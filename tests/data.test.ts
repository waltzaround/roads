import assert from 'node:assert/strict'
import { test } from 'node:test'
import { roads, summarise, defaultFilters, filterRoads, money } from '../src/lib/roads.ts'

test('preserves 35 supplied entries and excludes 3 overlaps from aggregate metrics', () => {
  assert.equal(roads.length, 35)
  assert.equal(summarise(roads).count, 32)
  const overlap = roads.find(r => r.name === 'Woodend Bypass')!
  const without = summarise(roads.filter(r => r.id !== overlap.id))
  assert.deepEqual(summarise(roads), without)
})
test('blended rate includes costs only for projects with comparable lengths', () => {
  const comparable = roads.filter(r => !r.excludeFromTotals && r.km != null && r.cost != null)
  const expected = comparable.reduce((sum, r) => sum + r.cost!, 0) * 1000 / comparable.reduce((sum, r) => sum + r.km!, 0)
  assert.equal(summarise(roads).rate, expected)
  assert.equal(summarise([]).rate, null)
})
test('search handles Māori macrons and filters compose without mutating source data', () => {
  const before = roads.map(r => r.id)
  const result = filterRoads(roads, { ...defaultFilters, query: 'whangarei', island: 'North' })
  assert.equal(result.length, 2)
  assert.ok(result.every(r => r.island === 'North'))
  assert.deepEqual(roads.map(r => r.id), before)
  assert.equal(filterRoads(roads, { ...defaultFilters, query: 'does not exist' }).length, 0)
})
test('unpublished values sort last and never become zero-dollar projects', () => {
  const list = filterRoads(roads, defaultFilters)
  assert.equal(list[0].name, 'Waihoehoe Road upgrade')
  assert.equal(list.at(-1)!.rate, null)
  assert.equal(money(null), 'Not published')
})

test('researched projects have distinct public references and scope notes for uncosted corridors', () => {
  for (const road of roads) {
    assert.ok(road.sources.length >= 2, road.name)
    assert.equal(new Set(road.sources.map(([, url]) => url)).size, road.sources.length, road.name)
    assert.ok(road.sources.some(([, url]) => new URL(url, "https://roads.walt.online").hostname === 'www.nzta.govt.nz'), road.name)
    for (const [, url] of road.sources) {
      assert.equal(new URL(url, "https://roads.walt.online").protocol, 'https:')
      assert.ok(!url.includes('utm_source='))
    }
    if (road.cost == null) {
      assert.ok(road.researchNote, road.name)
      assert.equal(road.rate, null, road.name)
    }
  }
})
