import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Image as ImageIcon, RotateCw, Trash2, Save, Check, Plus, SlidersHorizontal, Cog } from "lucide-react";
import { api, templateImageUrl } from "@/lib/api";
import { PhotoStripRenderer } from "@/components/PhotoStripRenderer";

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function makePlaceholder(color) {
  const c = document.createElement("canvas");
  c.width = 200;
  c.height = 200;
  const cx = c.getContext("2d");
  cx.fillStyle = color;
  cx.fillRect(0, 0, 200, 200);
  return c.toDataURL("image/png");
}

const SAMPLE_PHOTOS = [
  makePlaceholder("#F7E8EA"),
  makePlaceholder("#D4A5A5"),
  makePlaceholder("#B7C4B7"),
  makePlaceholder("#EDE3D5"),
];

const SNAP_THRESHOLD = 8;

export default function TemplateEditorPage({ navigate, templateId }) {
  const [template, setTemplate] = useState(null);
  const [frames, setFrames] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await api.getTemplate(templateId);
        if (cancelled) return;
        setTemplate(t);
        setFrames(Array.isArray(t.frames) ? t.frames : []);
        if (t.frames && t.frames.length && !selectedId) setSelectedId(t.frames[0].id);
      } catch (err) {
        setMessage(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [templateId]);

  const containerRect = useCallback(() => {
    const el = containerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
    const img = el.querySelector("img");
    if (img) {
      const ir = img.getBoundingClientRect();
      if (ir.width > 0 && ir.height > 0) return ir;
    }
    return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  }, []);

  const setFrameField = useCallback((id, updates) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const startDrag = (e, frame) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(frame.id);
    const r = containerRect();
    dragRef.current = {
      active: true,
      frame,
      startX: e.clientX,
      startY: e.clientY,
      frameX: frame.x,
      frameY: frame.y,
      frameW: frame.width,
      frameH: frame.height,
      containerW: r.width,
      containerH: r.height,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "move";
    const onMove = (ev) => {
      const d = dragRef.current;
      if (!d || !d.active) return;
      const dx = (ev.clientX - d.startX) / d.containerW;
      const dy = (ev.clientY - d.startY) / d.containerH;
      let nx = clamp(d.frameX + dx, 0, 1 - d.frameW);
      let ny = clamp(d.frameY + dy, 0, 1 - d.frameH);

      const snapPx = SNAP_THRESHOLD / d.containerW;
      const snapPy = SNAP_THRESHOLD / d.containerH;
      for (const other of frames) {
        if (other.id === d.frame.id) continue;
        const ox = other.x;
        const oy = other.y;
        const ow = other.width;
        const oh = other.height;

        if (Math.abs(nx - (ox + ow)) < snapPx) nx = ox + ow;
        if (Math.abs((nx + d.frameW) - ox) < snapPx) nx = ox - d.frameW;
        if (Math.abs(ny - (oy + oh)) < snapPy) ny = oy + oh;
        if (Math.abs((ny + d.frameH) - oy) < snapPy) ny = oy - d.frameH;
        if (Math.abs(nx - ox) < snapPx) nx = ox;
        if (Math.abs((nx + d.frameW) - (ox + ow)) < snapPx) nx = ox + ow - d.frameW;
        if (Math.abs(ny - oy) < snapPy) ny = oy;
        if (Math.abs((ny + d.frameH) - (oy + oh)) < snapPy) ny = oy + oh - d.frameH;
      }

      nx = clamp(nx, 0, 1 - d.frameW);
      ny = clamp(ny, 0, 1 - d.frameH);
      setFrameField(d.frame.id, { x: nx, y: ny });
    };
    const onEnd = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      if (dragRef.current) dragRef.current.active = false;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
  };

  const startResize = (e, frame, handle) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(frame.id);
    const r = containerRect();
    resizeRef.current = {
      active: true,
      frame,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      frameX: frame.x,
      frameY: frame.y,
      frameW: frame.width,
      frameH: frame.height,
      containerW: r.width,
      containerH: r.height,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = resizeCursor(handle);
    const onMove = (ev) => {
      const d = resizeRef.current;
      if (!d || !d.active) return;
      const dx = (ev.clientX - d.startX) / d.containerW;
      const dy = (ev.clientY - d.startY) / d.containerH;
      const minW = 0.03;
      const minH = 0.03;

      let x = d.frameX;
      let y = d.frameY;
      let w = d.frameW;
      let h = d.frameH;

      if (d.handle === "e" || d.handle === "ne" || d.handle === "se") w = d.frameW + dx;
      if (d.handle === "w" || d.handle === "nw" || d.handle === "sw") {
        w = d.frameW - dx;
        x = d.frameX + dx;
      }
      if (d.handle === "s" || d.handle === "sw" || d.handle === "se") h = d.frameH + dy;
      if (d.handle === "n" || d.handle === "nw" || d.handle === "ne") {
        h = d.frameH - dy;
        y = d.frameY + dy;
      }

      if (w < minW) w = minW;
      if (h < minH) h = minH;
      if (x < 0) { w = Math.max(minW, w + x); x = 0; }
      if (y < 0) { h = Math.max(minH, h + y); y = 0; }
      if (x + w > 1) w = 1 - x;
      if (y + h > 1) h = 1 - y;

      setFrameField(d.frame.id, { x, y, width: w, height: h });
    };
    const onEnd = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      if (resizeRef.current) resizeRef.current.active = false;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
  };

  const resizeCursor = (handle) => {
    switch (handle) {
      case "nw": case "se": return "nwse-resize";
      case "ne": case "sw": return "nesw-resize";
      case "n": case "s": return "ns-resize";
      case "e": case "w": return "ew-resize";
      default: return "default";
    }
  };

  const addFrame = () => {
    const used = new Set(frames.map((f) => f.photoNumber));
    let num = 1;
    while (used.has(num)) num++;
    if (num > 4) num = 1;
    const id = crypto.randomUUID();
    const next = [...frames, { id, x: 0.15, y: 0.15, width: 0.15, height: 0.15, photoNumber: num }];
    setFrames(next);
    setSelectedId(id);
  };

  const detectRectangles = async () => {
    if (!template?.original_path) return;
    setAutoDetecting(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = templateImageUrl(template.original_path);
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const scale = 0.3;
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      const gray = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          gray[y * w + x] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
      }

      const rowMean = new Float32Array(h);
      const colMean = new Float32Array(w);
      for (let y = 0; y < h; y++) {
        let s = 0;
        for (let x = 0; x < w; x++) s += gray[y * w + x];
        rowMean[y] = s / w;
      }
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let y = 0; y < h; y++) s += gray[y * w + x];
        colMean[x] = s / h;
      }

      let totalMean = 0;
      for (let y = 0; y < h; y++) totalMean += rowMean[y];
      totalMean /= h;

      const rowDiff = new Float32Array(h);
      const colDiff = new Float32Array(w);
      for (let y = 1; y < h - 1; y++) rowDiff[y] = Math.abs(rowMean[y] - totalMean);
      for (let x = 1; x < w - 1; x++) colDiff[x] = Math.abs(colMean[x] - totalMean);

      const rowStd = Math.sqrt(
        Array.from(rowDiff).reduce((s, v) => s + (v - totalMean) ** 2, 0) / h
      );
      const colStd = Math.sqrt(
        Array.from(colDiff).reduce((s, v) => s + (v - totalMean) ** 2, 0) / w
      );

      const rowThresh = totalMean + Math.max(rowStd * 0.5, 8);
      const colThresh = totalMean + Math.max(colStd * 0.5, 8);

      const findLineRuns = (arr, len, thresh) => {
        const runs = [];
        let start = -1;
        for (let i = 0; i < len; i++) {
          if (arr[i] > thresh && start === -1) start = i;
          else if (arr[i] <= thresh && start !== -1) {
            runs.push([start, i - 1]);
            start = -1;
          }
        }
        if (start !== -1) runs.push([start, len - 1]);
        return runs;
      };

      const hLines = findLineRuns(rowMean, h, rowThresh);
      const vLines = findLineRuns(colMean, w, colThresh);

      const merge = (runs, gap = 4) => {
        if (runs.length === 0) return [];
        const out = [[runs[0][0], runs[0][1]]];
        for (let i = 1; i < runs.length; i++) {
          const last = out[out.length - 1];
          if (runs[i][0] - last[1] <= gap) last[1] = runs[i][1];
          else out.push([runs[i][0], runs[i][1]]);
        }
        return out;
      };

      const mergedH = merge(hLines);
      const mergedV = merge(vLines);

      const minSize = 30;
      const rects = [];
      for (let i = 0; i < mergedH.length - 1; i++) {
        for (let j = i + 1; j < mergedH.length; j++) {
          const top = mergedH[i][1] + 2;
          const bottom = mergedH[j][0] - 2;
          if (bottom - top < minSize) continue;
          for (let k = 0; k < mergedV.length - 1; k++) {
            for (let l = k + 1; l < mergedV.length; l++) {
              const left = mergedV[k][1] + 2;
              const right = mergedV[l][0] - 2;
              if (right - left < minSize) continue;
              rects.push({ left, right, top, bottom });
            }
          }
        }
      }

      rects.sort((a, b) => (b.right - b.left) * (b.bottom - b.top) - (a.right - a.left) * (a.bottom - a.top));
      const keep = [];
      for (const r of rects) {
        const overlaps = keep.some((k) => {
          const ix = Math.max(0, Math.min(r.right, k.right) - Math.max(r.left, k.left));
          const iy = Math.max(0, Math.min(r.bottom, k.bottom) - Math.max(r.top, k.top));
          return ix * iy > 0.5 * (r.right - r.left) * (r.bottom - r.top);
        });
        if (!overlaps) keep.push(r);
      }

      const framesFromRects = keep
        .slice(0, 4)
        .map((r, idx) => {
          const id = crypto.randomUUID();
          return {
            id,
            x: r.left / w,
            y: r.top / h,
            width: (r.right - r.left) / w,
            height: (r.bottom - r.top) / h,
            photoNumber: idx + 1,
          };
        });

      setAutoDetecting(false);
      return framesFromRects;
    } catch (err) {
      setAutoDetecting(false);
      setMessage(err.message);
      return [];
    }
  };

  const applyAutoDetected = async () => {
    const detected = await detectRectangles();
    if (!detected || detected.length === 0) {
      setMessage("No rectangles detected. Add frames manually.");
      return;
    }
    setFrames(detected);
    setSelectedId(detected[0]?.id || null);
    setMessage(`Detected ${detected.length} frame(s). Adjust if needed.`);
  };

  const deleteFrame = () => {
    if (!selectedId) return;
    if (!window.confirm("Remove this photo frame?")) return;
    setFrames((prev) => prev.filter((f) => f.id !== selectedId));
    setSelectedId(null);
  };

  const handleSave = async (publish) => {
    if (!template) return;
    setSaving(true);
    try {
      await api.updateTemplate(template.id, {
        frames,
        ...(publish ? { status: "published" } : {}),
      });
      setMessage(publish ? "Saved and published!" : "Saved as draft.");
      setTimeout(() => setMessage(null), 2500);
      if (publish) navigate("admin");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async () => {
    if (!editNameValue.trim()) return;
    try {
      await api.updateTemplate(template.id, { name: editNameValue.trim() });
      setEditingName(false);
      setEditNameValue("");
      setMessage("Template name updated.");
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const selected = frames.find((f) => f.id === selectedId) || null;
  const pct = (v) => Math.round((v || 0) * 100);
  const isDragging = dragRef.current?.active || false;
  const isResizing = resizeRef.current?.active || false;

  if (!template) {
    return (
      <div className="min-h-screen bg-fleur-cream flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-fleur-blush flex items-center justify-center text-fleur-rose font-bold text-lg mb-4 animate-spin">
            F&F
          </div>
          <p className="text-fleur-ink/50 text-sm">Loading template…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fleur-cream">
      <div className="px-6 py-4 border-b border-fleur-blush/60 bg-white/70 backdrop-blur-lg sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("admin")} className="btn-ghost flex items-center gap-2 text-fleur-ink/70 hover:bg-fleur-blush/50 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to admin
          </button>
          <div className="flex items-center gap-3 ml-auto">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  autoFocus
                  className="input text-sm border-fleur-rose/50 focus:border-fleur-rose max-w-[200px]"
                />
                <button
                  onClick={handleRename}
                  className="btn-soft px-3 py-1.5 text-xs text-fleur-rose border-fleur-rose/40 hover:bg-fleur-rose/10 flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={() => { setEditingName(false); setEditNameValue(""); }}
                  className="btn-ghost px-3 py-1.5 text-xs text-fleur-ink/50 hover:bg-fleur-blush/50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 cursor-pointer text-xs font-bold text-fleur-ink/50 uppercase tracking-widest hidden md:block hover:text-fleur-ink/80" onClick={() => { setEditNameValue(template.name); setEditingName(true); }}>
                {template.name}
              </div>
            )}
            <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary px-7 py-3 flex items-center gap-2 shadow-[0_10px_25px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_35px_rgba(212,165,165,0.45)]">
              <Check className="w-4 h-4" /> {saving ? "Publishing…" : "Save & Publish"}
            </button>
            <button onClick={() => handleSave(false)} className="btn-soft px-7 py-3 flex items-center gap-2 hover:bg-fleur-blush/80">
              <Save className="w-4 h-4" /> Save draft
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {message && (
          <div className="mb-8 p-5 rounded-xl bg-fleur-rose/10 border border-fleur-rose/30 text-fleur-rose text-sm flex items-center gap-2 animate-slide-up">
            <RotateCw className="w-4 h-4" /> {message}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-2/3 flex flex-col items-center">
            <div
              className="max-w-[900px] relative inline-block rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-4 border-fleur-blush/60 bg-white overflow-visible"
              ref={containerRef}
              style={{ touchAction: "none" }}
            >
              <img
                src={templateImageUrl(template.original_path)}
                alt="Template"
                className="block max-w-[900px] max-h-[70vh] object-contain"
                onError={(e) => {
                  e.currentTarget.src = template.original_path;
                }}
              />
              {frames.map((frame) => {
                const isSel = selectedId === frame.id;
                return (
                  <div
                    key={frame.id}
                    onMouseDown={(e) => startDrag(e, frame)}
                    style={{
                      left: `${frame.x * 100}%`,
                      top: `${frame.y * 100}%`,
                      width: `${frame.width * 100}%`,
                      height: `${frame.height * 100}%`,
                    }}
                    className={`absolute z-20 pointer-events-auto transition-all duration-200 ${
                      isSel
                        ? "ring-2 ring-fleur-rose ring-offset-1 shadow-[0_0_0_3px_rgba(212,165,165,0.4)] bg-white/60 border-fleur-rose/80"
                        : "border-2 border-fleur-rose/30 bg-white/50 shadow-sm"
                    }`}
                  >
                    <div className="absolute top-2 left-2 z-30 flex items-center gap-1 bg-fleur-rose text-white text-[9px] font-bold rounded-md px-2 py-0.5 shadow-sm pointer-events-none">
                      Photo {frame.photoNumber}
                    </div>
                    {["nw", "ne", "sw", "se"].map((handle) => {
                      const pos = handlePos(handle);
                      return (
                        <div
                          key={handle}
                          onMouseDownCapture={(e) => startResize(e, frame, handle)}
                          style={{ ...pos }}
                          className={`absolute z-50 w-[20px] h-[20px] rounded-full bg-transparent cursor-pointer`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
                            <div
                              className={`w-[8px] h-[8px] rounded-full bg-fleur-rose border-2 border-white shadow-sm ${
                                isSel ? "ring-1 ring-white" : ""
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div className="flex gap-3 absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <button onClick={applyAutoDetected} disabled={autoDetecting} className="btn-ghost flex items-center gap-2 text-xs text-fleur-ink/70 hover:bg-fleur-blush/50 px-4 py-2 rounded-full">
                  {autoDetecting ? (
                    <RotateCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <RotateCw className="w-3 h-3" />
                  )}
                  {autoDetecting ? "Detecting…" : "Auto-detect"}
                </button>
                <button onClick={addFrame} className="btn-soft flex items-center gap-2 text-xs text-fleur-ink/70 hover:bg-fleur-blush/80 px-4 py-2 rounded-full">
                  <Plus className="w-3 h-3" /> Add frame
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs text-fleur-ink/50 text-center">
              {isResizing ? "Resizing frame…" : isDragging ? "Dragging frame… (auto-aligns to other frames)" : "Drag frames to move • Drag small rose handles to resize"}
            </p>
          </div>

          <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="card p-6 animate-slide-up">
              <h3 className="font-semibold text-fleur-ink mb-5 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-fleur-rose" /> Frame settings
              </h3>
              {!selected ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-fleur-blush/30 flex items-center justify-center text-fleur-ink/30 font-bold text-lg mb-3 mx-auto">
                    ?
                  </div>
                  <p className="text-fleur-ink/50 text-sm">Select a frame to edit.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="label">Photo number</label>
                    <select
                      value={selected.photoNumber || 1}
                      onChange={(e) => setFrameField(selected.id, { photoNumber: Number(e.target.value) })}
                      className="input"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <field label="X (%)" value={pct(selected.x)} onChange={(v) => setFrameField(selected.id, { x: v / 100 })} min={0} max={100 - pct(selected.width)} />
                    <field label="Y (%)" value={pct(selected.y)} onChange={(v) => setFrameField(selected.id, { y: v / 100 })} min={0} max={100 - pct(selected.height)} />
                    <field label="Width (%)" value={pct(selected.width)} onChange={(v) => setFrameField(selected.id, { width: v / 100 })} min={3} max={100 - pct(selected.x)} />
                    <field label="Height (%)" value={pct(selected.height)} onChange={(v) => setFrameField(selected.id, { height: v / 100 })} min={3} max={100 - pct(selected.y)} />
                  </div>
                  <button onClick={deleteFrame} className="w-full py-3 rounded-xl border border-fleur-rose/40 text-fleur-rose text-sm font-bold hover:bg-fleur-rose/5 transition-all">
                    Remove frame
                  </button>
                </div>
              )}
            </div>

            <div className="card p-6 animate-slide-up delay-100">
              <h3 className="font-semibold text-fleur-ink mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-fleur-rose" /> Preview (sample photos)
              </h3>
              <div className="h-64 flex items-center justify-center bg-fleur-blush rounded-[2rem] border border-fleur-blush/40 overflow-hidden relative">
                <PhotoStripRenderer template={template} photos={SAMPLE_PHOTOS} maxDimension={400} />
              </div>
              <p className="text-xs text-fleur-ink/50 text-center">Preview uses placeholder colors per photo number.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function field({ label, value, onChange, min, max }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          onChange(clamp(n, min, max));
        }}
        min={min}
        max={max}
        className="input"
      />
    </div>
  );
}

function handlePos(handle) {
  const s = -10;
  const base = { position: "absolute", zIndex: 50, touchAction: "none" };
  switch (handle) {
    case "nw": return { ...base, top: s, left: s };
    case "ne": return { ...base, top: s, right: s };
    case "sw": return { ...base, bottom: s, left: s };
    case "se": return { ...base, bottom: s, right: s };
  }
}
