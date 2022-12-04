import { app } from '#/index'

export const debugLog = (message: string): void => {
  if (!app.debug) return

  console.log(`>> ${message}`)
}
