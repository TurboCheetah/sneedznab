import { TOSHO_URL } from '#/constants'
import { IToshoData } from '#interfaces/animeTosho'
import { IProvider } from '#interfaces/provider'
import { ITorrentRelease, IUsenetRelease } from '#interfaces/releases'
import { ISneedexRelease } from '#interfaces/sneedex'
import { app } from '#/index'

export class AnimeTosho implements IProvider {
  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): Promise<IToshoData[]> {
    const cachedData = await app.cache.get(`tosho_${query}`)
    if (cachedData) return cachedData as IToshoData[]

    const data = await fetch(
      `${TOSHO_URL}?t=search&extended=1&limit=100&offset=0&q=${encodeURIComponent(
        query
      )}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    await app.cache.set(`tosho_${query}`, data)

    return data as IToshoData[]
  }

  // get function to standardize the returned data to make things easier to work with and plug-and-play
  public async get(
    anime: string,
    sneedexData: ISneedexRelease
  ): Promise<IUsenetRelease[] | ITorrentRelease[]> {
    // shrimply fetch the data and then map it to the appropriate values
    const data = await this.fetch(
      `${sneedexData.best ? sneedexData.best : sneedexData.alt} ${anime}`
    )

    const bestReleaseLinks = sneedexData.best_links.length
      ? sneedexData.best_links.split(' ')
      : sneedexData.alt_links.split(' ')

    // check if one of the returned releases is on Nyaa for Usenet cope

    const nyaaID = bestReleaseLinks
      .find((url: string) => url.includes('nyaa.si/view/'))
      .match(/nyaa.si\/view\/(\d+)/)[1]

    const matchedRelease = data.find((data: IToshoData) =>
      nyaaID
        ? data.nyaa_id === +nyaaID
        : data.title.includes(
            sneedexData.best ? sneedexData.best : sneedexData.alt
          )
    )

    // if a valid release was found, reutrn it
    if (!matchedRelease) return null

    // if the release is on usenet, return it as a usenet release
    if (matchedRelease.nzb_url) {
      return [
        {
          title: matchedRelease.title,
          link: matchedRelease.link,
          url: matchedRelease.nzb_url,
          size: matchedRelease.total_size,
          files: matchedRelease.num_files,
          timestamp: matchedRelease.timestamp,
          type: 'usenet'
        }
      ] as IUsenetRelease[]
    }

    // if the release is on torrent, return it as a torrent release
    return [
      {
        title: matchedRelease.title,
        link: matchedRelease.link,
        url: matchedRelease.torrent_url,
        seeders: matchedRelease.seeders,
        leechers: matchedRelease.leechers,
        infohash: matchedRelease.info_hash,
        size: matchedRelease.total_size,
        files: matchedRelease.num_files,
        timestamp: matchedRelease.timestamp,
        type: 'torrent'
      }
    ] as ITorrentRelease[]
  }
}
