import { test as base, Page } from '@playwright/test';

// ── Test credentials (update if different) ────────────────────────────────
const TEST_ADMIN = {
    email: 'admin@ttesol.com',
    password: 'admin123',
};
const TEST_USER = {
    email: 'admin@ttesol.com',
    password: 'password123',
};

// ── Extended fixture types ────────────────────────────────────────────────
type TteFixtures = {
    /** Page navigated to the public landing */
    landingPage: Page;
    /** Page logged in as admin */
    adminPage: Page;
    /** Page logged in as regular user, on the Library screen */
    libraryPage: Page;
    /** Page logged in as regular user, inside the BookReader */
    bookReaderPage: Page;
};

// ── Authentication helper ─────────────────────────────────────────────────
async function login(page: Page, email: string, password: string) {
    await page.goto('/');
    // Dismiss promo popup if present (it appears on first load when banners exist)
    const promoClose = page.locator('[data-testid="close-promo"]');
    if (await promoClose.isVisible({ timeout: 2000 }).catch(() => false)) {
        await promoClose.click();
        await page.waitForTimeout(400);
    }
    // Click login button — prefer data-testid, fallback to aria-label/text
    const loginBtn = page.locator('[data-testid="login-cta-nav"], [data-testid="login-cta-hero"]').first();
    const hasDTI = await loginBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasDTI) {
        await loginBtn.click();
    } else {
        const fallback = page.getByRole('button', { name: /login|acceder|entrar|platform|access/i }).first();
        if (await fallback.isVisible({ timeout: 3000 }).catch(() => false)) await fallback.click();
    }
    await page.waitForTimeout(500);
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.getByRole('button', { name: /sign in|login|ingresar|entrar/i }).last().click();
    // Wait for dashboard/library to appear
    await page.waitForURL(/\/|dashboard|library|biblioteca/i, { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(800);
}

// ── Fixtures ──────────────────────────────────────────────────────────────
export const test = base.extend<TteFixtures>({
    landingPage: async ({ page }, use) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(600);
        await use(page);
    },

    adminPage: async ({ page }, use) => {
        await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
        await use(page);
    },

    libraryPage: async ({ page }, use) => {
        await login(page, TEST_USER.email, TEST_USER.password);
        // Wait for library to appear
        await page.waitForSelector('[data-testid="library"], [class*="Library"], [class*="library"], h1', { timeout: 8_000 }).catch(() => {});
        await page.waitForTimeout(600);
        await use(page);
    },

    bookReaderPage: async ({ page }, use) => {
        await login(page, TEST_USER.email, TEST_USER.password);
        // Click the first book available
        const firstBook = page.locator('[data-testid="book-card"], [class*="book"], button').filter({ hasText: /read|leer|abrir|open/i }).first();
        if (await firstBook.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await firstBook.click();
        } else {
            // Fallback: look for any clickable book item
            const anyBook = page.locator('img[alt*="book"], img[alt*="libro"], [class*="BookCard"], [class*="book-card"]').first();
            if (await anyBook.isVisible({ timeout: 3_000 }).catch(() => false)) {
                await anyBook.click();
            }
        }
        await page.waitForTimeout(1200);
        await use(page);
    },
});

export { expect } from '@playwright/test';
export type { Page };
