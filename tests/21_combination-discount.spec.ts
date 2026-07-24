import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

test.describe('Combination Discount', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);
        await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

        const firstProductImg = page.locator('img.card-img-top').first();
        await expect(firstProductImg).toBeVisible({ timeout: 15000 });
        await firstProductImg.click();
        await page.waitForURL('**/product/**', { timeout: 15000 });
        const addBtn = page.getByTestId('add-to-cart');
        await expect(addBtn).toBeVisible({ timeout: 10000 });
        await addBtn.click();
        await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });

        await page.goto(baseURL + '/rentals');
        const firstRentalCard = page.locator('.card.mb-3').first();
        await expect(firstRentalCard).toBeVisible({ timeout: 15000 });
        await firstRentalCard.click();
        await page.waitForURL('**/product/**', { timeout: 15000 });
        await expect(addBtn).toBeVisible({ timeout: 10000 });
        await addBtn.click();
        await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });

        await page.getByTestId('nav-cart').click();
        await page.waitForURL('**/checkout', { timeout: 20000 });
    });


    test('Combination discount applied @sprint5 @AC1', async ({ page }) => {
        // Given my cart contains at least one rental item and at least one non-rental item
        // Then an additional 15% discount is applied to the cart subtotal. 
        await expect(page.getByTestId('cart-subtotal')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('cart-discount')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('cart-total')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Discount (15%)')).toBeVisible({ timeout: 10000 });
        

    });


    test('Discount display in cart @sprint5 @AC2', async ({ page }) => {
        // Given the combination discount is applied
        // Then the cart shows the subtotal, 
        // discount percentage (15%), discount amount, and final total. 
        await expect(page.getByTestId('cart-subtotal')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('cart-discount')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('cart-total')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Discount (15%)')).toBeVisible({ timeout: 10000 });
        
        const subtotalText = await page.getByTestId('cart-subtotal').innerText();
        const subtotal = parseFloat(subtotalText.replace('$', ''));
        
        const discountText = await page.getByTestId('cart-discount').innerText();
        const discount = parseFloat(discountText.replace('$', '').replace('-', ''));
        
        const totalText = await page.getByTestId('cart-total').innerText();
        const total = parseFloat(totalText.replace('$', ''));
        
        expect(discount).toBeCloseTo(subtotal * 0.15, 2);
        expect(total).toBeCloseTo(subtotal - discount, 2);

    });


    test('Discount removed when condition no longer met @sprint5 @AC3', async ({ page }) => {
        // Given I remove all rental items or all non-rental items from my cart
        // Then the 15% combination discount is removed
        // And the total reverts to the regular subtotal. 
        await expect(page.getByTestId('cart-subtotal')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('cart-discount')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('cart-total')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Discount (15%)')).toBeVisible({ timeout: 10000 });
        
        const delButton = page.locator('.btn.btn-danger').first();
        await expect(delButton).toBeVisible();
        await delButton.click();

        await expect(page.locator('.btn.btn-danger')).toHaveCount(1, { timeout: 15000 });

        await expect(page.getByText('Discount (15%)')).toBeHidden();

    });


    test('Discount on invoice  @sprint5 @AC4', async ({ page }) => {
        // Given I complete checkout with the combination discount applied
        // Then the invoice shows the subtotal, the 15% discount amount, and the final total. 
        
        let testEmail: string;
        let testPassword: string;
        let authToken: string;
        
        testEmail = `invoice-user-${Date.now()}@example.com`;
        testPassword = 'AnyP@ssworld11!';

        const registerResponse = await page.request.post(apiURL + '/users/register', {
            data: {
                first_name: 'Jane', last_name: 'Doe', dob: '1990-01-01', phone: '1234567890',
                email: testEmail, password: testPassword,
                address: { street: 'Test Street 123', postal_code: '12345', city: 'Test City', state: 'Test State', country: 'US' },
            },
        });
        expect(registerResponse.status()).toBe(201);
        
        // login via API, não via UI — não precisa nem abrir o navegador ainda
        const loginResponse = await page.request.post(apiURL + '/users/login', {
            data: { email: testEmail, password: testPassword },
        });
        expect(loginResponse.status()).toBe(200);
        const loginBody = await loginResponse.json();
        authToken = loginBody.access_token; // não 'token'

        const authHeaders = { Authorization: `Bearer ${authToken}` };
        
        const regularProductsRes = await page.request.get(apiURL + '/products?is_rental=false');
        const regularProducts = await regularProductsRes.json();
        const regularProductId = regularProducts.data[0].id;
        
        const rentalProductsRes = await page.request.get(apiURL + '/products?is_rental=true');
        const rentalProducts = await rentalProductsRes.json();
        const rentalProductId = rentalProducts.data[0].id;
        
        const cartRes = await page.request.post(apiURL + '/carts', { headers: authHeaders, data: {} });
        expect(cartRes.status()).toBe(201);
        const { id: cartId } = await cartRes.json();
        
        await page.request.post(apiURL + '/carts/' + cartId, {
            headers: authHeaders, data: { product_id: regularProductId, quantity: 1 },
        });
        await page.request.post(apiURL + '/carts/' + cartId, {
            headers: authHeaders, data: { product_id: rentalProductId, quantity: 1 },
        });
        
        const invoiceRes = await page.request.post(apiURL + '/invoices', {
            headers: authHeaders,
            data: {
                cart_id: cartId,
                billing_street: 'Autarboulevard',
                billing_city: 'Stroe',
                billing_state: 'Groningen',
                billing_postal_code: '1011AB',
                billing_country: 'NL',
                payment_method: 'credit-card',
                payment_details: {
                    credit_card_number: '1234-5678-9012-3456',
                    expiration_date: '12/2030',
                    cvv: '123',
                    card_holder_name: 'Jane Doe',
                },
            },
        });
        expect(invoiceRes.status(), await invoiceRes.text()).toBe(201);
        const invoiceBody = await invoiceRes.json();
        expect(invoiceBody.additional_discount_percentage).toBe(15);
        
        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account', { timeout: 20000, waitUntil: 'commit' }); // fix

        
        await page.goto(baseURL + '/account/invoices/' + invoiceBody.id, { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('invoice-number')).toHaveValue(invoiceBody.invoice_number, { timeout: 25000 });
        
        const subtotal = parseFloat((await page.locator('#subtotal').inputValue()).replace('$', '').trim());
        const discount = parseFloat((await page.locator('#additional_discount_percentage').inputValue()).replace('$', '').trim());
        const total = parseFloat((await page.locator('#total').inputValue()).replace('$', '').trim());
        
        await expect(page.getByText(`Discount (${invoiceBody.additional_discount_percentage}%)`)).toBeVisible();
        expect(discount).toBeCloseTo(subtotal * 0.15, 2);
        expect(total).toBeCloseTo(subtotal - discount, 2);

    });



});