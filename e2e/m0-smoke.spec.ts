import { expect, test } from '@playwright/test';

test('顯示第一章主選單與主要開始按鈕', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Arrow a Row' })).toBeVisible();
  await expect(page.getByRole('button', { name: '開始 晨線草原' })).toBeVisible();
});

test('可開始第一章 Run 並選取左側第一個 Gate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '開始 晨線草原' }).click();
  await page.locator('.game-canvas').dispatchEvent('pointermove', {
    clientX: 8,
    clientY: 700,
    pointerId: 1,
    pointerType: 'touch',
  });

  await expect(page.getByText(/晨線草原｜HP 100 \/ 100/)).toBeVisible();
  await expect(page.getByLabel('目前 Build')).toBeVisible();
  await expect(page.getByText('箭矢只往正前方射出，拖曳角色對準敵人。')).toBeVisible();
  await expect(page.getByText(/箭｜晶塵/)).toBeVisible({ timeout: 5000 });
});

test('桌機滑鼠拖曳可控制角色選取左側 Gate', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: '開始 晨線草原' }).click();
  await page.mouse.move(1100, 500);
  await page.mouse.down();
  await page.mouse.move(20, 500);
  await page.mouse.up();

  await expect(page.getByText(/箭｜晶塵/)).toBeVisible({ timeout: 5000 });
});

test('手機主選單可切換標準與省電畫質', async ({ page }) => {
  await page.goto('/');
  const quality = page.getByLabel('畫質設定');
  await quality.getByRole('button', { name: '省電 30 FPS' }).click();
  await expect(quality.getByRole('button', { name: '省電 30 FPS' })).toHaveClass(/selected/);
  await quality.getByRole('button', { name: '標準 60 FPS' }).click();
  await expect(quality.getByRole('button', { name: '標準 60 FPS' })).toHaveClass(/selected/);
});

test('Run 可由暫停鍵與 Esc 暫停及繼續', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '開始 晨線草原' }).click();
  await page.getByRole('button', { name: '暫停遊戲' }).click();
  await expect(page.getByLabel('遊戲已暫停')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('遊戲已暫停')).toBeHidden();
  await expect(page.getByRole('button', { name: '暫停遊戲' })).toBeVisible();
});
