import { App } from '#/app'
import { ApiRoute } from '#routes/api'
import { AnimeTosho } from '#providers/AnimeTosho'
import { AnimeBytes } from '#providers/AnimeBytes'
import { Rutracker } from '#providers/Rutracker'
import { RedisCache } from '#utils/Redis'
import { Redis } from '@upstash/redis'
import { SimpleCache } from '#utils/SimpleCache'
import * as NodeCache from 'node-cache'

export const app = new App(
  // If you would like to use Redis instead, comment out the line below and uncomment the Redis part
  new SimpleCache(
    new NodeCache({ stdTTL: +process.env.CACHE_TTL, checkperiod: 10 })
  ),
  /*
  new RedisCache(
    new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN
    })
  ),
    */
  [
    // AnimeTosho is used instead of scraping Nyaa
    new AnimeTosho(),
    // Only enable AnimeBytes if you have an account
    new AnimeBytes(
      process.env.ANIMEBYTES_PASSKEY,
      process.env.ANIMEBYTES_USERNAME
    ),
    new Rutracker()
  ],
  [new ApiRoute()]
)

export default {
  port: process.env.port || 3000,
  fetch: app.getServer().fetch
}
