import { expect, test, type Page } from '@playwright/test'

async function openSidebar(page: Page) {
  const trigger = page.getByRole('button', { name: 'Show project sidebar', exact: true })
  if (await trigger.isVisible()) await trigger.click()
  await expect(page.locator('.project-panel')).toBeVisible()
}
async function chooseFilter(page: Page, group: string, value: string) {
  await page.getByRole('button', { name: 'Filter projects', exact: true }).click()
  await page.getByRole('menuitem', { name: new RegExp(`^${group}`) }).click()
  await page.getByRole('menuitemradio', { name: value, exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  // Keep interface tests independent of whether the user's local token is set.
  await page.route('**/api/config', route => route.fulfill({ contentType: 'application/json', body: '{"mapboxToken":""}' }))
})

test('consolidated sidebar contains branding and totals, with one combined filter menu', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await openSidebar(page)
  await expect(page.locator('.project-panel .brand')).toHaveText('roads.walt.online')
  await expect(page.locator('.project-panel .metrics')).toBeVisible()
  await expect(page.locator('.app-shell > header')).toHaveCount(0)
  await expect(page.locator('.project-row')).toHaveCount(35)
  await expect(page.locator('.detail-shell')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Filter projects', exact: true })).toHaveCount(1)
  await chooseFilter(page, 'Programme', 'National significance')
  await expect(page.locator('.project-row')).toHaveCount(13)
  await chooseFilter(page, 'Programme', 'All projects')
  await chooseFilter(page, 'Status', 'Completed')
  await expect(page.locator('.project-row')).toHaveCount(2)
  await chooseFilter(page, 'Island', 'South Island')
  await expect(page.locator('.project-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear all filters', exact: true }).click()
  await page.getByRole('textbox', { name: 'Search projects' }).fill('whangarei')
  await expect(page.locator('.project-row')).toHaveCount(2)
  await page.getByRole('textbox', { name: 'Search projects' }).fill('not a real project')
  await expect(page.getByRole('heading', { name: 'No matching projects' })).toBeVisible()
  await expect(page.locator('.road-detail')).toHaveCount(0)
  await page.locator('.empty-state').getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.locator('.project-row')).toHaveCount(35)
  expect(errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('selecting a card exchanges panels and Back preserves filters, scroll, and focus', async ({ page }) => {
  await page.goto('/')
  await openSidebar(page)
  await chooseFilter(page, 'Programme', 'Regional significance')
  await page.getByRole('textbox', { name: 'Search projects' }).fill('')
  const project = page.locator('.project-row').filter({ hasText: 'Queenstown upgrade package' })
  await project.scrollIntoViewIfNeeded()
  const position = await page.locator('.project-list').evaluate(element => element.scrollTop)
  const count = await page.locator('.project-row').count()
  await project.click()
  await expect(page.locator('.project-panel')).toBeHidden()
  await expect(page.locator('.project-panel')).toHaveAttribute('inert', '')
  await expect(page.locator('.road-detail h2')).toBeVisible()
  await expect(page.locator('.road-detail h2')).toHaveText('Queenstown upgrade package')
  const inset = page.viewportSize()!.width <= 760 ? 12 : 20
  await expect.poll(async () => (await page.locator('.detail-shell').boundingBox())!.x).toBe(inset)
  expect((await page.locator('.detail-shell').boundingBox())!.y).toBe(inset)
  await expect(page.getByRole('button', { name: 'Back to projects' })).toBeFocused()
  await page.getByRole('button', { name: 'Back to projects' }).click()
  await expect(page.locator('.detail-shell')).toBeHidden()
  await expect(page.locator('.project-panel')).toBeVisible()
  await expect(page.locator('.project-row')).toHaveCount(count)
  await expect(page.locator('.active-filter-summary')).toContainText('Regional')
  await expect(project).toBeFocused()
  expect(await page.locator('.project-list').evaluate(element => element.scrollTop)).toBe(position)
  // Repeat with keyboard activation, including the same selected card.
  await project.press('Enter')
  await expect(page.locator('.road-detail h2')).toBeVisible()
  await page.getByRole('button', { name: 'Back to projects' }).click()
  await expect(project).toBeFocused()
})

test('fullscreen Mapbox waiting state and methodology remain accessible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your Mapbox map goes here' })).toBeVisible()
  await expect(page.locator('.overview-map')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toBeDisabled()
  const viewport = page.viewportSize()!
  expect(await page.locator('.map-panel').boundingBox()).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height })
  await openSidebar(page)
  await page.getByRole('button', { name: 'Methodology', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Behind the numbers' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Methodology', exact: true })).toBeFocused()
})

test('reduced motion disables panel animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await openSidebar(page)
  await page.locator('.project-row').first().click()
  await expect(page.locator('.road-detail h2')).toBeVisible()
  const transition = await page.locator('.detail-shell').evaluate(element => ({ duration: getComputedStyle(element).transitionDuration, delay: getComputedStyle(element).transitionDelay }))
  expect(transition.delay).toBe('0s')
  expect(parseFloat(transition.duration)).toBeLessThan(.01)
})
