"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { compressImage } from "@/lib/image";
import { CAMERA_STORAGE_KEY, cameraError, isMissingCamera } from "@/lib/camera";

export default function AthletePhoto({ photo, disabled, onPhoto, onBusyChange }: {
  photo: string | null;
  disabled: boolean;
  onPhoto: (photo: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const cameraId = useId();
  const uploadId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = useState("");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function stopStream() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => () => {
    requestRef.current++;
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  function cancel() {
    requestRef.current++;
    stopStream();
    setOpen(false); setReady(false); setSnapshot(null); setBusy(false);
    onBusyChange(false);
  }

  async function start(deviceId?: string, forceChoice = false) {
    const request = ++requestRef.current;
    stopStream();
    setOpen(true); setBusy(true); setReady(false); setSnapshot(null); setError("");
    onBusyChange(true);
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera not supported");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: deviceId ? { deviceId: { exact: deviceId } } : true });
      } catch (error) {
        if (request !== requestRef.current) return;
        // Do not silently capture from a different camera when the saved device disappears.
        if (deviceId && isMissingCamera(error)) {
          forceChoice = true;
          setNotice("Your saved camera is unavailable. Choose a connected camera to continue.");
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        } else throw error;
      }
      if (request !== requestRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === "videoinput");
      if (request !== requestRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId || "";
      setCameras(devices); setSelected(activeId || devices[0]?.deviceId || "");
      setChoosing(forceChoice || !deviceId || activeId !== deviceId);
      stream.getVideoTracks().forEach(track => track.addEventListener("ended", () => {
        if (request === requestRef.current) {
          setReady(false); setChoosing(true);
          setError("The camera disconnected. Reconnect it and try again, or upload a photo.");
        }
      }));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      if (request === requestRef.current) { stopStream(); setReady(false); setError(cameraError(error)); }
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  }

  function openCamera() {
    let saved: string | null = null;
    try { saved = localStorage.getItem(CAMERA_STORAGE_KEY); } catch { /* Browser storage may be disabled. */ }
    setNotice("");
    void start(saved || undefined);
  }

  async function chooseCamera() {
    if (!selected) return;
    const chosen = selected;
    await start(chosen);
    // Only remember a device that actually opened, never the unavailable fallback.
    if (streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId === chosen) {
      try { localStorage.setItem(CAMERA_STORAGE_KEY, chosen); setNotice("Camera saved for this browser profile."); }
      catch { setNotice("Camera selected. Browser storage is unavailable; choose it again next time."); }
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !ready || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) { setError("Could not capture this photo. Try uploading a photo."); return; }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.7));
    stopStream(); setReady(false);
  }

  function usePhoto() {
    if (!snapshot) return;
    onPhoto(snapshot);
    cancel();
  }

  async function upload(file?: File) {
    if (!file) return;
    const request = ++requestRef.current;
    setBusy(true); setError(""); onBusyChange(true);
    try {
      const compressed = await compressImage(file);
      if (request === requestRef.current) onPhoto(compressed);
    } catch { if (request === requestRef.current) setError("Could not process this photo. Try a different image."); }
    finally { if (request === requestRef.current) { setBusy(false); onBusyChange(false); } }
  }

  const buttonClass = "rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:opacity-50";
  return (
    <section aria-label="Athlete photo" className="space-y-3">
      {photo ? <img src={photo} alt="Athlete check-in photo" className="mx-auto h-40 w-40 rounded-xl object-cover" /> : <Camera aria-hidden="true" className="mx-auto h-12 w-12 text-foreground/40" />}
      {!open && <div className="flex flex-wrap justify-center gap-3">
        <button type="button" disabled={disabled || busy} onClick={openCamera} className={buttonClass}>Take Photo</button>
        <div className="min-w-0 w-full space-y-2">
          <label htmlFor={uploadId} className="block text-sm font-semibold">Upload Photo</label>
          <input id={uploadId} type="file" accept="image/*" capture="user" aria-label="Upload athlete photo" disabled={disabled || busy} className="w-full min-w-0 text-sm" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
      </div>}
      {open && <div className="space-y-3 rounded-xl border border-white/20 p-3">
        {snapshot ? <img src={snapshot} alt="Captured photo preview" className="w-full rounded-lg" /> : <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" onLoadedData={() => setReady(true)} className="w-full rounded-lg bg-black" />}
        {choosing && !snapshot && <div className="space-y-2">
          <label htmlFor={cameraId} className="block text-sm">Choose camera (saved on this browser)</label>
          <select id={cameraId} value={selected} onChange={event => setSelected(event.target.value)} disabled={busy} className="w-full rounded-lg bg-background p-3 text-sm">
            {cameras.map((camera, index) => <option key={camera.deviceId} value={camera.deviceId}>{camera.label || `Camera ${index + 1}`}</option>)}
          </select>
          <button type="button" disabled={disabled || busy || !selected} onClick={() => void chooseCamera()} className={buttonClass}>Use This Camera</button>
        </div>}
        <div className="flex flex-wrap gap-2">
          {snapshot ? <>
            <button type="button" disabled={disabled} onClick={usePhoto} className={buttonClass}>Use Photo</button>
            <button type="button" disabled={disabled || busy} onClick={openCamera} className={buttonClass}>Retake</button>
          </> : !choosing && <>
            <button type="button" disabled={disabled || busy || !ready} onClick={capture} className={buttonClass}>Capture Photo</button>
            <button type="button" disabled={disabled || busy} onClick={() => setChoosing(true)} className={buttonClass}>Change Camera</button>
          </>}
          {!snapshot && error && <button type="button" disabled={busy} onClick={openCamera} className={buttonClass}>Retry Camera</button>}
          <button type="button" disabled={disabled} onClick={cancel} className={buttonClass}>Cancel Camera</button>
        </div>
      </div>}
      <p role="status" aria-label="Camera status" className="text-sm text-foreground/70">{busy ? "Opening camera or processing photo…" : notice}</p>
      {error && <p role="alert" className="text-sm text-warning">{error}</p>}
    </section>
  );
}
