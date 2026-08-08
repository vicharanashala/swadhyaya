import { describe, expect, it } from "vitest";
import { DEFAULT_SEVERITY } from "@/components/proctor/usePenaltyScore";

describe("DEFAULT_SEVERITY", () => {
  it("covers every documented violation type", () => {
    const expected = [
      "focus_loss",
      "tab_switch",
      "right_click",
      "copy",
      "paste",
      "cut",
      "devtools_open",
      "long_idle",
      "no_face",
      "multiple_faces",
      "looking_away",
      "face_mismatch",
      "blur_detected",
      "voice_detected",
      "motion_detected",
      "camera_blocked",
      "virtual_camera",
      "view_source",
      "save",
      "print",
      "new_tab",
      "select",
      "drag",
      "window_minimized",
      "challenge_failed",
      "camera_blocked",
      "motion_detected",
    ];
    const missing = expected.filter(t => typeof DEFAULT_SEVERITY[t] !== "number");
    if (missing.length) {
      throw new Error("missing severities for: " + missing.join(", "));
    }
  });

  it("ranks more severe anomalies higher", () => {
    // Virtual camera and multi-face are an instant-eject class.
    expect(DEFAULT_SEVERITY.virtual_camera).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_SEVERITY.multiple_faces).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_SEVERITY.camera_blocked).toBeGreaterThanOrEqual(2);
    // Selection is silently dropped (already prevented by the hook).
    expect(DEFAULT_SEVERITY.select).toBe(0);
  });
});
