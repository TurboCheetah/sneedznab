import { ICache } from '#interfaces/index'
import { Redis } from '@upstash/redis'

export class RedisCache implements ICache {
  readonly name: string
  private redis: Redis
  constructor(private url: string, private token: string, private ttl: number) {
    this.name = 'RedisCache'
    this.redis = new Redis({
      url,
      token
    })
  }

  public async set(key: string, value: any): Promise<void> {
    await this.redis.set(key, value, { ex: this.ttl })
    return
  }

  public async get(key: string): Promise<any> {
    return await this.redis.get(key)
  }
}
