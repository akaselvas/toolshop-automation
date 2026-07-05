import { test, expect, Page, APIRequestContext } from '@playwright/test';
import * as OTPAuth from 'otpauth';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

let timeOffset = 0;

// Função geradora de TOTP (com sincronização de tempo do servidor)
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

// Registra um usuário, ativa o TOTP e desloga 
async function setupTotpUser(page: Page, request: APIRequestContext) {
    const testEmail = `mfa-login-user-${Date.now()}@example.com`;
    const testPassword = 'AnyPassword11!';

    const registerResponse = await request.post(`${apiURL}/users/register`, {
        data: {
            first_name: 'Jane', last_name: 'Doe', dob: '1990-01-01', phone: '1234567890',
            email: testEmail, password: testPassword,
            address: { street: 'Test Street', postal_code: '12345', city: 'Test City', state: 'Test State', country: 'US' }
        },
    });
    expect(registerResponse.status()).toBe(201);

    const serverDateHeader = registerResponse.headers()['date'];
    if (serverDateHeader) {
        timeOffset = new Date(serverDateHeader).getTime() - Date.now();
    }

    await page.goto(baseURL + '/auth/login');
    await page.getByTestId('email').fill(testEmail);
    await page.getByTestId('password').fill(testPassword);
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/account');

    await page.goto(`${baseURL}/account/profile`);
    const secretElement = page.getByTestId('totp-secret');
    await expect(secretElement).toBeVisible({ timeout: 15000 });
    const mfaSecret = (await secretElement.innerText()).trim();

    await page.getByTestId('totp-code').pressSequentially(generateTOTP(mfaSecret));
    
    const [totpResponse] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('totp') && resp.request().method() === 'POST'),
        page.getByTestId('verify-totp').click(),
    ]);
    expect(totpResponse.status()).toBeLessThan(300);

    await page.getByTestId('update-profile-submit').click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('nav-menu').click();
    await page.getByTestId('nav-sign-out').click();
    await page.waitForURL('**/auth/login');

    return { email: testEmail, password: testPassword, mfaSecret };
}


test.describe('User Login Suite', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL + '/auth/login');
        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible({ timeout: 10000 });
    });

    test('Login form @sprint5 @AC1', async ({ page }) => {
        // Given I navigate to the login page
        // Then email and password fields are displayed
        // And a "Sign in with Google" button is shown. 
        await expect(page.getByTestId('email')).toBeVisible();
        await expect(page.getByTestId('password')).toBeVisible();

        await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();

    });


    test('Successful login as Customer @sprint5 @AC2', async ({ page }) => {
        // Given I enter valid credentials
        // When I submit the form
        // Then I am redirected based on my role: /account for users 
        await page.getByTestId('email').fill('customer@practicesoftwaretesting.com');
        await page.getByTestId('password').fill('welcome01');
        await page.getByTestId('login-submit').click();
        await expect(page).toHaveURL(`${baseURL}/account`);
    });

    test('Successful login as Admin @sprint5 @AC2', async ({ page }) => {
        // Given I enter valid credentials
        // When I submit the form
        // Then I am redirected based on my role: /admin/dashboard for admins.
        await page.getByTestId('email').fill('admin@practicesoftwaretesting.com');
        await page.getByTestId('password').fill('welcome01');
        await page.getByTestId('login-submit').click();
        await expect(page).toHaveURL(`${baseURL}/admin/dashboard`);
    });


    test('Invalid credentials @sprint5 @AC3', async ({ page }) => {
        // Given I enter incorrect credentials
        // Then the error "Invalid email or password" is displayed. 
        await page.getByTestId('email').fill('any@email.com');
        await page.getByTestId('password').fill('welcome01');
        await page.getByTestId('login-submit').click();

        await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 });
        
    });


    test('Account locking after 3 failed attempts @sprint5 @AC4', async ({ page }) => {
        // Given I have entered incorrect credentials 3 times consecutively
        // When I try to log in again
        // Then the error "Account locked, too many failed attempts. Please contact the administrator." is displayed
        // And the API returns HTTP 423. 
        const testEmail = `locked-user-${Date.now()}@example.com`;
        const testPassword = 'AnyPassword11!';

        const registerResponse = await page.request.post(`${apiURL}/users/register`, {
            data: {
                first_name: 'Jane', last_name: 'Doe', dob: '1990-01-01',
                phone: '1234567890', email: testEmail, password: testPassword,
                address: {
                    street: 'Test Street 123', postal_code: '12345',
                    city: 'Test City', state: 'Test State', country: 'US',
                },
            },
        });
        expect(registerResponse.status()).toBe(201);

        const attemptLogin = async (expectedStatus) => {
            const responsePromise = page.waitForResponse(
                (res) => res.url().includes('/users/login') && res.status() === expectedStatus
            );
            await page.getByTestId('email').fill(testEmail);
            await page.getByTestId('password').fill('senha_errada_123');
            await page.getByTestId('login-submit').click();
            return responsePromise;
        };
        for (let i = 0; i < 3; i++) {
            await attemptLogin(401);
        }

        const response = await attemptLogin(423);
        expect(response.status()).toBe(423);
        await expect(
            page.getByText('Account locked, too many failed attempts. Please contact the administrator.')
        ).toBeVisible({ timeout: 10000 });

    });


    test('Admin accounts are exempt from locking @sprint5 @AC5', async ({ page }) => {
        // Given I am logging in as an admin
        // Then the account is never locked regardless of failed attempts. 
        const adminEmail = 'admin@practicesoftwaretesting.com';

        const attemptAdminLogin = async (password: string, expectedStatus: number) => {
            const responsePromise = page.waitForResponse(response => 
                response.url().includes('/users/login') && response.status() === expectedStatus
            );

            await page.getByTestId('email').fill(adminEmail);
            await page.getByTestId('password').fill(password);
            await page.getByTestId('login-submit').click();

            return responsePromise;
        };

        for (let i = 0; i < 3; i++) {
            await attemptAdminLogin('senha_errada', 401);
        }

        const response = await attemptAdminLogin('welcome01', 200);
        expect(response.status()).toBe(200);

        await expect(page).toHaveURL(`${baseURL}/admin/dashboard`);
    });

    
    test('Disabled account login attempt @sprint5 @AC6', async ({ page }) => {
        // Given my account has been disabled by an administrator
        // When I try to log in with valid credentials
        // Then the error "Account disabled." is displayed
        // And I am not authenticated. 
        const testEmail = `disabled-user-${Date.now()}@example.com`;
        const testPassword = 'AnyPassword11!';

        const registerResponse = await page.request.post(`${apiURL}/users/register`, {
            data: {
                first_name: 'Jane',  last_name: 'Doe', dob: '1990-01-01', 
                phone: '1234567890', email: testEmail, password: testPassword,
                address: { 
                    street: 'Test Street 123', postal_code: '12345', 
                    city: 'Test City', state: 'Test State', country: 'US' 
                },
            },
        });
        expect(registerResponse.status()).toBe(201);
        const userData = await registerResponse.json();
        const userId = userData.id;

        const adminLoginResponse = await page.request.post(`${apiURL}/users/login`, {
            data: {
                email: 'admin@practicesoftwaretesting.com',
                password: 'welcome01'
            }
        });
        expect(adminLoginResponse.status()).toBe(200);
        const { access_token } = await adminLoginResponse.json();

        const patchResponse = await page.request.patch(`${apiURL}/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${access_token}`
            },
            data: {
                enabled: false
            }
        });
        expect(patchResponse.status()).toBe(200);

        const responsePromise = page.waitForResponse(response => 
            response.url().includes('/users/login') && response.status() === 403
        );

        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();

        const response = await responsePromise;
        expect(response.status()).toBe(403);

        await expect(page.getByText('Account disabled')).toBeVisible({ timeout: 10000 });

    });


    test('Google social login @sprint5 @AC10', async ({ page }) => {
        // Given I click "Sign in with Google"
        // Then a popup (500x400px) opens for Google authentication
        // And on success, I am logged in and redirected to my account. 
        const popupPromise = page.waitForEvent('popup');

        await page.getByRole('button', { name: 'Sign in with Google' }).click();

        const popup = await popupPromise;

        await popup.waitForLoadState('domcontentloaded');

        const decodedUrl = decodeURIComponent(popup.url());

        expect(decodedUrl).toContain('accounts.google.com');
        expect(decodedUrl).toContain('auth/cb/google');

        const popupWidth = await popup.evaluate(() => window.outerWidth || window.innerWidth);
        const popupHeight = await popup.evaluate(() => window.outerHeight || window.innerHeight);

        expect(popupWidth).toBeGreaterThanOrEqual(360);
        expect(popupWidth).toBeLessThanOrEqual(440);
        
        expect(popupHeight).toBeGreaterThanOrEqual(460);
        expect(popupHeight).toBeLessThanOrEqual(550); 
    });

});

test('TOTP prompt @sprint5 @AC7', async ({ page, request }) => {
    // Given I have TOTP enabled on my account
    // When I submit valid email and password
    // Then a 6-digit TOTP input field is displayed. 
    const mfaUser = await setupTotpUser(page, request);

    await page.getByTestId('email').fill(mfaUser.email);
    await page.getByTestId('password').fill(mfaUser.password);
    await page.getByTestId('login-submit').click();

    const totpChallenge = page.getByTestId('totp-code');
    await expect(totpChallenge).toBeVisible({ timeout: 10000 });
});


 test('Valid TOTP code @sprint5 @AC8', async ({ page, request }) => {
    // Given I enter a valid TOTP code
    // Then I am fully authenticated and redirected. 
    const mfaUser = await setupTotpUser(page, request);

    await page.getByTestId('email').fill(mfaUser.email);
    await page.getByTestId('password').fill(mfaUser.password);
    await page.getByTestId('login-submit').click();

    const totpChallenge = page.getByTestId('totp-code');
    await expect(totpChallenge).toBeVisible({ timeout: 10000 });
    await totpChallenge.pressSequentially(generateTOTP(mfaUser.mfaSecret));
    await page.getByTestId('verify-totp').click();

    await expect(page).toHaveURL(baseURL +'/account', { timeout: 15000 });
});


test('Invalid TOTP code @sprint5 @AC9', async ({ page, request }) => {
    // Given I enter an incorrect TOTP code
    // Then the error "Invalid TOTP" is displayed. 
    const mfaUser = await setupTotpUser(page, request);

    await page.getByTestId('email').fill(mfaUser.email);
    await page.getByTestId('password').fill(mfaUser.password);
    await page.getByTestId('login-submit').click();

    const totpChallenge = page.getByTestId('totp-code');
    await expect(totpChallenge).toBeVisible({ timeout: 10000 });
    await totpChallenge.pressSequentially('000000');
    await page.getByTestId('verify-totp').click();

    await expect(page.getByText('Invalid TOTP')).toBeVisible({ timeout: 10000 });

});