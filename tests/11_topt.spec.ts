import { test, expect } from '@playwright/test';
import * as OTPAuth from 'otpauth';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

// armazena a diferença de relógio com o servidor
let timeOffset = 0;

// gera o totp com o horário do servidor
function generateTOTP(secret: string): string {
    const adjustedTime = Date.now() + timeOffset;
    const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
        digits: 6,
        algorithm: 'SHA1',
        period: 30,
    });
    return totp.generate({ timestamp: adjustedTime });
}

test.describe('Two-Factor Authentication Setup', () => {
    let testEmail, testPassword;

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

         // sincroniza relógio local com o do servidor (mesmo padrão do teste de checkout)
        const serverDateHeader = registerResponse.headers()['date'];
        if (serverDateHeader) {
            timeOffset = new Date(serverDateHeader).getTime() - Date.now();
        }

        await page.goto(baseURL +'/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account');

        await page.goto(baseURL +'/account/profile');

    });


    test('TOTP setup section @sprint5 @AC1', async ({ page }) => {
        // Given I am on my profile page
        // Then a "Setup two factor authentication" section is displayed. 
        await expect(page.getByText('Set up Two-Factor Authentication')).toBeVisible();

    });


    test('QR code displayed @sprint5 @AC2', async ({ page }) => {
        // Given the TOTP setup section is shown
        // Then a QR code is displayed that I can scan with my authenticator app. 
        await expect(page.locator('.qrcode canvas')).toBeVisible(); 

    });


    test('Manual secret entry @sprint5 @AC3', async ({ page }) => {
        // Given the TOTP setup section is shown
        // Then the secret key is also displayed as text for manual entry. 
        const secretElement = page.getByTestId('totp-secret');
        await expect(secretElement).toBeVisible();

        expect((await secretElement.innerText()).trim().length).toBeGreaterThan(0);
    });


    test('Verification @sprint5 @AC4', async ({ page }) => {
        // Given I enter a valid 6-digit code from my authenticator app
        // When I click "Verify TOTP"
        // Then the message "TOTP verified and enabled successfully." is displayed. 
        const secretElement = page.getByTestId('totp-secret');
        
        await expect(secretElement).not.toBeEmpty({ timeout: 15000 });
        const mfaSecret = (await secretElement.innerText()).trim();

        console.log(`[DEBUG] Time Offset de sincronização: ${timeOffset}ms`);

        const totpCode = generateTOTP(mfaSecret);
        await page.getByTestId('totp-code').fill(totpCode);
        await page.getByTestId('verify-totp').click();

        await page.getByTestId('update-profile-submit').click();

        await expect(page.getByText('TOTP verified and enabled successfully.'))
            .toBeVisible({ timeout: 15000 });

    });

    test('Invalid TOTP code @sprint5 @AC5', async ({ page }) => {
        // Given I enter an incorrect code
        // Then an error message is displayed. 
        await page.getByTestId('totp-code').pressSequentially('000000');
        await page.getByTestId('verify-totp').click();

        await expect(page.getByText(/error/i)).toBeVisible(); 

    });

});

    
test('Restricted for test accounts @sprint5 @AC6', async ({ page }) => {
    // Given I am logged in as 
    // customer@practicesoftwaretesting.com or admin@practicesoftwaretesting.com
    // Then TOTP setup is denied with
    //  "Access denied: If you want to configure TOTP, please create your own account." 
    await page.goto(baseURL +'/auth/login');
    await page.getByTestId('email').fill('customer@practicesoftwaretesting.com');
    await page.getByTestId('password').fill('welcome01');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/account');

    await page.goto(baseURL +'/account/profile');
    
    await expect(page.getByText('Access denied: If you want to configure TOTP, please create your own account.'))
            .toBeVisible({ timeout: 15000 });

});