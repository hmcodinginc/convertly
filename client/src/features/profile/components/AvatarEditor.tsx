import Cropper, { type Area } from "react-easy-crop"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Camera, ImagePlus, Trash2 } from "lucide-react"

import { Modal } from "@/components/feedback/Modal"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/features/profile/components/UserAvatar"
import { getCroppedAvatarBlob } from "@/features/profile/utils/cropImage"
import { cn } from "@/lib/utils"

type AvatarEditorProps = {
  initials: string
  currentAvatarUrl?: string | null
  previewUrl?: string | null
  disabled?: boolean
  onCropped: (blob: Blob, previewUrl: string) => void
  onRemove: () => void
}

const MAX_SOURCE_BYTES = 8 * 1024 * 1024

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

function AvatarEditor({
  initials,
  currentAvatarUrl,
  previewUrl,
  disabled = false,
  onCropped,
  onRemove,
}: AvatarEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraFallbackInputRef = useRef<HTMLInputElement>(null)
  const cropperHostRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropSize, setCropSize] = useState({ width: 280, height: 280 })
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cropError, setCropError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const zoomId = useId()

  const displayUrl = previewUrl || currentAvatarUrl || null

  const closeCamera = useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
    setCameraStream(null)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraOpen(false)
    setIsStartingCamera(false)
  }, [])

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
      stopStream(streamRef.current)
    }
  }, [sourceUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!cameraOpen || !cameraStream || !video) return
    video.srcObject = cameraStream
    void video.play().catch(() => undefined)
    return () => {
      video.srcObject = null
    }
  }, [cameraOpen, cameraStream])

  useEffect(() => {
    if (!cropOpen) return

    const host = cropperHostRef.current
    if (!host) return

    const updateCropSize = () => {
      const side = Math.floor(Math.min(host.clientWidth, host.clientHeight) * 0.88)
      const size = Math.max(220, Math.min(side, 420))
      setCropSize({ width: size, height: size })
    }

    updateCropSize()
    const observer = new ResizeObserver(updateCropSize)
    observer.observe(host)
    return () => observer.disconnect()
  }, [cropOpen])

  const closeCrop = useCallback(() => {
    setCropOpen(false)
    setCropError(null)
    setCroppedAreaPixels(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }, [])

  const openSource = useCallback((file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setCropError("Please choose an image file.")
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setCropError("Image must be under 8 MB before cropping.")
      return
    }

    setCropError(null)
    const url = URL.createObjectURL(file)
    setSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return url
    })
    setCropOpen(true)
  }, [])

  const openCamera = useCallback(async () => {
    setCropError(null)
    setCameraError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraFallbackInputRef.current?.click()
      return
    }

    setIsStartingCamera(true)
    setCameraOpen(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      })
      streamRef.current = stream
      setCameraStream(stream)
    } catch {
      closeCamera()
      setCameraError("Camera access was blocked or unavailable. Falling back to device picker.")
      cameraFallbackInputRef.current?.click()
    } finally {
      setIsStartingCamera(false)
    }
  }, [closeCamera])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is still starting. Try again in a moment.")
      return
    }

    const sourceWidth = video.videoWidth
    const sourceHeight = video.videoHeight
    const displayWidth = Math.max(video.clientWidth, 1)
    const displayHeight = Math.max(video.clientHeight, 1)
    const sourceAspect = sourceWidth / sourceHeight
    const displayAspect = displayWidth / displayHeight

    // Match object-fit: cover framing from the live preview.
    let sx = 0
    let sy = 0
    let sw = sourceWidth
    let sh = sourceHeight
    if (sourceAspect > displayAspect) {
      sw = sourceHeight * displayAspect
      sx = (sourceWidth - sw) / 2
    } else {
      sh = sourceWidth / displayAspect
      sy = (sourceHeight - sh) / 2
    }

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(sw)
    canvas.height = Math.round(sh)
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setCameraError("Unable to capture from camera.")
      return
    }

    // Preview is mirrored (selfie). Flip capture so crop matches what the user saw.
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to capture from camera.")
          return
        }
        closeCamera()
        openSource(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }))
      },
      "image/jpeg",
      0.92
    )
  }, [closeCamera, openSource])

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const applyCrop = useCallback(async () => {
    if (!sourceUrl || !croppedAreaPixels) return
    setIsCropping(true)
    setCropError(null)
    try {
      const blob = await getCroppedAvatarBlob(sourceUrl, croppedAreaPixels)
      const preview = URL.createObjectURL(blob)
      onCropped(blob, preview)
      closeCrop()
    } catch (error) {
      setCropError(error instanceof Error ? error.message : "Unable to crop image.")
    } finally {
      setIsCropping(false)
    }
  }, [closeCrop, croppedAreaPixels, onCropped, sourceUrl])

  return (
    <div className="profile-avatar-editor">
      <div className="profile-avatar-editor__row">
        <UserAvatar
          initials={initials}
          avatarUrl={displayUrl}
          size="lg"
          alt="Profile photo preview"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">Profile photo</p>
          <p className="text-xs leading-5 text-muted">
            Optional. Upload or take a photo, then crop to a square.
          </p>
          <div className="profile-avatar-editor__actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden />
              Upload
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => void openCamera()}
            >
              <Camera className="size-4" aria-hidden />
              Take photo
            </Button>
            {displayUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={onRemove}
                className="text-[#fca5a5] hover:text-[#fecaca]"
              >
                <Trash2 className="size-4" aria-hidden />
                Remove
              </Button>
            ) : null}
          </div>
          {(cropError && !cropOpen) || cameraError ? (
            <p className="text-xs text-[#fca5a5]">{cropError || cameraError}</p>
          ) : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          openSource(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      <input
        ref={cameraFallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          openSource(event.target.files?.[0])
          event.target.value = ""
        }}
      />

      <Modal
        open={cameraOpen}
        onClose={closeCamera}
        title="Take photo"
        description="Allow camera access, then capture a frame to crop."
        panelClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={closeCamera}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={capturePhoto}
              disabled={isStartingCamera}
            >
              <Camera className="size-4" aria-hidden />
              Capture
            </Button>
          </div>
        }
      >
        <div className="profile-avatar-camera">
          {isStartingCamera ? (
            <p className="text-sm text-muted">Starting camera…</p>
          ) : null}
          <video
            ref={videoRef}
            className="profile-avatar-camera__video"
            playsInline
            muted
            autoPlay
          />
        </div>
      </Modal>

      <Modal
        open={cropOpen}
        onClose={closeCrop}
        title="Crop photo"
        description="Drag and zoom to frame your avatar."
        panelClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={closeCrop} disabled={isCropping}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void applyCrop()} disabled={isCropping}>
              {isCropping ? "Cropping…" : "Use photo"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div
            ref={cropperHostRef}
            className={cn("profile-avatar-cropper relative overflow-hidden rounded-[var(--radius-md)]")}
          >
            {sourceUrl ? (
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                objectFit="contain"
                cropSize={cropSize}
                minZoom={0.6}
                maxZoom={4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor={zoomId} className="text-xs font-medium text-muted">
              Zoom
            </label>
            <input
              id={zoomId}
              type="range"
              min={0.6}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>
          {cropError ? <p className="text-xs text-[#fca5a5]">{cropError}</p> : null}
        </div>
      </Modal>
    </div>
  )
}

export { AvatarEditor }
