import { useState } from "react";
import { ArrowRight, Cog, Camera, Monitor, EyeOff } from "lucide-react";
import { CameraPreview } from "@/components/CameraPreview";

export default function WelcomePage({ navigate }) {
  const [cameraView, setCameraView] = useState(false);

  return (
    <div className={`min-h-screen relative overflow-hidden ${cameraView ? "bg-[#0a0a0a]" : "bg-fleur-cream"}`}>
      {/* Live camera monitor background */}
      {cameraView && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.08), rgba(0, 0, 0, 0.15))" }}></div>
          <div className="absolute inset-0 z-10 grid grid-cols-[1fr_2px_1fr] grid-rows-[1fr_2px_1fr] gap-[1px] bg-fleur-rose/20 pointer-events-none"></div>
          <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/20 pointer-events-none"></div>
          <div className="relative z-20 w-full h-full">
            <CameraPreview active={true} fullscreen={true} />
          </div>
          {/* Camera HUD */}
          <div className="absolute top-6 left-6 z-30 flex items-center gap-2 bg-fleur-ink/40 backdrop-blur px-3 py-1.5 rounded-full border border-fleur-rose/30 text-[10px] font-bold text-fleur-rose tracking-wider uppercase animate-pulse-soft">
            <div className="w-1.5 h-1.5 rounded-full bg-fleur-rose animate-pulse" />
            REC
          </div>
          <div className="absolute top-6 right-6 z-30 flex items-center gap-2 bg-fleur-ink/40 backdrop-blur px-3 py-1.5 rounded-full border border-fleur-rose/30 text-[10px] font-bold text-fleur-rose tracking-wider">
            <span>00:42</span>
          </div>
          <div className="absolute bottom-6 left-6 z-30 text-[10px] font-bold text-fleur-ink/50 tracking-wider uppercase">
            FLEUR 'N FRAME
          </div>
          <div className="absolute bottom-6 right-6 z-30 text-[10px] font-bold text-fleur-ink/50 tracking-wider uppercase">
            CAM 1
          </div>
          <div className="absolute top-8 left-8 z-30 w-4 h-4 border-t-2 border-l-2 border-fleur-rose/40"></div>
          <div className="absolute top-8 right-8 z-30 w-4 h-4 border-t-2 border-r-2 border-fleur-rose/40"></div>
          <div className="absolute bottom-8 left-8 z-30 w-4 h-4 border-b-2 border-l-2 border-fleur-rose/40"></div>
          <div className="absolute bottom-8 right-8 z-30 w-4 h-4 border-b-2 border-r-2 border-fleur-rose/40"></div>
        </div>
      )}

      {!cameraView && (
        <>
          <div className="blob top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-fleur-rose/20"></div>
          <div className="blob bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fleur-blush/30"></div>
        </>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        {cameraView && (
          <div className="absolute inset-0 z-0 backdrop-blur-xl bg-black/20 pointer-events-none"></div>
        )}
        <div className={`text-center relative z-10 transition-all duration-500 ${cameraView ? "scale-95" : "scale-100"}`}>
          <div className={`inline-block px-8 py-6 rounded-3xl ${cameraView ? "bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]" : ""}`}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/90 text-fleur-rose font-display font-bold text-xl mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-bounce-gentle backdrop-blur">
              F&F
            </div>

            <h1 className={`font-display font-bold text-5xl md:text-7xl mb-4 tracking-tight text-balance animate-slide-up ${cameraView ? "text-white drop-shadow-[0_0_20px_rgba(212,165,165,0.5)]" : "text-fleur-ink"}`}>
              Fleur<span className={`text-fleur-rose italic ${cameraView ? "text-white" : ""}`}> '</span>N Frame
            </h1>

            <p className={`font-display text-xl italic mb-8 font-semibold animate-slide-up delay-100 ${cameraView ? "text-white/90" : "text-fleur-rose/80"}`}>
              "made fleur-ever to keep."
            </p>

            <p className={`text-fleur-ink/70 text-lg md:text-xl mb-12 max-w-xl text-center leading-relaxed animate-slide-up delay-200 ${cameraView ? "text-white/90 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]" : ""}`}>
              Capture your moment and turn it into a beautiful photo strip. Instant prints, timeless memories.
            </p>

            <div className="flex flex-col gap-5 w-full max-w-xs animate-slide-up delay-300">
              <button
                onClick={() => navigate("photobooth")}
                className="w-full py-6 text-xl font-display font-bold tracking-tight flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_40px_rgba(212,165,165,0.45)] active:scale-95 transition-all"
              >
                <Camera className="w-6 h-6" /> Start Capturing
              </button>
              <button
                onClick={() => navigate("admin-login")}
                className="w-full py-2.5 text-xs font-medium text-fleur-ink/30 flex items-center justify-center gap-2 hover:bg-fleur-blush/30 hover:text-fleur-ink/60 transition-all border border-fleur-blush/40"
              >
                <Cog className="w-3 h-3" /> Admin login
              </button>
            </div>

            <p className={`mt-12 text-xs text-fleur-ink/40 tracking-widest uppercase animate-slide-up delay-400 ${cameraView ? "text-white/60" : ""}`}>
              Fleur 'N Frame Photobooth &middot; Just for you
            </p>
          </div>
        </div>

        {/* Camera mode toggle button - lower left */}
        <button
          onClick={() => setCameraView(!cameraView)}
          className={`absolute bottom-8 left-8 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
            cameraView
              ? "bg-white text-fleur-ink shadow-lg"
              : "bg-fleur-ink/20 text-fleur-ink/80 border border-fleur-ink/30 hover:bg-fleur-ink/30"
          }`}
        >
          <span className="flex items-center gap-1">
            {cameraView ? (
              <>
                <EyeOff className="w-4 h-4" /> Normal view
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" /> Camera view
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
