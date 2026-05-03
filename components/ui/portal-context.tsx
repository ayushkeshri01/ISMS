"use client"

import * as React from "react"

const PortalContainerContext = React.createContext<React.RefObject<HTMLElement | null> | null>(null)

export function PortalContainerProvider({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  return (
    <PortalContainerContext.Provider value={containerRef}>
      {children}
    </PortalContainerContext.Provider>
  )
}

export function usePortalContainer() {
  return React.useContext(PortalContainerContext)
}
