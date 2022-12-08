import {
  ISneedexRelease,
  ITorrentRelease,
  IUsenetRelease
} from '#interfaces/index'

export interface IProvider {
  name: string
  get(
    anime: { title: string; alias: string },
    sneedexData: ISneedexRelease
  ): Promise<ITorrentRelease[] | IUsenetRelease[]>
}
