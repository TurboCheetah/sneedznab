export interface UsenetRelease {
  title: string
  link: string
  url: string
  size: number
  files: number
  timestamp: Date
}

export interface TorrentRelease {
  title: string
  link: string
  url: string
  seeders: number
  peers: number
  size: number
  infohash: string
  files: number
  timestamp: Date
}
