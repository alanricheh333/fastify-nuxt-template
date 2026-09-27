import { expect, test } from '@playwright/test'

test('loads the template home page', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Nuxt + Fastify product starter' }),
  ).toBeVisible()
})
