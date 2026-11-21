import { useEffect, useRef, useState } from "react";
import { templateImageUrl } from "@/lib/api";

export function PhotoStripRenderer({ template, photos, maxDimension, onReady, filter }) {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!template || !template.original_path) {
      setReady(false);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const finalize = () => {
      const url = canvas.toDataURL("image/png");
      setImageUrl(url);
      setReady(true);
      if (onReady) onReady(url);
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let w = template.width || img.naturalWidth;
      let h = template.height || img.naturalHeight;
      if (maxDimension && Math.max(w, h) > maxDimension) {
        const scale = maxDimension / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      let pending = 0;
      const frames = template.frames || [];
      frames.forEach((frame) => {
        const photoIndex = (frame.photoNumber || 1) - 1;
        const photoUrl = photos[photoIndex];
        if (!photoUrl) return;
        pending += 1;
        const pImg = new Image();
        pImg.crossOrigin = "anonymous";
        pImg.onload = () => {
          const fx = (frame.x || 0) * w;
          const fy = (frame.y || 0) * h;
          const fw = Math.max((frame.width || 0) * w, 1);
          const fh = Math.max((frame.height || 0) * h, 1);

          const scale = Math.max(fw / pImg.width, fh / pImg.height);
          const sw = pImg.width * scale;
          const sh = pImg.height * scale;
          const dx = fx + (fw - sw) / 2;
          const dy = fy + (fh - sh) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.rect(fx, fy, fw, fh);
          ctx.clip();

          if (filter === "bw") ctx.filter = "grayscale(100%)";
          else if (filter === "vintage") ctx.filter = "sepia(100%) saturate(1.2)";
          else ctx.filter = "none";

          ctx.drawImage(pImg, dx, dy, sw, sh);
          ctx.restore();

          pending -= 1;
          if (pending === 0) finalize();
        };
        pImg.onerror = () => {
          pending -= 1;
          if (pending === 0) finalize();
        };
          pImg.src = photoUrl;
      });
      if (pending === 0) finalize();
    };
    img.onerror = () => setReady(false);
    img.src = templateImageUrl(template.original_path);
  }, [template, photos, maxDimension, filter]);

  return (
    <canvas
      ref={canvasRef}
      className="block rounded-xl shadow-soft bg-white border border-fleur-blush/40"
      style={{ maxWidth: "100%", height: "auto", display: "block" }}
    />
  );
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const dx = x + (w - sw) / 2;
  const dy = y + (h - sh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, sw, sh);
  ctx.restore();
}

export { PhotoStripRenderer as default };
