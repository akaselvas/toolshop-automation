import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

// SUÍTE 1: PROCESSOS DE CHECKOUT / DESCONTOS DINÂMICOS
test.describe('Invoices | Dynamic Checkout Flow', () => {
    let testEmail: string;
    let testPassword: string;
    let authToken: string;

    test.beforeEach(async ({ page }) => {
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
    });


    test('Non-existent invoice @sprint5 @AC3', async ({ page }) => {
        // Given the invoice does not exist or does not belong to me
        // Then a "not found" message is displayed. 
         const adminLoginRes = await page.request.post(apiURL + '/users/login', {
            data: {
                email: 'admin@practicesoftwaretesting.com',
                password: 'welcome01'
            }
        });
        expect(adminLoginRes.status()).toBe(200);
        const adminBody = await adminLoginRes.json();
        const adminToken = adminBody.access_token;

        // 2. Busca as faturas do sistema usando page.request [44]
        const invoicesRes = await page.request.get(apiURL + '/invoices', {
            headers: { Authorization: 'Bearer ' + adminToken }
        });
        expect(invoicesRes.status()).toBe(200);
        const invoicesData = await invoicesRes.json();
        
        // Pega o ID de uma fatura real de outro usuário
        const someoneElsesInvoiceId = invoicesData.data[0].id;

        // 3. Faz o login visual na UI do nosso usuário dinâmico [16]
        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account', { timeout: 20000 });

        // 4. Tenta acessar a fatura de outro usuário de forma forçada na UI [1.1.2]
        await page.goto(baseURL + '/account/invoices/' + someoneElsesInvoiceId);

        // 5. Valida se o sistema barrou o acesso e exibiu a mensagem de erro [1.1.2, 12]
        await expect(page.getByText("This invoice doesn't exist.")).toBeVisible({ timeout: 10000 });
    });


    test('Discount on invoice @sprint5 @AC4', async ({ page }) => {
        // Given the invoice has a discount
        // Then the detail page shows the 
        // subtotal, discount percentage and amount, and final total. 
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
        await page.waitForURL('**/account', { timeout: 20000 });

        await page.goto(baseURL + '/account/invoices/' + invoiceBody.id, { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('invoice-number')).toHaveValue(invoiceBody.invoice_number, { timeout: 25000 });

        const subtotal = parseFloat((await page.locator('#subtotal').inputValue()).replace('$', '').trim());
        const discount = parseFloat((await page.locator('#additional_discount_percentage').inputValue()).replace('$', '').trim());
        const total = parseFloat((await page.locator('#total').inputValue()).replace('$', '').trim());

        await expect(page.getByText(`Discount (${invoiceBody.additional_discount_percentage}%)`)).toBeVisible();
        expect(discount).toBeCloseTo(subtotal * 0.15, 2);
        expect(total).toBeCloseTo(subtotal - discount, 2);


    });
    

    test('Discounted line items @sprint5 @AC5', async ({ page }) => {
        // Given a line item has a discount
        // Then the original price is shown with a strikethrough and the discounted price below. 
        const mockInvoiceWithLineDiscount = {
            id: "fake-line-discount-invoice",
            invoice_number: "INV-2026-LINE-DISCOUNT",
            invoice_date: "2026-07-10 12:00:00",
            billing_street: "Test Street 123",
            billing_city: "Test City",
            billing_state: "Test State",
            billing_postal_code: "12345",
            billing_country: "US",
            subtotal: 100.00,
            total: 80.00,
            payment: {
                payment_method: "credit-card",
                payment_details: {
                    card_holder_name: "Jane Doe",
                    credit_card_number: "4111********1111"
                }
            },
            invoicelines: [
                {
                    id: "line-1",
                    unit_price: 100.00,
                    quantity: 1,
                    discount_percentage: 20,
                    discounted_price: 80.00,
                    product: {
                        name: "Discounted Bolt Cutters",
                        price: 100.00
                    }
                }
            ]
        };

        await page.route(apiURL + '/invoices/fake-line-discount-invoice', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockInvoiceWithLineDiscount)
            });
        });

        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account', { timeout: 20000 });

        await page.goto(baseURL + '/account/invoices/fake-line-discount-invoice');
        await expect(page.getByTestId('invoice-number')).toHaveValue(mockInvoiceWithLineDiscount.invoice_number, { timeout: 15000 });

        await expect(page.getByText('-20%')).toBeVisible();

        const originalPrice = page.locator('span.discounted').first();
        await expect(originalPrice).toBeVisible();
        await expect(originalPrice).toContainText('100.00');

        const discountedPrice = page.locator('#discount-price').last();
        await expect(discountedPrice).toBeVisible();
        await expect(discountedPrice).toContainText('80');
    });


});
    

test.describe('Invoices | Read Only', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill('customer@practicesoftwaretesting.com');
        await page.getByTestId('password').fill('welcome01');
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account', { timeout: 20000 });

        await page.goto(baseURL + '/account/invoices');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
    });


    test('Invoice list @sprint5 @AC1', async ({ page }) => {  
        // Given I am logged in
        // When I navigate to my invoices page
        // Then a paginated table is displayed with columns: 
        // invoice number, billing street, invoice date, total, and a details link. 

        await expect(page.getByRole('columnheader', { name: 'Invoice Number' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Billing Address' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Invoice Date' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
        
        await expect(page.locator('table th').last()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Details' }).first()).toBeVisible();

    });


    test('Invoice detail @sprint5 @AC2', async ({ page }) => {
        // Given I click on an invoice
        // Then the detail page shows:
        // invoice number, date, and total
        // billing address (street, postal code, city, state, country)
        // payment method and details
        // product line items (quantity, name, price, line total)
        const firstDetailBtn = page.getByRole('link', { name: 'Details' }).first();
        await expect(firstDetailBtn).toBeVisible();

        const invoiceLink = await firstDetailBtn.getAttribute('href');

        await firstDetailBtn.click();

        await expect(page).toHaveURL(baseURL + invoiceLink);

        await expect(page.getByTestId('invoice-number')).toBeVisible();
        await expect(page.getByTestId('invoice-date')).toBeVisible();
        await expect(page.getByTestId('total')).toBeVisible();
        await expect(page.getByTestId('street')).toBeVisible();
        await expect(page.getByTestId('postal_code')).toBeVisible();
        await expect(page.getByTestId('city')).toBeVisible();
        await expect(page.getByTestId('state')).toBeVisible();
        await expect(page.getByTestId('country')).toBeVisible();
        await expect(page.getByTestId('payment-method')).toBeVisible();
        
        const paymentMethodField = page.getByTestId('payment-method');
        const paymentDetails = await paymentMethodField.inputValue();
        if (paymentDetails === 'Gift Card') {
            await expect(page.locator('#gift_card_number')).toBeVisible();

        } else if (paymentDetails === 'Buy Now Pay Later') {
            await expect(page.locator('#monthly_installments')).toBeVisible();

        } else if (paymentDetails === 'Credit Card') {
            await expect(page.locator('#card_holder_name')).toBeVisible();

        } else if (paymentDetails === 'Bank Transfer') {
            await expect(page.locator('#bank_name')).toBeVisible();
            
        } else if (paymentDetails === 'Cash on Delivery') {
            await expect(page.locator('#gift_card_number')).toBeHidden();
            await expect(page.locator('#monthly_installments')).toBeHidden();
            await expect(page.locator('#card_holder_name')).toBeHidden();
            await expect(page.locator('#bank_name')).toBeHidden();
            
        }

        await expect(page.getByRole('columnheader', { name: 'Quantity' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Product' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Price' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();

    });
    

    test('Non-existent invoice @sprint5 @AC3', async ({ page }) => {
        // Given the invoice does not exist or does not belong to me
        // Then a "not found" message is displayed. 
        await page.goto(baseURL + '/account/invoices/999999999');
        await expect(page.getByText("This invoice doesn't exist.")).toBeVisible();
    });


    test('PDF download button @sprint5 @AC6', async ({ page }) => {
        // Given I am on the invoice detail page
        // Then a "Download PDF" button is displayed. 
        const firstDetailBtn = page.getByRole('link', { name: 'Details' }).first();
        await expect(firstDetailBtn).toBeVisible();

        const invoiceLink = await firstDetailBtn.getAttribute('href');

        await firstDetailBtn.click();

        await expect(page).toHaveURL(baseURL + invoiceLink);

        await expect(page.getByTestId('download-invoice')).toBeVisible();

    });


    test('PDF is still being generated - button is disabled @sprint5 @AC7', async ({ page }) => {
        // Given the PDF is still being generated
        // Then the download button is disabled
        // And the system checks the status every 20 seconds. 
        await page.route('**/invoices/*/pdf-status', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'PROCESSING' }) 
            });
        });

        const firstDetailBtn = page.getByRole('link', { name: 'Details' }).first();
        await expect(firstDetailBtn).toBeVisible();
        await firstDetailBtn.click();

        const downloadBtn = page.getByTestId('download-invoice');
        await expect(downloadBtn).toBeVisible({ timeout: 10000 });
        await expect(downloadBtn).toBeDisabled(); 
    });


    test('Successful PDF download @sprint5 @AC8', async ({ page }) => {
        // Given the PDF generation is complete
        // When I click "Download PDF"
        // Then the PDF file is downloaded. 
        const firstDetailBtn = page.getByRole('link', { name: 'Details' }).first();
        await expect(firstDetailBtn).toBeVisible();
        await firstDetailBtn.click();

        const downloadBtn = page.getByTestId('download-invoice');
        await expect(downloadBtn).toBeEnabled({ timeout: 15000 });

        const downloadPromise = page.waitForEvent('download');

        await downloadBtn.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.pdf');
        await download.path();

    });
});