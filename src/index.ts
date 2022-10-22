import { App } from '#/app'
import { ApiRoute } from '#routes/api'
import { AnimeTosho } from '#utils/AnimeTosho'
import { AnimeBytes } from '#utils/AnimeBytes'
import { RedisCache } from '#utils/redis'
import { Redis } from '@upstash/redis'

export const app = new App(
  // new SimpleCache(new NodeCache({ stdTTL: process.env.CACHE_TTL, checkperiod: 10 })),
  new RedisCache(
    new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN
    })
  ),
  [
    new AnimeTosho(),
    new AnimeBytes(
      process.env.ANIMEBYTES_PASSKEY,
      process.env.ANIMEBYTES_USERNAME
    )
  ],
  [new ApiRoute()]
)

export default {
  port: process.env.port || 3000,
  fetch: app.getServer().fetch
}
