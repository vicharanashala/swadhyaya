// Vendors the proctoring ML assets into public/models/.
//
// Runs on postinstall. Self-hosting matters for three reasons:
//
//   1. The default weights URL baked into @tensorflow-models/face-detection
//      is https://tfhub.dev/... — TFHub is deprecated and now 302s to
//      Kaggle with a signed, expiring GCS URL. Depending on that at
//      runtime means a proctored exam breaks when Google reshuffles
//      redirects.
//   2. It keeps the CSP at connect-src 'self'. Nothing has to be
//      allowlisted, so proctoring cannot become an exfiltration path.
//   3. Students on slow links download the models from the same origin
//      as the app, already warm in the CDN in front of it.
//
// The assets are gitignored — this script is what puts them there.

import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, cp, stat, readFile, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "models");

const FACE_MODEL_BASE =
  "https://tfhub.dev/mediapipe/tfjs-model/face_detection/short/1";
const YAMNET_URL =
  "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite";
const YAMNET_BYTES = 4_126_810;

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`GET ${url} → ${res.status}`);
  }
  await mkdir(path.dirname(dest), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

// ── 1. Face detection (MediaPipe short-range, float16) ────────────────
async function faceDetection() {
  const dir = path.join(OUT, "face-detection-short");
  const manifestPath = path.join(dir, "model.json");

  if (await exists(manifestPath)) {
    console.log("  face-detection      already present");
    return;
  }

  await mkdir(dir, { recursive: true });
  await download(`${FACE_MODEL_BASE}/model.json?tfjs-format=file`, manifestPath);

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const shards = manifest.weightsManifest.flatMap((g) => g.paths);
  for (const shard of shards) {
    await download(`${FACE_MODEL_BASE}/${shard}?tfjs-format=file`, path.join(dir, shard));
  }

  // Verify the shard bytes match what the manifest declares, honouring
  // float16 quantization — a truncated download would otherwise surface
  // much later as garbage detections.
  const width = (d) => ({ float32: 4, int32: 4, uint8: 1, bool: 1, float16: 2 })[d] ?? 4;
  const declared = manifest.weightsManifest
    .flatMap((g) => g.weights)
    .reduce((n, w) => {
      const elements = w.shape.reduce((a, x) => a * x, 1);
      return n + elements * width(w.quantization?.dtype ?? w.dtype);
    }, 0);
  const actual = (await stat(path.join(dir, shards[0]))).size;
  if (declared !== actual) {
    throw new Error(
      `face-detection weights corrupt: manifest declares ${declared}B, got ${actual}B`,
    );
  }
  console.log(`  face-detection      ok (${shards.length} shard, ${actual}B)`);
}

// ── 2. YAMNet audio classifier (voice activity) ───────────────────────
async function yamnet() {
  const dest = path.join(OUT, "yamnet", "yamnet.tflite");
  if (await exists(dest)) {
    console.log("  yamnet              already present");
    return;
  }
  await download(YAMNET_URL, dest);

  const size = (await stat(dest)).size;
  if (size !== YAMNET_BYTES) {
    throw new Error(`yamnet.tflite: expected ${YAMNET_BYTES}B, got ${size}B`);
  }
  // TFLite flatbuffers carry the identifier "TFL3" at byte offset 4.
  const head = await readFile(dest);
  if (head.subarray(4, 8).toString("ascii") !== "TFL3") {
    throw new Error("yamnet.tflite is not a TFLite flatbuffer");
  }
  console.log(`  yamnet              ok (${size}B)`);
}

// ── 3. MediaPipe audio wasm (ships inside the npm package) ────────────
async function audioWasm() {
  const src = path.join(ROOT, "node_modules", "@mediapipe", "tasks-audio", "wasm");
  const dest = path.join(OUT, "audio-wasm");
  if (!(await exists(src))) {
    console.log("  audio-wasm          skipped (@mediapipe/tasks-audio not installed)");
    return;
  }
  if (await exists(path.join(dest, "audio_wasm_internal.wasm"))) {
    console.log("  audio-wasm          already present");
    return;
  }
  await cp(src, dest, { recursive: true });
  console.log("  audio-wasm          ok (copied from node_modules)");
}

// ── 4. face-api weights for identity verification ─────────────────────
// vibe loads these from '/models' with a jsdelivr fallback; the npm
// package ships them, so copy just the three nets we use rather than
// the full 14-file set (which includes age/gender/expression models we
// have no business running on students).
async function faceApiWeights() {
  const src = path.join(ROOT, "node_modules", "@vladmandic", "face-api", "model");
  const dest = path.join(OUT, "face-api");
  if (!(await exists(src))) {
    console.log("  face-api            skipped (@vladmandic/face-api not installed)");
    return;
  }
  if (await exists(path.join(dest, "face_recognition_model.bin"))) {
    console.log("  face-api            already present");
    return;
  }

  await mkdir(dest, { recursive: true });
  const nets = ["tiny_face_detector", "face_landmark_68", "face_recognition"];
  let copied = 0;
  for (const net of nets) {
    const manifestName = `${net}_model-weights_manifest.json`;
    const manifest = JSON.parse(
      await readFile(path.join(src, manifestName), "utf8"),
    );
    await cp(path.join(src, manifestName), path.join(dest, manifestName));
    copied++;
    for (const shard of manifest.flatMap((g) => g.paths)) {
      await cp(path.join(src, shard), path.join(dest, shard));
      copied++;
    }
  }
  console.log(`  face-api            ok (${copied} files, 3 nets)`);
}

async function main() {
  // Nothing to do for deployments that don't run proctoring, but the
  // assets are cheap to have and the flag is read at request time, so
  // always vendor them rather than guessing.
  console.log("Vendoring proctoring models → public/models");
  await mkdir(OUT, { recursive: true });
  await faceDetection();
  await yamnet();
  await audioWasm();
  await faceApiWeights();

  await writeFile(
    path.join(OUT, "README.md"),
    [
      "# Vendored proctoring models",
      "",
      "Generated by `scripts/setup-proctor-models.mjs` (runs on postinstall).",
      "Gitignored — do not commit. Delete this directory and re-run",
      "`pnpm run setup:models` to refetch.",
      "",
      "| Asset | Source |",
      "| --- | --- |",
      `| face-detection-short | ${FACE_MODEL_BASE} |`,
      `| yamnet | ${YAMNET_URL} |`,
      "| audio-wasm | node_modules/@mediapipe/tasks-audio/wasm |",
      "| face-api | node_modules/@vladmandic/face-api/model |",
      "",
    ].join("\n"),
    "utf8",
  );
  console.log("Done.");
}

main().catch((err) => {
  // A failed vendor step must not break `pnpm install` for someone who
  // isn't using proctoring — warn loudly, exit clean.
  console.warn(`\n⚠ Could not vendor proctoring models: ${err.message}`);
  console.warn("  Proctoring's camera/audio detectors will not start.");
  console.warn("  Re-run with: pnpm run setup:models\n");
  process.exit(0);
});
