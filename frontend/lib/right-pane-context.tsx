'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type RightPaneContextValue = {
  content: ReactNode
  setContent: (node: ReactNode) => void
}

const RightPaneContext = createContext<RightPaneContextValue | null>(null)

export function RightPaneProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<ReactNode>(null)
  const setContent = useCallback((node: ReactNode) => {
    setContentState(node)
  }, [])
  return (
    <RightPaneContext.Provider value={{ content, setContent }}>
      {children}
    </RightPaneContext.Provider>
  )
}

export function useRightPane(): RightPaneContextValue {
  const ctx = useContext(RightPaneContext)
  if (!ctx) {
    return {
      content: null,
      setContent: () => {},
    }
  }
  return ctx
}
