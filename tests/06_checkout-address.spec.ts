import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

test.describe('checkout address', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    
        await expect(page.locator('.card-img-top').first()).toBeVisible({timeout:10000});
        const firstCard = page.locator('.card').first();
        await firstCard.click();
        await page.waitForURL('**/product/**')
    
        const addButton = page.getByTestId('add-to-cart');
        await addButton.click();
        await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });
    
        const cartButton = page.getByTestId('nav-cart');
        await cartButton.click();

        await page.waitForURL('**/checkout')

        await expect(page.locator('.btn.btn-danger')).toBeVisible({timeout:10000});
        await page.getByTestId('proceed-1').click();

        await page.getByRole('tab', { name: 'Continue as Guest' }).click();
        await page.getByTestId('guest-email').fill('guest@example.com');
        await page.getByTestId('guest-first-name').fill('Jane');
        await page.getByTestId('guest-last-name').fill('Doe');
        await page.getByTestId('guest-submit').click();

        await expect(page.getByText('Continuing as guest: Jane Doe')).toBeVisible({ timeout: 10000 });

        await page.getByTestId('proceed-2-guest').click();
   
    });

    test('Address form fields @sprint5 @AC1', async ({ page }) => {
        // Given I am on the billing address step
        // Then the following required fields are displayed:
        // Street (max 70 characters)
        // City (max 40 characters)
        // State (max 40 characters)
        // Country (max 40 characters) ||  This can't be done, is a dropdown menu
        // Postal code (max 10 characters)

        await expect(page.getByRole('heading', { name: 'Billing Address' })).toBeVisible({ timeout: 10000 });

        await expect(page.getByTestId('street')).toBeVisible();
        await expect(page.getByTestId('city')).toBeVisible();
        await expect(page.getByTestId('state')).toBeVisible();
        await expect(page.getByTestId('country')).toBeVisible();
        await expect(page.getByTestId('postal_code')).toBeVisible();

        const streetInput = page.getByTestId('street');
        await streetInput.fill('123 Any Street with Seventy One Characters Test Avenue, Unit X Block B1'); 
        await streetInput.blur();
        await expect(streetInput).toHaveClass(/ng-invalid/);

        const cityInput = page.getByTestId('city');
        await cityInput.fill('Any Fictional City With More Than Forty Characters'); 
        await cityInput.blur();
        await expect(cityInput).toHaveClass(/ng-invalid/);

        const stateInput = page.getByTestId('state');
        await stateInput.fill('Any Fictional State With More Than Forty Characterst'); 
        await stateInput.blur();
        await expect(stateInput).toHaveClass(/ng-invalid/);

        const postalInput = page.getByTestId('postal_code');
        await postalInput.fill('12345678901'); 
        await postalInput.blur();
        await expect(postalInput).toHaveClass(/ng-invalid/);
    
    });

    
    test('Validation @sprint5 @AC2', async ({ page }) => {
        // Given I leave a required field empty
        // Then the field is highlighted as invalid
        // And the "Proceed" button is disabled. 
        await expect(page.getByRole('heading', { name: 'Billing Address' })).toBeVisible({ timeout: 10000 });

        await expect(page.getByTestId('country')).toBeVisible();
        await expect(page.getByTestId('postal_code')).toBeVisible();
        await expect(page.getByTestId('house_number')).toBeVisible();
        await expect(page.getByTestId('street')).toBeVisible();
        await expect(page.getByTestId('city')).toBeVisible();
        await expect(page.getByTestId('state')).toBeVisible();

        await page.getByTestId('country').selectOption({ index: 1 });

        const postalInput = page.getByTestId('postal_code');
        await postalInput.fill('123456789'); 
        await postalInput.blur();
        await expect(postalInput).not.toHaveClass(/ng-invalid/);

        const houseNumberInput = page.getByTestId('house_number');
        await houseNumberInput.fill('123'); 
        await houseNumberInput.blur();
        await expect(houseNumberInput).not.toHaveClass(/ng-invalid/);
        
        const streetInput = page.getByTestId('street');
        await streetInput.fill('123 Any Street Test Avenue'); 
        await streetInput.blur();
        await expect(streetInput).not.toHaveClass(/ng-invalid/);

        const cityInput = page.getByTestId('city');
        await cityInput.fill('Any Fictional City'); 
        await cityInput.blur();
        await expect(cityInput).not.toHaveClass(/ng-invalid/);

        const stateInput = page.getByTestId('state');
        await stateInput.blur();
        await expect(stateInput).toHaveClass(/ng-invalid/);

        await expect(page.getByTestId('proceed-3')).toBeDisabled();
    
    });


    test('Validation @sprint5 @AC3', async ({ page }) => {
        // Given I leave a required field empty
        // Then the field is highlighted as invalid
        // And the "Proceed" button is disabled. 
        await expect(page.getByRole('heading', { name: 'Billing Address' })).toBeVisible({ timeout: 10000 });

        await expect(page.getByTestId('country')).toBeVisible();
        await expect(page.getByTestId('postal_code')).toBeVisible();
        await expect(page.getByTestId('house_number')).toBeVisible();
        await expect(page.getByTestId('street')).toBeVisible();
        await expect(page.getByTestId('city')).toBeVisible();
        await expect(page.getByTestId('state')).toBeVisible();

        await page.getByTestId('country').selectOption({ index: 1 });

        const postalInput = page.getByTestId('postal_code');
        await postalInput.fill('123456789'); 
        await postalInput.blur();
        await expect(postalInput).not.toHaveClass(/ng-invalid/);

        const houseNumberInput = page.getByTestId('house_number');
        await houseNumberInput.fill('123'); 
        await houseNumberInput.blur();
        await expect(houseNumberInput).not.toHaveClass(/ng-invalid/);
        
        const streetInput = page.getByTestId('street');
        await streetInput.fill('123 Any Street Test Avenue'); 
        await streetInput.blur();
        await expect(streetInput).not.toHaveClass(/ng-invalid/);

        const cityInput = page.getByTestId('city');
        await cityInput.fill('Any Fictional City'); 
        await cityInput.blur();
        await expect(cityInput).not.toHaveClass(/ng-invalid/);

        const stateInput = page.getByTestId('state');
        await stateInput.fill('Any State'); 
        await stateInput.blur();
        await expect(stateInput).not.toHaveClass(/ng-invalid/);

        await page.getByTestId('proceed-3').click();

        await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible({ timeout: 10000 });
    
    });
});


test('Pre-fill for logged-in users @sprint5 @AC4', async ({ page }) => {
    
    test.fixme(true, 'Ignorando devido a bug');

    const testEmail = `addr-user-${Date.now()}@example.com`;
    const testPassword = 'AnyPassworld11!';
    const address = {
        street: 'Test Street 123', postal_code: '12345',
        city: 'Test City', state: 'Test State', country: 'US',
    };

    const registerUser = await page.request.post(`${apiURL}/users/register`, {
        data: {
        first_name: 'Jane', last_name: 'Doe', dob: '1990-01-01', phone: '1234567890',
        email: testEmail, password: testPassword, address,
        },
    });
    expect(registerUser.status()).toBe(201);

    await page.goto(`${baseURL}/auth/login`);
    await page.getByTestId('email').fill(testEmail);
    await page.getByTestId('password').fill(testPassword);
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/account');

    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.card-img-top').first()).toBeVisible({ timeout: 15000 });
    await page.locator('.card').first().click();
    await page.waitForURL('**/product/**');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('nav-cart').click();
    await page.waitForURL('**/checkout');
    await page.getByTestId('proceed-1').click();

    await expect(page.getByText('Hello Jane Doe, you are already logged in')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('proceed-2').click();

    // AC4: aqui é onde o pre-fill deveria acontecer, mas te erro
    await expect(page.getByTestId('street')).toHaveValue(address.street, { timeout: 10000 });
    await expect(page.getByTestId('postal_code')).toHaveValue(address.postal_code);
    await expect(page.getByTestId('city')).toHaveValue(address.city);
    await expect(page.getByTestId('state')).toHaveValue(address.state);
});


