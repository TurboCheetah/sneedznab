import { Hono } from 'hono'
import { ITorrentRelease, IUsenetRelease } from '#interfaces/releases'
import { IRoute } from '#interfaces/route'
import { app } from '#/index'
import { debugLog } from '#utils/debugLog'
import { rssBuilder } from '#/utils/rss'

export const apiHono = new Hono()
export class ApiRoute implements IRoute {
  public path = '/api'
  public router: Hono
  constructor() {
    this.router = new Hono()
    this.initializeRoutes()
  }

  public getRouter(): Hono {
    return this.router
  }

  private initializeRoutes() {
    this.router.get('/', async c => {
      if (c.req.query('t') === 'caps') {
        return c.body(
          `<?xml version="1.0" encoding="UTF-8"?>
      <caps>
        <server version="1.0" title="Sneedex" strapline="Anime releases with the best video+subs" url="https://sneedex.moe/"/>
        <limits max="9999" default="100"/>
        <retention days="9999"/>
        <registration available="no" open="yes"/>
        <searching>
          <search available="yes" supportedParams="q"/>
          <tv-search available="no" supportedParams="q"/>
          <movie-search available="no" supportedParams="q"/>
        </searching>
        <categories>
          <category id="5070" name="Anime" description="Anime"/>
        </categories>
      </caps>`,
          200,
          { 'content-type': 'text/xml' }
        )
      } else if (c.req.query('t') === 'search') {
        const returnType = c.req.query('response')
        let query = c.req.query('q').trim()
        // if query is unspecified, e.g when Prowlarr is testing it, set it to DxD to test it
        if (!query) query = 'High School DxD'

        // Sonarr requests in the format Attack on Titan : S04E28 (87)
        // TODO: somehow make this work for titles like RE:Zero since it has a colon in it
        const sonarrQuery = query.split(' : ')[0]

        // check cache first
        debugLog('API', 'cache', `api_${query}`)
        const cachedData = await app.cache.get(`api_${sonarrQuery}`)

        if (cachedData) {
          debugLog('API', 'cache', `Cache hit: api_${query}`)
          if (returnType === 'json') return c.json(cachedData)

          return c.body(
            rssBuilder(cachedData.usenetReleases, cachedData.torrentReleases),
            200,
            {
              application: 'rss+xml'
            }
          )
        }
        debugLog('API', 'cache', `Cache miss: api_${query}`)

        debugLog('API', 'fetch', sonarrQuery)
        const sneedexData = await app.sneedex.fetch(sonarrQuery)

        const usenetReleases: IUsenetRelease[] = []
        const torrentReleases: ITorrentRelease[] = []

        // Return empty if no results
        if (!sneedexData) {
          debugLog('API', 'fetch', `No results found, caching api_${query}`)
          await app.cache.set(`api_${sonarrQuery}`, {
            usenetReleases,
            torrentReleases
          })

          if (returnType === 'json') {
            return c.json({ usenetReleases, torrentReleases }, 404)
          } else {
            return c.body(
              `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/" xmlns:torznab="http://torznab.com/schemas/2015/feed">
    <channel>
        <newznab:response offset="0" total="0"/>
    </channel>
    </rss>`,
              200,
              { application: 'rss+xml' }
            )
          }
        }

        // Releases are typically just each individual season
        for (const release of sneedexData.releases) {
          const sneedQuery = {
            title: sneedexData.title,
            alias: sneedexData.alias
          }

          const results = (
            await Promise.all(
              app.providers.map(
                async provider => await provider.get(sneedQuery, release)
              )
            )
          ).flat()

          // push each result to either usenetReleases or torrentReleases
          for (const result of results) {
            if (!result) continue
            result.type === 'usenet'
              ? usenetReleases.push(result)
              : torrentReleases.push(result)
          }
        }

        debugLog('API', 'fetch', `Fetched data, caching api_${sonarrQuery}`)
        await app.cache.set(`api_${sonarrQuery}`, {
          usenetReleases,
          torrentReleases
        })

        if (returnType === 'json') {
          return c.json(
            { usenetReleases, torrentReleases },
            usenetReleases.length + torrentReleases.length ? 200 : 404
          )
        }

        // if there are no releases, return a 200 with the proper torznab response
        if (!usenetReleases.length && !torrentReleases.length) {
          return c.body(
            `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/" xmlns:torznab="http://torznab.com/schemas/2015/feed">
    <channel>
        <newznab:response offset="0" total="0"/>
    </channel>
    </rss>`,
            200,
            { application: 'rss+xml' }
          )
        }

        // for each release, add an item to the rss feed
        const rss = rssBuilder(usenetReleases, torrentReleases)

        return c.body(rss, 200, {
          application: 'rss+xml'
        })
      }
    })
  }
}
