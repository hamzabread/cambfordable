import { defineConfig, devices } from "@playwright/test";

const API_PORT = 8010;
const WEB_PORT = 3100;
const API_URL = `http://localhost:${API_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const CI = Boolean(process.env.CI);

// The backend's virtualenv locally; CI puts its Python on PATH.
const python = process.env.E2E_PYTHON || (process.platform === "win32" ? "../backend/.venv/Scripts/python.exe" : "python");

export default defineConfig({
  testDir: "./e2e",
  // The tests share one seeded database and change it (a quiz gets submitted,
  // a payment approved), so they run one at a time.
  workers: 1,
  fullyParallel: false,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // Locally, the installed Chrome saves downloading Playwright's browser.
      use: { ...devices["Desktop Chrome"], channel: CI ? undefined : "chrome" },
    },
  ],
  webServer: [
    {
      // Seeds a fresh throwaway database on every start.
      command: `"${python}" ../backend/tests/e2e_server.py --port ${API_PORT} --frontend ${WEB_URL}`,
      url: `${API_URL}/`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm run build && npx next start -p ${WEB_PORT}`,
      url: WEB_URL,
      reuseExistingServer: !CI,
      timeout: 300_000,
      env: { NEXT_PUBLIC_API_URL: API_URL, NEXT_DIST_DIR: ".next-e2e" },
    },
  ],
});
