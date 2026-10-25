import { Check, Copy, Download } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { formatCode } from "@/lib/formatPrice"

async function copyText(text: string) {
  // navigator.clipboard only exists on https or localhost; the LAN address used for phone tests is plain http.
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  const field = document.createElement("textarea")
  field.value = text
  field.style.position = "fixed"
  field.style.opacity = "0"
  document.body.append(field)
  field.select()
  document.execCommand("copy")
  field.remove()
}

export function QrPanel({ slug, code }: { slug: string; code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Drawn from the address, never stored: the same slug always gives the same QR code.
  const url = `${window.location.origin}/${slug}`
  // The canvas needs real color values, so read them from the theme tokens.
  const tokens = getComputedStyle(document.documentElement)
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    await copyText(formatCode(code))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const link = document.createElement("a")
    link.href = canvasRef.current!.toDataURL("image/png")
    link.download = `paper-to-qr-${slug}.png`
    link.click()
  }

  return (
    <aside className="h-fit rounded-2xl bg-background p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">Your QR code</h3>
        <Button variant="ghost" size="icon" onClick={download} aria-label="Download QR code" title="Download QR code">
          <Download className="size-5" />
        </Button>
      </div>
      <div className="mt-2">
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
      {/^(localhost|127\.)/.test(window.location.hostname) && (
        // Local development only: a phone can't reach "localhost" on the laptop.
        <p className="mt-2 text-sm text-ink-soft">
          A phone can't open localhost. To scan this QR code, open the site from the Network address Vite prints.
        </p>
      )}

      <div className="mt-7 flex items-center justify-between">
        <h3 className="text-xl font-medium">Your code</h3>
        <Button variant="ghost" size="icon" onClick={copyCode} aria-label="Copy code" title="Copy code">
          {copied ? <Check className="size-5 text-primary" strokeWidth={2.5} /> : <Copy className="size-5" />}
        </Button>
      </div>
      <button
        type="button"
        onClick={copyCode}
        title="Copy code"
        className="mt-2 block w-full rounded-lg bg-surface px-4 py-3 text-center text-2xl font-semibold tracking-[0.18em] text-ink tabular-nums transition-colors hover:bg-hairline"
      >
        {formatCode(code)}
      </button>
      <p aria-live="polite" className={copied ? "mt-3 text-sm font-medium text-primary" : "mt-3 text-sm text-ink-soft"}>
        {copied ? "Code copied" : "Keep this code to edit your menu."}
      </p>
    </aside>
  )
}
