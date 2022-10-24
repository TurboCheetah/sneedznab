import { ITorrentRelease, IUsenetRelease } from '#interfaces/releases'

export const rssBuilder = (
  usenetReleases: IUsenetRelease[],
  torrentReleases: ITorrentRelease[]
): string => {
  // for each release, add an item to the rss feed
  return `<?xml version="1.0" encoding="UTF-8"?>
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
				<newznab:attr name="grabs" value="${release.grabs || 0}" />
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
					<torznab:attr name="grabs" value="${release.grabs || 0}" />
					<torznab:attr name="seeders" value="${release.seeders}" />
					<torznab:attr name="peers" value="${release.seeders + release.leechers}" />
					<torznab:attr name="infohash" value="${release.infohash}" />
				  </item>`
        )
        .join('')}
		  </channel>
		</rss>`
}
