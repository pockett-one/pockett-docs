import { logger } from '@/lib/logger'
import { ZodError } from 'zod'
import { ApiError } from './errors/api-error'

export type ActionResponse<T> = {
    success: boolean
    data?: T
    error?: string
    validationErrors?: Record<string, string[]>
}

/**
 * Wraps a server action with standardized error handling and logging
 * 
 * @param action The async function to execute
 * @param context The context name for logging
 * @returns Standardized ActionResponse
 */
export async function serverActionWrapper<T>(
    action: () => Promise<T>,
    context: string
): Promise<ActionResponse<T>> {
    const startTime = Date.now()

    try {
        const data = await action()

        logger.info(`${context} completed`, context, {
            duration: `${Date.now() - startTime}ms`,
            success: true
        })

        return { success: true, data }
    } catch (error) {
        const duration = Date.now() - startTime

        // Handle Zod validation errors
        if (error instanceof ZodError) {
            const validationErrors: Record<string, string[]> = {}
                ; (error as any).errors.forEach((err: any) => {
                    const path = err.path.join('.')
                    if (!validationErrors[path]) validationErrors[path] = []
                    validationErrors[path].push(err.message)
                })

            logger.warn(`Validation error: ${context}`, context, {
                duration: `${duration}ms`,
                errors: validationErrors
            })

            return {
                success: false,
                error: 'Validation failed',
                validationErrors
            }
        }

        // Handle known API errors
        if (error instanceof ApiError) {
            logger.warn(`${context} failed with ApiError`, context, {
                duration: `${duration}ms`,
                code: error.code,
                statusCode: error.statusCode,
                message: error.message
            })

            return {
                success: false,
                error: error.message
            }
        }

        // Handle generic errors
        logger.error(
            `Error in ${context}`,
            error instanceof Error ? error : new Error(String(error)),
            context,
            { duration: `${duration}ms` }
        )

        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
    }
}
