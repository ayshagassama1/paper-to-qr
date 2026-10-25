import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export type ProcessingStep = "uploading" | "reading"

const STEPS: { key: ProcessingStep; label: string }[] = [
  { key: "uploading", label: "Uploading photos…" },
  { key: "reading", label: "Reading your menu…" },
]

export function ProcessingSteps({ step }: { step: ProcessingStep }) {
  const current = STEPS.findIndex((s) => s.key === step)
  return (
    <div role="status" aria-live="polite" className="py-4">
      <ol className="space-y-5">
        {STEPS.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s.key} className="flex items-center gap-4">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-background",
                  !done && !active && "border-hairline bg-background",
                )}
              >
                {done ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : active ? (
                  <span className="size-2.5 animate-pulse rounded-full bg-primary" />
                ) : null}
              </span>
              <span
                className={cn(
                  "text-lg",
                  active ? "font-medium text-ink" : done ? "text-ink-soft" : "text-ink-soft/70",
                )}
              >
                {s.label}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-6 text-sm text-ink-soft">This usually takes a few seconds.</p>
    </div>
  )
}
