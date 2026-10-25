import { Download } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { formatCode } from "@/lib/formatPrice"

export function QrPanel({ slug, code }: { slug: string; code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Drawn from the address, never stored: the same slug always gives the same QR code.
  const url = `${window.location.origin}/${slug}`
  // The canvas needs real color values, so read them from the theme tokens.
  const tokens = getComputedStyle(document.documentElement)

  function download() {
    const link = document.createElement("a")
    link.href = canvasRef.current!.toDataURL("image/png")
    link.download = `paper-to-qr-${slug}.png`
    link.click()
  }

  return (
    <aside className="h-fit rounded-2xl border border-hairline bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Your QR code</h2>
        <Button variant="ghost" size="icon" onClick={download} aria-label="Download QR code" title="Download QR code">
          <Download className="size-5" />
        </Button>
      </div>
      <div className="mt-3 rounded-xl bg-background p-5">
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={1024}
          marginSize={2}
          fgColor={tokens.getPropertyValue("--ink").trim()}
          bgColor={tokens.getPropertyValue("--bg").trim()}
          level="M"
          // Overrides the library's inline 1024 px size; the canvas keeps full resolution for the PNG.
          style={{ width: "100%", height: "auto", maxWidth: "14rem", margin: "0 auto", display: "block" }}
        />
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm text-primary underline-offset-4 hover:underline">
        {url.replace(/^https?:\/\//, "")}
      </a>

      <h2 className="mt-7 text-xl font-medium">Your code</h2>
      <p className="mt-3 rounded-lg bg-background px-4 py-3 text-center text-2xl font-semibold tracking-[0.18em] text-ink tabular-nums">
        {formatCode(code)}
      </p>
      <p className="mt-3 text-sm text-ink-soft">Keep this code to edit your menu.</p>
    </aside>
  )
}
