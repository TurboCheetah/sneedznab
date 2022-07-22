import { Hono } from 'hono'
import { SNEEDEX_URL, TOSHO_URL } from '#/constants'
import { TorrentRelease, UsenetRelease } from '#interfaces/releases'
import { rssBuilder } from '#/utils/rss'

const apiRoute = new Hono()

apiRoute.get('/', async c => {
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
            title: '[hydes] Akira v2 [BDRip 1920x1032 x264 FLAC][Dual-Audio]',
            link: 'https://animetosho.org/view/hydes-akira-v2-bdrip-1920x1032-x264-flac-dual-audio.n1548873',
            url: 'https://animetosho.org/storage/nzbs/0007ae76/%5Bhydes%5D%20Akira%20%28BDRip%201920x1032%20x264%20FLAC%29.nzb',
            size: 26473019160,
            files: 1,
            timestamp: 1656898675
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
            timestamp: 1642614696
          }
        ]
      )

      return c.body(rss, 200, {
        application: 'rss+xml'
      })
    }

    const returnType = c.req.query('response')
    const sneedexData = await fetch(
      `${SNEEDEX_URL}/search?key=${process.env.API_KEY}&c=50&q=${query}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    const usenetReleases: UsenetRelease[] = []
    const torrentReleases: TorrentRelease[] = []

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

    for (const release of sneedexData[0].releases) {
      const bestReleases = release.best_links.length
        ? release.best_links.split(' ')
        : release.alt_links.split(' ')

      // check if there is a Nyaa release
      let nyaaRelease = bestReleases.find((url: string) =>
        url.includes('nyaa.si/view/')
      )

      // if there is, extract its ID
      if (nyaaRelease)
        nyaaRelease = nyaaRelease.match(/nyaa.si\/view\/(\d+)/)[1]

      const toshoData = await fetch(
        `${TOSHO_URL}?t=search&extended=1&q=${encodeURIComponent(
          `${release.best ? release.best : release.alt} ${sneedexData[0].title}`
        )}&limit=100&offset=0`
      ).then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })

      // find the first release from toshoData that matches the criteria
      // @ts-ignore
      const toshoRelease = toshoData.find((data: any) =>
        nyaaRelease
          ? data.nyaa_id === +nyaaRelease
          : data.title.includes(release.best ? release.best : release.alt)
      )

      // if a valid release was found, reutrn the nzb url property
      if (toshoRelease) {
        if (!toshoRelease.nzb_url)
          torrentReleases.push({
            title: toshoRelease.title,
            link: toshoRelease.link,
            url: toshoRelease.torrent_url,
            seeders: toshoRelease.seeders,
            peers: toshoRelease.leechers,
            infohash: toshoRelease.info_hash,
            size: toshoRelease.total_size,
            files: toshoRelease.num_files,
            timestamp: toshoRelease.timestamp
          })
        else
          usenetReleases.push({
            title: toshoRelease.title,
            link: toshoRelease.link,
            url: toshoRelease.nzb_url,
            size: toshoRelease.total_size,
            files: toshoRelease.num_files,
            timestamp: toshoRelease.timestamp
          })
      }
    }

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

export default apiRoute
