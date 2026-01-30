/**
 * API route handler wrapper with standardized error handling
 * Provides consistent error responses and automatic logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ValidationError, createErrorResponse } from './errors/api-error'
import { logger } from './logger'

type ApiHandler = (
    req: NextRequest,
    context?: any
) => Promise<NextResponse> | NextResponse

interface ApiHandlerOptions {
    /**
     * Context name for logging
     */
    context?: string

    /**
     * Whether to require authentication
     */
    requireAuth?: boolean
}

/**
 * Wraps an API route handler with error handling
 * 
 * @example
 * export const GET = apiHandler(async (req) => {
 *   const data = await fetchData()
 *   return NextResponse.json({ data })
 * }, { context: 'GetData' })
 */
export function apiHandler(
    handler: ApiHandler,
    options: ApiHandlerOptions = {}
): ApiHandler {
    return async (req: NextRequest, context?: any) => {
        const startTime = Date.now()
        const { context: logContext = 'API', requireAuth = false } = options

        try {
            logger.info(
                `${req.method} ${req.nextUrl.pathname}`,
                logContext,
                {
                    method: req.method,
                    path: req.nextUrl.pathname,
                    searchParams: Object.fromEntries(req.nextUrl.searchParams),
                }
            )

            // TODO: Add auth check if requireAuth is true
            // if (requireAuth) {
            //   const session = await getSession(req)
            //   if (!session) {
            //     throw new AuthError()
            //   }
            // }

            const response = await handler(req, context)

            const duration = Date.now() - startTime
            logger.info(
                `${req.method} ${req.nextUrl.pathname} completed`,
                logContext,
                {
                    duration: `${duration}ms`,
                    status: response.status,
                }
            )

            return response
        } catch (error) {
            const duration = Date.now() - startTime

            // Handle Zod validation errors
            if (error instanceof ZodError) {
                const validationError = new ValidationError(
                    'Validation failed',
                    {
                        issues: error.issues.map(err => ({
                            path: err.path.join('.'),
                            message: err.message,
                        })),
                    }
                )

                logger.warn(
                    `Validation error: ${req.method} ${req.nextUrl.pathname}`,
                    logContext,
                    {
                        duration: `${duration}ms`,
                        issues: validationError.details.issues,
                    }
                )

                return createErrorResponse(validationError)
            }

            // Handle all other errors
            logger.error(
                `Error in ${req.method} ${req.nextUrl.pathname}`,
                error instanceof Error ? error : new Error(String(error)),
                logContext,
                {
                    duration: `${duration}ms`,
                }
            )

            return createErrorResponse(
                error instanceof Error ? error : new Error(String(error))
            )
        }
    }
}

/**
 * Helper to create successful JSON responses
 */
export function successResponse<T>(data: T, status: number = 200) {
    return NextResponse.json(
        {
            data,
            timestamp: new Date().toISOString(),
        },
        { status }
    )
}
