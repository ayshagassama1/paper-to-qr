import { Check, Pencil, X } from "lucide-react"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { addDish, deleteDish, updateDish, type Dish } from "@/lib/api"
import { formatPrice, parsePrice, priceInputValue } from "@/lib/formatPrice"
import { cn } from "@/lib/utils"

type Props = {
  code: string
  /** Absent for a line added with "Add dish" that isn't saved yet. */
  dish?: Dish
  onSaved: (dish: Dish) => void
  /** Called after a confirmed delete, or to discard an unsaved new line. */
  onRemoved: () => void
}

export function DishRow({ code, dish, onSaved, onRemoved }: Props) {
  const [editing, setEditing] = useState(!dish)
  const [name, setName] = useState(dish?.name ?? "")
  const [price, setPrice] = useState(priceInputValue(dish?.price_cents ?? null))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    const priceCents = parsePrice(price)
    if (!name.trim()) return
    if (priceCents === undefined) {
      setError("Enter a price like 12.50, or leave it empty.")
      return
    }
    run(async () => {
      const changes = { name: name.trim(), price_cents: priceCents }
      onSaved(dish ? await updateDish(code, dish.id, changes) : await addDish(code, changes))
      setEditing(false)
    })
  }

  function cancelEdit() {
    if (!dish) return onRemoved()
    setName(dish.name)
    setPrice(priceInputValue(dish.price_cents))
    setError(null)
    setEditing(false)
  }

  function toggle(active: boolean) {
    if (!dish) return
    // Optimistic: flip right away, roll back if the API refuses.
    onSaved({ ...dish, active })
    run(async () => {
      try {
        onSaved(await updateDish(code, dish.id, { active }))
      } catch (err) {
        onSaved(dish)
        throw err
      }
    })
  }

  return (
    <li className="py-3">
      {editing ? (
        <form
          onSubmit={save}
          onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
          className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
        >
          <Input
            aria-label="Dish name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dish name"
            autoFocus
            className="h-10 min-w-0 flex-1 basis-full sm:basis-auto"
          />
          <Input
            aria-label="Price in euros"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="12.50"
            inputMode="decimal"
            className="h-10 w-28 flex-none text-right tabular-nums"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!name.trim() || busy}
            aria-label="Save dish"
            title={name.trim() ? "Save" : "A dish needs a name"}
          >
            <Check className="size-4" strokeWidth={2.5} />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={cancelEdit} aria-label={dish ? "Cancel editing" : "Discard new dish"}>
            <X className="size-4" />
          </Button>
        </form>
      ) : (
        dish && (
          <div className="flex items-center gap-1">
            <span className={cn("min-w-0 flex-1 py-1 text-[17px] text-ink", !dish.active && "text-ink-soft")}>
              {dish.name}
            </span>
            <span className={cn("mr-2 text-[17px] tabular-nums", dish.active ? "text-ink" : "text-ink-soft")}>
              {dish.price_cents === null ? <span className="text-sm text-ink-soft">No price</span> : formatPrice(dish.price_cents)}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label={`Edit ${dish.name}`} title="Edit">
              <Pencil className="size-4 text-ink-soft" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirming(true)} aria-label={`Delete ${dish.name}`} title="Delete">
              <X className="size-4 text-ink-soft" />
            </Button>
            <Switch
              checked={dish.active}
              onCheckedChange={toggle}
              aria-label={`${dish.name} shown to customers`}
              title={dish.active ? "Shown to customers" : "Hidden from customers"}
              className="ml-2"
            />
          </div>
        )
      )}

      {error && <p role="alert" className="mt-1.5 text-sm text-destructive">{error}</p>}

      {dish && (
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this dish?</AlertDialogTitle>
              <AlertDialogDescription>
                {dish.name} will be removed from your menu. To hide it for today only, use the switch instead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => run(async () => {
                  await deleteDish(code, dish.id)
                  onRemoved()
                })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  )
}
