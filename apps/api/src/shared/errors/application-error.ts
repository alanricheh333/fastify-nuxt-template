export class ApplicationError extends Error {
  readonly code: string
  readonly details?: unknown

  constructor(options: {
    code: string
    message: string
    details?: unknown
    cause?: unknown
  }) {
    super(options.message, { cause: options.cause })
    this.name = new.target.name
    this.code = options.code
    this.details = options.details
  }
}
