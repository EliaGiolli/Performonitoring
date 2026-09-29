import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useResolvedTheme } from "@/core/theme"

// shadcn/ui sonner, written by hand: follows the app theme on <html> instead of
// next-themes, and paints toasts with the popover tokens.
function Toaster(props: ToasterProps) {
  const theme = useResolvedTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      toastOptions={{ classNames: { description: "text-muted-foreground!" } }}
      {...props}
    />
  )
}

export { Toaster }
