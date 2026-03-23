import { test, expect } from '@playwright/test';
import {
    assertNoHorizontalOverflow,
    assertSidebarDoesNotCoverContent,
    assertBookCanvasInViewport,
    assertBookNavButtonsVisible,
    captureState,
    waitForStable,
    isFullyInViewport,
    waitForReaderReady,
    assertNotCovered,
    getSidebarWidth,
} from '../helpers/viewport';

/**
 * Professional Book Reader Suite
 * Focus: Authenticated flows, Mobile/Tablet WebKit layout, Sidebar interaction.
 */

test.describe('Reading Module — Integration & Layout', () => {

    test.beforeEach(async ({ page }) => {
        // Go directly to the library (session is already active via storageState)
        await page.goto('/library');
        await waitForStable(page, 1000);
    });

    test('should navigate from library to book reader', async ({ page }) => {
        // Find the first book and click its "START READING" button (verified via subagent)
        const startBtn = page.getByRole('button', { name: /START READING|INICIAR LECTURA/i }).first();
        await expect(startBtn).toBeVisible({ timeout: 15000 });
        
        await startBtn.click();
        
        // Use helper to wait for reader
        await waitForReaderReady(page);
        
        // Validate URL change
        await expect(page).toHaveURL(/\/reader\/|book\//i);
        
        await captureState(page, 'reader-loaded');
    });

    test('sidebar behavior on different viewports', async ({ page }) => {
        const vp = page.viewportSize();
        const sidebar = page.locator('[data-testid="sidebar"], aside, nav.sidebar').first();
        
        // Open a book first using the verified button
        const startBtn = page.getByRole('button', { name: /START READING|INICIAR LECTURA/i }).first();
        await startBtn.click();
        await waitForReaderReady(page);

        const isMobile = vp && vp.width < 768;
        
        if (isMobile) {
            // On mobile, sidebar should usually be hidden or overlayed (not pushing content)
            const width = await getSidebarWidth(page);
            console.log(`Mobile viewport (${vp?.width}w): Sidebar width = ${width}px`);
            
            // If sidebar is visible, it MUST not cover the main content or be toggleable
            if (await sidebar.isVisible()) {
                await assertSidebarDoesNotCoverContent(page);
            }
        } else {
            // On desktop, sidebar should be visible and have reasonable width
            await expect(sidebar).toBeVisible();
            const width = await getSidebarWidth(page);
            expect(width).toBeGreaterThan(150);
            await assertSidebarDoesNotCoverContent(page);
        }
        
        await captureState(page, `sidebar-check-${vp?.width}w`);
    });

    test('reader canvas visibility and interaction', async ({ page }) => {
        // Open a book
        const firstBook = page.locator('[data-testid="book-card"], [class*="BookCard"], [class*="book-card"]').first();
        await firstBook.click();
        await waitForReaderReady(page);

        // Verify canvas/content container is the primary element
        const canvas = page.locator('canvas, .page-content, [data-testid="reader-content"]').first();
        await assertBookCanvasInViewport(page);
        await assertNotCovered(page, canvas, 'Book Canvas');

        // Check navigation controls
        const { prevVisible, nextVisible } = await assertBookNavButtonsVisible(page);
        console.log(`Navigation buttons status: Prev=${prevVisible}, Next=${nextVisible}`);
        
        // If they are visible, they must be in the viewport and not covered
        if (nextVisible) {
            const nextBtn = page.getByRole('button', { name: /next|siguiente/i }).first();
            await assertNotCovered(page, nextBtn, 'Next Button');
        }

        await captureState(page, 'reader-ui-elements');
    });

    test('no horizontal overflow during reading', async ({ page }) => {
        // Open a book
        const firstBook = page.locator('[data-testid="book-card"], [class*="BookCard"], [class*="book-card"]').first();
        await firstBook.click();
        await waitForReaderReady(page);

        // Crucial for mobile: no horizontal scrolling allowed in the reader
        await assertNoHorizontalOverflow(page);
    });

    test('orientation change handling (Landscape)', async ({ page }) => {
        const vp = page.viewportSize();
        if (!vp) return;

        // Open a book
        const firstBook = page.locator('[data-testid="book-card"], [class*="BookCard"], [class*="book-card"]').first();
        await firstBook.click();
        await waitForReaderReady(page);

        // Force landscape if on mobile
        if (vp.width < 768) {
            await page.setViewportSize({ width: vp.height, height: vp.width });
            await waitForStable(page, 1000);
            
            await assertNoHorizontalOverflow(page);
            await assertBookCanvasInViewport(page);
            
            await captureState(page, 'reader-landscape');
        }
    });

    test('modals and overlays on mobile reader focus', async ({ page }) => {
        const vp = page.viewportSize();
        if (!vp || vp.width > 768) return; // Mobile only test

        // Open a book
        const firstBook = page.locator('[data-testid="book-card"], [class*="BookCard"], [class*="book-card"]').first();
        await firstBook.click();
        await waitForReaderReady(page);

        // Look for any menu button that might open a modal/overlay
        const menuBtn = page.locator('button[aria-label*="menu"], button[class*="menu"], [data-testid="menu-trigger"]').first();
        if (await menuBtn.isVisible()) {
            await menuBtn.click();
            await waitForStable(page, 500);
            
            // Check that the modal doesn't cause overflow
            await assertNoHorizontalOverflow(page);
            
            const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
            if (await modal.isVisible()) {
                const box = await modal.boundingBox();
                if (box) {
                    expect(box.x).toBeGreaterThanOrEqual(-5);
                    expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 5);
                }
            }
            
            await captureState(page, 'reader-mobile-menu-open');
        }
    });
});
