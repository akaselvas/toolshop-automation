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

        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);

        const loginResponsePromise = page.waitForResponse(
            r => r.url().includes('/users/login') && r.request().method() === 'POST',
            { timeout: 20000 }
        );
        await page.getByTestId('login-submit').click();
        await loginResponsePromise;

        await page.waitForURL('**/account', { timeout: 20000 });

        await page.goto(baseURL + '/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 15000 });

    });


    test('Change password form @sprint5 @AC1', async ({ page }) => {
        // Given I am on my profile page
        // Then a change password section is displayed with:
        // Current password (required)
        // New password (required)
        // Confirm new password (required)
        await page.goto(baseURL + '/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });

        await expect(page.getByTestId('current-password')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('new-password')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('new-password-confirm')).toBeVisible({ timeout: 10000 });

    });


    test('Password strength indicator @sprint5 @AC2', async ({ page }) => {
        // Given I enter a new password
        // Then the same password strength indicator as registration is displayed
        // With the same 5 strength levels and visual progress bar.

        await page.goto(baseURL + '/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });

        await expect(page.getByTestId('current-password')).toBeVisible({ timeout: 10000 });

        const strengthTestCases = [
            { password: 'a',            label: 'Weak',        width: '20%' },
            { password: 'aB',           label: 'Moderate',     width: '40%' },
            { password: 'aB1',          label: 'Strong',       width: '60%' },
            { password: 'aB1!',         label: 'Very Strong',  width: '80%' },
            { password: 'aB1!aaaaaaaa', label: 'Excellent',    width: '100%' },
        ];

        // Aponta para o campo de NOVA senha [15]
        const newPasswordFill = page.getByTestId('new-password');
        for (const testPassword of strengthTestCases) {
            await newPasswordFill.fill('');
            await newPasswordFill.pressSequentially(testPassword.password);
            await expect(page.locator('.strength-labels span.active')).toHaveText(testPassword.label);
            await expect(page.locator('.strength-bar .fill')).toHaveAttribute('style', `width: ${testPassword.width};`);
        }
    });


    test('Passwords must match @sprint5 @AC3', async ({ page }) => {
        // Given the new password and confirmation do not match
        // Then the error "Passwords do not match." is displayed. 
        await page.goto(baseURL + '/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('first-name')).toHaveValue('Jane', { timeout: 10000 });

        await page.getByTestId('current-password').fill(testPassword); 
        await page.getByTestId('new-password').fill('AnyP@ssworld22!');
        await page.getByTestId('new-password-confirm').fill('AnyP@ssworld33!');

        const submitBtn = page.getByTestId('change-password-submit');
        await expect(submitBtn).toBeEnabled({ timeout: 10000 });
        await submitBtn.click();

        const alertMessage = page.locator('.alert-danger[role="alert"]');
        await expect(alertMessage).toBeVisible({ timeout: 15000 });

    });


    test('Current password verification @sprint5 @AC4', async ({ page }) => {
        // Given I enter an incorrect current password
        // When I submit the form
        // Then the error "Your current password does not matches with the password." is displayed. 

        await page.goto(baseURL + '/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('first-name')).toHaveValue('Jane', { timeout: 10000 });

        await page.getByTestId('current-password').fill('testPassword'); 
        await page.getByTestId('new-password').fill('AnyP@ssworld22!');
        await page.getByTestId('new-password-confirm').fill('AnyP@ssworld33!');

        const submitBtn = page.getByTestId('change-password-submit');
        await expect(submitBtn).toBeEnabled({ timeout: 10000 });
        await submitBtn.click();

        const alertMessage = page.locator('.alert-danger[role="alert"]');
        await expect(alertMessage).toBeVisible({ timeout: 15000 });

        await expect(page.getByText('Your current password does not matches with the password.')).toBeVisible({ timeout: 10000 });

    });


    test('New password must differ @sprint5 @AC5', async ({ page }) => {
        // Given I enter a new password identical to the current one
        // When I submit the form
        // Then the error "New Password cannot be same as your current password." is displayed. 
        await page.goto(baseURL + '/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('first-name')).toHaveValue('Jane', { timeout: 10000 });

        await page.getByTestId('current-password').fill(testPassword); 
        await page.getByTestId('new-password').fill(testPassword);
        await page.getByTestId('new-password-confirm').fill(testPassword);

        const submitBtn = page.getByTestId('change-password-submit');
        await expect(submitBtn).toBeEnabled({ timeout: 10000 });

        await submitBtn.click();

        const alertMessage = page.locator('.alert-danger[role="alert"]');
        await expect(alertMessage).toBeVisible({ timeout: 15000 });

        await expect(page.getByText('New Password cannot be same as your current password.')).toBeVisible({ timeout: 10000 });

    });


    test('Successful change @sprint5 @AC6', async ({ page }) => {
        // Given I provide a valid current password and a new password that matches the confirmation
        // When I submit the form
        // Then a success message is displayed
        // And I am logged out after 5 seconds. 
        await page.goto(baseURL + '/account/profile');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('first-name')).toHaveValue('Jane', { timeout: 10000 });

        await page.getByTestId('current-password').fill(testPassword);
        await page.getByTestId('new-password').fill('AnyP@ssworld22!');
        await page.getByTestId('new-password-confirm').fill('AnyP@ssworld22!');

        const submitBtn = page.getByTestId('change-password-submit');
        await expect(submitBtn).toBeEnabled({ timeout: 10000 });

        const responsePromise = page.waitForResponse(
            r => r.url().includes('/change-password') && r.request().method() === 'POST',
            { timeout: 15000 }
        );

        await submitBtn.click();
        
        // diagnóstico: confirma resposta da API e conteúdo real do alerta
        const response = await responsePromise;
        console.log('STATUS:', response.status());
        console.log('BODY:', await response.text());
        const anyAlert = page.locator('[role="alert"]');
        await expect(anyAlert).toBeVisible({ timeout: 15000 });
        const alertHtml = await anyAlert.evaluate(el => el.outerHTML);
        console.log('HTML DO ALERTA:', alertHtml);
        const alertText = await anyAlert.textContent();
        console.log('TEXTO DO ALERTA:', alertText);

        await expect(anyAlert).toHaveClass(/alert-success/);
        await expect.poll(() => page.url(), { timeout: 20000 }).toContain('/auth/login');

    });

});
