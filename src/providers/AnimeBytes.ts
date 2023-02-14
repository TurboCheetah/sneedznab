import { animebytesUrl } from '#/constants'
import {
  IAnimeBytesData,
  IProvider,
  ISneedexRelease,
  ITorrentRelease
} from '#interfaces/index'
import { app } from '#/index'
import { Utils } from '#utils/Utils'

export class AnimeBytes implements IProvider {
  readonly name: string
  constructor(private passkey: string, private username: string) {
    if (!passkey || !username) {
      throw new Error('No AnimeBytes credentials provided')
    }

    this.name = 'AnimeBytes'
    this.passkey = passkey
    this.username = username
  }

  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): Promise<IAnimeBytesData> {
    Utils.debugLog(this.name, 'cache', `${this.name}_${query}`)
    const cachedData = await app.cache.get(`${this.name}_${query}`)
    if (cachedData) {
      Utils.debugLog(this.name, 'cache', `Cache hit: ${this.name}_${query}`)
      return cachedData as IAnimeBytesData
    }
    Utils.debugLog(this.name, 'cache', `Cache miss: ${this.name}_${query}`)

    const searchURL = `${animebytesUrl}?torrent_pass=${this.passkey}&username=${
      this.username
    }&type=anime&searchstr=${encodeURIComponent(query)}`
    Utils.debugLog(this.name, 'fetch', query)
    Utils.debugLog(
      this.name,
      'fetch',
      `Fetching data from ${searchURL.replace(
        new RegExp(`${this.passkey}|${this.username}`, 'gi'),
        '[REDACTED]'
      )}`
    )
    const data = await fetch(searchURL).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    Utils.debugLog(
      this.name,
      'fetch',
      `Fetched data, caching ${this.name}_${query}`
    )
    await app.cache.set(`${this.name}_${query}`, data)

    return data as IAnimeBytesData
  }

  // get function to standardize the returned data to make things easier to work with and plug-and-play
  public async get(
    anime: { title: string; alias: string },
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
    let data = await this.fetch(anime.title)

    // if no data was found, return null
    if (data.Results === '0') {
      if (!anime.alias.length) return null

      data = await this.fetch(anime.alias)
      if (data.Results === '0') return null
    }

    // only parse the group where CategoryName === "Anime"
    const animeData = data.Groups.filter(
      group => group.CategoryName === 'Anime'
    )
      .map(group => group.Torrents)
      .flat()
      .filter(torrent => torrentIDs.includes(torrent.ID))

    const hashMap = {}
    animeData.forEach(torrent => {
      hashMap[torrent.ID] = torrent
    })

    const result = torrentIDs.map(torrentID => {
      const torrent = hashMap[torrentID]
      if (!torrent) return null

      const group = data.Groups.find(group => group.Torrents.includes(torrent))
      const props = torrent.Property.split('|').map(s => s.trim())

      // the release group is always after the text "softsubs", so we can just find the part that includes that then use a regex
      const releaseGroup = props
        .find(prop => prop.includes('subs'))
        .match(/\((.*?)\)/)[1]

      const dualAudio = props.find(prop =>
        prop.toLowerCase().includes('dual audio')
      )

      // format the title to TVDB format
      /*
        Example values for props:
            props[0] = "Blu-ray"
            props[1] = "MKV"
            props[2] = "h264 10-bit"
            props[3] = 1080
            props[4] = "FLAC 2.0"
            props[5] = "Softsubs"
        */
      const [medium, container, codec, resolution, audio, subs] = props
      // get the bitdepth from codec by splitting it and checking if it has either 10-bit or 8-bit
      // if it has nothing return 8-bit
      const bitDepth =
        codec.split(' ').find(text => text.includes('bit')) || '8-bit'
      return {
        title: `${anime.title}${
          sneedexData.type ? ` ${sneedexData.type}` : ''
        } [${medium}-${props[3]}][${bitDepth}][${
          codec.split(' ')[0]
        }][${audio}]${dualAudio ? '[EN+JA]' : '[JA]'}-${releaseGroup}`,
        link: `https://animebytes.tv/torrents.php?id=${group.ID}&torrentid=${torrent.ID}`,
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

    return result as ITorrentRelease[]
  }
}
