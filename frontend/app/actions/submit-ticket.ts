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

        // Create ticket
        await prisma.customerSuccess.create({
            data: {
                type: data.type,
                description: data.description,
                errorDetails: data.errorDetails ?? {},
                metadata: data.metadata ?? {},
                userId: user?.id ?? null,
            }
        })

        return { success: true, message: 'Ticket submitted successfully' }
    } catch (error) {
        console.error('Failed to submit ticket:', error)
        return { success: false, message: 'Failed to submit ticket' }
    }
}
