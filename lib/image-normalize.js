// Client-side image normalizer.
// Loads any uploaded image and cover-crops/resizes it to a fixed width/height,
// returning a compressed WEBP File so every stored image has identical dimensions.
// SVG and GIF pass through unchanged (vector / animation should not be rasterized).
export function normalizeImage(file, targetW, targetH) {
  return new Promise((resolve) => {
    try {
      if (!file || !file.type || file.type === 'image/svg+xml' || file.type === 'image/gif') { resolve(file); return; }
      const TW = targetW || 1200;
      const TH = targetH || 900;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = TW; canvas.height = TH;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, TW, TH);
          const scale = Math.max(TW / img.width, TH / img.height);
          const dw = img.width * scale, dh = img.height * scale;
          const dx = (TW - dw) / 2, dy = (TH - dh) / 2;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, dx, dy, dw, dh);
          URL.revokeObjectURL(url);
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            const base = file.name || 'image';
            const dot = base.lastIndexOf('.');
            const stem = dot > 0 ? base.slice(0, dot) : base;
            resolve(new File([blob], stem + '.webp', { type: 'image/webp' }));
          }, 'image/webp', 0.86);
        } catch (e) { URL.revokeObjectURL(url); resolve(file); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    } catch (e) { resolve(file); }
  });
}
