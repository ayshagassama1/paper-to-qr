import { useEffect, useState } from "react"
import { useParams } from "react-router"

import { ApiError, getPublicMenu, type PublicMenu } from "@/lib/api"
import { formatPrice } from "@/lib/formatPrice"

type State = { status: "loading" } | { status: "ready"; menu: PublicMenu } | { status: "error"; message: string }

export function CustomerMenuPage() {
  const { slug = "" } = useParams()
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    getPublicMenu(slug)
      .then((menu) => !cancelled && setState({ status: "ready", menu }))
      .catch((err) => {
        if (cancelled) return
        setState({
          status: "error",
          message: err instanceof ApiError && err.status === 404 ? "Restaurant not found" : err.message,
        })
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (state.status === "ready") document.title = `${state.menu.name} menu`
  }, [state])

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-6 pt-14 pb-16">
      {state.status === "loading" && <p className="text-ink-soft">Loading the menu…</p>}

      {state.status === "error" && (
        <div className="pt-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{state.message}</h1>
          <p className="mt-3 text-ink-soft">Check the address, or ask the staff for the menu.</p>
        </div>
      )}

      {state.status === "ready" && (
        <>
          <h1 className="text-center text-4xl font-semibold tracking-tight">{state.menu.name}</h1>
          {state.menu.dishes.length === 0 ? (
            <p className="mt-10 text-center text-lg text-ink-soft">No dishes available right now</p>
          ) : (
            <ul className="mt-10 divide-y divide-hairline border-y border-hairline">
              {state.menu.dishes.map((dish, i) => (
                <li key={i} className="flex items-baseline gap-4 py-4">
                  <span className="min-w-0 flex-1 text-lg text-ink">{dish.name}</span>
                  <span className="text-lg text-ink tabular-nums">{formatPrice(dish.price_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
