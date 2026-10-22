import { defineConfig, devices } from '@playwright/test'

// Runs against the production build (`npm run build` first). Uses the locally
// installed Microsoft Edge or Chrome, so no browser download is needed; set
// PW_CHANNEL=chromium after `npx playwright install chromium` to use the bundled one.
const channel = process.env.PW_CHANNEL ?? 'msedge'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: channel === 'chromium' ? undefined : channel,
    acceptDownloads: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: channel === 'chromium' ? undefined : channel } },
  ],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
