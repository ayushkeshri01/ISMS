"use client"

import { useEffect } from "react"

export function LinkHandler() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest("a") as HTMLAnchorElement

      if (!link) return

      const isCtrlClick = event.ctrlKey || event.metaKey
      const href = link.getAttribute("href")

      // If Ctrl/Cmd is pressed and there's an href
      if (isCtrlClick && href) {
        // Prevent default navigation
        event.preventDefault()
        event.stopPropagation()

        // Open in new tab
        window.open(href, "_blank", "noopener,noreferrer")
      }
    }

    // Add listener to document
    document.addEventListener("click", handleClick, true)

    return () => {
      document.removeEventListener("click", handleClick, true)
    }
  }, [])

  return null
}
