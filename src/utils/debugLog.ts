import { app } from '#/index'
import { cyan, magenta } from 'picocolors'

export const debugLog = (
  name: string,
  context: string,
  message: string
): void => {
  if (!app.debug) return

  console.log(`>> ${magenta(name)} (${cyan(context)}): ${message}`)
}
