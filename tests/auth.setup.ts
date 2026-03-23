import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as user', async ({ page }) => {
    // Navigate to the app (using baseURL from config)
    await page.goto('/');

    // Professional muting of marketing popups for functional testing
    await page.addStyleTag({ content: '[data-testid="promo-popup"] { display: none !important; }' });
    
    // Reach Login Form
    console.log('Navigating to login form...');
    const loginBtn = page.locator('button[aria-label="Platform Login"], [data-testid="login-cta-nav"], [data-testid="login-cta-hero"]').first();
    await loginBtn.click({ timeout: 5000 }).catch(async () => {
        console.log('Primary login button click failed. Trying fallback...');
        await page.getByRole('button', { name: /login|acceder|entrar|platform|access/i }).first().click({ force: true });
    });

    await page.waitForTimeout(1000);

    // Use admin credentials (verified via subagent)
    const email = 'admin@ttesol.com';
    const password = 'password123';

    console.log(`Attempting login for ${email}...`);
    await page.fill('input[placeholder*="admin@ttesol.com"], input[type="email"], [data-testid="email-input"]', email);
    await page.fill('input[placeholder*="password123"], input[type="password"], [data-testid="password-input"]', password);
    await page.click('button:has-text("Iniciar Sesión"), button:has-text("Login"), button[type="submit"]');

    // Wait for successful login (The app uses state-based routing, URL stays at /)
    console.log('Waiting for sidebar elements to indicate successful login...');
    const logoutBtn = page.getByRole('button', { name: /cerrar sesión|logout/i }).first();
    const dashboardHeader = page.getByRole('heading', { name: /dashboard|panel|executive/i }).first();
    
    await expect(logoutBtn.or(dashboardHeader)).toBeVisible({ timeout: 20000 });
    console.log(`Login successful! Dashboard/Sidebar is visible. Current URL: ${page.url()}`);

    // Save storage state to a file
    await page.context().storageState({ path: authFile });
});
