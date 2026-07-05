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
        await expect(page.getByTestId('cart-quantity')).toHaveText('1', { timeout: 15000 });

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

    test('Bank Transfer fields @sprint5 @AC2', async ({ page }) => {
        // Given I select "Bank Transfer"
        // Then these fields are displayed:
        // Bank name (required, letters and spaces only)
        // Account name (required, alphanumeric with spaces, periods, apostrophes, hyphens)
        // Account number (required, digits only)
        await page.getByTestId('payment-method').selectOption('bank-transfer');

        const bankNameInput = page.getByTestId('bank_name');
        const accountNameInput = page.getByTestId('account_name');
        const accountNumberInput = page.getByTestId('account_number');

        await expect(bankNameInput).toBeVisible();
        await expect(accountNameInput).toBeVisible();
        await expect(accountNumberInput).toBeVisible();

        await bankNameInput.fill('International Bank');
        await bankNameInput.blur();

        await accountNameInput.fill('Jack.Howe-Smith');
        await accountNameInput.blur();

        await accountNumberInput.fill('987654321');
        await accountNumberInput.blur();

        await expect(bankNameInput).not.toHaveClass(/ng-invalid/);
        await expect(accountNameInput).not.toHaveClass(/ng-invalid/);
        await expect(accountNumberInput).not.toHaveClass(/ng-invalid/);

    });

    test('Credit Card fields @sprint5 @AC3', async ({ page }) => {
        // Given I select "Credit Card"
        // Then these fields are displayed:
        // Card number (format: XXXX-XXXX-XXXX-XXXX)
        // Expiration date (format: MM/YYYY, must be a future date)
        // CVV (3 or 4 digits)
        // Card holder name (letters and spaces only)
        await page.getByTestId('payment-method').selectOption('credit-card');

        const cardNumberInput = page.getByTestId('credit_card_number');
        const expirationInput = page.getByTestId('expiration_date');
        const cvvInput = page.getByTestId('cvv');
        const cardHolderInput = page.getByTestId('card_holder_name');

        await expect(cardNumberInput).toBeVisible();
        await expect(expirationInput).toBeVisible();
        await expect(cvvInput).toBeVisible();
        await expect(cardHolderInput).toBeVisible();

        await cardNumberInput.fill('1234-5678-9012-3456');
        await cardNumberInput.blur();

        await expirationInput.fill('12/2030');
        await expirationInput.blur();

        await cvvInput.fill('123');
        await cvvInput.blur();

        await cardHolderInput.fill('Jane Doe');
        await cardHolderInput.blur();

        await expect(cardNumberInput).not.toHaveClass(/ng-invalid/);
        await expect(expirationInput).not.toHaveClass(/ng-invalid/);
        await expect(cvvInput).not.toHaveClass(/ng-invalid/);
        await expect(cardHolderInput).not.toHaveClass(/ng-invalid/);

    });

    test('Credit Card expiration validation @sprint5 @AC4', async ({ page }) => {
        // Given I enter an expiration date in the past
        // Then the error "Expiration date must be in the future." is displayed. 
        await page.getByTestId('payment-method').selectOption('credit-card');

        const expirationInput = page.getByTestId('expiration_date');
        await expect(expirationInput).toBeVisible();

        await expirationInput.fill('12/2020');
        await expirationInput.blur();

        await expect(page.getByText('Expiration date must be in the future.')).toBeVisible({ timeout: 10000 });

        await expect(expirationInput).toHaveClass(/ng-invalid/);

    });


    test('Gift Card fields @sprint5 @AC6', async ({ page }) => {
        // Given I select "Gift Card"
        // Then these fields are displayed:
        // Gift card number (required, alphanumeric)
        // Validation code (required, alphanumeric)
        await page.getByTestId('payment-method').selectOption('gift-card');

        const giftCardInput = page.getByTestId('gift_card_number');
        const validationInput = page.getByTestId('validation_code');

        await expect(giftCardInput).toBeVisible();
        await expect(validationInput).toBeVisible();

        await giftCardInput.fill('GIFT1234567890AB');
        await giftCardInput.blur();

        await validationInput.fill('12AB');
        await validationInput.blur();

        await expect(giftCardInput).not.toHaveClass(/ng-invalid/);
        await expect(validationInput).not.toHaveClass(/ng-invalid/);

    });

    test('Cash on Delivery @sprint5 @AC7', async ({ page }) => {
        // Given I select "Cash on Delivery"
        // Then no additional fields are required. 
        await page.getByTestId('payment-method').selectOption('cash-on-delivery');

        await expect(page.getByTestId('bank_name')).toBeHidden();
        await expect(page.getByTestId('credit_card_number')).toBeHidden();
        await expect(page.getByTestId('monthly_installments')).toBeHidden();
        await expect(page.getByTestId('gift_card_number')).toBeHidden();

        await expect(page.getByTestId('finish')).toBeEnabled();
        
    });

    test('Payment method change resets form @sprint5 @AC8', async ({ page }) => {
        // Given I switch to a different payment method
        // Then the form resets and shows the new method's fields. 
        await page.getByTestId('payment-method').selectOption('bank-transfer');
        const bankNameInput = page.getByTestId('bank_name');
        await expect(bankNameInput).toBeVisible();
        await bankNameInput.fill('International Bank');
        await bankNameInput.blur();

        await page.getByTestId('payment-method').selectOption('credit-card');

        await expect(bankNameInput).toBeHidden();
        const cardNumberInput = page.getByTestId('credit_card_number');
        await expect(cardNumberInput).toBeVisible();

        await page.getByTestId('payment-method').selectOption('bank-transfer');

        await expect(bankNameInput).toBeVisible();
        
    });

});

// AC9 fica fora do describe/beforeEach de propósito: os demais ACs usam um
// endereço fake no billing address, mas o AC9 precisa criar um pedido de
// verdade, e o backend só aceita endereços que batem com um lookup real de
// CEP. Por isso o AC9 tem seu próprio fluxo completo, com endereço real (NL/1011AB)
test('Successful order form @sprint5 @AC9', async ({ page }) => {
    // Given valid payment details are provided
    // When I click confirm
    // Then the payment is validated, the order is placed, a confirmation with the invoice number is shown, and the cart is cleared
    // And a checkout confirmation email is sent to the customer. 
    test.setTimeout(90000);

    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 20000 });

    await page.locator('.card').first().click();
    await page.waitForURL('**/product/**');

    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-quantity')).toHaveText('1', { timeout: 15000 });

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

    // combinação REAL (país + CEP), pra bater com o lookup
    // que o backend usa pra validar de verdade na criação do invoice.
    await expect(page.getByRole('heading', { name: 'Billing Address' })).toBeVisible({ timeout: 10000 });

    await page.getByTestId('country').selectOption('NL');
    await page.getByTestId('postal_code').fill('1011AB');
    await page.getByTestId('house_number').fill('1');

    await expect(page.getByTestId('postcode-lookup-loading')).toBeHidden({ timeout: 10000 });
    await expect(page.getByTestId('street')).not.toHaveValue('', { timeout: 10000 });

    await page.getByTestId('proceed-3').click();
    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible({ timeout: 10000 });

    // CC
    await page.getByTestId('payment-method').selectOption('credit-card');

    await page.getByTestId('credit_card_number').fill('1234-5678-9012-3456');
    await page.getByTestId('credit_card_number').blur();
    await page.getByTestId('expiration_date').fill('12/2030');
    await page.getByTestId('expiration_date').blur();
    await page.getByTestId('cvv').fill('123');
    await page.getByTestId('cvv').blur();
    await page.getByTestId('card_holder_name').fill('Jane Doe');
    await page.getByTestId('card_holder_name').blur();

    const confirmButton = page.getByTestId('finish');
    await expect(confirmButton).toBeEnabled();

    // BUG CONHECIDO: checkPayment() no app retorna o resultado de forma síncrona/stale
    // (antes da chamada assíncrona /payment/check terminar). O primeiro clique só
    // "esquenta" this.state; a criação do pedido só dispara no segundo clique,
    // quando this.state já está true. Ver payment.component.ts::checkPayment().
    const firstPaymentCheck = page.waitForResponse(
        resp => resp.url().includes('/payment/check') && resp.request().method() === 'POST'
    );
    await confirmButton.click();
    const paymentResponse = await firstPaymentCheck;
    expect(paymentResponse.status()).toBeLessThan(300);

    const invoiceResponsePromise = page.waitForResponse(
        resp => resp.url().includes('/invoices/guest') && resp.request().method() === 'POST'
    );
    await confirmButton.click();
    const invoiceResponse = await invoiceResponsePromise;
    const invoiceBody = await invoiceResponse.json();
    expect(invoiceResponse.status()).toBeLessThan(300);

    const expectedInvoiceNumber = invoiceBody.invoice_number;
    expect(expectedInvoiceNumber).toMatch(/^INV-\d+$/);

    const orderConfirmation = page.locator('#order-confirmation');
    await expect(orderConfirmation).toBeVisible({ timeout: 15000 });
    await expect(orderConfirmation).toContainText('Thanks for your order! Your invoice number is');
    await expect(orderConfirmation).toContainText(expectedInvoiceNumber);

    await expect(page.getByTestId('cart-quantity')).toBeHidden({ timeout: 10000 });
});