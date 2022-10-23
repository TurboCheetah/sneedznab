import { ICache } from '#interfaces/cache'
import * as NodeCache from 'node-cache'

export class SimpleCache implements ICache {
  constructor(private cache: NodeCache) {}

  public async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value)
    return
  }

  public async get(key: string): Promise<any> {
    return this.cache.get(key)
  }
}
