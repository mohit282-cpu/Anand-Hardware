# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Anand Hardware Public Storefront & Admin E2E Suite >> Public Products Catalog & Search
- Location: tests\e2e\app.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder*="Search"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('input[placeholder*="Search"]') with timeout 5000ms
  - waiting for locator('input[placeholder*="Search"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Anand Hardware Public Storefront & Admin E2E Suite', () => {
  4  |   test('Public Homepage loads successfully', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page).toHaveTitle(/Anand Hardware/i);
  7  |     await expect(page.locator('h1')).toBeVisible();
  8  |   });
  9  | 
  10 |   test('Public Products Catalog & Search', async ({ page }) => {
  11 |     await page.goto('/products');
> 12 |     await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  13 |     await page.fill('input[placeholder*="Search"]', 'Cement');
  14 |     await expect(page).toHaveURL(/\/products/);
  15 |   });
  16 | 
  17 |   test('Admin Login Route Protection', async ({ page }) => {
  18 |     await page.goto('/admin/dashboard');
  19 |     // Expect unauthenticated request to redirect to /admin/login or render login card
  20 |     await expect(page).toHaveURL(/admin/);
  21 |   });
  22 | 
  23 |   test('Admin Credit Management Page rendering', async ({ page }) => {
  24 |     await page.goto('/admin/credit');
  25 |     await expect(page.locator('h1')).toContainText('Credit');
  26 |   });
  27 | 
  28 |   test('Admin Payments Log Page rendering', async ({ page }) => {
  29 |     await page.goto('/admin/payments');
  30 |     await expect(page.locator('h1')).toContainText('Payment');
  31 |   });
  32 | });
  33 | 
```