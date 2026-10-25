/** 1250 -> "12.50 €" (non-breaking space so the euro sign never wraps alone). */
export function formatPrice(cents: number | null): string {
  if (cents === null) return ""
  return `${(cents / 100).toFixed(2)} €`
}

/**
 * What the manager types -> cents. Accepts "12.50", "12,5", "12 €", "12€50".
 * Returns null for an empty field (no price) and undefined when it can't be read.
 */
export function parsePrice(input: string): number | null | undefined {
  const text = input.trim()
  if (!text) return null
  const euroCents = text.match(/^(\d+)\s*€\s*(\d{1,2})$/)
  const normalized = euroCents ? `${euroCents[1]}.${euroCents[2]}` : text.replace(/\s|€/g, "").replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined
  return Math.round(parseFloat(normalized) * 100)
}

/** cents -> the value shown in the price field while editing. */
export function priceInputValue(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2)
}

/** "K7Q29P" -> "K7Q-29P" */
export function formatCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`
}
