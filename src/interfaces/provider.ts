import { ISneedexRelease } from '#interfaces/sneedex'
import { ITorrentRelease, IUsenetRelease } from '#interfaces/releases'

export interface IProvider {
  name: string
  get(
    anime: { title: string; alias: string },
    sneedexData: ISneedexRelease
  ): Promise<ITorrentRelease[] | IUsenetRelease[]>
}
