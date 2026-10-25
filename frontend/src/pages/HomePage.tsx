import { useState } from "react"

import { ExistingMenuForm } from "@/components/ExistingMenuForm"
import { Hero } from "@/components/Hero"
import { MenuEditor } from "@/components/MenuEditor"
import { Navbar } from "@/components/Navbar"
import { NewRestaurantForm } from "@/components/NewRestaurantForm"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import type { RestaurantPrivate } from "@/lib/api"
import { cn } from "@/lib/utils"

type Tab = "existing" | "new"

export function HomePage() {
  const [tab, setTab] = useState<Tab>("existing")
  // Each tab keeps its own opened menu; the menu replaces that tab's form inside the panel.
  const [found, setFound] = useState<RestaurantPrivate | null>(null)
  const [created, setCreated] = useState<RestaurantPrivate | null>(null)

  const showingMenu = tab === "existing" ? found !== null : created !== null

  function reset() {
    setFound(null)
    setCreated(null)
    setTab("existing")
  }

  return (
    <div className="min-h-svh">
      <Navbar onHome={reset} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-0 pb-20">
        <Hero />
        <div className={cn("mx-auto mt-10 w-full px-4 sm:px-6", showingMenu ? "max-w-5xl" : "max-w-xl")}>
          <div className="rounded-3xl border border-hairline bg-surface p-5 text-base sm:p-9">
            <TabsContent value="existing" className="text-base">
              {found ? (
                <MenuEditor menu={found} justCreated={false} onClose={() => setFound(null)} closeLabel="Open another menu" />
              ) : (
                <ExistingMenuForm onFound={setFound} />
              )}
            </TabsContent>
            <TabsContent value="new" className="text-base">
              {created ? (
                <MenuEditor menu={created} justCreated onClose={() => setCreated(null)} closeLabel="Add another restaurant" />
              ) : (
                <NewRestaurantForm onCreated={setCreated} />
              )}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
