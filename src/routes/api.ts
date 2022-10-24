import { Hono } from 'hono'
import { SNEEDEX_URL, TOSHO_URL } from '#/constants'
import { ITorrentRelease, IUsenetRelease } from '#interfaces/releases'
import { IRoute } from '#interfaces/route'
import { rssBuilder } from '#/utils/rss'
import { app } from '#/index'

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
        const query = c.req.query('q')
        // if no query is specified, return Sneedex
        if (!query) {
          const rss = rssBuilder(
            [
              {
                title:
                  '[hydes] Akira v2 [BDRip 1920x1032 x264 FLAC][Dual-Audio]',
                link: 'https://animetosho.org/view/hydes-akira-v2-bdrip-1920x1032-x264-flac-dual-audio.n1548873',
                url: 'https://animetosho.org/storage/nzbs/0007ae76/%5Bhydes%5D%20Akira%20%28BDRip%201920x1032%20x264%20FLAC%29.nzb',
                size: 26473019160,
                files: 1,
                timestamp: 1656898675,
                type: 'usenet'
              }
            ],
            [
              {
                title:
                  '[IK] High School DxD (D�D+New+BorN+Hero) [BD 1920x1080 x264 FLAC] [Uncensored] [Dual Audio] [Anime+Manga+Light Novel+OST] V3',
                link: 'https://animetosho.org/view/ik-high-school-dxd-dd-new-born-hero.n1479910',
                url: 'https://animetosho.org/storage/torrent/ae29524587aaeddee035229031f3b2ca2ed646c6/%5BIK%5D%20High%20School%20DxD%20%28D%C3%97D%2BNew%2BBorN%2BHero%29%20%5BBD%201920x1080%20x264%20FLAC%5D%20%5BUncensored%5D%20%5BDual%20Audio%5D%20%5BAnime%2BManga%2BLight%20Novel%2BOST%5D%20V3.torrent',
                seeders: 13,
                peers: 22,
                infohash: 'ae29524587aaeddee035229031f3b2ca2ed646c6',
                size: 123796771251,
                files: 718,
                timestamp: 1642614696,
                type: 'torrent'
              }
            ]
          )

          return c.body(rss, 200, {
            application: 'rss+xml'
          })
        }

        const returnType = c.req.query('response')

        // Sonarr requests in the format Attack on Titan : S04E28 (87)
        const sonarrQuery = query.split(':')[0]
        // check cache first
        const cachedData = await app.cache.get(`api_${sonarrQuery}`)
        if (cachedData) {
          if (returnType === 'json') return c.json(cachedData)

          return c.body(
            rssBuilder(cachedData.usenetReleases, cachedData.torrentReleases),
            200,
            {
              application: 'rss+xml'
            }
          )
        }

        const sneedexData = await app.sneedex.fetch(sonarrQuery)

        const usenetReleases: IUsenetRelease[] = []
        const torrentReleases: ITorrentRelease[] = []

        // Return empty if no results
        if (!sneedexData[0] && returnType === 'json') {
          return c.json({ usenetReleases, torrentReleases }, 404)
        } else if (!sneedexData[0]) {
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

        // Releases are typically just each individual season
        for (const release of sneedexData[0].releases) {
          const sneedQuery = `${release.best ? release.best : release.alt} ${
            sneedexData[0].title
          }`

          const results = (
            await Promise.all(
              app.providers.map(
                async provider =>
                  await provider.get(sneedexData[0].title, release)
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
