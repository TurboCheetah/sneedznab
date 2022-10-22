export interface IUsenetRelease {
  title: string
  link: string
  url: string
  size: number
  files: number
  timestamp: number
}

export interface ITorrentRelease {
  title: string
  link: string
  url: string
  seeders: number
  peers: number
  size: number
  infohash: string
  files: number
  timestamp: number
}
