import { ANIMEBYTES_URL } from '#/constants'
import { IAnimeBytesData } from '#interfaces/animeBytes'
import { IProvider } from '#interfaces/provider'
import { ITorrentRelease } from '#interfaces/releases'
import { ISneedexRelease } from '#interfaces/sneedex'
import { app } from '#/index'

export class AnimeBytes implements IProvider {
  constructor(private passkey: string, private username: string) {}

  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): Promise<IAnimeBytesData> {
    const cachedData = await app.cache.get(`animebytes_${query}`)
    if (cachedData) return cachedData as IAnimeBytesData

    const data = await fetch(
      `${ANIMEBYTES_URL}?torrent_pass=${this.passkey}&username=${
        this.username
      }&type=anime&searchstr=${encodeURIComponent(query)}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    await app.cache.set(`animebytes_${query}`, data)

    return data as IAnimeBytesData
  }

  // get function to standardize the returned data to make things easier to work with and plug-and-play
  public async get(
    anime: string,
    sneedexData: ISneedexRelease
  ): Promise<ITorrentRelease[]> {
    const bestReleaseLinks = sneedexData.best_links.length
      ? sneedexData.best_links.split(' ')
      : sneedexData.alt_links.split(' ')

    // get all animebytes ursl from best release links
    const animebytesLink = bestReleaseLinks.filter(link =>
      link.includes('animebytes')
    )

    // if there is no AB link, return null because parsing the data is pointless
    if (!animebytesLink.length) return null

    // extract the torrent id from the links in animebytesLink array that either comes after the last # or is the value of the torrentid query param
    const torrentIDs = animebytesLink
      .map(
        link =>
          new URL(link).searchParams.get('torrentid') || link.split('#').pop()
      )
      .map(id => parseInt(id, 10))

    // shrimply fetch the data and then map it to the appropriate values
    const data = await this.fetch(anime)

    // if no data was found, return null
    if (data.Results === '0') return null

    // only parse the group where CategoryName === "Anime"
    const animeData = data.Groups.filter(
      group => group.CategoryName === 'Anime'
    )
      .map(group => group.Torrents)
      .flat()
      // only parse the torrents where the torrent id is in the torrentIDs array
      // and then map it to the appropriate values
      .filter(torrent => torrentIDs.includes(torrent.ID))
      .map(torrent => {
        const props = torrent.Property.split('|').map(s => s.trim())

        // format the title to TVDB format
        return {
          title: `${anime}${sneedexData.type ? ` ${sneedexData.type}` : ''} [${
            props[3]
          } ${props[0]} ${props[2]} ${props[4]}${
            props[7] ? props[5].replace('Dual Audio', ' Dual-Audio') : ''
          }]-${
            props[8]
              ? props[7].match(/\((.*?)\)/g)[0].replace(/\(|\)/g, '')
              : props[7]
              ? props[6].match(/\((.*?)\)/g)[0].replace(/\(|\)/g, '')
              : props[5].match(/\((.*?)\)/g)[0].replace(/\(|\)/g, '')
          }`,
          link: torrent.Link,
          url: torrent.Link,
          seeders: torrent.Seeders,
          leechers: torrent.Leechers,
          infohash: null,
          size: torrent.Size,
          files: torrent.FileCount,
          timestamp: torrent.UploadTime,
          grabs: torrent.Snatched,
          type: 'torrent'
        }
      })

    return animeData as ITorrentRelease[]
  }
}
