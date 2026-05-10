import { test, expect } from '@playwright/test'

test.describe('Protected route guard', () => {
  const protectedRoutes = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/profile', label: 'Profile Edit' },
    { path: '/admin/experiences', label: 'Experience Manage' },
    { path: '/admin/projects', label: 'Project Manage' },
    { path: '/admin/bookings', label: 'Booking Manage' },
    { path: '/admin/schedule', label: 'Schedule Manage' },
    { path: '/admin/notifications', label: 'Notification Manage' },
    { path: '/admin/knowledge', label: 'Knowledge Manage' },
    { path: '/admin/settings', label: 'Settings' },
  ]

  for (const route of protectedRoutes) {
    test(`redirects unauthenticated user from ${route.label} (${route.path}) to /admin/login`, async ({ page }) => {
      // Clear any existing auth state before navigating
      await page.goto('/admin/login')
      await page.evaluate(() => localStorage.removeItem('auth-storage'))
      await page.goto('/admin/login')
      await page.waitForLoadState('networkidle')

      // Now navigate to the protected route
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')

      // Verify we are redirected to /admin/login
      await expect(page).toHaveURL(/\/admin\/login/)

      // Verify the login form is visible
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.getByRole('button', { name: /登录/i })).toBeVisible()
    })
  }

  test('does not redirect when already authenticated', async ({ page }) => {
    // Simulate an authenticated state by setting auth data in localStorage
    // This matches the zustand persist configuration (name: 'auth-storage')
    await page.goto('/admin/login')
    await page.evaluate(() => {
      const authData = {
        state: {
          token: 'test-token',
          user: { id: 1, name: 'Admin', email: '' },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem('auth-storage', JSON.stringify(authData))
    })

    // Navigate to a protected route
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // Verify we stay on the dashboard (not redirected to login)
    // Note: The dashboard page may still have API failures since the token is fake,
    // but the route guard should allow access
    expect(page.url()).toContain('/admin/dashboard')
  })
})
