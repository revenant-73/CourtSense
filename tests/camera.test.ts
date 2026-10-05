import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraError, isMissingCamera } from "../src/lib/camera";

test("camera fallback only applies to unavailable devices, not denied access or hardware errors", () => {
  assert.equal(isMissingCamera({ name: "OverconstrainedError" }), true);
  assert.equal(isMissingCamera(new DOMException("missing", "NotFoundError")), true);
  for (const error of [null, undefined, "unavailable", { name: "NotAllowedError" }, { name: "NotReadableError" }]) assert.equal(isMissingCamera(error), false);
  assert.match(cameraError({ name: "NotAllowedError" }), /Allow camera access/);
  assert.match(cameraError({ name: "NotReadableError" }), /Close other apps/);
  assert.match(cameraError({ name: "OverconstrainedError" }), /choose another camera/);
  assert.equal(cameraError(new Error("Private device information")), "Could not use the camera. Try again or upload a photo.");
});
