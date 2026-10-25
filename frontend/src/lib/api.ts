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

export type PublicMenu = {
  name: string
  dishes: { name: string; price_cents: number | null }[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch {
    throw new ApiError(0, "Can't reach Paper to QR. Check your connection and try again.")
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, errorMessage(res.status, body))
  return body as T
}

export function getMenuByCode(code: string): Promise<RestaurantPrivate> {
  return request("/api/manage", { headers: { "X-Menu-Code": code } })
}

export function addDish(code: string, dish: { name: string; price_cents: number | null }): Promise<Dish> {
  return request("/api/manage/dishes", {
    method: "POST",
    headers: { "X-Menu-Code": code, "Content-Type": "application/json" },
    body: JSON.stringify(dish),
  })
}

export function updateDish(
  code: string,
  id: string,
  changes: Partial<Pick<Dish, "name" | "price_cents" | "active">>,
): Promise<Dish> {
  return request(`/api/manage/dishes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "X-Menu-Code": code, "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  })
}

export function deleteDish(code: string, id: string): Promise<void> {
  return request(`/api/manage/dishes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-Menu-Code": code },
  })
}

export function getPublicMenu(slug: string): Promise<PublicMenu> {
  return request(`/api/menus/${encodeURIComponent(slug)}`)
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
