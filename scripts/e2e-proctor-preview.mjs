// Verifies the floating webcam preview is actually painting frames.
//
// Regression guard for a bug where three <video> elements were handed
// the same React ref. A ref holds one node, so only the last to mount
// received `srcObject` — the visible panel sat black at readyState 0
// while the hidden 1×1 detector sink held the stream. Checking
// `srcObject != null` alone would not have caught the follow-on
// question of whether pixels reach the screen, so this samples the
// rendered image.

import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE || "http://localhost:3000";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--use-fake-device-for-media-stream",
    "--use-file-for-fake-video-capture=/tmp/proctor-noface.y4m",
    "--use-fake-ui-for-media-stream",
    "--no-sandbox",
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/learn`, { waitUntil: "networkidle2", timeout: 45000 });
await page
  .waitForFunction(() => document.body.innerText.includes("Vector Spaces"), {
    timeout: 30000,
  })
  .catch(() => {});
await new Promise((r) => setTimeout(r, 5000));

const report = await page.evaluate(() => {
  const vids = Array.from(document.querySelectorAll("video"));
  // The preview is the one that's actually laid out at a visible size.
  const visible = vids.find((v) => v.getBoundingClientRect().width > 40);
  if (!visible) return { found: false };

  // Draw the current frame and measure spread. A black or never-painted
  // element yields near-zero variance; real video does not.
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 48;
  const ctx = c.getContext("2d");
  ctx.drawImage(visible, 0, 0, 64, 48);
  const d = ctx.getImageData(0, 0, 64, 48).data;

  let sum = 0;
  const luma = [];
  for (let i = 0; i < d.length; i += 4) {
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    luma.push(y);
    sum += y;
  }
  const mean = sum / luma.length;
  const sd = Math.sqrt(
    luma.reduce((a, y) => a + (y - mean) ** 2, 0) / luma.length,
  );

  return {
    found: true,
    hasSrcObject: !!visible.srcObject,
    tracks: visible.srcObject?.getTracks?.().length ?? 0,
    readyState: visible.readyState,
    dims: `${visible.videoWidth}x${visible.videoHeight}`,
    paused: visible.paused,
    meanLuma: Math.round(mean),
    stdDev: Math.round(sd),
  };
});

console.log("\n  Floating preview:");
for (const [k, v] of Object.entries(report)) console.log(`    ${k}: ${v}`);

const checks = [
  ["preview element exists", report.found],
  ["stream is attached", report.hasSrcObject],
  ["both tracks present", report.tracks === 2],
  ["decoder has frames (readyState 4)", report.readyState === 4],
  ["not paused", report.paused === false],
  ["frame is not black — pixels vary", report.stdDev > 3],
];

console.log("");
let ok = true;
for (const [name, pass] of checks) {
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) ok = false;
}

await page.screenshot({ path: "/tmp/proctor-preview.png" });
console.log("\n  screenshot: /tmp/proctor-preview.png");

await browser.close();
process.exit(ok ? 0 : 1);
