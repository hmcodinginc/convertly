import type { Area } from "react-easy-crop"

const OUTPUT_SIZE = 512

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.crossOrigin = "anonymous"
    image.src = url
  })
}

/** Crop to square pixels then downscale to a lightweight avatar JPEG blob. */
export async function getCroppedAvatarBlob(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Unable to crop image in this browser.")
  }

  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to create cropped image."))
          return
        }
        resolve(blob)
      },
      "image/jpeg",
      0.9
    )
  })
}
