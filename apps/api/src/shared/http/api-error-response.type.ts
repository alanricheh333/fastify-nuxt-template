export type ApiErrorResponse = {
  error: {
    code: string
    message: string
    requestId: string
    details?: unknown
  }
}
