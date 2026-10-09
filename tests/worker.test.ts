import assert from 'node:assert/strict'
import { test } from 'node:test'
import worker from '../worker/index.ts'

const assets = { fetch: async () => new Response('asset') }
const request = () => new Request('https://roads.walt.online/api/config')

test('runtime config reads public Mapbox tokens and remains usable without one', async () => {
  const configured = await worker.fetch(request(), { ASSETS: assets, MAPBOX_TOKEN: 'pk.test-public' })
  assert.deepEqual(await configured.json(), { mapboxToken: 'pk.test-public' })
  assert.equal(configured.headers.get('Cache-Control'), 'no-store')
  const empty = await worker.fetch(request(), { ASSETS: assets })
  assert.deepEqual(await empty.json(), { mapboxToken: '' })
})
test('secret tokens are never exposed by the browser config endpoint', async () => {
  const result = await worker.fetch(request(), { ASSETS: assets, MAPBOX_TOKEN: 'sk.test-secret' })
  assert.equal(result.status, 500)
  assert.ok(!(await result.text()).includes('sk.test-secret'))
})
test('API routes do not fall through to the SPA and assets remain accessible', async () => {
  assert.equal((await worker.fetch(new Request('https://roads.walt.online/api/unknown'), { ASSETS: assets })).status, 404)
  assert.equal((await worker.fetch(new Request('https://roads.walt.online/api/config', { method: 'POST' }), { ASSETS: assets })).status, 405)
  assert.equal(await (await worker.fetch(new Request('https://roads.walt.online/'), { ASSETS: assets })).text(), 'asset')
})
