/** 1250 -> "12.50 €" (non-breaking space so the euro sign never wraps alone). */
export function formatPrice(cents: number | null): string {
  if (cents === null) return ""
  return `${(cents / 100).toFixed(2)} €`
}

/** "K7Q29P" -> "K7Q-29P" */
export function formatCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`
}
