import { useEffect, useState } from "react";
import { ChevronLeft, Download, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function SharePage({ navigate, photoId }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getSharePhoto(photoId);
        if (cancelled) return;
        setPhoto(data);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load photo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-fleur-cream flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="mx-auto w-10 h-10 text-fleur-rose animate-spin mb-4" />
          <p className="text-fleur-ink/60 text-sm">Loading your photo…</p>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-fleur-cream flex items-center justify-center px-6">
        <div className="card p-10 text-center max-w-md w-full animate-fade-in">
          <AlertCircle className="mx-auto w-14 h-14 text-fleur-rose mb-6" />
          <h2 className="font-display font-bold text-2xl text-fleur-ink mb-3">Photo not found</h2>
          <p className="text-fleur-ink/60 mb-8">{error || "This photo could not be loaded."}</p>
          <button onClick={() => navigate("welcome")} className="btn-primary w-full">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fleur-cream">
      <div className="blob top-[-15%] right-[-10%] w-[420px] h-[420px] rounded-full bg-fleur-rose/20 pointer-events-none" />
      <div className="relative z-10 px-4 sm:px-6 py-8 max-w-md mx-auto">
        <button
          onClick={() => navigate("welcome")}
          className="btn-ghost flex items-center gap-2 text-fleur-ink/70 hover:bg-fleur-blush/50 text-sm mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to home
        </button>
        <div className="card p-6 sm:p-10">
          <h2 className="font-display font-bold text-2xl text-fleur-ink mb-3 text-center">
            Your photo strip
          </h2>
          <div className="flex items-center justify-center bg-fleur-blush rounded-[2rem] border border-fleur-blush/60 overflow-hidden mb-6">
            <img src={photo.imageUrl} alt="Photo strip" className="block max-h-[600px] w-full object-contain" />
          </div>
          <p className="text-[10px] font-bold text-fleur-ink/50 uppercase tracking-widest text-center mb-6">
            Long-press image to save on iOS
          </p>
          <button
            onClick={() => {
              if (photo.downloadUrl) window.location.href = photo.downloadUrl;
            }}
            className="btn-primary w-full py-5 flex items-center justify-center gap-3 text-base shadow-[0_10px_25px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_35px_rgba(212,165,165,0.45)]"
          >
            <Download className="w-5 h-5" /> Save / Download Photo
          </button>
          <p className="text-center text-xs text-fleur-ink/40 mt-4">
            Photo ID: <span className="text-fleur-ink">{photo.photoId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
