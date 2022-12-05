import { sneedexUrl } from '#/constants'
import {
  IRawSneedexData,
  ISneedexData,
  ISneedexRelease
} from '#interfaces/sneedex'
import { app } from '#/index'
import { debugLog } from '#utils/debugLog'
import { closest, distance } from 'fastest-levenshtein'

export class Sneedex {
  public name: string
  constructor() {
    this.name = 'Sneedex'
  }

  public async fetch(query: string): Promise<ISneedexData> {
    debugLog(this.name, 'cache', `${this.name}_${query}`)
    const cachedData = await app.cache.get(`${this.name}_${query}`)
    if (cachedData) {
      debugLog(this.name, 'cache', `Cache hit: ${this.name}_${query}`)
      return cachedData as ISneedexData
    }
    debugLog(this.name, 'cache', `Cache miss: ${this.name}_${query}`)

    const searchURL = `${sneedexUrl}/public/indexer`

    debugLog(this.name, 'fetch', query)
    debugLog(this.name, 'fetch', `Fetching data from ${searchURL}`)
    const sneedexData: IRawSneedexData[] = await fetch(searchURL).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
    debugLog(
      this.name,
      'fetch',
      `Fetched raw data, caching ${this.name}_${query}`
    )
    await app.cache.set(`${this.name}_${query}`, sneedexData)

    // replace any occurances of \n in the title or alias with a space
    // also gotta remember to parse the stringified releases
    // also gotta strip out any weird stuff that isn't in the official title
    // e.g Baki (2018) --> Baki
    const rawReleasesWithFormattedStrings = sneedexData.map(
      (release: IRawSneedexData) => {
        release.title = release.title
          .replace(/\\n/gi, ' ')
          .replace(/\n/gi, ' ')
          .replace(/ \(\d{4}\)/gi, '')
        release.alias = release.alias
          .replace(/\\n/gi, ' ')
          .replace(/\n/gi, ' ')
          .replace(/ \(\d{4}\)/gi, '')
        return release
      }
    )

    // find a release tile that contains the query
    const matchedRelease = rawReleasesWithFormattedStrings.find(release => {
      const title = release.title.toLowerCase()
      const alias = release.alias.toLowerCase()
      return title === query.toLowerCase() || alias === query.toLowerCase()
    })

    // if we found a release, parse it and return it
    // otherwise, find the closest match
    if (matchedRelease) {
      const parsedRelease: ISneedexData = {
        uuid: matchedRelease.uuid,
        title: matchedRelease.title,
        alias: matchedRelease.alias,
        releases: JSON.parse(matchedRelease.releases)
      }

      debugLog(
        this.name,
        'parser',
        `parsed data, caching ${this.name}_${query}`
      )
      await app.cache.set(`${this.name}_${query}`, parsedRelease)

      return parsedRelease as ISneedexData
    }

    // find the object whose title or alias matches the query using fastest-levenshtein
    const closestMatch = closest(query, [
      ...rawReleasesWithFormattedStrings.map(release => release.title),
      ...rawReleasesWithFormattedStrings
        .map(release => release.alias)
        .filter(alias => alias)
    ])
    // get the distance between the query and the closest match
    const closestMatchDistance = distance(query, closestMatch)

    // to prevent false positives, only return the closest match if the distance is less than 5
    if (closestMatchDistance > 5) {
      debugLog(this.name, 'parser', `No match found for ${query}, caching`)
      await app.cache.set(`${this.name}_${query}`, null)
      return null
    }

    // find the object whose title or alias matches the closest match
    const closestMatchObject = rawReleasesWithFormattedStrings.find(
      release =>
        release.title === closestMatch ||
        (release.alias && release.alias === closestMatch)
    )

    const match = closestMatchObject

    const actualRelease: ISneedexData = {
      uuid: match.uuid,
      title: match.title,
      alias: match.alias,
      releases: JSON.parse(match.releases).map((release: ISneedexRelease) => {
        return {
          uuid: release.uuid,
          type: release.type,
          best: release.best,
          alt: release.alt,

          best_links: release.best_links,
          alt_links: release.alt_links,

          best_dual: release.best_dual,
          alt_dual: release.alt_dual,

          best_incomplete: release.best_incomplete,
          alt_incomplete: release.alt_incomplete,

          best_unmuxed: release.best_unmuxed,
          alt_unmuxed: release.alt_unmuxed,

          best_bad_encode: release.best_bad_encode,
          alt_bad_encode: release.alt_bad_encode
        }
      })
    }

    debugLog(this.name, 'parser', `Parsed data, caching ${this.name}_${query}`)
    await app.cache.set(`${this.name}_${query}`, actualRelease as ISneedexData)

    return actualRelease as ISneedexData
  }
}
