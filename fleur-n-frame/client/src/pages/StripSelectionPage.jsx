import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Image,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Camera,
  Sparkles,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { api, templateImageUrl } from "@/lib/api";
import { usePhotos } from "@/context/PhotoContext";
import { PhotoStripRenderer } from "@/components/PhotoStripRenderer";
import { jsPDF } from "jspdf";

const FILTERS = [
  { id: "none", label: "Original" },
  { id: "bw", label: "Black & White" },
  { id: "vintage", label: "Vintage" },
];

const STRIP_COLORS = {
  1: "#E8A0A8",
  2: "#9FB8A0",
  3: "#E5CE85",
  4: "#B3A9D6",
};

function MiniStrip({ template, isSelected }) {
  const canvasRef = useRef(null);
  const frames = Array.isArray(template.frames) ? template.frames : [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template?.original_path) return;
    let cancelled = false;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const w = 160;
      const h = Math.max(1, Math.round(w * (img.naturalHeight / img.naturalWidth)));
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      frames.forEach((f) => {
        const num = f.photoNumber || 1;
        const colorKey = ((num - 1) % 4) + 1;
        const x = (f.x || 0) * w;
        const y = (f.y || 0) * h;
        const fw = Math.max((f.width || 0) * w, 1);
        const fh = Math.max((f.height || 0) * h, 1);
        ctx.fillStyle = STRIP_COLORS[colorKey] + "cc";
        ctx.fillRect(x, y, fw, fh);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(fw - 1, 0), Math.max(fh - 1, 0));
        ctx.fillStyle = "#222";
        ctx.font = "bold 13px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(num), x + fw / 2, y + fh / 2);
      });
    };
    img.onerror = () => {};
    img.src = templateImageUrl(template.original_path);
    return () => {
      cancelled = true;
    };
  }, [template]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#2c2a2c] shadow-inner">
      <canvas ref={canvasRef} className="block w-full h-auto" width={160} height={240} />
      {isSelected && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-white/70 pointer-events-none" />
      )}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-fleur-rose text-white flex items-center justify-center shadow-md animate-fade-in">
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </div>
      )}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-black/40 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-semibold text-white">
        {frames.length} slots
      </div>
    </div>
  );
}

export default function StripSelectionPage({ navigate, sessionId: passedSessionId }) {
  const { photos } = usePhotos();
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("none");
  const [previewScale, setPreviewScale] = useState(1);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.listTemplates(true);
      setTemplates(data || []);
      if (data && data.length && !selectedId) setSelectedId(data[0].id);
    } catch (err) {
      setError(err.message);
    }
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  const template = templates.find((t) => t.id === selectedId) || null;

  const handleRendererReady = useCallback((url) => {
    setPreviewUrl(url);
  }, []);

  const handleSavePDF = useCallback(async () => {
    if (!previewUrl) return;
    setGenerating(true);
    try {
      const img = document.createElement("img");
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl;
      });
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px",
        format: [img.width, img.height],
      });
      pdf.addImage(previewUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`fleur-n-frame-strip-${Date.now()}.pdf`);
    } catch (err) {
      setError(err.message || "Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  }, [previewUrl]);

  const handleSaveImage = useCallback(() => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = `fleur-n-frame-strip-${Date.now()}.png`;
    link.href = previewUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [previewUrl]);

  const scrollStrip = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.6, 240), behavior: "smooth" });
  };

  const allTaken = photos.every(Boolean);
  const takenCount = photos.filter(Boolean).length;

  if (error) {
    return (
      <div className="min-h-screen bg-fleur-cream flex items-center justify-center px-6">
        <div className="card p-10 text-center max-w-md w-full animate-fade-in">
          <Image className="mx-auto w-14 h-14 text-fleur-rose mb-6" />
          <h2 className="font-display font-bold text-2xl text-fleur-ink mb-3">Unable to load designs</h2>
          <p className="text-fleur-ink/60 mb-8">{error}</p>
          <button onClick={load} className="btn-primary w-full mb-4">Try again</button>
          <button onClick={() => navigate("welcome")} className="btn-ghost w-full text-sm">Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fleur-cream">
      <div className="blob top-[-15%] right-[-10%] w-[420px] h-[420px] rounded-full bg-fleur-rose/20 pointer-events-none" />

      <div className="relative z-10">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("welcome")}
            className="btn-ghost flex items-center gap-2 text-fleur-ink/70 hover:bg-fleur-blush/50 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to home
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-fleur-ink/50 uppercase tracking-widest">
            <Camera className="w-3.5 h-3.5 text-fleur-rose" />
            {takenCount} / 4 photos captured
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-4">
          <header className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fleur-rose/10 border border-fleur-rose/25 text-fleur-rose text-[10px] font-bold uppercase tracking-widest mb-4 animate-fade-in">
              <Sparkles className="w-3 h-3" /> Final step
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-fleur-ink mb-3 tracking-tight animate-slide-up text-balance">
              Choose your design
            </h1>
            <p className="text-fleur-ink/60 max-w-lg mx-auto animate-slide-up delay-100">
              Pick a template to see your photos come together into a polished strip.
            </p>
          </header>

          {/* Template chooser — horizontal snap strip */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="floral-divider whitespace-nowrap text-xs">Choose a template</div>
              </div>
              {templates.length > 1 && (
                <div className="hidden sm:flex items-center gap-1.5 ml-4">
                  <button
                    onClick={() => scrollStrip(-1)}
                    className="w-9 h-9 rounded-full bg-white border border-fleur-blush/60 text-fleur-ink/60 flex items-center justify-center hover:bg-fleur-blush/50 hover:text-fleur-ink transition-all active:scale-95"
                    aria-label="Scroll templates left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollStrip(1)}
                    className="w-9 h-9 rounded-full bg-white border border-fleur-blush/60 text-fleur-ink/60 flex items-center justify-center hover:bg-fleur-blush/50 hover:text-fleur-ink transition-all active:scale-95"
                    aria-label="Scroll templates right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {templates.length === 0 ? (
              <div className="card p-14 text-center animate-fade-in">
                <Image className="mx-auto w-14 h-14 text-fleur-rose/30 mb-5" />
                <h3 className="font-display font-bold text-xl text-fleur-ink mb-2">No designs published yet</h3>
                <p className="text-fleur-ink/50 text-sm mb-6 max-w-sm mx-auto">
                  Ask an administrator to upload and publish a photo strip design.
                </p>
                <button onClick={() => navigate("welcome")} className="btn-ghost text-sm">Back to home</button>
              </div>
            ) : (
              <div className="relative">
                <div
                  ref={scrollRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 px-1"
                >
                  {templates.map((t, idx) => {
                    const isSelected = selectedId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={`snap-start shrink-0 w-[132px] sm:w-[150px] text-left rounded-2xl p-2.5 transition-all duration-300 animate-slide-up ${
                          isSelected
                            ? "bg-white ring-2 ring-fleur-rose shadow-[0_12px_30px_rgba(212,165,165,0.35)] -translate-y-1"
                            : "bg-white/70 border border-fleur-blush/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                        }`}
                        style={{ animationDelay: `${idx * 70}ms` }}
                      >
                        <MiniStrip template={t} isSelected={isSelected} />
                        <div className="mt-2.5 px-0.5">
                          <p className="text-xs font-bold text-fleur-ink truncate">{t.name}</p>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${t.status === "published" ? "text-fleur-rose" : "text-fleur-ink/40"}`}>
                            {t.status === "published" ? "Available" : "Draft"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-fleur-cream to-transparent" />
              </div>
            )}
          </section>

          {/* Detailed preview */}
          {template && (
            <section className="card p-6 sm:p-10 animate-slide-up">
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
                <div className="w-full lg:w-1/2">
                  <div className="relative rounded-2xl bg-fleur-blush/40 border border-fleur-blush/60 p-4 sm:p-6 flex items-center justify-center min-h-[280px] overflow-visible">
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-fleur-ink/70 border border-fleur-blush/50 shadow-sm uppercase tracking-wider">
                      <Image className="w-3 h-3 text-fleur-rose" /> Live preview
                    </div>
                    <div className="absolute top-3 right-3 z-20 flex gap-1">
                      <button
                        onClick={() => setPreviewScale((s) => Math.max(0.5, s - 0.2))}
                        className="w-8 h-8 rounded-full bg-white border border-fleur-blush/60 text-fleur-ink/60 flex items-center justify-center hover:bg-fleur-blush/50 active:scale-95 transition-all"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewScale((s) => Math.min(2, s + 0.2))}
                        className="w-8 h-8 rounded-full bg-fleur-rose border border-fleur-rose text-white flex items-center justify-center hover:bg-fleur-rose/90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(212,165,165,0.35)]"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-[440px] flex items-center justify-center overflow-visible">
                      <div
                        className="inline-block"
                        style={{
                          transform: `scale(${previewScale})`,
                          transformOrigin: "center center",
                          display: "inline-flex",
                          justifyContent: "center",
                        }}
                      >
                        <PhotoStripRenderer
                          template={template}
                          photos={photos}
                          maxDimension={1200}
                          onReady={handleRendererReady}
                          filter={filter}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-fleur-ink/50 leading-relaxed text-center">
                    Your photos are placed into the slots configured for this design.
                  </p>
                </div>

                <div className="w-full lg:w-1/2 flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge-published">Selected</span>
                      <span className="badge-draft">{template.frames?.length || 0} slots</span>
                    </div>
                    <h3 className="font-display font-bold text-2xl text-fleur-ink mb-1">{template.name}</h3>
                    <p className="text-fleur-ink/50 text-sm">
                      {template.status === "published" ? "Ready to print" : "Unpublished preview"}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-bold text-fleur-ink/50 uppercase tracking-widest mb-3">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-fleur-rose" /> Photo filter
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                            filter === f.id
                              ? "bg-fleur-rose border-fleur-rose text-white shadow-[0_4px_12px_rgba(212,165,165,0.35)]"
                              : "bg-white border-fleur-blush/60 text-fleur-ink/60 hover:bg-fleur-blush/50"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 pt-2">
                    <button
                      onClick={handleSavePDF}
                      disabled={!allTaken || !previewUrl || generating}
                      className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-base shadow-[0_10px_25px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_35px_rgba(212,165,165,0.45)]"
                    >
                      <FileText className="w-5 h-5" />
                      {generating ? "Saving PDF…" : "Save as PDF"}
                    </button>
                    <button
                      onClick={handleSaveImage}
                      disabled={!allTaken || !previewUrl || generating}
                      className="btn-soft w-full py-4 flex items-center justify-center gap-3 text-base hover:bg-fleur-blush/50"
                    >
                      <Download className="w-5 h-5" /> Save as Image
                    </button>
                    {!allTaken && (
                      <p className="text-center text-xs text-fleur-ink/40">
                        Capture all four photos to export.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
