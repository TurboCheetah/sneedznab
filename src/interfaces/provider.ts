export interface Data {
  title: string
  url: string
  type: 'usenet' | 'torrent'
}

export interface Provider {
  get(query: string): Promise<Data[]>
}
