import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, CheckCircle, ArrowLeft, X as XIcon } from "lucide-react";
import { CameraPreview, CountdownOverlay } from "@/components/CameraPreview";
import { usePhotos } from "@/context/PhotoContext";
import { api } from "@/lib/api";

const TOTAL = 4;

const STORAGE_KEYS = {
  countdown: "fleur_countdown_timer",
  shutter: "fleur_shutter_sound",
  countdownTick: "fleur_countdown_tick",
};

const DEFAULT_COUNTDOWN = "3";
const DEFAULT_SHUTTER = "classic";
const DEFAULT_COUNTDOWN_TICK = "true";

const shutterSounds = {
  classic: (ctx, t) => {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.1));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufferSize) * 8);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.22, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    noise.connect(ng);
    ng.connect(ctx.destination);
    noise.start(t);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.09);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.12, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  },
  loud: (ctx, t) => {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.15));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufferSize) * 6);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.35, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    noise.connect(ng);
    ng.connect(ctx.destination);
    noise.start(t);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.18, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  },
  studio: (ctx, t) => {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.06));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufferSize) * 12);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.16, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    noise.connect(ng);
    ng.connect(ctx.destination);
    noise.start(t);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.05);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.08, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  },
  silent: () => {},
};

const SHUTTER_LABELS = {
  classic: "Classic click",
  loud: "Loud snap",
  studio: "Studio shutter",
  silent: "Silent",
};

const playCountdownTick = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  } catch (err) {
    // Audio synthesis best-effort only.
  }
};

export default function PhotoboothPage({ navigate }) {
  const { photos, addPhoto, resetPhotos } = usePhotos();
  const cameraRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState("idle");
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(3);
  const [countdownSeconds, setCountdownSeconds] = useState(DEFAULT_COUNTDOWN);
  const [shutterSound, setShutterSound] = useState(DEFAULT_SHUTTER);
  const [countdownTickEnabled, setCountdownTickEnabled] = useState(DEFAULT_COUNTDOWN_TICK === "true");
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!cameraEnabled) return;
    const id = setInterval(() => {
      setCameraReady(!!cameraRef.current?.isReady());
    }, 200);
    return () => clearInterval(id);
  }, [cameraEnabled]);

  const startSession = useCallback(() => {
    resetPhotos();
    setStep(0);
    setStatus("idle");
    setTimer(Number(countdownSeconds));
    setFlashOpacity(0);
  }, [resetPhotos, countdownSeconds]);

  const enableCamera = useCallback(() => {
    initAudio();
    setCameraEnabled(true);
    setStatus("idle");
  }, []);

  const initAudio = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    } catch (err) {
      // Audio may be blocked until user interaction; ignored.
    }
  }, []);

  const playShutter = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;
      shutterSounds[shutterSound](ctx, t);
    } catch (err) {
      // Audio synthesis best-effort only.
    }
  }, [shutterSound]);

  useEffect(() => {
    if (!cameraEnabled || !cameraReady) return;
    if (status === "idle" && step < TOTAL) {
      setStatus("countdown");
      setTimer(Number(countdownSeconds));
    }
  }, [cameraEnabled, cameraReady, status, step, countdownSeconds]);

  useEffect(() => {
    if (status !== "countdown") return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        if (countdownTickEnabled) playCountdownTick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status, countdownTickEnabled]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.countdown);
      if (saved) setCountdownSeconds(saved);
      const savedShutter = localStorage.getItem(STORAGE_KEYS.shutter);
      if (savedShutter && shutterSounds[savedShutter]) setShutterSound(savedShutter);
      const savedTick = localStorage.getItem(STORAGE_KEYS.countdownTick);
      if (savedTick !== null) setCountdownTickEnabled(savedTick === "true");
    } catch (err) {
      // localStorage unavailable; use defaults.
    }
  }, []);

  useEffect(() => {
    if (status !== "countdown" || timer > 0) return;
    doCapture();
  }, [status, timer]);

  const doCapture = useCallback(() => {
    const dataUrl = cameraRef.current?.capture();
    if (!dataUrl) {
      setTimeout(() => doCapture(), 150);
      return;
    }
    setFlashOpacity(1);
    playShutter();
    addPhoto(dataUrl, step);
    setTimeout(() => setFlashOpacity(0), 400);
    setTimeout(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= TOTAL) { setStatus("done"); } else { setStatus("idle"); }
        return next;
      });
    }, 350);
  }, [step, addPhoto]);

  const handleRetake = useCallback(() => {
    startSession();
    setPreviewOpen(null);
  }, [startSession]);

  const goToResults = useCallback(async () => {
    try {
      const sessionId = Math.random().toString(36).substring(2, 12);
      await api.savePhotoSession(sessionId, photos);
      sessionStorage.setItem("fleur_last_session", sessionId);
      navigate("strips", sessionId);
    } catch (err) {
      navigate("strips");
    }
  }, [navigate, photos]);

  const openPreview = (i) => setPreviewOpen(i);
  const closePreview = () => setPreviewOpen(null);

  const taken = photos.filter(Boolean).length;
  const progress = (taken / TOTAL) * 100;
  const allDone = taken >= TOTAL;

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-[#f7f1e7]">
        {/* Decorative kiosk background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 25% 30%, #f7e8ea 0%, transparent 50%), radial-gradient(circle at 80% 70%, #d4a5a5 0%, transparent 50%)" }} />

        {/* Full-screen photo preview modal */}
        {previewOpen !== null && (
          <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-[800px] h-[800px] flex items-center justify-center bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden border border-white/10 animate-slide-up">
              <img src={photos[previewOpen]} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={closePreview} className="absolute top-4 right-4 z-30 bg-[#0a0a0a] text-white rounded-full p-3 hover:bg-fleur-rose/90 transition-all">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Top bar */}
        {!previewOpen && (
          <div className="fixed top-0 left-0 right-0 z-40 px-6 py-3 flex justify-between items-center bg-white/70 backdrop-blur-md border-b border-fleur-blush/50">
            <button onClick={() => navigate("welcome")} className="btn-ghost flex items-center gap-1.5 text-fleur-ink/50 text-[10px] hover:bg-fleur-blush/50 p-2 rounded-full">
              <ArrowLeft className="w-3 h-3" /> Exit
            </button>
            <div className="flex items-center gap-1.5 text-fleur-ink/70">
              <div className="w-8 h-8 rounded-full bg-fleur-rose flex items-center justify-center text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(212,165,165,0.35)] animate-bounce-gentle">
                {step + 1}
              </div>
              <span className="text-[10px] font-semibold tracking-tight leading-none uppercase">Photo {step + 1} of {TOTAL}</span>
            </div>
            <div className="w-8 h-8 flex items-center justify-center"></div>
          </div>
        )}

        {/* Main layout: camera top-center-left, captured photos right */}
        {!previewOpen && (
          <div className="relative flex items-center flex-1 z-0 relative w-full max-w-full p-2 lg:p-8">
            {/* Camera monitor — centered top */}
            <div className="relative flex-shrink-0 max-w-[900px] aspect-video rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-fleur-blush/80 bg-white overflow-hidden mt-[20px]">
                  {cameraEnabled ? (
                    <>
                      <CameraPreview ref={cameraRef} active={true} />
                      <div
                        className="fixed inset-0 z-[60] bg-[#FFFFFF] pointer-events-none"
                        style={{
                          opacity: flashOpacity,
                          transition: "opacity 250ms ease-out",
                          transform: "translateZ(0)",
                        }}
                      />
                      <CountdownOverlay n={status === "countdown" ? timer : 0} />
                    </>
                  ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                  <div className="w-20 h-20 rounded-full bg-fleur-blush flex items-center justify-center mb-6 text-fleur-rose font-bold text-2xl shadow-lg animate-bounce-gentle">
                    <Camera className="w-10 h-10" />
                  </div>
                  <button onClick={enableCamera} className="btn-primary px-10 py-5 text-lg flex flex-col items-center gap-3 shadow-[0_10px_25px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_35px_rgba(212,165,165,0.45)]">
                    <span className="font-semibold">Turn on camera</span>
                    <span className="text-xs text-white/70">Allow camera access to capture photos</span>
                  </button>
                </div>
              )}
            </div>

            {/* Captured photos sidebar */}
            <div className="ml-6 hidden lg:flex flex-col items-center gap-4 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-fleur-ink/40 mb-2">Captured</div>
              <div className="flex flex-col gap-4 w-full max-w-xs">
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <div key={i} className="relative cursor-pointer group flex flex-col items-center gap-2" onClick={() => photos[i] && openPreview(i)}>
                    <div className={`w-24 h-24 rounded-2xl overflow-hidden border shadow-sm flex items-center justify-center relative transition-all duration-300 ${
                      photos[i]
                        ? "border-fleur-rose/60 bg-white shadow-[0_4px_12px_rgba(212,165,165,0.25)] scale-105"
                        : "border-2 border-dashed border-fleur-blush/40 bg-fleur-blush/40"
                    }`}>
                      {photos[i] ? (
                        <img src={photos[i]} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-fleur-ink/30">
                          <div className="w-10 h-10 rounded-full border-2 border-dashed border-fleur-ink/20 mb-1" />
                          <span className="text-[10px] font-medium opacity-60">{i + 1}</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/95 backdrop-blur px-2 py-0.5 rounded-full text-fleur-rose font-bold text-[10px] shadow-sm border border-white">
                        Photo {i + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        {!previewOpen && (
          <div className="px-6 py-8 z-10 flex flex-col items-center justify-between w-full max-w-[900px] gap-6">
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 bg-fleur-blush rounded-full h-3 overflow-hidden border border-fleur-blush/40">
                <div className="h-full bg-fleur-rose rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(212,165,165,0.5)]" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] font-bold text-fleur-ink/50 mt-2 uppercase tracking-widest text-center w-full">{taken}/{TOTAL} photos taken</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {!cameraEnabled ? null : allDone ? (
                <div className="flex items-center gap-2 text-fleur-rose font-bold shadow-sm bg-fleur-rose/10 px-4 py-2 rounded-full border border-fleur-rose/30">
                  <CheckCircle className="w-5 h-5" /> All done!
                </div>
              ) : cameraReady ? (
                <div className="flex items-center gap-2 text-fleur-ink/60 text-sm">
                  <span className="font-medium">
                    {status === "captured" ? "Captured!" : status === "countdown" ? "Get ready…" : "Camera ready"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-fleur-ink/60 text-sm">
                  <span className="font-medium animate-pulse">Enabling camera…</span>
                </div>
              )}

              {cameraEnabled && status !== "done" && taken > 0 && (
                <button
                  onClick={handleRetake}
                  className="btn-soft px-6 py-3 text-sm flex items-center gap-2 shadow-sm hover:bg-fleur-blush/80"
                >
                  <RefreshCw className="w-4 h-4" /> Retake all
                </button>
              )}
              {allDone && (
                <button onClick={goToResults} className="btn-primary px-10 py-4 text-base shadow-[0_10px_25px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_35px_rgba(212,165,165,0.45)]">
                  Proceed to strips
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <></>
    </>
  );
}
