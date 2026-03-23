import { test, expect } from '../fixtures/tte.fixture';
import {
    assertNoHorizontalOverflow,
    assertSidebarDoesNotCoverContent,
    assertVisibleInViewport,
    captureState,
    waitForStable,
    isFullyInViewport,
    dismissPromoAndClickLogin,
    assertNotCovered,
} from '../helpers/viewport';

/**
 * Professional Responsive Suite
 * Focus: Breakpoint consistency, Orientation reflow, Modal centering, Tap targets.
 */

test.describe('Responsive — Layout Consistency', () => {

    const devices = [
        { name: 'iPhone SE (Small)', w: 375, h: 667 },
        { name: 'iPhone 14 (Medium)', w: 390, h: 844 },
        { name: 'iPad Portrait', w: 768, h: 1024 },
        { name: 'iPad Landscape', w: 1024, h: 768 },
        { name: 'Desktop Baseline', w: 1440, h: 900 },
    ];

    for (const dev of devices) {
        test(`no horizontal overflow on ${dev.name}`, async ({ page }) => {
            await page.setViewportSize({ width: dev.w, height: dev.h });
            await page.goto('/');
            await waitForStable(page, 1000);
            await assertNoHorizontalOverflow(page);
            await captureState(page, `resp-overflow-${dev.name.replace(/\s/g, '-')}`);
        });
    }
});

test.describe('Responsive — Form & Modal Interaction', () => {

    test('login modal is centered and usable on small mobile', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 }); // Very small mobile
        await page.goto('/');
        await dismissPromoAndClickLogin(page);
        await waitForStable(page, 800);

        const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
        await expect(modal).toBeVisible();
        
        const box = await modal.boundingBox();
        if (box) {
            // Modal should be within viewport with a small margin
            expect(box.x).toBeGreaterThanOrEqual(-1);
            expect(box.x + box.width).toBeLessThanOrEqual(320 + 5);
            
            // Check submit button as tap target
            const submitBtn = modal.locator('button[type="submit"], button:has-text("Ingresar"), button:has-text("Login")').last();
            if (await submitBtn.isVisible()) {
                const btnBox = await submitBtn.boundingBox();
                if (btnBox) {
                    expect(btnBox.height).toBeGreaterThanOrEqual(40);
                }
            }
        }
        await captureState(page, 'mobile-small-login-modal');
    });

    test('inputs remain visible and accessible on mobile focus', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await dismissPromoAndClickLogin(page);
        await waitForStable(page, 800);

        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.isVisible()) {
            await emailInput.click();
            await waitForStable(page, 500); // Simulate keyboard opening
            
            // Input should still be visible (not pushed off screen)
            await assertVisibleInViewport(page, emailInput, 'Email Input on Focus');
            
            // Ensure no layout break
            await assertNoHorizontalOverflow(page);
        }
    });
});

test.describe('Responsive — Orientation Change', () => {

    test('seamless reflow from Portrait to Landscape', async ({ page }) => {
        // Start Portrait (iPhone 14)
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await waitForStable(page, 1000);
        await assertNoHorizontalOverflow(page);

        // Transition to Landscape
        await page.setViewportSize({ width: 844, height: 390 });
        await waitForStable(page, 1200);
        
        await assertNoHorizontalOverflow(page);
        
        // Navigation should still be functional
        const nav = page.locator('nav').first();
        if (await nav.isVisible()) {
            await assertVisibleInViewport(page, nav, 'Navbar Landscape');
        }
        
        await captureState(page, 'resp-orientation-reflow');
    });
});
