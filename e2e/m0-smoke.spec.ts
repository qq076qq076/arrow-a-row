import { expect, test } from '@playwright/test';

test('顯示主選單與主要開始按鈕', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Arrow a Row' })).toBeVisible();
  await expect(page.getByRole('button', { name: '開始新局' })).toBeVisible();
});
