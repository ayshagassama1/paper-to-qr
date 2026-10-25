import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMenuByCode, type RestaurantPrivate } from "@/lib/api"

export function ExistingMenuForm({ onFound }: { onFound: (menu: RestaurantPrivate) => void }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      onFound(await getMenuByCode(code.trim()))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <label htmlFor="menu-code" className="text-sm font-medium text-ink">
          Your menu code
        </label>
        <Input
          id="menu-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
          }}
          placeholder="K7Q-29P"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby="menu-code-hint"
          className="text-lg tracking-[0.2em] uppercase placeholder:tracking-[0.2em]"
        />
        <p id="menu-code-hint" role={error ? "alert" : undefined} className={error ? "text-sm text-destructive" : "text-sm text-ink-soft"}>
          {error ?? "You got it when you created your menu."}
        </p>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={!code.trim() || loading}>
        {loading ? "Opening your menu…" : "Validate"}
      </Button>
    </form>
  )
}
