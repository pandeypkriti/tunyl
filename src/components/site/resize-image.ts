// Photos from a phone camera are often 3-8 MB. The reader only needs enough
// resolution to read the print, so this shrinks the long edge and re-encodes
// as a JPEG before anything leaves the browser.
export type ResizedPhoto = {
  base64: string; // no "data:" prefix, ready for the API and the server action
  dataUrl: string; // for <img src>
};

export function resizeImageToJpeg(file: File, maxEdge = 1568, quality = 0.85): Promise<ResizedPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that photo."));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("This browser cannot resize photos."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const comma = dataUrl.indexOf(",");
        resolve({ base64: dataUrl.slice(comma + 1), dataUrl });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
