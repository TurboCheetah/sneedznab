import { ICache } from '#interfaces/cache'
import { IData } from '#interfaces/provider'
import { Redis } from '@upstash/redis'

export class RedisCache implements ICache {
  constructor(private redis: Redis) {}

  public async set(key: string, value: IData[]): Promise<void> {
    // Convert CACHE_TTL to a number so tsc doesn't complain
    await this.redis.set(key, value, { ex: +process.env.CACHE_TTL })
    return
  }

  public async get(key: string): Promise<IData[]> {
    return (await this.redis.get(key)) as IData[]
  }
}
