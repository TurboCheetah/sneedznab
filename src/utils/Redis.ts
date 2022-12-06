import { ICache } from '#interfaces/cache'
import { Redis } from '@upstash/redis'

export class RedisCache implements ICache {
  constructor(private redis: Redis) {}

  public async set(key: string, value: any): Promise<void> {
    // Convert CACHE_TTL to a number so tsc doesn't complain
    await this.redis.set(key, value, { ex: +process.env.CACHE_TTL })
    return
  }

  public async get(key: string): Promise<any> {
    return await this.redis.get(key)
  }
}
