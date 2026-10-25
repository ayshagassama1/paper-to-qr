import { DishRow } from "@/components/DishRow"
import type { RestaurantPrivate } from "@/lib/api"
import { formatCode } from "@/lib/formatPrice"

export function MenuEditor({ menu, justCreated }: { menu: RestaurantPrivate; justCreated: boolean }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-10 pb-20 sm:pt-16">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{menu.name}</h1>
        {justCreated && (
          <span className="rounded-full bg-apricot px-3 py-1 text-sm font-medium text-apricot-ink">Menu ready</span>
        )}
      </header>

      <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_300px] md:gap-14">
        <div>
          <h2 className="text-xl font-medium">Dishes</h2>
          {menu.extraction_empty && menu.dishes.length === 0 ? (
            <p className="mt-4 rounded-xl border border-hairline bg-surface px-5 py-4 text-ink">
              We couldn't find any dishes. Try a clearer photo, or add your dishes below.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
              {menu.dishes.map((dish) => (
                <DishRow key={dish.id} dish={dish} />
              ))}
            </ul>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="text-xl font-medium">Your code</h2>
          <p className="mt-3 rounded-lg bg-background px-4 py-3 text-center text-2xl font-semibold tracking-[0.18em] text-ink tabular-nums">
            {formatCode(menu.code)}
          </p>
          <p className="mt-3 text-sm text-ink-soft">Keep this code to edit your menu.</p>
        </aside>
      </div>
    </section>
  )
}
