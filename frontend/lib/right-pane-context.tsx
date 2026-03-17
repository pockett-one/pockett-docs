'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

/** Current search root (scope) when Search pane is open; updated by file list when breadcrumb root changes. */
export type SearchRootValue = {
  searchRootFolderId: string | null
  searchRootLabel: string | null
} | null

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
  /** Optional icon to show next to the title in the right panel header. */
  headerIcon: ReactNode
  setHeaderIcon: (node: ReactNode) => void
  /** Optional subtitle to show under the title in the right panel header. */
  headerSubtitle: string
  setHeaderSubtitle: (t: string) => void
  clearPane: () => void
  /** Optional actions (e.g. Search icon) to show in the right panel header; set by page content (e.g. ProjectFileList). */
  headerActions: ReactNode
  setHeaderActions: (node: ReactNode) => void
  /** True when inside RightPaneProvider (e.g. d/o layout); use to open in sidebar instead of sheet */
  hasRightPane: boolean
  /** Current search root (scope) for Search pane; file list keeps this in sync with FILES breadcrumb. */
  searchRoot: SearchRootValue
  setSearchRoot: (v: SearchRootValue) => void
  /** Whether the right pane is expanded to full-screen overlay. */
  isExpanded: boolean
  /** Set expanded/collapsed state for the right pane. */
  setExpanded: (v: boolean) => void
}

const RightPaneContext = createContext<RightPaneContextValue | null>(null)

export function RightPaneProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<ReactNode>(null)
  const [title, setTitleState] = useState<string>('')
  const [headerIcon, setHeaderIconState] = useState<ReactNode>(null)
  const [headerSubtitle, setHeaderSubtitleState] = useState<string>('')
  const [headerActions, setHeaderActionsState] = useState<ReactNode>(null)
  const [searchRoot, setSearchRootState] = useState<SearchRootValue>(null)
  const [isExpanded, setExpandedState] = useState(false)
  const setContent = useCallback((node: ReactNode) => {
    setContentState(node)
  }, [])
  const setTitle = useCallback((t: string) => {
    setTitleState(t)
  }, [])
  const setHeaderIcon = useCallback((node: ReactNode) => {
    setHeaderIconState(node)
  }, [])
  const setHeaderSubtitle = useCallback((t: string) => {
    setHeaderSubtitleState(t)
  }, [])
  const setHeaderActions = useCallback((node: ReactNode) => {
    setHeaderActionsState(node)
  }, [])
  const setSearchRoot = useCallback((v: SearchRootValue) => {
    setSearchRootState(v)
  }, [])
  const clearPane = useCallback(() => {
    setContentState(null)
    setTitleState('')
    setHeaderIconState(null)
    setHeaderSubtitleState('')
    setHeaderActionsState(null)
  }, [])
  const setExpanded = useCallback((v: boolean) => {
    setExpandedState(v)
  }, [])
  return (
    <RightPaneContext.Provider
      value={{
        content,
        title,
        setContent,
        setTitle,
        headerIcon,
        setHeaderIcon,
        headerSubtitle,
        setHeaderSubtitle,
        clearPane,
        headerActions,
        setHeaderActions,
        hasRightPane: true,
        searchRoot,
        setSearchRoot,
        isExpanded,
        setExpanded,
      }}
    >
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
      headerIcon: null,
      setHeaderIcon: () => {},
      headerSubtitle: '',
      setHeaderSubtitle: () => {},
      clearPane: () => {},
      headerActions: null,
      setHeaderActions: () => {},
      hasRightPane: false,
      searchRoot: null,
      setSearchRoot: () => {},
      isExpanded: false,
      setExpanded: () => {},
    }
  }
  return ctx
}
