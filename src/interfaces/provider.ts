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
  ): Promise<(ITorrentRelease | IUsenetRelease)[]>
}

export interface IProviderRepository {
  getResults(
    sneedQuery: { title: string; alias: string },
    release: ISneedexRelease
  ): Promise<(ITorrentRelease | IUsenetRelease)[]>
}
