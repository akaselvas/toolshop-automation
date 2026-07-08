import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';


test.describe('Customer Profile', () => {
    let testEmail: string = '';
    let testPassword: string = '';

    test.beforeEach(async ({ page }) => {
        testEmail = `mfa-setup-${Date.now()}@example.com`;
        testPassword = 'AnyP@ssworld11!';

        const registerResponse = await page.request.post(`${apiURL}/users/register`, {
            data: {
                first_name: 'Jane', last_name: 'Doe',
                dob: '1990-01-01', phone: '1234567890',
                email: testEmail, password: testPassword,
                address: { street: 'Test Street 123', postal_code: '12345',
                    city: 'Test City', state: 'Test State', country: 'US' },
            },
        });
        expect(registerResponse.status()).toBe(201);

        await page.goto(baseURL +'/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account');

    });


    test('Profile page is accessible @sprint5 @AC1', async ({ page }) => {
        // Given I am logged in
        // When I navigate to my profile page
        // Then my current profile information is displayed. 
        await page.goto(baseURL +'/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({timeout: 10000});

        await expect(page.getByTestId('first-name')).toHaveValue('Jane');
        await expect(page.getByTestId('last-name')).toHaveValue('Doe');
        await expect(page.getByTestId('email')).toHaveValue(testEmail);
        await expect(page.getByTestId('street')).toHaveValue('Test Street 123');
        await expect(page.getByTestId('phone')).toHaveValue('1234567890');
        await expect(page.getByTestId('postal_code')).toHaveValue('12345');
        await expect(page.getByTestId('city')).toHaveValue('Test City');
        await expect(page.getByTestId('state')).toHaveValue('Test State');
        await expect(page.getByTestId('country')).toHaveValue('US');

    });

    test('Editable fields @sprint5 @AC2', async ({ page }) => {
        // Given the profile page is displayed
        // Then I can edit:
        // First name (required)    Last name (required)
        // Phone (required)     Street (required)
        // Postal code (required)     City (required)
        // State (required)     Country (required)
        await page.goto(baseURL +'/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({timeout: 10000});

        await expect(page.getByTestId('first-name')).toBeEditable();
        await expect(page.getByTestId('last-name')).toBeEditable();
        await expect(page.getByTestId('street')).toBeEditable();
        await expect(page.getByTestId('phone')).toBeEditable();
        await expect(page.getByTestId('postal_code')).toBeEditable();
        await expect(page.getByTestId('city')).toBeEditable();
        await expect(page.getByTestId('state')).toBeEditable();
        await expect(page.getByTestId('country')).toBeEditable();

    });

    
    test('Read-only email @sprint5 @AC3', async ({ page }) => {
        // Given the profile page is displayed
        // Then the email field is not editable. 
        await page.goto(baseURL +'/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({timeout: 10000});

        await expect(page.getByTestId('email')).not.toBeEditable();

    });


    test('Successful update @sprint5 @AC4', async ({ page }) => {
        await page.goto(baseURL + '/account/profile');

        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('first-name')).toHaveValue('Jane', { timeout: 10000 });

        await page.getByTestId('first-name').fill('Jane EDITED');
        await page.getByTestId('last-name').fill('Doe EDITED');

        await page.getByTestId('update-profile-submit').click();

        const alertMessage = page.getByRole('alert');
        await expect(alertMessage).toBeVisible({ timeout: 10000 });
        await expect(alertMessage).toContainText('Your profile is successfully updated!');

        await expect(page.getByTestId('first-name')).toHaveValue('Jane EDITED');
        await expect(page.getByTestId('last-name')).toHaveValue('Doe EDITED');

        await expect(alertMessage).toBeHidden({ timeout: 10000 });
    });

});