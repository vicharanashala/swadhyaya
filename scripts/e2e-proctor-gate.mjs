// End-to-end check of the proctoring gate, driven through real Chrome
// with a synthetic camera and microphone.
//
// The static curl tests prove content is withheld from an unverified
// client. They cannot prove the opposite half — that content actually
// appears once permission is granted. Because ProctorGate never renders
// `children` on the server, "does it render after hydration" is a real
// risk, not a formality: if the subtree were missing from the flight
// payload the gate would open onto a blank page.
//
// Chrome's --use-fake-device-for-media-stream gives getUserMedia a
// synthetic feed, and --use-fake-ui-for-media-stream auto-accepts the
// permission prompt, so both states are reachable headlessly.
//
// Run against a server already listening on BASE (default :3000).

import puppeteer from "puppeteer-core";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE || "http://localhost:3000";

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

async function launch({ grant }) {
  const args = [
    "--use-fake-device-for-media-stream",
    "--use-file-for-fake-video-capture=/tmp/proctor-noface.y4m",
    "--no-sandbox",
    // A tiny synthetic y4m would let us control content; the built-in
    // fake device is enough to make a face detector see *something*.
  ];
  if (grant) args.push("--use-fake-ui-for-media-stream");
  else args.push("--deny-permission-prompts");

  return puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args,
  });
}

async function textOf(page) {
  return page.evaluate(() => document.body.innerText);
}

// ── 1. Permission GRANTED → gate opens, real content renders ──────────
async function grantedPath() {
  const browser = await launch({ grant: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${BASE}/learn`, { waitUntil: "networkidle2", timeout: 45000 });

    // Wait for the gate to hand over.
    await page
      .waitForFunction(
        () => !document.body.innerText.includes("Starting secure session"),
        { timeout: 30000 },
      )
      .catch(() => {});

    let body = await textOf(page);
    const gateGone = !/This session is proctored|Access blocked/i.test(body);
    check("granted: gate releases", gateGone, gateGone ? "" : body.slice(0, 120));

    // The decisive assertion — real curriculum content is on screen.
    await page
      .waitForFunction(
        () => document.body.innerText.includes("Vector Spaces"),
        { timeout: 20000 },
      )
      .catch(() => {});
    body = await textOf(page);
    const hasContent = body.includes("Vector Spaces");
    check(
      "granted: lesson content renders after the gate opens",
      hasContent,
      hasContent ? "" : `body was: ${body.slice(0, 160)}`,
    );

    // The floating panel is the always-on proof of monitoring.
    const panel = await page.evaluate(() =>
      Boolean(document.querySelector("video")),
    );
    check("granted: a video element is mounted", panel);

    return browser;
  } finally {
    await browser.close();
  }
}

// ── 2. Permission DENIED → gate holds, no content ─────────────────────
async function deniedPath() {
  const browser = await launch({ grant: false });
  try {
    const context = browser.defaultBrowserContext();
    // Explicitly revoke so getUserMedia rejects rather than hanging.
    await context.overridePermissions(BASE, []);

    const page = await browser.newPage();
    await page.goto(`${BASE}/learn`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 6000));

    const body = await textOf(page);
    const blocked = /proctored|Access blocked|camera/i.test(body);
    check("denied: gate screen is shown", blocked, blocked ? "" : body.slice(0, 120));

    const leaked = body.includes("Vector Spaces");
    check(
      "denied: lesson content is NOT rendered",
      !leaked,
      leaked ? "content leaked to a denied user" : "",
    );

    // Check interactive controls, not prose. The gate's own copy says
    // "no option to continue without monitoring", which a naive text
    // match would flag as an escape hatch.
    const actionable = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button, a, [role=button]"))
        .filter((el) => el.offsetParent !== null)
        .map((el) => (el.textContent || "").trim().toLowerCase()),
    );
    const escapes = actionable.filter((t) =>
      /continue without|without monitoring|skip|dismiss|not now|later|decline|disable|turn off/.test(
        t,
      ),
    );
    check(
      "denied: no opt-out control is offered",
      escapes.length === 0,
      escapes.length ? `found: ${escapes.join(", ")}` : `${actionable.length} controls, all benign`,
    );
  } finally {
    await browser.close();
  }
}

console.log(`\nProctor gate E2E against ${BASE}\n`);
await grantedPath();
await deniedPath();

const failed = results.filter((r) => !r.pass);
console.log(
  `\n  ${results.length - failed.length}/${results.length} passed\n`,
);
process.exit(failed.length ? 1 : 0);
