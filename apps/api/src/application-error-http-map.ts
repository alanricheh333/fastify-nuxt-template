import type { ApplicationErrorHttpMap } from './shared/http/application-error-http-map.type.js'

export const applicationErrorHttpMap = {
  // Register product-specific mappings here, for example:
  // GIG_NOT_FOUND: 404,
  // APPLICATION_ALREADY_EXISTS: 409,
} satisfies ApplicationErrorHttpMap
