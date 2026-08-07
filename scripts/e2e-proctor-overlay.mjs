// Regression test for "the video alert popped up and never closed".
//
// Three separate defects produced that symptom, and each needs its own
// assertion because any one of them alone reproduces it:
//
//   1. VibeStyleAnomalyOverlay rendered "auto-dismisses in ~5s" but had
//      no timer at all — it closed only if the parent nulled the prop.
//   2. The parent derived that prop from Date.now() inside a useMemo
//      keyed on [attempt], which stops recomputing once violations stop
//      arriving, so the prop never went null.
//   3. Even with both fixed, a persistent condition logs a violation
//      every ~3s while the alert shows for 5s, so it re-armed before it
//      expired and never visibly closed.
//
// Chrome's fake camera contains no face, so `no_face` fires naturally
// and drives the whole path without any mocking.

import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE || "http://localhost:3000";

const OVERLAY_RE =
  /Stay in frame|Multiple people detected|Eyes on the screen|Identity check|Camera unclear|Background voice|Scene changed|Camera blocked/;

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
await page.goto(`${BASE}/learn`, { waitUntil: "networkidle2", timeout: 45000 });
await page
  .waitForFunction(() => document.body.innerText.includes("Vector Spaces"), {
    timeout: 30000,
  })
  .catch(() => {});

const overlayUp = () =>
  page.evaluate(
    (re) => new RegExp(re).test(document.body.innerText),
    OVERLAY_RE.source,
  );

// ── Wait for the alert to appear on its own ───────────────────────────
let appearedAt = null;
for (let i = 0; i < 60; i++) {
  if (await overlayUp()) {
    appearedAt = Date.now();
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}

if (!appearedAt) {
  console.log("  FAIL  alert never appeared — cannot test dismissal");
  await browser.close();
  process.exit(1);
}
console.log("  alert appeared");

// ── It must close by itself ───────────────────────────────────────────
let closedAt = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 500));
  if (!(await overlayUp())) {
    closedAt = Date.now();
    break;
  }
}

const visibleFor = closedAt ? (closedAt - appearedAt) / 1000 : null;
console.log(
  closedAt
    ? `  alert closed after ~${visibleFor.toFixed(1)}s`
    : "  alert STILL open after 20s",
);

// ── Content must be usable again once it closes ───────────────────────
const contentBack = await page.evaluate(() =>
  document.body.innerText.includes("Vector Spaces"),
);

// ── And it must not immediately re-arm (the cooldown) ─────────────────
let reArmedWithin = null;
if (closedAt) {
  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await overlayUp()) {
      reArmedWithin = (Date.now() - closedAt) / 1000;
      break;
    }
  }
}
console.log(
  reArmedWithin === null
    ? "  no re-arm within 8s of closing"
    : `  re-armed after ${reArmedWithin.toFixed(1)}s`,
);

const checks = [
  ["alert auto-closes without interaction", Boolean(closedAt)],
  ["closes in roughly 5s, not instantly or never", visibleFor !== null && visibleFor >= 2 && visibleFor <= 12],
  ["lesson content is usable after it closes", contentBack],
  ["does not immediately re-arm", reArmedWithin === null || reArmedWithin > 5],
];

console.log("");
let ok = true;
for (const [name, pass] of checks) {
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) ok = false;
}

await browser.close();
process.exit(ok ? 0 : 1);
