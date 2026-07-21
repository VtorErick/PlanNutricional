const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.82;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No fue posible leer la imagen.'));
    };
    image.src = url;
  });
}

export async function fileToCompressedJpegBase64(
  file: File
): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  if (!file.type.startsWith('image/') || (file.type && !SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase()))) {
    throw new Error('Elige una foto JPG, PNG, WebP o HEIC.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('La foto es demasiado pesada. Elige una de menos de 20 MB.');
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Tu navegador no permite procesar la foto.');
  }

  context.drawImage(image, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1] || '';

  if (!base64) {
    throw new Error('No fue posible comprimir la foto.');
  }

  return { base64, mimeType: 'image/jpeg', previewUrl: dataUrl };
}
