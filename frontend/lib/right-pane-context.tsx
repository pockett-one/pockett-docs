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
  /** Optional actions (e.g. Search icon) to show in the right panel header; set by page content (e.g. ProjectFileList). */
  headerActions: ReactNode
  setHeaderActions: (node: ReactNode) => void
  /** True when inside RightPaneProvider (e.g. d/o layout); use to open in sidebar instead of sheet */
  hasRightPane: boolean
}

const RightPaneContext = createContext<RightPaneContextValue | null>(null)

export function RightPaneProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<ReactNode>(null)
  const [title, setTitleState] = useState<string>('')
  const [headerActions, setHeaderActionsState] = useState<ReactNode>(null)
  const setContent = useCallback((node: ReactNode) => {
    setContentState(node)
  }, [])
  const setTitle = useCallback((t: string) => {
    setTitleState(t)
  }, [])
  const setHeaderActions = useCallback((node: ReactNode) => {
    setHeaderActionsState(node)
  }, [])
  const clearPane = useCallback(() => {
    setContentState(null)
    setTitleState('')
  }, [])
  return (
    <RightPaneContext.Provider value={{ content, title, setContent, setTitle, clearPane, headerActions, setHeaderActions, hasRightPane: true }}>
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
      headerActions: null,
      setHeaderActions: () => {},
      hasRightPane: false,
    }
  }
  return ctx
}
