import { ImagePlus, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { ProcessingSteps, type ProcessingStep } from "@/components/ProcessingSteps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createRestaurant, type RestaurantPrivate } from "@/lib/api"
import { compressImage, UnsupportedImageError } from "@/lib/compressImage"
import { cn } from "@/lib/utils"

const MAX_PHOTOS = 5

export function NewRestaurantForm({ onCreated }: { onCreated: (menu: RestaurantPrivate) => void }) {
  const [name, setName] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [step, setStep] = useState<ProcessingStep | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showMissing, setShowMissing] = useState(false)
  const [dragging, setDragging] = useState(false)

  const previews = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  function addPhotos(files: FileList | null) {
    if (!files) return
    const images = Array.from(files).filter((f) => f.type.startsWith("image/") || f.name.match(/\.hei[cf]$/i))
    setError(images.length + photos.length > MAX_PHOTOS ? `You can add up to ${MAX_PHOTOS} photos.` : null)
    setPhotos((current) => [...current, ...images].slice(0, MAX_PHOTOS))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || photos.length === 0) {
      setShowMissing(true)
      return
    }
    setError(null)
    setStep("uploading")
    try {
      const compressed = await Promise.all(photos.map(compressImage))
      onCreated(await createRestaurant(name.trim(), compressed, () => setStep("reading")))
    } catch (err) {
      setStep(null)
      setError(
        err instanceof UnsupportedImageError
          ? "This image format isn't supported. Try a JPEG or PNG photo."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      )
    }
  }

  if (step) return <ProcessingSteps step={step} />

  const nameMissing = showMissing && !name.trim()
  const photosMissing = showMissing && photos.length === 0

  return (
    <form className="space-y-6" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <label htmlFor="restaurant-name" className="text-sm font-medium text-ink">
          Restaurant name
        </label>
        <Input
          id="restaurant-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chez Marcel"
          aria-invalid={nameMissing || undefined}
        />
        {nameMissing && <p className="text-sm text-destructive">Enter your restaurant's name.</p>}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-ink">Menu photos</span>
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            addPhotos(e.dataTransfer.files)
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed bg-background px-6 py-8 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50",
            dragging ? "border-primary" : photosMissing ? "border-destructive" : "border-input",
          )}
        >
          <ImagePlus className="size-6 text-primary" strokeWidth={1.75} />
          <span className="font-medium text-ink">Add photos of your menu</span>
          <span className="text-sm text-ink-soft">Up to {MAX_PHOTOS} photos. Take them in good light, straight on.</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addPhotos(e.target.files)
              e.target.value = ""
            }}
          />
        </label>
        {photosMissing && <p className="text-sm text-destructive">Add at least one photo.</p>}

        {photos.length > 0 && (
          <ul className="grid grid-cols-5 gap-2 pt-2">
            {previews.map((url, i) => (
              <li key={url} className="relative aspect-square">
                <img src={url} alt={`Menu photo ${i + 1}`} className="size-full rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setPhotos((current) => current.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-ink text-white"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full">
        Read my menu
      </Button>
    </form>
  )
}
