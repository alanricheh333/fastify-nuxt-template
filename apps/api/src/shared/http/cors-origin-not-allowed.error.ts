export class CorsOriginNotAllowedError extends Error {
  readonly code = 'CORS_ORIGIN_NOT_ALLOWED'
  readonly statusCode = 403

  constructor(origin: string) {
    super(`Origin ${origin} is not allowed.`)
    this.name = 'CorsOriginNotAllowedError'
  }
}
