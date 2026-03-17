import { AuditWithFilters } from '@/components/audit/audit-with-filters'

export interface ProjectAuditPaneProps {
  /** Project-scoped audit (use either projectId or organizationId, not both) */
  projectId?: string
  projectName?: string
  /** Org-scoped audit */
  organizationId?: string
  /** Used for CSV filename in org mode */
  exportTitle?: string
}

export function ProjectAuditPane({ projectId, projectName, organizationId, exportTitle }: ProjectAuditPaneProps) {
  const isOrgMode = Boolean(organizationId)
  const mode = isOrgMode ? 'org' : 'project'
  const resourceId = (organizationId ?? projectId) ?? ''

  return (
    <AuditWithFilters
      mode={mode}
      resourceId={resourceId}
      exportTitle={exportTitle ?? projectName ?? 'audit'}
      // Client + Project filters are org-only; project audit doesn't need them.
      showClientProjectFilters={isOrgMode}
      organizationIdForFilters={organizationId}
    />
  )
}
