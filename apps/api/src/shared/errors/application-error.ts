export type ApplicationErrorKind =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'unprocessable'

export type ApplicationErrorOptions = {
  code: string
  message: string
  kind: ApplicationErrorKind
  details?: unknown
  cause?: unknown
}

export class ApplicationError extends Error {
  readonly code: string
  readonly kind: ApplicationErrorKind
  readonly details?: unknown

  constructor(options: ApplicationErrorOptions) {
    super(options.message, { cause: options.cause })
    this.name = 'ApplicationError'
    this.code = options.code
    this.kind = options.kind
    this.details = options.details
  }
}
