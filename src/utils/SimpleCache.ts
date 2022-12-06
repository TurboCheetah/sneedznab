import { ICache } from '#interfaces/cache'
import * as NodeCache from 'node-cache'

export class SimpleCache implements ICache {
  private cache: NodeCache
  constructor(private ttl: number) {
    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: 10
    })
  }

  public async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value)
    return
  }

  public async get(key: string): Promise<any> {
    return this.cache.get(key)
  }
}
