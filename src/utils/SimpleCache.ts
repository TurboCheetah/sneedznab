import { ICache } from '#interfaces/index'
import * as LRU from 'lru-cache'

export class SimpleCache implements ICache {
  private cache: LRU<string, any>
  constructor(private ttl: number) {
    this.cache = new LRU({ max: 250, ttl: this.ttl })
  }

  public async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value)
    return
  }

  public async get(key: string): Promise<any> {
    return this.cache.get(key)
  }
}
