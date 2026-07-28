import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4187', trace: 'on-first-retry' },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4187', port: 4187, reuseExistingServer: false },
});
