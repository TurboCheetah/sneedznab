import { App } from '#/app'
import { ApiRoute } from '#routes/api'
import { AnimeTosho } from '#providers/AnimeTosho'
import { AnimeBytes } from '#providers/AnimeBytes'
import { Nyaa } from '#providers/Nyaa'
import { Rutracker } from '#providers/Rutracker'
import { RedisCache } from '#utils/Redis'
import { SimpleCache } from '#utils/SimpleCache'

export const app = new App(
  process.env.REDIS_ENABLED
    ? new RedisCache(
        process.env.REDIS_URL,
        process.env.REDIS_TOKEN,
        +process.env.CACHE_TTL
      )
    : new SimpleCache(),
  [
    process.env.NYAA_ENABLED ? new Nyaa() : null,
    // AnimeTosho can be used instead of scraping Nyaa, but it's far less reliable
    // it's only useful if you want NZBs
    process.env.ANIMETOSHO_ENABLED ? new AnimeTosho() : null,
    // Only enable AnimeBytes if you have an account
    process.env.ANIMEBYTES_ENABLED
      ? new AnimeBytes(
          process.env.ANIMEBYTES_PASSKEY,
          process.env.ANIMEBYTES_USERNAME
        )
      : null,
    process.env.RUTRACKER_ENABLED ? new Rutracker() : null
  ].filter(provider => provider !== null),
  [new ApiRoute()]
)

export default {
  port: process.env.port || 3000,
  fetch: app.getServer().fetch
}
