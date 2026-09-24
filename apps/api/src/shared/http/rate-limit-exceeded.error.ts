export class RateLimitExceededError extends Error {
  readonly code = 'RATE_LIMIT_EXCEEDED'
  readonly statusCode = 429

  constructor() {
    super('Too many requests. Please try again later.')
    this.name = 'RateLimitExceededError'
  }
}
