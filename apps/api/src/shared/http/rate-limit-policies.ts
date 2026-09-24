export const rateLimitPolicies = {
  authSensitive: {
    max: 10,
    timeWindow: 60_000,
  },
  expensiveOperation: {
    max: 30,
    timeWindow: 60_000,
  },
  writeHeavy: {
    max: 60,
    timeWindow: 60_000,
  },
} as const
