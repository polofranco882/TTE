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
 * Professional Auth & Login Suite
 * Focus: Mobile Form Usability, Input Focus, Error Visibility, Tap Targets.
 */

test.describe('Auth — Login Component Responsivity', () => {
    // These tests require a "logged out" state to see the login form
    test.use({ storageState: { cookies: [], origins: [] } });


    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForStable(page, 1000);
        await dismissPromoAndClickLogin(page);
        await waitForStable(page, 800);
    });

    test('login form inputs are fully accessible on mobile', async ({ page }) => {
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passInput  = page.locator('input[type="password"]').first();
        
        await expect(emailInput).toBeVisible();
        await expect(passInput).toBeVisible();
        
        // Ensure they are not covered by any header or floating element
        await assertNotCovered(page, emailInput, 'Email Input');
        await assertNotCovered(page, passInput, 'Password Input');
        
        const inVp = await isFullyInViewport(page, emailInput);
        expect(inVp, 'Email input must be centered in viewport').toBe(true);
        
        await captureState(page, 'login-form-inputs');
    });

    test('submit button meets touch target requirements', async ({ page }) => {
        const submitBtn = page.getByRole('button', { name: /sign in|login|ingresar|acceder|entrar/i }).last();
        await expect(submitBtn).toBeVisible();
        
        const vp = page.viewportSize();
        if (vp && vp.width < 768) {
            const box = await submitBtn.boundingBox();
            if (box) {
                // Professional standard: minimum 44px
                expect(box.height, 'Submit button too small for mobile touch').toBeGreaterThanOrEqual(44);
            }
        }
    });

    test('keyboard focus does not break modal layout', async ({ page }) => {
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        await emailInput.click();
        await waitForStable(page, 500);
        
        // Modal must stay within bounds even if shifted by browser keyboard
        const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
        const box = await modal.boundingBox();
        const vp = page.viewportSize();
        
        if (box && vp) {
            expect(box.x).toBeGreaterThanOrEqual(-5);
            expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 5);
        }
        
        await captureState(page, 'login-keyboard-focus');
    });
});

test.describe('Auth — Error Feedback', () => {

    test('error messages are visible and correctly placed', async ({ page }) => {
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passInput  = page.locator('input[type="password"]').first();
        const submitBtn  = page.getByRole('button', { name: /sign in|login|ingresar|acceder|entrar/i }).last();

        await emailInput.fill('invalid@user.com');
        await passInput.fill('wrongpassword');
        await submitBtn.click();
        
        await waitForStable(page, 1500);
        
        // Look for error message
        const errorMsg = page.locator('[role="alert"], [class*="error"], [class*="Error"], [class*="toast"]').first();
        await expect(errorMsg).toBeVisible({ timeout: 5000 });
        
        // Error must be in viewport so user sees it
        await assertVisibleInViewport(page, errorMsg, 'Error Message');
        
        await captureState(page, 'login-error-feedback');
    });
});
