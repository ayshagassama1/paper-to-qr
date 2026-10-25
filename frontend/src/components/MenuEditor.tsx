import { Plus } from "lucide-react"
import { useState } from "react"

import { DishRow } from "@/components/DishRow"
import { QrPanel } from "@/components/QrPanel"
import { Button } from "@/components/ui/button"
import type { Dish, RestaurantPrivate } from "@/lib/api"

type Props = {
  menu: RestaurantPrivate
  justCreated: boolean
  /** Dishes live in the parent so a tab switch doesn't bring back stale ones. */
  onDishesChange: (update: (dishes: Dish[]) => Dish[]) => void
  onClose: () => void
  closeLabel: string
}

/** Shown inside the home panel, in place of the form that opened it. */
export function MenuEditor({ menu, justCreated, onDishesChange, onClose, closeLabel }: Props) {
  const [drafts, setDrafts] = useState<number[]>([])
  const [nextDraft, setNextDraft] = useState(0)

  function addDraft() {
    setDrafts((d) => [...d, nextDraft])
    setNextDraft((n) => n + 1)
  }

  function dropDraft(key: number) {
    setDrafts((d) => d.filter((k) => k !== key))
  }

  return (
    <div className="text-left">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{menu.name}</h2>
          {justCreated && (
            <span className="rounded-full bg-apricot px-3 py-1 text-sm font-medium text-apricot-ink">Menu ready</span>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {closeLabel}
        </button>
      </header>

      <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-2xl bg-background p-4 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-xl font-medium">Dishes</h3>
            <span className="text-sm text-ink-soft">Switch off what's sold out</span>
          </div>
          {menu.extraction_empty && menu.dishes.length === 0 && drafts.length === 0 && (
            <p className="mt-4 rounded-xl bg-surface px-5 py-4 text-ink">
              We couldn't find any dishes. Try a clearer photo, or add your dishes below.
            </p>
          )}
          <ul className="mt-2 divide-y divide-hairline">
            {menu.dishes.map((dish) => (
              <DishRow
                key={dish.id}
                code={menu.code}
                dish={dish}
                onSaved={(saved) => onDishesChange((dishes) => dishes.map((d) => (d.id === saved.id ? saved : d)))}
                onRemoved={() => onDishesChange((dishes) => dishes.filter((d) => d.id !== dish.id))}
              />
            ))}
            {drafts.map((key) => (
              <DishRow
                key={`draft-${key}`}
                code={menu.code}
                onSaved={(saved) => {
                  dropDraft(key)
                  onDishesChange((dishes) => [...dishes, saved])
                }}
                onRemoved={() => dropDraft(key)}
              />
            ))}
          </ul>
          <Button variant="outline" onClick={addDraft} className="mt-4">
            <Plus className="size-4" />
            Add dish
          </Button>
        </div>

        <QrPanel slug={menu.slug} code={menu.code} />
      </div>
    </div>
  )
}
