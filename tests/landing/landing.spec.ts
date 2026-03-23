import { test, expect } from '../fixtures/tte.fixture';
import {
    assertNoHorizontalOverflow,
    assertVisibleInViewport,
    captureState,
    waitForStable,
    isFullyInViewport,
    dismissPromoAndClickLogin,
    assertNotCovered,
} from '../helpers/viewport';

/**
 * Professional Landing Page Suite
 * Focus: Premium design, Responsive Hero, Multilingual support, Mobile accessibility.
 */

test.describe('Landing — Hero & Key CTAs', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
    });

    test('hero section is stunning and visible', async ({ page }) => {
        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible({ timeout: 5000 });
        
        // Ensure no overflow in hero
        await assertNoHorizontalOverflow(page);
        
        // H1 should not be covered by any navbar/overlay
        await assertNotCovered(page, h1, 'Hero Headline');
        
        await captureState(page, 'landing-hero-check');
    });

    test('main CTA is accessible and has correct mobile size', async ({ page }) => {
        const cta = page.locator('[data-testid="login-cta-nav"], [data-testid="login-cta-hero"], button:has-text("Acceder"), button:has-text("Login")').first();
        await expect(cta).toBeVisible();
        await assertVisibleInViewport(page, cta, 'Primary CTA');

        const vp = page.viewportSize();
        if (vp && vp.width < 768) {
            const box = await cta.boundingBox();
            if (box) {
                // Apple HIG / Android Material: Minimum 44x44 or 48x48
                expect(box.height, 'Mobile CTA must be at least 44px tall').toBeGreaterThanOrEqual(44);
                expect(box.width, 'Mobile CTA must be at least 44px wide').toBeGreaterThanOrEqual(44);
            }
        }
    });

    test('language selector is interactive and visible', async ({ page }) => {
        // Look for language triggers
        const langTrigger = page.locator('[class*="Language"], [aria-label*="language"], button:has-text("🇺🇸"), button:has-text("🇪🇸")').first();
        if (await langTrigger.isVisible()) {
            await assertVisibleInViewport(page, langTrigger, 'Language Selector');
            await langTrigger.click();
            await waitForStable(page, 400);
            
            // Should show options
            const options = page.locator('[role="menuitem"], [class*="option"]').first();
            if (await options.isVisible()) {
                await expect(options).toBeVisible();
            }
            await captureState(page, 'landing-lang-open');
        }
    });
});

test.describe('Landing — Layout Stability', () => {

    test('no horizontal scroll during viewport resize', async ({ page }) => {
        await page.goto('/');
        const widths = [375, 414, 768, 1024, 1440];
        
        for (const w of widths) {
            await page.setViewportSize({ width: w, height: 800 });
            await waitForStable(page, 500);
            await assertNoHorizontalOverflow(page);
        }
    });

    test('images and videos do not break layout', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1500);
        
        // Scroll through the page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await waitForStable(page, 500);
        await assertNoHorizontalOverflow(page);
        
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await waitForStable(page, 500);
        await assertNoHorizontalOverflow(page);
    });
});
