import { ISneedexData } from '#interfaces/sneedex'

export interface IData {
  title: string
  url: string
  type: 'usenet' | 'torrent'
}

export interface IProvider {
  get(anime: string, sneedexData: ISneedexData): Promise<IData[]>
}
