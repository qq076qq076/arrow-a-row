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
  await expect(page.getByText(/2 箭｜晶塵/)).toBeVisible({ timeout: 5000 });
});

test('桌機滑鼠拖曳可控制角色選取左側 Gate', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: '開始第一章' }).click();
  await page.mouse.move(1100, 500);
  await page.mouse.down();
  await page.mouse.move(20, 500);
  await page.mouse.up();

  await expect(page.getByText(/2 箭｜晶塵/)).toBeVisible({ timeout: 5000 });
});
