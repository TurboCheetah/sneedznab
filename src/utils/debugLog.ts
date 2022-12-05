import { app } from '#/index'
import { cyan, magenta } from 'picocolors'

export const debugLog = (
  name: string,
  context: string,
  message: string
): void => {
  if (!process.env.DEBUG) return

  console.log(`>> ${magenta(name)} (${cyan(context)}): ${message}`)
}
