// Mid-session revocation: kill the tracks after the gate has opened and
// confirm the app is re-hidden. This is the "throughout the session"
// half of the requirement — a gate that only checked at startup would
// let a student grant access, then unplug the webcam and carry on.
//
// Timing matters here. ProctorMediaProvider retries every 3s, and
// Chrome's fake device always re-grants, so the session heals by itself
// shortly after. So we sample twice:
//
//   t+1s  content must be gone      (the block is immediate)
//   t+8s  content must be back      (recovery works, no dead end)
//
// Sampling only once, late, would have shown "content visible" and
// looked like the gate failed when it had actually blocked and recovered.

import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE || "http://localhost:3000";
const MARKER = "Vector Spaces";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--no-sandbox",
  ],
});

const page = await browser.newPage();
await page.goto(`${BASE}/learn`, { waitUntil: "networkidle2", timeout: 45000 });
await page
  .waitForFunction(
    (m) => document.body.innerText.includes(m),
    { timeout: 30000 },
    MARKER,
  )
  .catch(() => {});

const state = async () => {
  const r = await page.evaluate((m) => {
    const t = document.body.innerText;
    return {
      content: t.includes(m),
      gate: /This session is proctored|Monitoring interrupted|Access blocked/i.test(t),
    };
  }, MARKER);
  return r;
};

const before = await state();
console.log(`  t-0   content=${before.content}  gate=${before.gate}`);

const stopped = await page.evaluate(() => {
  let n = 0;
  for (const v of Array.from(document.querySelectorAll("video"))) {
    const s = v.srcObject;
    if (s && s.getTracks) {
      s.getTracks().forEach((t) => {
        t.stop();
        t.dispatchEvent(new Event("ended"));
        n++;
      });
    }
  }
  return n;
});
console.log(`  revoked ${stopped} tracks`);

await new Promise((r) => setTimeout(r, 1000));
const during = await state();
console.log(`  t+1s  content=${during.content}  gate=${during.gate}`);

await new Promise((r) => setTimeout(r, 8000));
const after = await state();
console.log(`  t+9s  content=${after.content}  gate=${after.gate}`);

const checks = [
  ["content visible before revocation", before.content],
  ["content hidden immediately on revocation", !during.content],
  ["gate shown on revocation", during.gate],
  ["session recovers once the device returns", after.content],
];

console.log("");
let ok = true;
for (const [name, pass] of checks) {
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) ok = false;
}

await browser.close();
process.exit(ok ? 0 : 1);
