import type { FastifyInstance } from 'fastify'

export const registerRequestId = (app: FastifyInstance): void => {
  app.addHook('onSend', (request, reply, payload, done) => {
    reply.header('x-request-id', request.id)
    done(null, payload)
  })
}
