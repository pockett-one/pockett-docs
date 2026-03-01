/**
 * Links a connector from a source organization to a target organization.
 * With the 1:N connector:organization model, multiple orgs share the same
 * connector — no duplication is needed.
 *
 * @param sourceOrgId - Organization ID to copy the connector from
 * @param targetOrgId - Organization ID to link the connector to
 * @param prismaClient - Prisma client instance
 * @returns The shared connector, or null if source connector not found
 */
export async function duplicateConnectorForOrganization(
  sourceOrgId: string,
  targetOrgId: string,
  prismaClient: any
) {
  // Find connector for source organization
  const sourceOrg = await prismaClient.organization.findUnique({
    where: { id: sourceOrgId },
    select: { connectorId: true }
  })

  if (!sourceOrg?.connectorId) {
    return null
  }

  const sourceConnector = await prismaClient.connector.findUnique({
    where: { id: sourceOrg.connectorId }
  })

  if (!sourceConnector) {
    return null
  }

  // Check if target organization already has a connector
  const targetOrg = await prismaClient.organization.findUnique({
    where: { id: targetOrgId },
    select: { connectorId: true }
  })

  if (targetOrg?.connectorId) {
    // Target org already has a connector linked — return it
    const existingConnector = await prismaClient.connector.findUnique({
      where: { id: targetOrg.connectorId }
    })
    if (existingConnector) {
      return existingConnector
    }
  }

  // Link the source connector to the target organization (1:N — no new connector row)
  await prismaClient.organization.update({
    where: { id: targetOrgId },
    data: { connectorId: sourceConnector.id }
  })

  return sourceConnector
}
