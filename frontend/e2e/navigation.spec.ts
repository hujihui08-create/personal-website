import { test, expect } from '@playwright/test'

test.describe('Page navigation', () => {
  test('navigate to home page (/)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify the URL is correct
    await expect(page).toHaveURL('/')

    // Verify the page rendered without crashing - main content area exists
    await expect(page.locator('#main-content')).toBeAttached()

    // Verify no fatal error messages are shown
    await expect(page.getByText(/页面加载失败/i)).toHaveCount(0)
  })

  test('navigate to projects page (/projects)', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/projects')
    await expect(page.locator('#main-content')).toBeAttached()
    await expect(page.getByText(/页面加载失败/i)).toHaveCount(0)
  })

  test('navigate to booking page (/booking)', async ({ page }) => {
    await page.goto('/booking')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/booking')
    await expect(page.locator('#main-content')).toBeAttached()
    await expect(page.getByText(/页面加载失败/i)).toHaveCount(0)
  })

  test('navigate to agent page (/agent)', async ({ page }) => {
    await page.goto('/agent')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/agent')
    await expect(page.locator('#main-content')).toBeAttached()
    await expect(page.getByText(/页面加载失败/i)).toHaveCount(0)
  })

  test('navigate to admin login page (/admin/login)', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/admin/login')

    // Verify the login form is rendered
    await expect(page.locator('#password')).toBeAttached()
    await expect(page.getByRole('button', { name: /登录/i })).toBeAttached()
  })
})
