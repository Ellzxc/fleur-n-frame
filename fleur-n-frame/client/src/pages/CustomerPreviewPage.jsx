import { useCallback, useEffect, useState } from "react";
import { Image, RefreshCw, ChevronLeft, Download, X as XIcon } from "lucide-react";
import { PhotoStripRenderer } from "@/components/PhotoStripRenderer";
import { api } from "@/lib/api";

export default function CustomerPreviewPage({ navigate }) {
  const [sessionId, setSessionId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ready, setReady] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get("session");
    const id = sessionId || urlSessionId;
    if (!id) {
      setError("No session ID provided.");
      return;
    }
    setSessionId(id);
    setLoading(true);
    api.getPhotoSession(id)
      .then((session) => {
        setPhotos(session.photos || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Session not found or expired.");
        setLoading(false);
      });
  }, [sessionId]);

  const downloadStrip = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = `fleur-n-frame-strip-${sessionId}.png`;
    link.href = previewUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allTaken = photos.every(Boolean);

  if (error) {
    return (
      <div className="min-h-screen bg-fleur-cream flex items-center justify-center px-6 animate-fade-in">
        <div className="card p-10 text-center max-w-md w-full">
          <Image className="mx-auto w-16 h-14 text-fleur-rose mb-6" />
          <h2 className="font-display font-bold text-2xl text-fleur-ink mb-3">{error}</h2>
          <button onClick={() => navigate("welcome")} className="btn-primary w-full">
            Back to start
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fleur-cream flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <Image className="mx-auto w-16 h-14 text-fleur-rose mb-6" />
          <p className="text-fleur-ink/50 text-sm">Loading your photos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fleur-cream p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <button onClick={() => navigate("welcome")} className="btn-ghost flex items-center gap-2 text-fleur-ink/70 hover:bg-fleur-blush/50 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to home
        </button>
        <div className="flex items-center gap-3">
          {previewUrl && (
            <button onClick={downloadStrip} className="btn-soft flex items-center gap-2 text-fleur-ink/70 hover:bg-fleur-blush/50 border-fleur-blush/40">
              <Download className="w-4 h-4" /> Download Strip
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-fleur-ink mb-3 tracking-tight animate-slide-up">Your Photo Strip</h1>
          <p className="text-fleur-ink/60 animate-slide-up delay-100">Scan and save your memories</p>
        </div>

        {/* Main strip preview */}
        <div className="mb-10 flex justify-center">
          <div className="relative inline-block shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-[2rem] border-4 border-fleur-blush/60 bg-white overflow-hidden animate-slide-up delay-200">
            {ready && previewUrl ? (
              <img src={previewUrl} alt="Photo Strip" className="block max-w-[600px] max-h-[400px]" />
            ) : (
              <div className="flex items-center justify-center h-96 bg-fleur-blush rounded-[2rem] text-fleur-ink/40">
                Loading strip preview…
              </div>
            )}
            {sessionId && (
              <div className="absolute top-4 right-4 z-10 bg-fleur-ink/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                Session: {sessionId}
              </div>
            )}
          </div>
        </div>

        {/* Photo thumbnails grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {photos.map((photo, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <div
                key={i}
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className={`relative cursor-pointer group rounded-xl overflow-hidden border transition-all duration-300 ${
                  isExpanded
                    ? "ring-3 ring-fleur-rose bg-white shadow-[0_0_20px_rgba(212,165,165,0.4)]"
                    : "border-fleur-blush/40 hover:border-fleur-rose/50 hover:shadow-md"
                } animate-slide-up delay-300`}
              >
                <img
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-fleur-ink/90 to-transparent px-3 py-2 text-white text-xs font-bold">
                  Photo {i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded photo preview modal */}
        {expandedIndex !== null && photos[expandedIndex] && (
          <div className="fixed inset-0 z-50 bg-fleur-ink/98 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-[700px] h-[700px] flex items-center justify-center bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 animate-slide-up">
              <img src={photos[expandedIndex]} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => setExpandedIndex(null)} className="absolute top-4 right-4 z-30 bg-fleur-ink/90 text-white rounded-full p-3 hover:bg-fleur-rose/90 transition-all">
                <XIcon className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <span className="bg-fleur-ink/90 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">Photo {expandedIndex + 1}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
