import { defineConfig, devices } from '@playwright/test';

/**
 * TTESOL Playwright Configuration
 * iOS/Mobile compatibility testing from Windows using WebKit
 * 
 * Base URL: http://localhost:5173 (Vite dev server)
 * API:      http://localhost:3002
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: false,        // sequential for stability on low-end hardware
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : 2,
    timeout: 45_000,             // 45s per test — network can be slow
    expect: {
        timeout: 10_000,
        toHaveScreenshot: { maxDiffPixels: 150 },
    },

    /* Reporting */
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
        ['json', { outputFile: 'playwright-report/results.json' }],
    ],

    /* Shared settings */
    use: {
        baseURL: 'http://localhost:3002',
        storageState: 'playwright/.auth/user.json',
        screenshot: 'on',
        video: 'on-first-retry',
        trace: 'on',
        ignoreHTTPSErrors: true,
        actionTimeout: 15_000,
    },

    /* ────────────────────────────────────────────────────────────────
     * Projects — one per device class
     * ──────────────────────────────────────────────────────────────── */
    projects: [

        /* ── Setup ────────────────────────────────────────────────── */
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
            use: {
                storageState: { cookies: [], origins: [] }, // Start fresh for login
            },
        },

        /* ── Desktop ─────────────────────────────────────────────── */
        {
            name: 'desktop-chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
            },
            dependencies: ['setup'],
        },
        {
            name: 'desktop-webkit',
            use: {
                ...devices['Desktop Safari'],
                viewport: { width: 1440, height: 900 },
            },
            dependencies: ['setup'],
        },

        /* ── Mobile WebKit — simulates Mobile Safari / iOS ─────── */
        {
            name: 'mobile-iphone-14',
            use: {
                ...devices['iPhone 14'],           // 390×844, deviceScaleFactor:3
                browserName: 'webkit',
                hasTouch: true,
            },
            dependencies: ['setup'],
        },
        {
            name: 'mobile-iphone-se',
            use: {
                ...devices['iPhone SE'],           // 375×667, small screen
                browserName: 'webkit',
                hasTouch: true,
            },
            dependencies: ['setup'],
        },
        {
            name: 'mobile-iphone-14-landscape',
            use: {
                ...devices['iPhone 14 landscape'],
                browserName: 'webkit',
                hasTouch: true,
            },
            dependencies: ['setup'],
        },

        /* ── Tablet WebKit — simulates iPad ─────────────────────── */
        {
            name: 'tablet-ipad',
            use: {
                ...devices['iPad (gen 7)'],        // 810×1080
                browserName: 'webkit',
                hasTouch: true,
            },
            dependencies: ['setup'],
        },
        {
            name: 'tablet-ipad-landscape',
            use: {
                ...devices['iPad (gen 7) landscape'],
                browserName: 'webkit',
                hasTouch: true,
            },
            dependencies: ['setup'],
        },

        /* ── Android / Chrome mobile (optional comparison) ──────── */
        {
            name: 'mobile-android',
            use: {
                ...devices['Pixel 5'],             // 393×851
                browserName: 'chromium',
                hasTouch: true,
            },
            dependencies: ['setup'],
        },
    ],

    /* Start frontend dev server automatically if not running */
    webServer: {
        command: 'npm run dev',
        cwd: './frontend',
        url: 'http://localhost:3002',
        reuseExistingServer: true,
        timeout: 60_000,
    },
});
