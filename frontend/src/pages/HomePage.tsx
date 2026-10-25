import { useState } from "react"

import { ExistingMenuForm } from "@/components/ExistingMenuForm"
import { Hero } from "@/components/Hero"
import { MenuEditor } from "@/components/MenuEditor"
import { Navbar } from "@/components/Navbar"
import { NewRestaurantForm } from "@/components/NewRestaurantForm"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import type { RestaurantPrivate } from "@/lib/api"

type Opened = { menu: RestaurantPrivate; justCreated: boolean }

export function HomePage() {
  const [opened, setOpened] = useState<Opened | null>(null)

  return (
    <div className="min-h-svh">
      <Navbar onHome={() => setOpened(null)} />
      {opened ? (
        <MenuEditor menu={opened.menu} justCreated={opened.justCreated} />
      ) : (
        <Tabs defaultValue="existing" className="gap-0 pb-20">
          <Hero />
          <div className="mx-auto mt-10 w-full max-w-xl px-4 sm:px-6">
            <div className="rounded-3xl border border-hairline bg-surface p-6 text-base sm:p-9">
              <TabsContent value="existing" className="text-base">
                <ExistingMenuForm />
              </TabsContent>
              <TabsContent value="new" className="text-base">
                <NewRestaurantForm onCreated={(menu) => setOpened({ menu, justCreated: true })} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      )}
    </div>
  )
}
