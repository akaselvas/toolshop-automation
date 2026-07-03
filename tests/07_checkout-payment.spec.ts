import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

test.describe('Checkout - Payment Step', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 15000 });
        const firstCard = page.locator('.card').first();
        await firstCard.click();
        await page.waitForURL('**/product/**');
        await page.getByTestId('add-to-cart').click();
        await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });

        await page.getByTestId('nav-cart').click();
        await page.waitForURL('**/checkout');
        await page.getByTestId('proceed-1').click();

        await page.getByRole('tab', { name: 'Continue as Guest' }).click();
        await page.getByTestId('guest-email').fill('guest@example.com');
        await page.getByTestId('guest-first-name').fill('Jane');
        await page.getByTestId('guest-last-name').fill('Doe');
        await page.getByTestId('guest-submit').click();

        await expect(page.getByText('Continuing as guest: Jane Doe')).toBeVisible({ timeout: 10000 });
        await page.getByTestId('proceed-2-guest').click();

        await expect(page.getByRole('heading', { name: 'Billing Address' })).toBeVisible({ timeout: 10000 });

        await page.getByTestId('country').selectOption({ index: 1 });
        await page.getByTestId('postal_code').fill('12345');
        await page.getByTestId('house_number').fill('123');
        await page.getByTestId('street').fill('Test Street 123');
        await page.getByTestId('city').fill('Test City');
        await page.getByTestId('state').fill('Test State');

        await page.getByTestId('proceed-3').click();

        await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible({ timeout: 10000 });
    });

    test('Payment method selection @sprint5 @AC1', async ({ page }) => {
        // Given I am on the payment step
        // Then a dropdown is displayed with options:
        // Bank Transfer   Cash on Delivery   Credit Card
        // Buy Now Pay Later   Gift Card

        const paymentSelect = page.getByTestId('payment-method');
        await expect(paymentSelect).toBeVisible();

        const optionTexts = await paymentSelect.locator('option').allTextContents();

        expect(optionTexts).toEqual([
            'Choose your payment method',
            'Bank Transfer',
            'Cash on Delivery',
            'Credit Card',
            'Buy Now Pay Later',
            'Gift Card'
        ]);

    });
});