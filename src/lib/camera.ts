export const CAMERA_STORAGE_KEY = "courtsense.check-in.camera.v1";

export function isMissingCamera(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && ["NotFoundError", "OverconstrainedError"].includes(String(error.name));
}

export function cameraError(error: unknown): string {
  const name = typeof error === "object" && error !== null && "name" in error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access was blocked. Allow camera access for CourtSense in your browser settings, or upload a photo.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "That camera is unavailable. Connect it or choose another camera.";
  if (name === "NotReadableError" || name === "AbortError") return "Could not open the camera. Close other apps using it, check the connection, and try again.";
  return "Could not use the camera. Try again or upload a photo.";
}
