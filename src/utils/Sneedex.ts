import { sneedexUrl } from '#/constants'
import {
  IRawSneedexData,
  ISneedexData,
  ISneedexRelease
} from '#interfaces/index'
import { app } from '#/index'
import { Utils } from '#utils/Utils'
import Fuse from 'fuse.js'

export class Sneedex {
  readonly name: string
  constructor() {
    this.name = 'Sneedex'
  }

  public async fetch(query: string): Promise<ISneedexData> {
    // check the cache to see if a match has already been found
    Utils.debugLog(this.name, 'cache', `${this.name}_${query}`)
    const cachedData = await app.cache.get(`${this.name}_${query}`)
    if (cachedData) {
      Utils.debugLog(this.name, 'cache', `Cache hit: ${this.name}_${query}`)
      return cachedData as ISneedexData
    }
    Utils.debugLog(this.name, 'cache', `Cache miss: ${this.name}_${query}`)

    // check the cache for the raw response from sneedex.moe
    let sneedexData: IRawSneedexData[]
    const sneedexCache = await app.cache.get(`${this.name}`)

    if (sneedexCache) {
      Utils.debugLog(this.name, 'cache', `Cache hit: ${this.name}`)
      sneedexData = sneedexCache as IRawSneedexData[]
    } else {
      // if the cache is empty, fetch the data from sneedex.moe
      Utils.debugLog(this.name, 'cache', `Cache miss: ${this.name}`)
      const searchURL = `${sneedexUrl}/public/indexer`
      Utils.debugLog(this.name, 'fetch', `Fetching data from ${searchURL}`)
      sneedexData = await fetch(searchURL).then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      Utils.debugLog(
        this.name,
        'fetch',
        `Fetched raw data, caching ${this.name}`
      )
      await app.cache.set(`${this.name}`, sneedexData)
    }

    // replace any occurances of \n in the title or alias with a space
    const rawReleasesWithFormattedStrings = sneedexData.map(
      (release: IRawSneedexData) => {
        release.title = release.title.replace(/\\n/gi, ' ').replace(/\n/gi, ' ')
        release.alias = release.alias.replace(/\\n/gi, ' ').replace(/\n/gi, ' ')
        return release
      }
    )

    // initialize fuse.js for fuzzy searching, prioritizing title over alias
    const fuse = new Fuse(rawReleasesWithFormattedStrings, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'alias', weight: 0.3 }
      ]
    })

    Utils.debugLog(this.name, 'fuse', `Fuzzy finding ${query}`)
    const [matchedRelease] = fuse.search(query)

    if (!matchedRelease) {
      Utils.debugLog(this.name, 'fuse', `No match found for ${query}, caching`)
      await app.cache.set(`${this.name}_${query}`, null)
      return null
    }

    // if a match if found, parse it and cache it
    const parsedRelease: ISneedexData = {
      uuid: matchedRelease.item.uuid,
      title: matchedRelease.item.title,
      alias: matchedRelease.item.alias,
      releases: JSON.parse(matchedRelease.item.releases)
    }

    Utils.debugLog(
      this.name,
      'parser',
      `parsed data, caching ${this.name}_${query}`
    )
    await app.cache.set(`${this.name}_${query}`, parsedRelease)

    return parsedRelease
  }
}
