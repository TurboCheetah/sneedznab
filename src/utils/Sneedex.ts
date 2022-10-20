import { SNEEDEX_URL } from '#/constants'
import { SneedexData } from '#interfaces/Sneedex'

export class Sneedex {
  constructor(private apiKey: string) {}

  public async fetch(query: string): SneedexData[] {
    const sneedexData = await fetch(
      `${SNEEDEX_URL}/search?key=${this.apiKey}&c=50&q=${query}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    return sneedexData
  }
}
