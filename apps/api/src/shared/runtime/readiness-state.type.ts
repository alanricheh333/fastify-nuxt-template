export type ReadinessState = {
  isAcceptingTraffic: () => boolean
  markNotReady: () => void
  addCheck: (name: string, check: () => Promise<boolean>) => void
  check: () => Promise<{ ready: boolean, failedChecks: string[] }>
}
