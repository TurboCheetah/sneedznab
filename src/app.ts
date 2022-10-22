import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ICache } from '#interfaces/cache'
import { IProvider } from '#interfaces/provider'
import { IRoute } from '#interfaces/route'
import { ApiRoute } from '#routes/api'

export class App {
  public app: Hono
  constructor(
    public cache: ICache,
    public providers: IProvider[],
    public routes: IRoute[]
  ) {
    this.app = new Hono()
    this.cache = cache
    this.providers = providers
    this.routes = routes

    this.initializeMiddlewares()
    this.initializeRoutes()
  }

  public getServer() {
    return this.app
  }

  private initializeRoutes() {
    this.app.get('/', c => c.json({ message: 'OK' }))
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
