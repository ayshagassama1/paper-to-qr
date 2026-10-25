export type Dish = {
  id: string
  name: string
  price_cents: number | null
  active: boolean
}

export type RestaurantPrivate = {
  name: string
  slug: string
  code: string
  dishes: Dish[]
  extraction_empty: boolean
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function errorMessage(status: number, body: unknown): string {
  if (status === 503 || status === 504) {
    return "Reading your menu took too long. Try again with fewer photos."
  }
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === "string") return detail
  return "Something went wrong. Please try again."
}

/**
 * Uploads the name and photos. Uses XMLHttpRequest rather than fetch so the
 * form can tell when the bytes are sent and the API starts reading the menu.
 */
export function createRestaurant(
  name: string,
  photos: Blob[],
  onUploaded: () => void,
): Promise<RestaurantPrivate> {
  const form = new FormData()
  form.append("name", name)
  photos.forEach((photo, i) => form.append("images", photo, `photo-${i + 1}.jpg`))

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/restaurants")
    xhr.responseType = "json"
    xhr.upload.onload = onUploaded
    xhr.onload = () => {
      if (xhr.status === 201) resolve(xhr.response as RestaurantPrivate)
      else reject(new ApiError(xhr.status, errorMessage(xhr.status, xhr.response)))
    }
    xhr.onerror = () => reject(new ApiError(0, "Can't reach Paper to QR. Check your connection and try again."))
    xhr.send(form)
  })
}
