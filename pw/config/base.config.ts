import { defineConfig, devices } from '@playwright/test'

export const baseConfig = defineConfig({
    use: {
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']}
        }
    ],
    reporter: 'html',
    retries: process.env.CI ? 3 : 2,
    workers: process.env.CI ? 1 : undefined,
    forbidOnly: !!process.env.CI,
    fullyParallel: true,
    testMatch: '**/*.spec.ts',
    testDir: '../e2e'
})