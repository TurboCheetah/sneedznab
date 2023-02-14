import { nyaaUrl } from '#/constants'
import {
  INyaaData,
  IProvider,
  ITorrentRelease,
  ISneedexRelease
} from '#interfaces/index'
import { app } from '#/index'
import { Utils } from '#utils/Utils'
import { load } from 'cheerio'

export class Nyaa implements IProvider {
  readonly name: string
  constructor() {
    this.name = 'Nyaa'
  }

  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): Promise<INyaaData> {
    Utils.debugLog(this.name, 'cache', `${this.name}_${query}`)
    const cachedData = await app.cache.get(`${this.name}_${query}`)
    if (cachedData) {
      Utils.debugLog(this.name, 'cache', `Cache hit: ${this.name}_${query}`)
      return cachedData as INyaaData
    }
    Utils.debugLog(this.name, 'cache', `Cache miss: ${this.name}_${query}`)

    const scrapeUrl = `https://nyaa.si/view/${query}`
    Utils.debugLog(this.name, 'fetch', query)
    Utils.debugLog(this.name, 'fetch', `Fetching data from ${scrapeUrl}`)
    // Scrape the HTML for the info
    const html = await fetch(scrapeUrl).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.text()
    })

    const $ = load(html)

    const scrapedData = {
      title: $('body > div > div:nth-child(1) > div.panel-heading > h3')
        .text()
        .trim(),
      date: $('div.row:nth-child(1) > div:nth-child(4)').text().trim(),
      seeders: +$('div.row:nth-child(2) > div:nth-child(4) > span:nth-child(1)')
        .text()
        .trim(),
      leechers: +$(
        'div.row:nth-child(3) > div:nth-child(4) > span:nth-child(1)'
      )
        .text()
        .trim(),
      size: $('div.row:nth-child(4) > div:nth-child(2)').text().trim(),
      completed: +$('div.row:nth-child(4) > div:nth-child(4)').text().trim(),
      infohash: $('div.row:nth-child(5) > div:nth-child(2) > kbd:nth-child(1)')
        .text()
        .trim(),
      files: $(
        '.torrent-file-list > ul:nth-child(1) > li:nth-child(1) > ul:nth-child(2)'
      ).find('li').length,
      id: +query
    }

    Utils.debugLog(
      this.name,
      'fetch',
      `Fetched data, caching ${this.name}_${query}`
    )
    await app.cache.set(`${this.name}_${query}`, scrapedData)

    return scrapedData as INyaaData
  }

  public async get(
    anime: { title: string; alias: string },
    sneedexData: ISneedexRelease
  ): Promise<ITorrentRelease[]> {
    /*
    // try to find the torrent using Nyaa's RSS API
    // this used fast-xml-parser
    const nyaaRSS = `https://nyaa.si/?page=rss&cats=1_2&term=${encodeURIComponent(
      anime.title
    )}`

    const nyaaData = await fetch(nyaaRSS).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.text()
    })

    // parse the RSS feed to return an array of torrents
    const {
      rss: {
        channel: { item }
      }
    } = new XMLParser().parse(nyaaData)

    // search the items in the array's download links for the nyaaID
    // the property is item.guid
    const matchedNyaa = item.find(
      (item: any) => +item.guid.match(/nyaa.si\/view\/(\d+)/)[1] === nyaaID
    )
    */

    const bestReleaseLinks = sneedexData.best_links.length
      ? sneedexData.best_links.split(' ')
      : sneedexData.alt_links.split(' ')

    // get each Nyaa link and scrape the page
    const nyaaLinks = bestReleaseLinks.filter((url: string) =>
      url.includes('nyaa.si/view/')
    )
    const nyaaIDs = nyaaLinks.length
      ? nyaaLinks.map((url: string) => +url.match(/nyaa.si\/view\/(\d+)/)[1])
      : null

    // for each nyaaID, scrape the page and return the data
    const nyaaData = nyaaIDs
      ? await Promise.all(
          nyaaIDs.map(async (nyaaID: number) => {
            const nyaaData = await this.fetch(`${nyaaID}`)
            return nyaaData
          })
        )
      : null

    // if there's no nyaa data, return null
    if (!nyaaData) return null

    // format the data into an array of ITorrentReleases
    const releases: ITorrentRelease[] = nyaaData.map((data: INyaaData) => {
      const size = data.size.split(' ')
      const sizeInBytes =
        size[1] === 'GiB'
          ? +size[0] * 1024 * 1024 * 1024
          : +size[0] * 1024 * 1024

      // remove decimal places from the size in bytes to comply with Torznab
      const sizeInBytesRounded = Math.round(sizeInBytes)

      const formattedDate = Utils.formatDate(
        new Date(data.date.replace(' UTC', '')).getTime()
      )

      return {
        title: data.title,
        link: `https://nyaa.si/view/${data.id}`,
        url: `https://nyaa.si/download/${data.id}.torrent`,
        seeders: data.seeders,
        leechers: data.leechers,
        infohash: data.infohash,
        size: sizeInBytesRounded,
        files: data.files,
        timestamp: formattedDate,
        grabs: data.completed,
        type: 'torrent'
      }
    })

    return releases as ITorrentRelease[]
  }
}
