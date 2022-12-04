import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ICache } from '#interfaces/cache'
import { IProvider } from '#interfaces/provider'
import { IRoute } from '#interfaces/route'
import { ApiRoute } from '#routes/api'
import { Sneedex } from '#utils/Sneedex'

export class App {
  public app: Hono
  public sneedex: Sneedex
  constructor(
    public cache: ICache,
    public providers: IProvider[],
    public routes: IRoute[],
    public debug: boolean
  ) {
    this.app = new Hono()
    this.cache = cache
    this.providers = providers
    this.routes = routes
    this.sneedex = new Sneedex()
    this.debug = debug

    this.initializeMiddlewares()
    this.initializeRoutes()
  }

  public getServer() {
    return this.app
  }

  private initializeRoutes() {
    this.app.get('/', c => c.json({ message: 'ok' }))
    this.routes.forEach(route => {
      this.app.route(route.path, route.getRouter())
    })
  }

  private initializeMiddlewares() {
    this.app.use('*', logger())
    this.app.onError((err, c) => {
      console.error(err)
      return c.json({ message: err.message }, 500)
    })
  }
}
