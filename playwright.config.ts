import { defineConfig, devices } from "@playwright/test";
const baseURL=process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
export default defineConfig({
  testDir:"./e2e", timeout:240_000, expect:{timeout:20_000}, workers:1, fullyParallel:false,
  forbidOnly:!!process.env.CI, retries:process.env.CI ? 1 : 0,
  reporter:[["list"],["html",{open:"never"}]],
  use:{baseURL,ignoreHTTPSErrors:process.env.E2E_IGNORE_HTTPS_ERRORS === "1",trace:"retain-on-failure",screenshot:"only-on-failure",actionTimeout:20_000,navigationTimeout:60_000},
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}],
  webServer:process.env.E2E_START_SERVER === "0" ? undefined : {
    command:"npm run dev -- --hostname 127.0.0.1 --port 3100",url:baseURL,reuseExistingServer:!process.env.CI,timeout:120_000,
    env:{BACKEND_API_URL:process.env.E2E_BACKEND_URL || "http://127.0.0.1:18081",APP_ORIGIN:baseURL},
  },
});
