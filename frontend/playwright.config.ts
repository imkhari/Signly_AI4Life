import { defineConfig, devices } from '@playwright/test';

const frontendOrigin = 'http://127.0.0.1:15173';
const backendOrigin = 'http://127.0.0.1:18080';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1024, height: 768 },
    baseURL: frontendOrigin,
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.SIGNLY_CHROMIUM_PATH,
    },
  },
  webServer: [
    {
      command: 'VITE_HTTPS=true npm run dev -- --host 127.0.0.1 --port 15443 --strictPort',
      env: { SIGNLY_BACKEND_ORIGIN: backendOrigin },
      url: 'https://127.0.0.1:15443',
      ignoreHTTPSErrors: true,
    },
    {
      command: 'ENV=demo LLM_PROVIDER=mock .venv/bin/uvicorn tests.e2e_toxic_app:app --host 127.0.0.1 --port 18081 --no-access-log --log-level warning',
      cwd: '../backend',
      url: 'http://127.0.0.1:18081/api/health',
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 15174 --strictPort',
      env: { SIGNLY_BACKEND_ORIGIN: 'http://127.0.0.1:18081' },
      url: 'http://127.0.0.1:15174',
    },
    {
      command: 'ENV=demo LLM_PROVIDER=mock .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 18080 --no-access-log --log-level warning',
      cwd: '../backend',
      url: `${backendOrigin}/api/health`,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 15173 --strictPort',
      env: { SIGNLY_BACKEND_ORIGIN: backendOrigin },
      url: frontendOrigin,
    },
  ],
});
