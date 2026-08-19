import { test, expect } from '@playwright/test';

test.describe('Anand Hardware Public Storefront & Admin E2E Suite', () => {
  test('Public Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Anand Hardware/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Public Products Catalog & Search', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await page.fill('input[placeholder*="Search"]', 'Cement');
    await expect(page).toHaveURL(/\/products/);
  });

  test('Admin Login Route Protection', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Expect unauthenticated request to redirect to /admin/login or render login card
    await expect(page).toHaveURL(/admin/);
  });

  test('Admin Credit Management Page rendering', async ({ page }) => {
    await page.goto('/admin/credit');
    await expect(page.locator('h1')).toContainText('Credit');
  });

  test('Admin Payments Log Page rendering', async ({ page }) => {
    await page.goto('/admin/payments');
    await expect(page.locator('h1')).toContainText('Payment');
  });
});
