import type { ReadinessState } from './readiness-state.type.js'

export const createReadinessState = (): ReadinessState => {
  let acceptingTraffic = true
  const checks = new Map<string, () => Promise<boolean>>()

  return {
    isAcceptingTraffic: () => acceptingTraffic,
    markNotReady: () => {
      acceptingTraffic = false
    },
    addCheck: (name, check) => {
      checks.set(name, check)
    },
    check: async () => {
      if (!acceptingTraffic) {
        return { ready: false, failedChecks: ['shutdown'] }
      }

      const failedChecks: string[] = []

      for (const [name, check] of checks) {
        try {
          if (!(await check())) {
            failedChecks.push(name)
          }
        } catch {
          failedChecks.push(name)
        }
      }

      return {
        ready: failedChecks.length === 0,
        failedChecks,
      }
    },
  }
}
