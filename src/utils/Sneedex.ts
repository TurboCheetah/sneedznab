import { SNEEDEX_URL } from '#/constants'
import { ISneedexData } from '#interfaces/sneedex'

export class Sneedex {
  constructor(private apiKey: string) {}

  public async fetch(query: string): Promise<ISneedexData[]> {
    const sneedexData = await fetch(
      `${SNEEDEX_URL}/search?key=${this.apiKey}&c=50&q=${query}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    return sneedexData as ISneedexData[]
  }
}
