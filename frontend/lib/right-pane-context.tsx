'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

/**
 * Reusable right sidebar context. Any part of the app can set content + title to show
 * in the layout right panel (e.g. document Edit, document Preview, share detail, etc.).
 * When hasRightPane is true, prefer opening in the sidebar; otherwise fall back to sheet/modal.
 */
type RightPaneContextValue = {
  content: ReactNode
  title: string
  setContent: (node: ReactNode) => void
  setTitle: (t: string) => void
  clearPane: () => void
  /** True when inside RightPaneProvider (e.g. d/o layout); use to open in sidebar instead of sheet */
  hasRightPane: boolean
}

const RightPaneContext = createContext<RightPaneContextValue | null>(null)

export function RightPaneProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<ReactNode>(null)
  const [title, setTitleState] = useState<string>('')
  const setContent = useCallback((node: ReactNode) => {
    setContentState(node)
  }, [])
  const setTitle = useCallback((t: string) => {
    setTitleState(t)
  }, [])
  const clearPane = useCallback(() => {
    setContentState(null)
    setTitleState('')
  }, [])
  return (
    <RightPaneContext.Provider value={{ content, title, setContent, setTitle, clearPane, hasRightPane: true }}>
      {children}
    </RightPaneContext.Provider>
  )
}

export function useRightPane(): RightPaneContextValue {
  const ctx = useContext(RightPaneContext)
  if (!ctx) {
    return {
      content: null,
      title: '',
      setContent: () => {},
      setTitle: () => {},
      clearPane: () => {},
      hasRightPane: false,
    }
  }
  return ctx
}
