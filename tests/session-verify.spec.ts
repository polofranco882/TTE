import { test, expect } from '@playwright/test';

test.describe('Session Session Reuse', () => {
    test('should be logged in and see dashboard', async ({ page }) => {
        await page.goto('/');
        
        // Wait for stability
        await page.waitForTimeout(1000);

        // Check if we are on a post-login page or if sidebar is visible
        const sidebar = page.locator('[data-testid="sidebar"], [class*="sidebar"], [class*="Sidebar"]').first();
        const isVisible = await sidebar.isVisible({ timeout: 10000 }).catch(() => false);
        
        expect(isVisible, 'Sidebar should be visible if session is reused').toBe(true);
        
        const currentUrl = page.url();
        console.log(`Current URL after session reuse check: ${currentUrl}`);
    });
});
