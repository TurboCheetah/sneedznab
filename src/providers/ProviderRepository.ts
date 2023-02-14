import {
  IProvider,
  IProviderRepository,
  ITorrentRelease,
  IUsenetRelease,
  ISneedexRelease
} from '#interfaces/index'

export class ProviderRepository implements IProviderRepository {
  private providers: IProvider[]

  constructor(providers: IProvider[]) {
    this.providers = providers
  }

  public async getResults(
    sneedQuery: { title: string; alias: string },
    release: ISneedexRelease
  ): Promise<(ITorrentRelease | IUsenetRelease)[]> {
    const results = (
      await Promise.all(
        this.providers.map(
          async provider => await provider.get(sneedQuery, release)
        )
      )
    ).flat()

    return results
  }
}
