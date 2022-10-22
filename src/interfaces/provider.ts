export interface IData {
  title: string
  url: string
  type: 'usenet' | 'torrent'
}

export interface IProvider {
  get(query: string): Promise<IData[]>
}
