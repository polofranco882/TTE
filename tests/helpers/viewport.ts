import { Page, Locator, expect } from '@playwright/test';

/**
 * Viewport & Layout Helpers
 * Utilities to detect visual/layout issues across all device types.
 */

// ── Shared interaction helpers ─────────────────────────────────────────────

/**
 * Dismisses the promo popup (if visible) then clicks the login CTA.
 * Handles all device types: uses data-testid first, falls back to aria-label.
 */
export async function dismissPromoAndClickLogin(page: Page): Promise<void> {
    // Close promo popup if it's blocking the CTA
    const promoClose = page.locator('[data-testid="close-promo"]');
    if (await promoClose.isVisible({ timeout: 2000 }).catch(() => false)) {
        await promoClose.click();
        await page.waitForTimeout(400);
    }
    // Prefer data-testid then fall back to text/aria-label
    const cta = page.locator('[data-testid="login-cta-nav"], [data-testid="login-cta-hero"]').first();
    const hasDTI = await cta.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasDTI) {
        await cta.click();
    } else {
        const fallback = page.getByRole('button', { name: /login|platform|acceder|access/i }).first();
        if (await fallback.isVisible({ timeout: 3000 }).catch(() => false)) await fallback.click();
    }
}

// ── Viewport helpers ──────────────────────────────────────────────────────

/** Returns the current page's visible viewport dimensions */
export async function getViewport(page: Page) {
    return page.viewportSize() ?? { width: 375, height: 667 };
}

/** Checks if an element is fully within the viewport (no clipping) */
export async function isFullyInViewport(page: Page, locator: Locator): Promise<boolean> {
    const vp = await getViewport(page);
    const box = await locator.boundingBox();
    if (!box) return false;
    return (
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width  <= vp.width  + 2 &&   // 2px tolerance
        box.y + box.height <= vp.height + 2
    );
}

/** Checks if there is horizontal overflow on the page */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
}

/** Returns scrollWidth vs clientWidth delta */
export async function getHorizontalOverflowPx(page: Page): Promise<number> {
    return page.evaluate(() => {
        return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
}

/** Checks if two elements visually overlap on screen */
export async function elementsOverlap(locA: Locator, locB: Locator): Promise<boolean> {
    const [boxA, boxB] = await Promise.all([locA.boundingBox(), locB.boundingBox()]);
    if (!boxA || !boxB) return false;
    const xOverlap = boxA.x < boxB.x + boxB.width  && boxA.x + boxA.width  > boxB.x;
    const yOverlap = boxA.y < boxB.y + boxB.height && boxA.y + boxA.height > boxB.y;
    return xOverlap && yOverlap;
}

// ── Visibility helpers ────────────────────────────────────────────────────

/** Asserts an element is visible AND within the viewport */
export async function assertVisibleInViewport(page: Page, locator: Locator, label = 'element') {
    await expect(locator, `${label} should be visible`).toBeVisible();
    const inside = await isFullyInViewport(page, locator);
    if (!inside) {
        const box = await locator.boundingBox();
        const vp = await getViewport(page);
        throw new Error(
            `❌ ${label} is NOT fully in viewport.\n  Element box: ${JSON.stringify(box)}\n  Viewport: ${JSON.stringify(vp)}`
        );
    }
}

/** Asserts no horizontal scrollbar / overflow exists */
export async function assertNoHorizontalOverflow(page: Page) {
    const overflow = await getHorizontalOverflowPx(page);
    if (overflow > 5) {  // 5px tolerance for sub-pixel rounding
        throw new Error(`❌ Horizontal overflow detected: ${overflow}px beyond viewport`);
    }
}

// ── Sidebar helpers ───────────────────────────────────────────────────────

/** Returns the computed --sidebar-width CSS variable value in pixels */
export async function getSidebarWidth(page: Page): Promise<number> {
    return page.evaluate(() => {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
        return parseInt(raw, 10) || 0;
    });
}

/** Asserts sidebar and main content do NOT overlap */
export async function assertSidebarDoesNotCoverContent(page: Page) {
    const sidebar   = page.locator('[data-testid="sidebar"], nav.sidebar, aside').first();
    const mainArea  = page.locator('[data-testid="main-content"], main, .reader-fullscreen, [class*="reader"]').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    const mainVisible    = await mainArea.isVisible().catch(() => false);
    if (!sidebarVisible || !mainVisible) return; // Not applicable on current view
    const overlapping = await elementsOverlap(sidebar, mainArea);
    if (overlapping) {
        throw new Error('❌ Sidebar overlaps the main content area');
    }
}

// ── Book Reader helpers ───────────────────────────────────────────────────

/** Asserts the book canvas is fully inside the viewport */
export async function assertBookCanvasInViewport(page: Page) {
    const canvas = page.locator('canvas, [data-testid="book-canvas"], .book-canvas, [class*="canvas"]').first();
    const visible = await canvas.isVisible().catch(() => false);
    if (!visible) return; // no canvas yet, skip
    await assertVisibleInViewport(page, canvas, 'Book canvas');
}

/** Returns true if the book prev/next buttons are both visible */
export async function assertBookNavButtonsVisible(page: Page) {
    const prevBtn = page.getByRole('button', { name: /prev|anterior|back/i }).first();
    const nextBtn = page.getByRole('button', { name: /next|siguiente/i }).first();
    const prevVisible = await prevBtn.isVisible().catch(() => false);
    const nextVisible = await nextBtn.isVisible().catch(() => false);
    return { prevVisible, nextVisible };
}

// ── Scroll helpers ────────────────────────────────────────────────────────

/** Scroll to bottom and measure total scroll height */
export async function getScrollHeight(page: Page): Promise<number> {
    return page.evaluate(() => document.documentElement.scrollHeight);
}

/** Wait for page to be visually stable (no pending animations) */
export async function waitForStable(page: Page, ms = 600) {
    await page.waitForTimeout(ms);
}

// ── Screenshot helper ─────────────────────────────────────────────────────

/** Takes a labeled screenshot for a given state */
export async function captureState(page: Page, label: string) {
    await page.screenshot({
        path: `playwright-report/screenshots/${label.replace(/[^a-z0-9]/gi, '_')}.png`,
        fullPage: false,
    });
}
