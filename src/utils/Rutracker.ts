import { rutrackerUrl } from '#/constants'
import { IRutrackerData } from '#interfaces/rutracker'
import { IProvider } from '#interfaces/provider'
import { ITorrentRelease, IUsenetRelease } from '#interfaces/releases'
import { ISneedexRelease } from '#interfaces/sneedex'
import { app } from '#/index'
import { debugLog } from '#utils/debugLog'

export class Rutracker implements IProvider {
  public name: string
  constructor() {
    this.name = 'ruTracker'
  }

  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): Promise<IRutrackerData> {
    debugLog(`${this.name} (cache): ${this.name}_${query}`)
    const cachedData = await app.cache.get(`${this.name}_${query}`)
    if (cachedData) {
      debugLog(`${this.name} (cache): Cache hit: ${this.name}_${query}`)
      return cachedData as IRutrackerData
    }
    debugLog(`${this.name} (cache): Cache miss: ${this.name}_${query}`)

    /* for some reason unknown to me turning query, which is just the ID into a number fixes an issue with the way that bun's fetch parses URLs.
    It works fine if I hardcode the ID in there but breaks if I throw the same exactly string in as a variable, query
    Then, typecasting it to be a number fixes it somehow!?!? Sir!?!?! */
    query = +query
    const searchURL = `${rutrackerUrl}/get_tor_topic_data?by=topic_id&val=${query}`

    debugLog(`${this.name} (fetch): ${query}`)
    debugLog(`${this.name} (fetch): Fetching data from ${searchURL}`)

    const data = await fetch(searchURL).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    debugLog(
      `${this.name} (fetch): Fetched data, caching ${this.name}_${query}`
    )
    await app.cache.set(`${this.name}_${query}`, data)

    return data as IRutrackerData
  }

  // get function to standardize the returned data to make things easier to work with and plug-and-play
  public async get(
    anime: { title: string; alias: string },
    sneedexData: ISneedexRelease
  ): Promise<ITorrentRelease[]> {
    // first check if there even is an rutracker link in sneedexData.best_links and sneedexData.alt_links
    const bestReleaseLinks = sneedexData.best_links.length
      ? sneedexData.best_links.split(' ')
      : sneedexData.alt_links.split(' ')

    const threadLink = bestReleaseLinks.find((url: string) =>
      url.includes('https://rutracker.org/forum/viewtopic.php?t=')
    )
    if (!threadLink) return null

    // extract the thread ID from the link
    // https://rutracker.org/forum/viewtopic.php?t=4035529 where 4035529 is the thread ID
    const threadID = threadLink.split('t=')[1]

    // call the ruTracker API
    const data = await this.fetch(threadID)

    // Handle no results
    if (!data || data.result[threadID] === null) return null

    return [
      {
        title: data.result[threadID].topic_title,
        link: `https://rutracker.org/forum/viewtopic.php?t=${threadID}`,
        url: `magnet:?xt=urn:btih:${
          data.result[threadID].info_hash
        }&tr=${encodeURIComponent(
          `http://bt3.t-ru.org/ann?magnet&dn=${data.result[
            threadID
          ].topic_title.slice(0, 150)}`
        )}`, // not sure why they only include the first 150 chars of the title post but ok
        seeders: data.result[threadID].seeders,
        leechers: 0, // API doesn't report this
        infohash: data.result[threadID].info_hash,
        size: data.result[threadID].size,
        files: null,
        timestamp: null,
        grabs: data.result[threadID].dl_count,
        type: 'torrent'
      }
    ] as ITorrentRelease[]
  }
}
