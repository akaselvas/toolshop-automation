import { test, expect } from '@playwright/test';
import * as OTPAuth from 'otpauth';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

// AC3: armazena a diferença de relógio com o servidor
let timeOffset = 0;

// AC3: gera o totp com o horário do servidor
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


test.describe('checkout sign-in', () => {
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
    });


    test('Login step displayed for guests @sprint5 @AC1', async({page}) => {
        // Given I am not logged in
        // And I am on the checkout page
        // When I click "Proceed to Checkout" from the cart step
        // Then a login form is displayed as the next step in the checkout wizard. 
        const proceedButton = page.getByTestId('proceed-1');
        await expect(proceedButton).toBeVisible({ timeout: 10000 });
        await proceedButton.click();
        
        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible({ timeout: 10000 });

    })

    test('Login form fields @sprint5 @AC2', async({page}) => {
        // Given the checkout login step is displayed
        // Then email and password fields are shown
        // And a submit button is available. 
        const proceedButton = page.getByTestId('proceed-1');;
        await expect(proceedButton).toBeVisible({ timeout: 10000 });
        await proceedButton.click();
        
        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('email')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('password')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('login-submit')).toBeVisible({ timeout: 10000 });

    })

});


test('TOTP support during checkout login @sprint5 @AC3 + @AC4', async ({ page }) => {
    // Given I have TOTP enabled on my account
    // When I submit valid email and password on the checkout login step
    // Then a 6-digit TOTP input field is displayed
    // And I must enter a valid TOTP code to proceed. 
    test.setTimeout(60000);

    const testEmail = `mfa-user-${Date.now()}@example.com`;
    const testPassword = 'AnyPassworld11!';

    // novo usuário via API
    const registerResponse = await page.request.post(`${apiURL}/users/register`, {
        data: {
        first_name: 'Jane', 
        last_name: 'Doe',
        dob: '1990-01-01', 
        phone: '1234567890',
        email: testEmail, 
        password: testPassword,
        address: { street: 'Test Street 123', 
            postal_code: '12345', 
            city: 'Test City', 
            state: 'Test State', 
            country: 'US' },
        },
    });
    expect(registerResponse.status()).toBe(201);

    // sincroniza o relógio do teste com o do servidor 
    // para evitar rejeição de tokens do 2FA por diferença de tempo
    const serverDateHeader = registerResponse.headers()['date'];
    if (serverDateHeader) {
        timeOffset = new Date(serverDateHeader).getTime() - Date.now();
    }

    // login
    await page.goto(`${baseURL}/auth/login`);
    await page.getByTestId('email').fill(testEmail);
    await page.getByTestId('password').fill(testPassword);
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/account');

    // ativa totp
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

    // logout
    await page.getByTestId('nav-menu').click();
    await page.getByTestId('nav-sign-out').click();
    await page.waitForURL('**/auth/login');

    // compra um produto
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.card-img-top').first()).toBeVisible({ timeout: 15000 });
    await page.locator('.card').first().click();
    await page.waitForURL('**/product/**');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('nav-cart').click();
    await page.waitForURL('**/checkout');
    await page.getByTestId('proceed-1').click();

    // login pra checkout  + @AC4:
    // Given I enter valid credentials on the checkout login step
    // When I submit the form
    // Then I am authenticated
    // And I can proceed to the billing address step. 

    await page.getByTestId('email').fill(testEmail);
    await page.getByTestId('password').fill(testPassword);
    await page.getByTestId('login-submit').click();

    // totp-code
    const totpChallenge = page.getByTestId('totp-code');
    await expect(totpChallenge).toBeVisible({ timeout: 15000 });

    // inserir e verifica totp code
    await totpChallenge.fill('');
    await totpChallenge.pressSequentially(generateTOTP(mfaSecret));
    await page.getByTestId('verify-totp').click();

    // verificar login
    const proceedButton = page.getByTestId('proceed-2');
    await expect(proceedButton).toBeVisible({ timeout: 15000 });
    await expect(proceedButton).toBeEnabled();
    await proceedButton.click();

    await expect(page.locator('li.current')).toContainText('Billing Address', { timeout: 15000 });

});

test('Already logged in during checkout @sprint5 @AC5', async ({ page }) => {
    await page.goto(`${baseURL}/auth/login`);
    await page.getByTestId('email').fill('customer@practicesoftwaretesting.com');
    await page.getByTestId('password').fill('welcome01');
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

});
