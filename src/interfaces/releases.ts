export interface IUsenetRelease {
  title: string
  link: string
  url: string
  size: number
  files: number
  timestamp: number
  grabs: number
  type: 'usenet'
}

export interface ITorrentRelease {
  title: string
  link: string
  url: string
  seeders: number
  leechers: number
  size: number
  infohash: string
  files: number
  timestamp: number | string
  grabs: number
  type: 'torrent'
}
