import { sneedexUrl } from '#/constants'
import { ISneedexData } from '#interfaces/sneedex'
import { app } from '#/index'
import { debugLog } from '#utils/debugLog'

export class Sneedex {
  public name: string
  constructor(private apiKey: string) {
    if (!apiKey) throw new Error('No Sneedex API key provided')

    this.name = 'Sneedex'
    this.apiKey = apiKey
  }

  public async fetch(query: string): Promise<ISneedexData[]> {
    debugLog(`${this.name}: ${query}`)
    debugLog(`${this.name} (cache): ${query}`)
    const cachedData = await app.cache.get(`${this.name}_${query}`)
    if (cachedData) {
      debugLog(`${this.name} (cache): Cache hit: ${this.name}_${query}`)
      return cachedData as ISneedexData[]
    }
    debugLog(`${this.name} (cache): Cache miss: ${this.name}_${query}`)

    const searchURL = `${sneedexUrl}/search?key=${
      this.apiKey
    }&c=50&q=${encodeURIComponent(query)}`

    debugLog(
      `${this.name} (fetch): Fetching data from ${searchURL.replace(
        new RegExp(this.apiKey, 'gi'),
        '[REDACTED]'
      )}`
    )

    const sneedexData = await fetch(searchURL).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    debugLog(
      `${this.name} (fetch): Fetched data, caching ${this.name}_${query}`
    )
    await app.cache.set(`${this.name}_${query}`, sneedexData as ISneedexData[])

    return sneedexData as ISneedexData[]
  }
}
