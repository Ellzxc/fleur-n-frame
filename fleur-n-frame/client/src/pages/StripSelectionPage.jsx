import { useCallback, useEffect, useState } from "react";
import { Download, Image, RefreshCw, Heart, FileText, ChevronLeft, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { usePhotos } from "@/context/PhotoContext";
import { PhotoStripRenderer } from "@/components/PhotoStripRenderer";
import { jsPDF } from "jspdf";

export default function StripSelectionPage({ navigate, sessionId: passedSessionId }) {
  const { photos } = usePhotos();
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(passedSessionId || null);

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
    setReady(Boolean(url));
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

  const allTaken = photos.every(Boolean);

  if (error) {
    return (
      <div className="min-h-screen bg-fleur-cream flex items-center justify-center px-6">
        <div className="card p-10 text-center max-w-md w-full animate-fade-in">
          <Image className="mx-auto w-14 h-14 text-fleur-rose mb-6" />
          <h2 className="font-display font-bold text-2xl text-fleur-ink mb-3">Unable to load designs</h2>
          <p className="text-fleur-ink/60 mb-8">{error}</p>
          <button onClick={load} className="btn-primary w-full mb-4">
            Try again
          </button>
          <button onClick={() => navigate("welcome")} className="btn-ghost w-full text-sm">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-fleur-cream">
        <div className="px-6 py-4 z-10 flex items-center justify-between">
          <button onClick={() => navigate("welcome")} className="btn-ghost flex items-center gap-2 text-fleur-ink/70 hover:bg-fleur-blush/50 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to home
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-fleur-ink/40 uppercase tracking-widest">
            {photos.filter(Boolean).length} / 4 photos captured
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <header className="mb-10 text-center">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-fleur-ink mb-3 tracking-tight animate-slide-up">Choose your design</h2>
            <p className="text-fleur-ink/60 animate-slide-up delay-100">Preview your four pictures inside each published photo strip.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {templates.map((t) => {
              const isSelected = selectedId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`card-hover cursor-pointer group relative overflow-hidden animate-slide-up ${
                    isSelected ? "ring-3 ring-fleur-rose bg-fleur-blush/40" : ""
                  }`}
                  style={{ animationDelay: `${templates.indexOf(t) * 100}ms` }}
                >
                  <div className="h-64 overflow-hidden relative group-hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute inset-0 bg-fleur-blush/30 group-hover:bg-fleur-blush/50 transition-colors"></div>
                    <PhotoStripRenderer
                      template={t}
                      photos={photos}
                      maxDimension={600}
                    />
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-fleur-ink text-xs font-semibold shadow-sm border border-white/50">
                      <Heart className="w-3 h-3 fill-current" /> {t.frames?.length || 0} frames
                    </div>
                    {isSelected && (
                      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-fleur-rose text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        <CheckCircle className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-bold text-lg text-fleur-ink mb-1">{t.name}</h3>
                      <p className={`text-xs font-bold uppercase tracking-widest ${t.status === "published" ? "text-fleur-rose" : "text-fleur-ink/50"}`}>{t.status === "published" ? "Available" : "Draft"}</p>
                  </div>
                </div>
              );
            })}
            {templates.length === 0 && (
              <div className="col-span-full card p-16 text-center animate-fade-in">
                <Image className="mx-auto w-16 h-16 text-fleur-rose/30 mb-6" />
                <h3 className="font-display font-bold text-xl text-fleur-ink mb-2">No designs published yet</h3>
                <p className="text-fleur-ink/50 text-sm mb-6">
                  Ask an administrator to upload and publish a photo strip design.
                </p>
                <button onClick={() => navigate("welcome")} className="btn-ghost text-sm">
                  Back to home
                </button>
              </div>
            )}
          </div>

          {template && (
            <section className="card p-8 md:p-12 animate-slide-up">
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="lg:w-1/2">
                  <div className="relative">
                    <div className="absolute -top-10 left-0 flex items-center gap-2 text-xs font-bold text-fleur-ink/70 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-fleur-blush/40 shadow-sm">
                      <Image className="w-3 h-3 text-fleur-rose" /> Preview
                    </div>
                    <PhotoStripRenderer
                      template={template}
                      photos={photos}
                      maxDimension={1200}
                      onReady={handleRendererReady}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all"></div>
                  </div>
                  <p className="mt-6 text-sm text-fleur-ink/60 leading-relaxed">
                    Your four pictures are placed according to the frame positions configured by the administrator.
                  </p>
                </div>
                <div className="lg:w-1/2 flex flex-col gap-5">
                  <div>
                    <h3 className="font-display font-bold text-xl text-fleur-ink mb-2">{template.name}</h3>
                    <p className="text-fleur-ink/60 text-sm">
                      {template.frames?.length || 0} photo frame(s) configured &middot;
                      {template.status === "published" ? "Published" : "Unpublished"}
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleSavePDF}
                      disabled={!allTaken || !previewUrl || generating}
                      className="btn-primary w-full py-5 flex items-center justify-center gap-3 text-lg shadow-[0_10px_25px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_35px_rgba(212,165,165,0.45)]"
                    >
                      <FileText className="w-5 h-5" />
                      {generating ? "Saving PDF…" : "Save as PDF"}
                    </button>
                    <button
                      onClick={handleSaveImage}
                      disabled={!allTaken || !previewUrl || generating}
                      className="btn-soft w-full py-5 flex items-center justify-center gap-3 text-lg border border-fleur-blush/40 hover:bg-fleur-blush/50"
                    >
                      <Download className="w-5 h-5" />
                      Save as Image
                    </button>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="btn-ghost w-full py-3 text-sm flex items-center justify-center gap-2 hover:bg-fleur-blush/50"
                    >
                      <RefreshCw className="w-4 h-4" /> Choose a different design
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
