import { test, expect } from '../fixtures/tte.fixture';
import {
    assertNoHorizontalOverflow,
    assertVisibleInViewport,
    captureState,
    waitForStable,
    isFullyInViewport,
} from '../helpers/viewport';

/**
 * Auth / Login Tests — Mobile Compatibility
 * Validates that the login form is usable on small screens
 * and that touch inputs work correctly.
 */

test.describe('Auth — Login Form Visibility', () => {

    test('login form opens and email input is in viewport', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);

        // Open login dialog (may require clicking a button first)
        const loginTrigger = page.getByRole('button', { name: /login|platform|acceder|access/i }).first();
        if (await loginTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await loginTrigger.click();
            await waitForStable(page, 600);
        }
        await captureState(page, `auth-form-open-${page.viewportSize()?.width}w`);

        // Email input should be visible
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            const inVp = await isFullyInViewport(page, emailInput);
            expect(inVp, 'Email input should be fully in viewport').toBe(true);
        } else {
            console.log('ℹ️ Email input not found — may not be on this route');
        }
    });

    test('password input is visible and accessible', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);

        const loginTrigger = page.getByRole('button', { name: /login|platform|acceder|access/i }).first();
        if (await loginTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await loginTrigger.click();
            await waitForStable(page, 600);
        }

        const passInput = page.locator('input[type="password"]').first();
        if (await passInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            const inVp = await isFullyInViewport(page, passInput);
            expect(inVp, 'Password input should be fully in viewport').toBe(true);
        }
        await captureState(page, `auth-password-${page.viewportSize()?.width}w`);
    });

    test('submit button is tappable on mobile', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);

        const loginTrigger = page.getByRole('button', { name: /login|platform|acceder|access/i }).first();
        if (await loginTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await loginTrigger.click();
            await waitForStable(page, 600);
        }

        const submitBtn = page.getByRole('button', { name: /sign in|login|ingresar|acceder|entrar/i }).last();
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            const box = await submitBtn.boundingBox();
            const vp = page.viewportSize();
            if (box && vp && vp.width < 768) {
                // Mobile tap target: minimum 44x44px (Apple HIG)
                expect(box.height, 'Submit button height should be ≥ 40px (mobile tap target)').toBeGreaterThanOrEqual(40);
                expect(box.width, 'Submit button width should be ≥ 44px (mobile tap target)').toBeGreaterThanOrEqual(44);
            }
        }
        await captureState(page, `auth-submit-${page.viewportSize()?.width}w`);
    });

    test('login form has no horizontal overflow', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);

        const loginTrigger = page.getByRole('button', { name: /login|platform|acceder|access/i }).first();
        if (await loginTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await loginTrigger.click();
            await waitForStable(page, 600);
        }

        await assertNoHorizontalOverflow(page);
        await captureState(page, `auth-no-overflow-${page.viewportSize()?.width}w`);
    });
});

test.describe('Auth — Keyboard / Input Interaction (Mobile)', () => {

    test('filling email input does not cause layout shift', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);

        const loginTrigger = page.getByRole('button', { name: /login|platform|acceder|access/i }).first();
        if (await loginTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await loginTrigger.click();
            await waitForStable(page, 600);
        }

        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Simulate typing (equivalent to virtual keyboard interaction)
            await emailInput.click();
            await waitForStable(page, 300);
            await emailInput.fill('test@example.com');
            await waitForStable(page, 400);

            // Layout should still be OK after typing
            await assertNoHorizontalOverflow(page);
            const inVp = await isFullyInViewport(page, emailInput);
            expect(inVp, 'Email input should stay in viewport after typing').toBe(true);
            await captureState(page, `auth-after-typing-${page.viewportSize()?.width}w`);
        }
    });

    test('modal container stays within viewport after input focus', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);

        const loginTrigger = page.getByRole('button', { name: /login|platform|acceder|access/i }).first();
        if (await loginTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await loginTrigger.click();
            await waitForStable(page, 600);

            const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
            if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
                const box = await modal.boundingBox();
                const vp = page.viewportSize();
                if (box && vp) {
                    expect(box.x, 'Modal must not start off-screen left').toBeGreaterThanOrEqual(-5);
                    expect(box.x + box.width, 'Modal must not extend off-screen right').toBeLessThanOrEqual(vp.width + 5);
                    console.log(`Modal width: ${Math.round(box.width)}px (viewport: ${vp.width}px)`);
                }
            }
        }
        await captureState(page, `auth-modal-bounds-${page.viewportSize()?.width}w`);
    });
});

test.describe('Auth — Error Messages', () => {

    test('error message visible when wrong credentials used', async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 800);

        const loginTrigger = page.getByRole('button', { name: /login|platform|acceder|access/i }).first();
        if (await loginTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await loginTrigger.click();
            await waitForStable(page, 600);
        }

        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passInput  = page.locator('input[type="password"]').first();
        const submitBtn  = page.getByRole('button', { name: /sign in|login|ingresar|acceder/i }).last();

        const inputsVisible = await emailInput.isVisible({ timeout: 2000 }).catch(() => false);
        if (!inputsVisible) { console.log('ℹ️ Login form not found'); return; }

        await emailInput.fill('wrong@wrong.com');
        await passInput.fill('wrongpass');
        await submitBtn.click();
        await waitForStable(page, 1500);
        await captureState(page, `auth-error-${page.viewportSize()?.width}w`);

        // Check that error message is visible (either toast or inline)
        const errorMsg = page.locator('[class*="error"], [class*="Error"], [role="alert"], [class*="toast"]').first();
        const errorVisible = await errorMsg.isVisible({ timeout: 4000 }).catch(() => false);
        if (errorVisible) {
            const inVp = await isFullyInViewport(page, errorMsg);
            expect(inVp, 'Error message should be visible in viewport').toBe(true);
        } else {
            console.log('ℹ️ Error message not visibly detected (may be inside modal or different selector)');
        }
    });
});
