import { Hono } from 'hono'

export interface IRoute {
  path: string
  router: Hono
  getRouter(): Hono
}
