import { ICache } from '#interfaces/cache'
import { IData } from '#interfaces/provider'
import * as NodeCache from 'node-cache'

export class SimpleCache implements ICache {
  constructor(private cache: NodeCache) {}

  public async set(key: string, value: IData[]): Promise<void> {
    this.cache.set(key, value)
    return
  }

  public async get(key: string): Promise<IData[]> {
    return this.cache.get(key) as IData[]
  }
}
