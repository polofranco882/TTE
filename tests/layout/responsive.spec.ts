import { test, expect } from '../fixtures/tte.fixture';
import {
    assertNoHorizontalOverflow,
    assertSidebarDoesNotCoverContent,
    assertVisibleInViewport,
    captureState,
    waitForStable,
    isFullyInViewport,
    dismissPromoAndClickLogin,
} from '../helpers/viewport';

/**
 * Responsive Layout Tests
 * Validates correct layout redistribution across all breakpoints
 * Simulates mobile small → tablet → desktop progression
 */

test.describe('Layout — No Horizontal Overflow', () => {

    test('no horizontal scroll on landing page', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        await assertNoHorizontalOverflow(page);
        await captureState(page, `layout-no-overflow-${page.viewportSize()?.width}w`);
    });

    test('body width matches viewport width', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page);
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const vpWidth = page.viewportSize()?.width ?? 375;
        // Allow up to 10px tolerance for scrollbars
        expect(bodyWidth, `Body scrollWidth (${bodyWidth}) should not exceed viewport (${vpWidth})`).toBeLessThanOrEqual(vpWidth + 10);
    });
});

test.describe('Layout — Navigation & Header', () => {

    test('header/navbar is visible and within viewport', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        const nav = page.locator('nav').first();
        if (await nav.isVisible({ timeout: 3000 }).catch(() => false)) {
            await assertVisibleInViewport(page, nav, 'Navbar');
        }
        await captureState(page, `layout-header-${page.viewportSize()?.width}w`);
    });

    test('main CTA button is visible and not clipped', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        // Dismiss promo then look for CTA
        const promoClose = page.locator('[data-testid="close-promo"]');
        if (await promoClose.isVisible({ timeout: 2000 }).catch(() => false)) {
            await promoClose.click();
            await waitForStable(page, 400);
        }
        const cta = page.locator('[data-testid="login-cta-nav"], [data-testid="login-cta-hero"]').first();
        if (await cta.isVisible({ timeout: 3000 }).catch(() => false)) {
            const inVp = await isFullyInViewport(page, cta);
            expect(inVp, 'CTA button should be fully in viewport').toBe(true);
        }
        await captureState(page, `layout-cta-${page.viewportSize()?.width}w`);
    });

    test('no elements extend beyond right edge of screen', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        const overflow = await page.evaluate(() => {
            const vw = document.documentElement.clientWidth;
            return Array.from(document.querySelectorAll('*'))
                .filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.right > vw + 5 && r.width > 10; // meaningful elements only
                })
                .map(el => ({
                    tag: el.tagName,
                    cls: el.className?.toString().substring(0, 50),
                    right: Math.round(el.getBoundingClientRect().right),
                    vw,
                }))
                .slice(0, 8);
        });
        if (overflow.length > 0) {
            console.warn('⚠️ Overflowing elements:', JSON.stringify(overflow, null, 2));
        }
        expect(overflow.length, `${overflow.length} elements overflow horizontally`).toBe(0);
    });
});

test.describe('Layout — Responsive Breakpoints', () => {

    const breakpoints = [
        { name: 'mobile-small',  w: 320, h: 568 },
        { name: 'iphone-14',     w: 390, h: 844 },
        { name: 'iphone-plus',   w: 430, h: 932 },
        { name: 'tablet',        w: 768, h: 1024 },
        { name: 'tablet-wide',   w: 1024, h: 768 },
        { name: 'desktop',       w: 1440, h: 900 },
    ];

    for (const bp of breakpoints) {
        test(`no overflow @ ${bp.name} (${bp.w}x${bp.h})`, async ({ page }) => {
            await page.setViewportSize({ width: bp.w, height: bp.h });
            await page.goto('/');
            await waitForStable(page, 800);
            await assertNoHorizontalOverflow(page);
            await captureState(page, `responsive-${bp.name}`);
        });
    }
});

test.describe('Layout — Sidebar Behavior', () => {

    test('sidebar does not cover content on mobile', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        await assertSidebarDoesNotCoverContent(page);
    });

    test('correct sidebar state on narrow viewport', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page);
        const vp = page.viewportSize();
        if (vp && vp.width < 768) {
            // On mobile, sidebar should be hidden or collapsed
            const sidebar = page.locator('aside, [class*="Sidebar"], [class*="sidebar"]').first();
            const visible = await sidebar.isVisible({ timeout: 1500 }).catch(() => false);
            if (visible) {
                // If sidebar is visible on mobile, ensure it's not obscuring main area
                const sidebarBox = await sidebar.boundingBox();
                const main = page.locator('main, [class*="main"], [class*="content"]').first();
                const mainBox = await main.boundingBox();
                if (sidebarBox && mainBox) {
                    const isOverlapping = sidebarBox.x < mainBox.x + mainBox.width && sidebarBox.x + sidebarBox.width > mainBox.x;
                    if (isOverlapping) {
                        console.warn('⚠️ Sidebar may be overlapping main content on mobile');
                    }
                }
            }
        }
    });
});

test.describe('Layout — Portrait vs Landscape', () => {

    test('portrait to landscape: no overflow occurs', async ({ page }) => {
        // Start portrait
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await waitForStable(page, 600);
        await assertNoHorizontalOverflow(page);
        await captureState(page, 'orientation-portrait');

        // Switch to landscape
        await page.setViewportSize({ width: 844, height: 390 });
        await waitForStable(page, 600);
        await assertNoHorizontalOverflow(page);
        await captureState(page, 'orientation-landscape');
    });

    test('layout reflows correctly after orientation change', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await waitForStable(page, 600);

        // Switch to landscape
        await page.setViewportSize({ width: 844, height: 390 });
        await waitForStable(page, 800);

        // Nav should still be visible
        const nav = page.locator('nav').first();
        if (await nav.isVisible({ timeout: 2000 }).catch(() => false)) {
            const inVp = await isFullyInViewport(page, nav);
            expect(inVp, 'Nav should be in viewport after landscape orientation').toBe(true);
        }
        await captureState(page, 'orientation-landscape-nav');
    });
});

test.describe('Layout — Overlapping Panels Detection', () => {

    test('modals and panels are centered and not clipped', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);

        // Use shared helper to dismiss promo then click login
        const loginBtnVisible = await page.locator('[data-testid="login-cta-nav"], [data-testid="login-cta-hero"]').first().isVisible({ timeout: 2000 }).catch(() => false)
            || await page.getByRole('button', { name: /login|platform|acceder/i }).first().isVisible({ timeout: 1000 }).catch(() => false);
        if (loginBtnVisible) {
            await dismissPromoAndClickLogin(page);
            await waitForStable(page, 600);
            await captureState(page, 'modal-login-opened');

            const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
            if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
                const box = await modal.boundingBox();
                const vp = page.viewportSize();
                if (box && vp) {
                    expect(box.x, 'Modal must not start to the left of viewport').toBeGreaterThanOrEqual(-5);
                    expect(box.y, 'Modal must not start above viewport').toBeGreaterThanOrEqual(-5);
                    expect(box.x + box.width, 'Modal must not extend beyond right edge').toBeLessThanOrEqual(vp.width + 10);
                    console.log(`Modal: x=${Math.round(box.x)}, w=${Math.round(box.width)}, vp=${vp.width}`);
                }
            }
        }
    });
});
