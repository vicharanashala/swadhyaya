// Inspects stored proctoring evidence: fetches each snapshot through the
// admin API, decodes it in a real browser, and measures the pixels.
//
// A snapshot pipeline can fail silently in a way the dashboard cannot
// show you — captureFrame() draws from a <video> that may not have a
// decoded frame yet, producing a perfectly valid JPEG that happens to be
// solid black. It looks like working evidence in a thumbnail grid and is
// worthless in a review. So this checks luminance spread, not just that
// bytes came back.

import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE || "http://localhost:3000";

const token = readFileSync(".env.local", "utf8")
  .split("\n")
  .find((l) => l.startsWith("PROCTOR_ADMIN_TOKEN="))
  ?.split("=")[1]
  ?.trim();

if (!token) {
  console.error("PROCTOR_ADMIN_TOKEN not found in .env.local");
  process.exit(1);
}

// Collect every evidence id the store knows about.
const res = await fetch(`${BASE}/api/proctor/attempts`, {
  headers: { Authorization: `Bearer ${token}` },
});
const { attempts } = await res.json();

const evidence = [];
for (const a of attempts) {
  for (const v of a.violations) {
    if (v.evidenceId) {
      evidence.push({ id: v.evidenceId, type: v.type, at: v.timestamp });
    }
  }
}

console.log(`\n  ${evidence.length} evidence images referenced by the store\n`);
if (!evidence.length) {
  console.log("  nothing to inspect");
  process.exit(0);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

const rows = [];
for (const e of evidence.slice(0, 12)) {
  const r = await page.evaluate(
    async (id, tok, base) => {
      const resp = await fetch(`${base}/api/proctor/evidence/${id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!resp.ok) return { ok: false, status: resp.status };
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);

      const c = document.createElement("canvas");
      c.width = 80;
      c.height = 60;
      const ctx = c.getContext("2d");
      ctx.drawImage(bmp, 0, 0, 80, 60);
      const d = ctx.getImageData(0, 0, 80, 60).data;

      const luma = [];
      let sum = 0;
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
        ok: true,
        bytes: blob.size,
        w: bmp.width,
        h: bmp.height,
        mean: Math.round(mean),
        sd: Math.round(sd),
      };
    },
    e.id,
    token,
    BASE,
  );
  rows.push({ ...e, ...r });
}

console.log("  type              bytes    dims       meanLuma  stdDev  verdict");
let good = 0;
for (const r of rows) {
  if (!r.ok) {
    console.log(`  ${r.type.padEnd(17)} HTTP ${r.status}`);
    continue;
  }
  // A blank or never-painted frame has almost no spread.
  const real = r.sd > 3;
  if (real) good++;
  console.log(
    `  ${r.type.padEnd(17)} ${String(r.bytes).padStart(6)}  ${`${r.w}x${r.h}`.padEnd(10)} ${String(
      r.mean,
    ).padStart(8)}  ${String(r.sd).padStart(6)}  ${real ? "real image" : "BLANK/BLACK"}`,
  );
}

console.log(
  `\n  ${good}/${rows.length} snapshots contain actual picture data\n`,
);

await browser.close();
process.exit(good === rows.length ? 0 : 1);
