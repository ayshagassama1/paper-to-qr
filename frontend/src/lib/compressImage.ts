const MAX_EDGE = 1600
const JPEG_QUALITY = 0.8

export class UnsupportedImageError extends Error {}

/**
 * Shrinks a photo to 1600 px on its long edge and re-encodes it as JPEG.
 * Drawing through a canvas also drops EXIF metadata, including GPS position.
 */
export async function compressImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    // Typically HEIC in browsers that can't decode it.
    throw new UnsupportedImageError(file.name)
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new UnsupportedImageError(file.name))),
      "image/jpeg",
      JPEG_QUALITY,
    ),
  )
}
