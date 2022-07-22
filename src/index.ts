import { Hono } from 'hono'
import { logger } from 'hono/logger'
import searchRoute from '#routes/search'

const app = new Hono()

app.use('*', logger())
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ message: err.message }, 500)
})
app.get('/', c => c.json({ message: 'OK' }))
app.route('/search', searchRoute)

export default {
  port: 3000,
  fetch: app.fetch
}
