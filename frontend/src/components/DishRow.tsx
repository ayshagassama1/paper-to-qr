import type { Dish } from "@/lib/api"
import { formatPrice } from "@/lib/formatPrice"

export function DishRow({ dish }: { dish: Dish }) {
  return (
    <li className="flex items-baseline gap-4 py-4">
      <span className="min-w-0 flex-1 text-[17px] text-ink">{dish.name}</span>
      <span className="text-[17px] text-ink tabular-nums">
        {dish.price_cents === null ? <span className="text-sm text-ink-soft">No price</span> : formatPrice(dish.price_cents)}
      </span>
    </li>
  )
}
