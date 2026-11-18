// Shrinks a phone photo before upload: max 2000 px on the long side. A 6 MB photo becomes ~300 KB,
// so uploads finish on mobile data and the shop loads fast.
const MAX = 2000;

const encode = (canvas: HTMLCanvasElement, type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.85));

export async function shrinkImage(file: File): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file); // applies the photo's EXIF rotation by default
  } catch {
    throw new Error(`„${file.name}” nevar nolasīt. Izvēlies JPG vai PNG attēlu.`);
  }
  const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  // Safari can't encode WebP (it silently returns PNG), so fall back to JPEG there.
  const webp = await encode(canvas, "image/webp");
  const blob = webp?.type === "image/webp" ? webp : await encode(canvas, "image/jpeg");
  if (!blob) throw new Error(`„${file.name}” neizdevās sagatavot augšupielādei.`);
  return blob;
}
