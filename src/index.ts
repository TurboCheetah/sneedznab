import { Hono } from 'hono'
import { logger } from 'hono/logger'
import apiRoute from '#routes/api'

const app = new Hono()

app.use('*', logger())
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ message: err.message }, 500)
})
app.get('/', c => c.json({ message: 'OK' }))
app.route('/api', apiRoute)

export default {
  port: 3000,
  fetch: app.fetch
}
