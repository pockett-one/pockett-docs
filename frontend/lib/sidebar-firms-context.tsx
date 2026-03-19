'use client'

import React, { createContext, useContext } from 'react'

export interface SidebarOrganizationOption {
  id: string
  name: string
  slug: string
  isDefault: boolean
  createdAt?: string
}

const SidebarOrganizationsContext = createContext<SidebarOrganizationOption[] | null>(null)

export function SidebarOrganizationsProvider({
  organizations,
  children,
}: {
  organizations: SidebarOrganizationOption[]
  children: React.ReactNode
}) {
  return (
    <SidebarOrganizationsContext.Provider value={organizations}>
      {children}
    </SidebarOrganizationsContext.Provider>
  )
}

export function useSidebarOrganizations(): SidebarOrganizationOption[] | null {
  return useContext(SidebarOrganizationsContext)
}
