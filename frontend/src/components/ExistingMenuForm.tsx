import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ExistingMenuForm() {
  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-2">
        <label htmlFor="menu-code" className="text-sm font-medium text-ink">
          Your menu code
        </label>
        <Input
          id="menu-code"
          placeholder="K7Q-29P"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="text-lg tracking-[0.2em] uppercase placeholder:tracking-[0.2em] placeholder:normal-case"
        />
        <p className="text-sm text-ink-soft">You got it when you created your menu.</p>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled>
        Validate
      </Button>
    </form>
  )
}
