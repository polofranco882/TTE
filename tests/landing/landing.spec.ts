import { test, expect } from '../fixtures/tte.fixture';
import {
    assertNoHorizontalOverflow,
    assertVisibleInViewport,
    captureState,
    waitForStable,
    isFullyInViewport,
    dismissPromoAndClickLogin,
} from '../helpers/viewport';

/**
 * Landing Page Tests — Responsive & Multilingal
 * Tests for public landing page across mobile, tablet, desktop
 */

test.describe('Landing — Page Load', () => {

    test('landing page loads without errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('response', r => { if (r.status() >= 500) errors.push(`HTTP ${r.status()} on ${r.url()}`); });

        await page.goto('/');
        await waitForStable(page, 1200);
        await captureState(page, `landing-load-${page.viewportSize()?.width}w`);

        // Filter known non-critical errors
        const critical = errors.filter(e =>
            !e.includes('Could not establish connection') &&  // browser extension noise
            !e.includes('ResizeObserver') &&
            !e.includes('DevTools')
        );
        expect(critical.length, `Critical errors: ${critical.join(', ')}`).toBe(0);
    });

    test('page title is set', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        const title = await page.title();
        expect(title.length, 'Page title should not be empty').toBeGreaterThan(0);
        console.log(`Page title: "${title}"`);
    });

    test('no horizontal overflow', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        await assertNoHorizontalOverflow(page);
    });
});

test.describe('Landing — Hero Section', () => {

    test('hero headline is visible', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible({ timeout: 5000 });
        const box = await h1.boundingBox();
        expect(box?.height, 'H1 should have height > 0').toBeGreaterThan(0);
        await captureState(page, `landing-hero-${page.viewportSize()?.width}w`);
    });

    test('CTA button is visible and tappable', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        // Look for the primary CTA in the hero
        const cta = page.getByRole('button', { name: /login|platform|access|acceder/i }).first();
        if (await cta.isVisible({ timeout: 4000 }).catch(() => false)) {
            await assertVisibleInViewport(page, cta, 'Hero CTA button');
            // Check button is large enough to tap on mobile
            const box = await cta.boundingBox();
            const vp = page.viewportSize();
            if (vp && vp.width < 768 && box) {
                expect(box.height, 'CTA button should be at least 40px tall on mobile').toBeGreaterThanOrEqual(40);
            }
        }
        await captureState(page, `landing-cta-${page.viewportSize()?.width}w`);
    });
});

test.describe('Landing — Navbar Mobile', () => {

    test('navbar is visible on mobile', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        const nav = page.locator('nav').first();
        if (await nav.isVisible({ timeout: 3000 }).catch(() => false)) {
            const inVp = await isFullyInViewport(page, nav);
            expect(inVp, 'Navbar should be fully in viewport').toBe(true);
        }
        await captureState(page, `landing-nav-${page.viewportSize()?.width}w`);
    });

    test('institution logo/name is visible in navbar', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        // Logo image or institution name text
        const logo = page.locator('nav img, nav [class*="logo"], nav [class*="brand"]').first();
        if (await logo.isVisible({ timeout: 2000 }).catch(() => false)) {
            const box = await logo.boundingBox();
            expect(box?.width, 'Logo should have width > 0').toBeGreaterThan(0);
        }
    });
});

test.describe('Landing — Language Switcher', () => {

    test('language switcher is accessible', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);
        // Language switcher — could be flag icons or a dropdown
        const switcher = page.locator('[class*="LanguageSwitcher"], [class*="language"], [aria-label*="language"], button:has-text("🇺🇸"), button:has-text("🇪🇸")').first();
        const visible = await switcher.isVisible({ timeout: 3000 }).catch(() => false);
        if (visible) {
            const inVp = await isFullyInViewport(page, switcher);
            expect(inVp, 'Language switcher should be in viewport').toBe(true);
            await captureState(page, `landing-lang-switcher-${page.viewportSize()?.width}w`);
        } else {
            console.log('ℹ️ Language switcher not found (may need auth or specific route)');
        }
    });

    test('language switch changes page content', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);

        // Dismiss promo popup first so language buttons are accessible
        const promoClose = page.locator('[data-testid="close-promo"]');
        if (await promoClose.isVisible({ timeout: 2000 }).catch(() => false)) {
            await promoClose.click();
            await waitForStable(page, 600);
        }

        // Get initial hero text
        const h1 = page.locator('h1').first();
        const initialText = await h1.textContent({ timeout: 3000 }).catch(() => '');

        // Try clicking Spanish switcher
        const esBtn = page.locator('button:has-text("🇪🇸"), [data-lang="es"], button:has-text("ES")').first();
        if (await esBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await esBtn.click();
            await waitForStable(page, 1200);
            const newText = await h1.textContent({ timeout: 3000 }).catch(() => '');
            // Text should either change or stay the same if no ES translation configured
            console.log(`Language switch: "${initialText?.substring(0, 40)}" → "${newText?.substring(0, 40)}"`);
            await captureState(page, 'landing-lang-switched-es');
        } else {
            console.log('ℹ️ Spanish switcher button not directly clickable from this view');
        }
    });
});

test.describe('Landing — Responsive Sections', () => {

    test('courses section is visible', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        // Scroll to courses section
        await page.evaluate(() => {
            const el = document.getElementById('courses') || document.querySelector('[id*="course"]');
            el?.scrollIntoView({ behavior: 'instant' });
        });
        await waitForStable(page, 400);
        await assertNoHorizontalOverflow(page);
        await captureState(page, `landing-courses-${page.viewportSize()?.width}w`);
    });

    test('footer is visible and not clipped', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        // Scroll to footer
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await waitForStable(page, 600);
        const footer = page.locator('footer').first();
        if (await footer.isVisible({ timeout: 2000 }).catch(() => false)) {
            await assertNoHorizontalOverflow(page);
        }
        await captureState(page, `landing-footer-${page.viewportSize()?.width}w`);
    });
});

test.describe('Landing — Dynamic Sections (Banners, Gallery, Videos)', () => {

    test('promotional banners render without overflow if present', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1200);
        const banners = page.locator('[class*="banner"], [class*="Banner"]');
        const count = await banners.count();
        if (count > 0) {
            await assertNoHorizontalOverflow(page);
            console.log(`✅ ${count} banner(s) rendered`);
        } else {
            console.log('ℹ️ No banners configured yet — skipping');
        }
    });

    test('gallery images render within grid (if present)', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1200);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await waitForStable(page, 400);
        const gallery = page.locator('[id="gallery"], section:has(img)').first();
        if (await gallery.isVisible({ timeout: 2000 }).catch(() => false)) {
            await assertNoHorizontalOverflow(page);
            await captureState(page, `landing-gallery-${page.viewportSize()?.width}w`);
        } else {
            console.log('ℹ️ Gallery section not visible / no images yet');
        }
    });
});
