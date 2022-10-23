import { SNEEDEX_URL } from '#/constants'
import { ISneedexData } from '#interfaces/sneedex'
import { app } from '#/index'

export class Sneedex {
  constructor(private apiKey: string) {}

  public async fetch(query: string): Promise<ISneedexData[]> {
    const cachedData = await app.cache.get(`sneedex_${query}`)
    if (cachedData) return cachedData as ISneedexData[]

    const sneedexData = await fetch(
      `${SNEEDEX_URL}/search?key=${this.apiKey}&c=50&q=${query}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    await app.cache.set(`sneedex_${query}`, sneedexData as ISneedexData[])

    return sneedexData as ISneedexData[]
  }
}
