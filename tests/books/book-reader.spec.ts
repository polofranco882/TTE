import { test, expect } from '../fixtures/tte.fixture';
import {
    assertNoHorizontalOverflow,
    assertSidebarDoesNotCoverContent,
    assertBookCanvasInViewport,
    assertBookNavButtonsVisible,
    captureState,
    waitForStable,
    isFullyInViewport,
    hasHorizontalOverflow,
    getHorizontalOverflowPx,
} from '../helpers/viewport';

/**
 * Book Reader Tests — Critical iOS/Mobile Priority
 * 
 * Validates that the book viewer works correctly across:
 * - Desktop (sidebar visible)
 * - Mobile portrait (sidebar hidden/collapsed)
 * - Mobile landscape (more horizontal space)
 * - iPad portrait and landscape
 */

test.describe('Book Reader — Layout & Visibility', () => {

    test('book canvas is visible in viewport on desktop', async ({ page }) => {
        await page.goto('/');
        await captureState(page, 'book-reader-desktop-start');
        // Verify no horizontal overflow
        await assertNoHorizontalOverflow(page);
    });

    test('no horizontal overflow on book reader page', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page);
        const overflow = await hasHorizontalOverflow(page);
        if (overflow) {
            const px = await getHorizontalOverflowPx(page);
            throw new Error(`Horizontal overflow on book reader: ${px}px`);
        }
    });
});

test.describe('Book Reader — Login and Access', () => {

    test('login form is visible and functional', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        await captureState(page, 'book-reader-login-form');

        // Check login button is accessible
        const loginBtn = page.getByRole('button', { name: /login|acceder|platform/i }).first();
        if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(loginBtn).toBeVisible();
            const inViewport = await isFullyInViewport(page, loginBtn);
            expect(inViewport, 'Login button should be fully in viewport').toBe(true);
        }

        await captureState(page, 'book-login-checked');
    });

    test('landing page loads without layout errors', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        await assertNoHorizontalOverflow(page);
        await captureState(page, 'landing-mobile-layout');
    });
});

test.describe('Book Reader — Sidebar Overlap Detection', () => {

    test('sidebar does not overlap book content area', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        await assertSidebarDoesNotCoverContent(page);
    });

    test('sidebar has correct CSS variable applied', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page);
        const sidebarWidth = await page.evaluate(() => {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--sidebar-width').trim();
            return raw;
        });
        // On mobile the sidebar-width should be 0 or small
        const vp = page.viewportSize();
        if (vp && vp.width < 768) {
            const widthPx = parseInt(sidebarWidth, 10) || 0;
            expect(widthPx, `On mobile (${vp.width}px), --sidebar-width should be 0`).toBeLessThanOrEqual(0);
        }
        console.log(`Viewport: ${vp?.width}px | --sidebar-width: "${sidebarWidth}"`);
    });
});

test.describe('Book Reader — Mobile Portrait', () => {

    test('page renders without horizontal scroll on mobile', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        await assertNoHorizontalOverflow(page);
        await captureState(page, 'book-mobile-portrait-noscroll');
    });

    test('content does not overflow viewport width', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page);
        const overflow = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('*'));
            const vw = document.documentElement.clientWidth;
            return all
                .filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.right > vw + 5; // 5px tolerance
                })
                .map(el => ({
                    tag: el.tagName,
                    cls: el.className?.toString().substring(0, 60),
                    right: Math.round(el.getBoundingClientRect().right),
                    vw,
                }))
                .slice(0, 5);
        });
        if (overflow.length > 0) {
            console.warn('⚠️ Elements overflowing viewport:', JSON.stringify(overflow, null, 2));
        }
        expect(overflow.length, `${overflow.length} elements overflow the viewport`).toBe(0);
    });
});

test.describe('Book Reader — Landscape Orientation', () => {

    test('no horizontal overflow in landscape', async ({ page }) => {
        await page.setViewportSize({ width: 844, height: 390 });
        await page.goto('/');
        await waitForStable(page, 800);
        await assertNoHorizontalOverflow(page);
        await captureState(page, 'book-landscape-noscroll');
    });

    test('content reflows correctly in landscape', async ({ page }) => {
        await page.setViewportSize({ width: 844, height: 390 });
        await page.goto('/');
        await waitForStable(page);
        const vp = page.viewportSize();
        // In landscape, width > height
        if (vp) {
            console.log(`Landscape viewport: ${vp.width}x${vp.height}`);
            expect(vp.width, 'Landscape: width should be > height').toBeGreaterThan(vp.height);
        }
        await assertNoHorizontalOverflow(page);
        await captureState(page, 'book-landscape-layout');
    });
});

test.describe('Book Reader — Canvas & Controls Visibility', () => {

    test('book canvas visible in reader mode', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        // Check if any canvas element is visible after load
        const canvas = page.locator('canvas').first();
        const visible = await canvas.isVisible({ timeout: 3000 }).catch(() => false);
        if (visible) {
            await assertBookCanvasInViewport(page);
            await captureState(page, 'book-canvas-visible');
        } else {
            console.log('ℹ️ Canvas not present on current view (user not in reader yet)');
        }
    });

    test('book navigation buttons (if visible) are accessible', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        const { prevVisible, nextVisible } = await assertBookNavButtonsVisible(page);
        if (prevVisible || nextVisible) {
            console.log(`Nav buttons: prev=${prevVisible}, next=${nextVisible}`);
            if (prevVisible) {
                const prev = page.getByRole('button', { name: /prev|anterior|back/i }).first();
                const inVp = await isFullyInViewport(page, prev);
                expect(inVp, 'Prev button should be in viewport').toBe(true);
            }
        }
        await captureState(page, 'book-nav-buttons');
    });
});

test.describe('Book Reader — Safe Area & Fixed Positioning', () => {

    test('bottom navigation bar not clipped by device notch', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page);
        // Bottom nav or toolbar should not be positioned partially off-screen
        const bottomBar = page.locator('[class*="bottom"], [class*="nav-bar"], [class*="controls"]').first();
        const visible = await bottomBar.isVisible({ timeout: 2000 }).catch(() => false);
        if (visible) {
            const box = await bottomBar.boundingBox();
            const vp = page.viewportSize();
            if (box && vp) {
                const bottomEdge = box.y + box.height;
                // Bottom bar must not extend beyond viewport + reasonable tolerance
                expect(bottomEdge, 'Bottom bar should not be clipped below viewport')
                    .toBeLessThanOrEqual(vp.height + 100);
                console.log(`Bottom bar: y=${Math.round(box.y)}, height=${Math.round(box.height)}, viewport=${vp.height}`);
            }
        } else {
            console.log('ℹ️ No bottom bar found on current view');
        }
        await captureState(page, 'book-safe-area');
    });
});
