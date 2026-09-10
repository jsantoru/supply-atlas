import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : [
        {
          command:
            process.platform === 'win32'
              ? '.venv\\Scripts\\python -m uvicorn backend.main:app --port 8000'
              : 'python -m uvicorn backend.main:app --port 8000',
          url: 'http://127.0.0.1:8000/api/health',
          reuseExistingServer: !process.env.CI,
        },
        {
          command: 'npm run dev -- --port 5174 --strictPort',
          url: 'http://127.0.0.1:5174',
          reuseExistingServer: !process.env.CI,
        },
      ],
});
