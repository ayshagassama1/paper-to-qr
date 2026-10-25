import { DishRow } from "@/components/DishRow"
import { QrPanel } from "@/components/QrPanel"
import type { RestaurantPrivate } from "@/lib/api"

type Props = {
  menu: RestaurantPrivate
  justCreated: boolean
  onClose: () => void
  closeLabel: string
}

/** Shown inside the home panel, in place of the form that opened it. */
export function MenuEditor({ menu, justCreated, onClose, closeLabel }: Props) {
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
        <div className="rounded-2xl bg-background p-6">
          <h3 className="text-xl font-medium">Dishes</h3>
          {menu.extraction_empty && menu.dishes.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface px-5 py-4 text-ink">
              We couldn't find any dishes. Try a clearer photo, or add your dishes below.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-hairline">
              {menu.dishes.map((dish) => (
                <DishRow key={dish.id} dish={dish} />
              ))}
            </ul>
          )}
        </div>

        <QrPanel slug={menu.slug} code={menu.code} />
      </div>
    </div>
  )
}
