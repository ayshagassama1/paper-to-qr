import { TabsList, TabsTrigger } from "@/components/ui/tabs"

// Inactive look is the base; data-active overrides shadcn's own active styles.
const tabButton =
  "h-12 flex-none rounded-lg border border-input/60 bg-background px-6 text-[15px] font-medium text-ink transition-colors hover:bg-surface hover:text-ink " +
  "data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:hover:bg-primary-hover " +
  "group-data-[variant=default]/tabs-list:data-active:shadow-none"

/** H1, subtext and the two buttons that switch the tabs below them. Must sit inside <Tabs>. */
export function Hero() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-12 text-center sm:pt-20">
      <h1 className="text-[2.6rem] leading-[1.08] font-semibold tracking-tight sm:text-6xl">
        Your paper menu, online in one photo
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
        Photograph your chalkboard or printed menu. We list your dishes and prices, you fix what needs fixing,
        and you get a QR code for your tables. No account needed.
      </p>
      <TabsList className="mt-9 h-auto gap-3 bg-transparent p-0">
        <TabsTrigger value="existing" className={tabButton}>
          Existing menu
        </TabsTrigger>
        <TabsTrigger value="new" className={tabButton}>
          New restaurant
        </TabsTrigger>
      </TabsList>
    </div>
  )
}
