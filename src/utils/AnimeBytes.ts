import { ANIMEBYTES_URL } from '#/constants'
import { IAnimeBytesData } from '#interfaces/animeBytes'
import { IData, IProvider } from '#interfaces/provider'

export class AnimeBytes implements IProvider {
  constructor(private passkey: string, private username: string) {}

  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): Promise<IAnimeBytesData> {
    const data = await fetch(
      `${ANIMEBYTES_URL}?torrent_pass=${this.passkey}&username=${
        this.username
      }&type=anime&searchstr=${encodeURIComponent(query)}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    return data as IAnimeBytesData
  }

  // get function to standardize the returned data to make things easier to work with and plug-and-play
  public async get(query: string): Promise<IData[]> {
    // shrimply fetch the data and then map it to the appropriate values
    const data = await this.fetch(query)
    // extract the value of "Property" and "Link" from the "Torrents" array
    // and then map it to the appropriate values
    // only parse the group where CategoryName === "Anime"

    return data.Groups.filter(group => group.CategoryName === 'Anime')[0]
      .Torrents.map(entry => ({
        title: entry.Property,
        url: entry.Link,
        type: 'torrent'
      }))
      .flat() as IData[]
  }
}
