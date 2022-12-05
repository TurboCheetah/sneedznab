import { sneedexUrl } from '#/constants'
import { ISneedexData } from '#interfaces/sneedex'
import { app } from '#/index'
import { debugLog } from '#utils/debugLog'
import { closest, distance } from 'fastest-levenshtein'

export class Sneedex {
  public name: string
  constructor() {
    this.name = 'Sneedex'
  }

  public async fetch(query: string): Promise<ISneedexData> {
    debugLog(`${this.name}: ${query}`)
    debugLog(`${this.name} (cache): ${query}`)
    const cachedData = await app.cache.get(`${this.name}_${query}`)
    if (cachedData) {
      debugLog(`${this.name} (cache): Cache hit: ${this.name}_${query}`)
      return cachedData as ISneedexData[]
    }
    debugLog(`${this.name} (cache): Cache miss: ${this.name}_${query}`)

    const searchURL = `${sneedexUrl}/public/indexer`

    debugLog(`${this.name} (fetch): Fetching data from ${searchURL}`)

    const sneedexData = await fetch(searchURL).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    // replace any occurances of \n in the title or alias with a space
    const data = sneedexData.map((release: ISneedexData) => {
      release.title = release.title.replace(/\\n/gi, ' ').replace(/\n/gi, ' ')
      release.alias = release.alias.replace(/\\n/gi, ' ').replace(/\n/gi, ' ')
      return release
    })
    // find a release tile that contains the query
    const release = data.find(release => {
      const title = release.title.toLowerCase()
      const alias = release.alias.toLowerCase()
      return title === query.toLowerCase() || alias === query.toLowerCase()
    })

    // if we found a release, return it
    // otherwise, find the closest match
    // also gotta remember to parse the stringified releases
    // also gotta strip out any weird stuff that isn't in the official title
    // e.g Baki (2018) --> Baki
    if (release) {
      release.title = release.title
        .replace(/\\n/gi, ' ')
        .replace(/\n/gi, ' ')
        .replace(/ \(\d{4}\)/gi, '')
      release.releases = JSON.parse(release.releases)

      debugLog(
        `${this.name} (fetch): Fetched data, caching ${this.name}_${query}`
      )
      await app.cache.set(`${this.name}_${query}`, data as ISneedexData[])

      return release as ISneedexData
    }

    // find the object whose title or alias matches the query using fastest-levenshtein
    const closestMatch = closest(query, [
      ...data.map(release => release.title),
      ...data.map(release => release.alias).filter(alias => alias)
    ])
    // get the distance between the query and the closest match
    const closestMatchDistance = distance(query, closestMatch)

    // to prevent false positives, only return the closest match if the distance is less than 5
    if (closestMatchDistance > 5) {
      debugLog(`${this.name} (fetch): No match found for ${query}, caching`)
      await app.cache.set(`${this.name}_${query}`, null)
      return null
    }

    // find the object whose title or alias matches the closest match
    const closestMatchObject = data.find(
      release =>
        release.title === closestMatch ||
        (release.alias && release.alias === closestMatch)
    )

    const match = closestMatchObject
    match.releases = JSON.parse(match.releases)

    debugLog(
      `${this.name} (fetch): Fetched data, caching ${this.name}_${query}`
    )
    await app.cache.set(`${this.name}_${query}`, data as ISneedexData)

    return match as ISneedexData
  }
}
