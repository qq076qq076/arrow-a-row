import { expect, test } from '@playwright/test';

test('顯示第一章主選單與主要開始按鈕', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Arrow a Row' })).toBeVisible();
  await expect(page.getByRole('button', { name: '開始第一章' })).toBeVisible();
});

test('可開始第一章 Run 並選取左側第一個 Gate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '開始第一章' }).click();
  await page.locator('.game-canvas').dispatchEvent('pointermove', {
    clientX: 8,
    clientY: 700,
    pointerId: 1,
    pointerType: 'touch',
  });

  await expect(page.getByText('HP 100 / 100')).toBeVisible();
  await expect(page.getByText('2 箭', { exact: true })).toBeVisible({ timeout: 5000 });
});
