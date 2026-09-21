import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ApplicationError } from '../errors/application-error.js'
import type { ApiErrorResponse } from './api-error-response.type.js'
import type { ApplicationErrorHttpMap } from './application-error-http-map.type.js'

export const registerErrorHandling = (
  app: FastifyInstance,
  applicationErrorHttpMap: ApplicationErrorHttpMap,
): void => {
  app.setNotFoundHandler((request, reply) => {
    return sendError(reply, 404, {
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested route was not found.',
        requestId: request.id,
      },
    })
  })

  app.setErrorHandler((error, request, reply) => {
    if (isValidationError(error)) {
      return sendError(reply, 400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request is invalid.',
          requestId: request.id,
          details: error.validation,
        },
      })
    }

    if (error instanceof ApplicationError) {
      const statusCode = applicationErrorHttpMap[error.code]

      if (statusCode !== undefined) {
        return sendError(reply, statusCode, {
          error: {
            code: error.code,
            message: error.message,
            requestId: request.id,
            ...(error.details === undefined ? {} : { details: error.details }),
          },
        })
      }

      request.log.error(
        { err: error, applicationErrorCode: error.code },
        'Application error is missing an HTTP mapping.',
      )

      return sendInternalServerError(request, reply)
    }

    if (isSafeFastifyClientError(error)) {
      return sendError(reply, error.statusCode, {
        error: {
          code: error.code ?? 'REQUEST_ERROR',
          message: error.message,
          requestId: request.id,
        },
      })
    }

    request.log.error({ err: error }, 'Unhandled request error.')

    return sendInternalServerError(request, reply)
  })
}

const sendInternalServerError = (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  return sendError(reply, 500, {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      requestId: request.id,
    },
  })
}

const sendError = (
  reply: FastifyReply,
  statusCode: number,
  response: ApiErrorResponse,
) => {
  return reply.status(statusCode).send(response)
}

const isValidationError = (
  error: unknown,
): error is Error & { validation: unknown } => {
  return error instanceof Error && 'validation' in error && error.validation !== undefined
}

const isSafeFastifyClientError = (
  error: unknown,
): error is Error & { code?: string, statusCode: number } => {
  return error instanceof Error
    && 'statusCode' in error
    && typeof error.statusCode === 'number'
    && error.statusCode >= 400
    && error.statusCode < 500
}
