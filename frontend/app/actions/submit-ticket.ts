'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { TicketType } from '@prisma/client'
import { z } from 'zod'

// Schema for validation
const TicketSchema = z.object({
    description: z.string().min(1, "Description is required"),
    errorDetails: z.any().optional(),
    metadata: z.any().optional(),
    type: z.nativeEnum(TicketType).default(TicketType.BUG),
    // Optional Context Slugs
    orgSlug: z.string().optional(),
    clientSlug: z.string().optional(),
    projectSlug: z.string().optional(),
})

export type SubmitTicketResult = {
    success: boolean
    message: string
}

export async function submitErrorTicket(input: z.infer<typeof TicketSchema>): Promise<SubmitTicketResult> {
    try {
        const data = TicketSchema.parse(input)

        // Get user session if available
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Resolve context IDs if slugs provided
        let organizationId: string | null = null
        let clientId: string | null = null
        let projectId: string | null = null

        if (data.orgSlug) {
            const org = await prisma.organization.findUnique({
                where: { slug: data.orgSlug },
                select: { id: true }
            })
            organizationId = org?.id ?? null

            if (organizationId && data.clientSlug) {
                const client = await prisma.client.findFirst({
                    where: { organizationId, slug: data.clientSlug },
                    select: { id: true }
                })
                clientId = client?.id ?? null

                if (clientId && data.projectSlug) {
                    const project = await prisma.project.findFirst({
                        where: { clientId, slug: data.projectSlug },
                        select: { id: true }
                    })
                    projectId = project?.id ?? null
                }
            }
        }

        // Create ticket
        await prisma.customerRequest.create({
            data: {
                type: data.type,
                description: data.description,
                errorDetails: data.errorDetails ?? {},
                metadata: data.metadata ?? {},
                userId: user?.id ?? null,
                userEmail: user?.email ?? null,
                organizationId,
                clientId,
                projectId,
            }
        })

        return { success: true, message: 'Ticket submitted successfully' }
    } catch (error) {
        console.error('Failed to submit ticket:', error)
        return { success: false, message: 'Failed to submit ticket' }
    }
}
