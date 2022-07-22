import { Hono } from 'hono'
import { SNEEDEX_URL, TOSHO_URL } from '#/constants'

const apiRoute = new Hono()

apiRoute.get('/', async c => {
  if (c.req.query('t') === 'caps') {
    return c.body(
      `<?xml version="1.0" encoding="UTF-8"?>
      <caps>
        <server version="1.0" title="Sneedex" strapline="Anime releases with the best video+subs" url="https://sneedex.moe/"/>
        <limits max="200" default="75"/>
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
    const returnType = c.req.query('response')
    const sneedexData = await fetch(
      `${SNEEDEX_URL}/search?key=${process.env.API_KEY}&c=50&q=${query}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    const usenetReleases: {
      title: string
      link: string
      url: string
      size: number
      files: number
      timestamp: Date
    }[] = []
    const torrentReleases: {
      title: string
      link: string
      url: string
      seeders: number
      peers: number
      size: number
      infohash: string
      files: number
      timestamp: Date
    }[] = []

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
        { application: 'rss+xml', 'content-type': 'rss+xml' }
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
        { application: 'rss+xml', 'content-type': 'rss+xml' }
      )
    }

    // for each release, add an item to the rss feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/" xmlns:torznab="http://torznab.com/schemas/2015/feed">
    <channel>
      <atom:link rel="self" type="application/rss+xml" />
      <title>Sneedex</title>
      ${usenetReleases
        .map(
          release => `
            <item>
              <title>${release.title}</title>
              <description />
              <guid>${release.link}</guid>
              <comments>${release.link}</comments>
              <pubDate>${new Date(release.timestamp).toUTCString()}</pubDate>
              <size>${release.size}</size>
              <link>${release.url}</link>
              <category>5070</category>
              <enclosure url="${release.url}" length="${
            release.size
          }" type="application/x-nzb" />
          <newznab:attr name="category" value="5070" />
          <newznab:attr name="rageid" value="0" />
          <newznab:attr name="tvdbid" value="0" />
          <newznab:attr name="imdb" value="0000000" />
          <newznab:attr name="tmdbid" value="0" />
          <newznab:attr name="traktid" value="0" />
          <newznab:attr name="doubanid" value="0" />
          <newznab:attr name="files" value="${release.files}" />
          <newznab:attr name="grabs" value="69" />
          </item>`
        )
        .join('')}
      ${torrentReleases
        .map(
          release => `
            <item>
              <title>${release.title}</title>
              <description />
              <guid>${release.link}</guid>
              <comments>${release.link}</comments>
              <pubDate>${new Date(release.timestamp).toUTCString()}</pubDate>
              <size>${release.size}</size>
              <link>${release.url}</link>
              <category>5070</category>
              <enclosure url="${release.url}" length="${
            release.size
          }" type="application/x-bittorrent" />
              <torznab:attr name="category" value="5070" />
              <torznab:attr name="rageid" value="0" />
              <torznab:attr name="tvdbid" value="0" />
              <torznab:attr name="imdb" value="0000000" />
              <torznab:attr name="tmdbid" value="0" />
              <torznab:attr name="traktid" value="0" />
              <torznab:attr name="doubanid" value="0" />
              <torznab:attr name="files" value="${release.files}" />
              <torznab:attr name="grabs" value="69" />
              <torznab:attr name="seeders" value="${release.seeders}" />
              <torznab:attr name="peers" value="${release.peers}" />
              <torznab:attr name="infohash" value="${release.infohash}" />
            </item>`
        )
        .join('')}
    </channel>
  </rss>`

    return c.body(rss, 200, {
      application: 'rss+xml',
      'content-type': 'rss+xml'
    })
  }
})

export default apiRoute
