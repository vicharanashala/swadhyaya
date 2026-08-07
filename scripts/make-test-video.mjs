// Generates a deterministic face-free test video for the proctoring E2E
// suite, and feeds it to Chrome via --use-file-for-fake-video-capture.
//
// Chrome's built-in fake device draws a rolling pattern that the face
// detector reads inconsistently — it flapped between 0 and 1 faces on
// alternating frames, so no anomaly ever confirmed and the overlay tests
// had nothing to assert against. A fixed input makes `no_face` fire
// reliably and keeps the test from depending on Chrome's internals.
//
// The pattern is deliberately textured (diagonal bars) rather than flat:
// a solid frame has near-zero luminance variance and would trip the
// camera_blocked detector instead, testing the wrong path.
//
// Y4M, I420 planar, per the spec Chrome expects.

import { writeFileSync } from "node:fs";

const W = 640;
const H = 480;
const FRAMES = 60;

function build() {
  const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F30:1 Ip A1:1 C420\n`);
  const parts = [header];

  const ySize = W * H;
  const cSize = (W / 2) * (H / 2);

  for (let f = 0; f < FRAMES; f++) {
    parts.push(Buffer.from("FRAME\n"));

    // Luma: diagonal bars that drift, so successive frames differ enough
    // to look like a live feed but never resemble a face.
    const y = Buffer.alloc(ySize);
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        const v = ((row + col + f * 4) % 64) < 32 ? 70 : 150;
        y[row * W + col] = v;
      }
    }
    parts.push(y);

    // Neutral chroma — grayscale bars.
    parts.push(Buffer.alloc(cSize, 128));
    parts.push(Buffer.alloc(cSize, 128));
  }

  return Buffer.concat(parts);
}

const out = process.argv[2] || "/tmp/proctor-noface.y4m";
const buf = build();
writeFileSync(out, buf);
console.log(
  `wrote ${out}  ${W}x${H}  ${FRAMES} frames  ${(buf.length / 1e6).toFixed(1)} MB`,
);
