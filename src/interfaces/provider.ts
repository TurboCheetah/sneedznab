import { ISneedexRelease } from '#interfaces/sneedex'
import { ITorrentRelease, IUsenetRelease } from '#interfaces/releases'

export interface IProvider {
  get(
    anime: string,
    sneedexData: ISneedexRelease
  ): Promise<ITorrentRelease[] | IUsenetRelease[]>
}
