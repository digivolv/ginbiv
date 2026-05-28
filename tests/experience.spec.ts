import { test, expect } from '@playwright/test'

// All tests assume the app is served at baseURL (see playwright.config.ts)

test.describe('Application loading', () => {
  test('loads without uncaught page errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.waitForTimeout(3000)

    expect(errors).toHaveLength(0)
  })

  test('experience container is present in the DOM', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#experience')).toBeAttached()
  })

  test('canvas element is rendered', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('canvas', { timeout: 8000 })
    await expect(page.locator('canvas')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for loading screen to clear
    await page.waitForSelector('[data-testid="navigation"]', { timeout: 10000 })
  })

  test('all four destination labels are visible', async ({ page }) => {
    const nav = page.locator('[data-testid="navigation"]')
    await expect(nav.getByText('INDEX')).toBeVisible()
    await expect(nav.getByText('WORK')).toBeVisible()
    await expect(nav.getByText('ABOUT')).toBeVisible()
    await expect(nav.getByText('CONTACT')).toBeVisible()
  })

  test('INDEX is the initial active destination', async ({ page }) => {
    const indexBtn = page.locator('button[data-destination="INDEX"]')
    await expect(indexBtn).toHaveAttribute('aria-current', 'page')
  })

  test('clicking WORK sets it active and clears INDEX', async ({ page }) => {
    await page.click('button[data-destination="WORK"]')
    await expect(page.locator('button[data-destination="WORK"]')).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('button[data-destination="INDEX"]')).not.toHaveAttribute('aria-current')
  })

  test('clicking ABOUT sets it active', async ({ page }) => {
    await page.click('button[data-destination="ABOUT"]')
    await expect(page.locator('button[data-destination="ABOUT"]')).toHaveAttribute('aria-current', 'page')
  })

  test('clicking CONTACT sets it active', async ({ page }) => {
    await page.click('button[data-destination="CONTACT"]')
    await expect(page.locator('button[data-destination="CONTACT"]')).toHaveAttribute('aria-current', 'page')
  })

  test('keyboard activation changes active state', async ({ page }) => {
    // Tab to WORK button and activate with Enter
    await page.locator('button[data-destination="WORK"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('button[data-destination="WORK"]')).toHaveAttribute('aria-current', 'page')
  })

  test('keyboard activation with Space changes active state', async ({ page }) => {
    await page.locator('button[data-destination="ABOUT"]').focus()
    await page.keyboard.press('Space')
    await expect(page.locator('button[data-destination="ABOUT"]')).toHaveAttribute('aria-current', 'page')
  })

  test('rapid destination switching does not trigger uncaught errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    const destinations = ['WORK', 'ABOUT', 'CONTACT', 'INDEX', 'WORK', 'INDEX'] as const
    for (const dest of destinations) {
      await page.click(`button[data-destination="${dest}"]`)
      await page.waitForTimeout(80)
    }

    await page.waitForTimeout(500)
    expect(errors).toHaveLength(0)

    // Final state should reflect last clicked
    await expect(page.locator('button[data-destination="INDEX"]')).toHaveAttribute('aria-current', 'page')
  })

  test('clicking the already-active destination does not break state', async ({ page }) => {
    await expect(page.locator('button[data-destination="INDEX"]')).toHaveAttribute('aria-current', 'page')
    await page.click('button[data-destination="INDEX"]')
    await expect(page.locator('button[data-destination="INDEX"]')).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('Responsive layout', () => {
  test('no horizontal overflow at 390×844 (iPhone 14)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForSelector('[data-testid="navigation"]', { timeout: 10000 })

    const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(docScrollWidth).toBeLessThanOrEqual(viewportWidth)
  })

  test('no horizontal overflow at 360×800', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')
    await page.waitForSelector('[data-testid="navigation"]', { timeout: 10000 })

    const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(docScrollWidth).toBeLessThanOrEqual(viewportWidth)
  })

  test('no unintended document scroll at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForSelector('[data-testid="navigation"]', { timeout: 10000 })

    const docScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    expect(docScrollHeight).toBeLessThanOrEqual(viewportHeight + 2)
  })
})

test.describe('Reduced motion', () => {
  test('navigation remains functional with reduced motion emulated', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForSelector('[data-testid="navigation"]', { timeout: 10000 })

    await page.click('button[data-destination="WORK"]')
    await expect(page.locator('button[data-destination="WORK"]')).toHaveAttribute('aria-current', 'page')

    await page.click('button[data-destination="CONTACT"]')
    await expect(page.locator('button[data-destination="CONTACT"]')).toHaveAttribute('aria-current', 'page')
  })

  test('no uncaught errors with reduced motion', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForSelector('[data-testid="navigation"]', { timeout: 10000 })
    await page.click('button[data-destination="ABOUT"]')
    await page.waitForTimeout(200)

    expect(errors).toHaveLength(0)
  })
})
