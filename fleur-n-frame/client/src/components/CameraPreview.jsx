import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export const CameraPreview = forwardRef(
  ({ active = true, fullscreen = false }, ref) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);

    useImperativeHandle(
      ref,
      () => ({
        start: setup,
        stop: teardown,
        capture: captureFrame,
        isReady: () => ready,
      }),
      [ready]
    );

    function timeoutPromise(promise, ms, msg) {
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(msg)), ms);
      });
      return Promise.race([promise, timeout]).then(
        (r) => { clearTimeout(timer); return r; },
        (e) => { clearTimeout(timer); throw e; }
      );
    }

    async function setup() {
      teardown();
      try {
        setError(null);
        setReady(false);
        const stream = await timeoutPromise(
          navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } }),
          5000,
          "Camera request timed out"
        );
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setReady(true);
          setError(null);
        }
      } catch (err) {
        try {
          setError(null);
          setReady(false);
          const stream = await timeoutPromise(
            navigator.mediaDevices.getUserMedia({ video: true }),
            5000,
            "Camera request timed out"
          );
          streamRef.current = stream;
          const video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            await video.play();
            setReady(true);
            setError(null);
          }
        } catch (err2) {
          setError(err2.message || "Camera access denied");
        }
      }
    }

    function teardown() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const video = videoRef.current;
      if (video) video.srcObject = null;
      setReady(false);
    }

    function captureFrame() {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return null;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.92);
    }

    useEffect(() => {
      if (active) setup();
      return () => teardown();
    }, [active]);

    return (
      <div className={`relative w-full ${fullscreen ? "h-full" : "aspect-video"} ${fullscreen ? "rounded-none border-none bg-transparent shadow-none" : "bg-fleur-blush rounded-2xl overflow-hidden shadow-soft border border-fleur-blush/50"}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-fleur-ink/90 text-white rounded-2xl p-6 text-center leading-relaxed">
            <p className="font-medium">{error}</p>
            <p className="mt-2 text-sm opacity-80">Allow camera access, then click below.</p>
            <button
              onClick={setup}
              className="mt-4 btn-soft text-xs px-5 py-2 rounded-full border-fleur-rose/40 hover:bg-fleur-rose/10"
            >
              Try again
            </button>
          </div>
        )}
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-fleur-ink/50">
            <span className="animate-pulse">Initializing camera…</span>
            <p className="mt-2 text-xs opacity-70">Allow camera access to continue</p>
          </div>
        )}
      </div>
    );
  }
);

CameraPreview.displayName = "CameraPreview";

export function CountdownOverlay({ n }) {
  if (n <= 0) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="text-[8rem] font-display font-black text-white drop-shadow-[0_0_30px_rgba(212,165,165,0.6)] animate-pulse-soft">
        {n}
      </div>
    </div>
  );
}
