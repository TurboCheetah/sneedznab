import { ANIMEBYTES_URL } from '#/constants'
import { AnimeBytesData } from '#interfaces/animeBytes'
import { Data, Provider } from '#interfaces/provider'

export class AnimeBytes implements Provider {
  constructor(private passkey: string, private username: string) {}

  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): Promise<AnimeBytesData> {
    const data = await fetch(
      `${ANIMEBYTES_URL}?torrent_pass=${this.passkey}&username=${
        this.username
      }&type=anime&searchstr=${encodeURIComponent(query)}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    return data as AnimeBytesData
  }

  // get function to standardize the returned data to make things easier to work with and plug-and-play
  public async get(query: string): Promise<Data[]> {
    // shrimply fetch the data and then map it to the appropriate values
    const data = await this.fetch(query)
    // extract the value of "Property" and "Link" from the "Torrents" array
    // and then map it to the appropriate values
    return data.Groups[0].Torrents.map(entry => ({
      title: entry.Property,
      url: entry.Link,
      type: 'torrent'
    })).flat() as Data[]
  }
}
