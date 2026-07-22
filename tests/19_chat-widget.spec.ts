import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

test.describe('Chat Widget', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);

        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill('customer@practicesoftwaretesting.com');
        await page.getByTestId('password').fill('welcome01');
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account', { timeout: 20000 }); 
        await page.goto(baseURL);

        await expect(page.getByTestId('nav-menu')).toBeVisible({ timeout: 15000 });
    });

    test('Chat toggle @sprint5 @AC1', async ({ page }) => {
        // Given I am on any page
        // Then a chat toggle button is displayed in the bottom-right corner
        // And clicking it opens the chat window with a menu: 
        // Find Product, Order Product, Checkout, Support
        await expect(page.getByTestId('chat-toggle')).toBeVisible({ timeout: 10000 });
        await page.getByTestId('chat-toggle').click();
        await expect(page.getByTestId('chat-action-find-product')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('chat-action-order-product')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('chat-action-start-checkout')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('chat-action-support-ticket')).toBeVisible({ timeout: 10000 });

    });


    test('Find Product @sprint5 @AC2', async ({ page }) => {
        // Given I select "Find Product"
        // Then I can enter a search query and up to 5 matching products are shown as cards
        // And I can click "View Product" to navigate to the detail page. 
        await expect(page.getByTestId('chat-toggle')).toBeVisible({ timeout: 10000 });
        await page.getByTestId('chat-toggle').click();
        await page.getByTestId('chat-action-find-product').click();

        await expect(page.locator('.message-content').first()).toBeVisible({ timeout: 10000 });
        await page.getByTestId('chat-input').fill('Hammer')
        await page.getByTestId('chat-input').press('Enter'); 

        const productCards = page.getByTestId('chat-product');
        await expect(productCards).toHaveCount(5, { timeout: 15000 });

        await page.getByTestId('chat-product').first().click();
        await page.waitForURL('**/product/**', { timeout: 20000 }); 

    });
    

    test('Order Product @sprint5 @AC3', async ({ page }) => {
        // Given I select "Order Product"
        // Then I can search for a product, 
        // select a quantity (1, 2, 3, 5, 10, or custom 1–999), 
        // confirm the order, and the product is added to my cart. 
        await expect(page.getByTestId('chat-toggle')).toBeVisible({ timeout: 10000 });
        await page.getByTestId('chat-toggle').click();
        await page.getByTestId('chat-action-order-product').click();

        await expect(page.locator('.message-content').first()).toBeVisible({ timeout: 10000 });
        await page.getByTestId('chat-input').fill('Combination Pliers');
        await page.getByTestId('chat-input').press('Enter'); 

        const productCard = page.getByTestId('chat-product').filter({ hasText: 'Combination Pliers' });
        await expect(productCard).toBeVisible({ timeout: 15000 });
        await productCard.click();

        const quantityTwo = page.getByTestId('chat-action-select-quantity').filter({ hasText: '2' });
        await expect(quantityTwo).toBeVisible({ timeout: 15000 });
        await quantityTwo.click();

        const productCardAdd = page.getByTestId('chat-action-confirm-order');
        await expect(productCardAdd).toContainText('Yes, add to cart', { timeout: 15000 });
        await productCardAdd.click();
        
        await page.getByTestId('cart-quantity').click();
        await page.waitForURL('**/checkout', { timeout: 20000 });

        const productCart = page.getByTestId('product-title'); 
        await expect(productCart).toContainText('Combination Pliers', { timeout: 15000 }); 
        
    });

    test('Checkout @sprint5 @AC4', async ({ page }) => {
        // Given I select "Checkout" and my cart has items
        // Then the chat walks me through the full checkout flow:
        // cart summary
        // guest details (if not logged in): email, first name, last name
        // address: street, city, state, country, postal code
        // payment method selection and details
        // order confirmation with invoice number
        await page.route('**/invoices', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: "fake-chat-invoice-id",
                        invoice_number: "INV-2026-CHATBOT", // Número retornado dinamicamente [21]
                        status: "COMPLETED"
                    })
                });
            } else {
                await route.continue();
            }
        });

        await expect(page.getByTestId('chat-toggle')).toBeVisible({ timeout: 10000 });
        await page.getByTestId('chat-toggle').click();
        await page.getByTestId('chat-action-order-product').click();

        await expect(page.locator('.message-content').first()).toBeVisible({ timeout: 10000 });
        await page.getByTestId('chat-input').fill('Combination Pliers');
        await page.getByTestId('chat-input').press('Enter');

        const productCard = page.getByTestId('chat-product').filter({ hasText: 'Combination Pliers' });
        await expect(productCard).toBeVisible({ timeout: 15000 });
        await productCard.click();

        await expect(page.locator('.message-content').filter({ hasText: 'How many would you like to order?' })).toBeVisible({ timeout: 15000 });

        const quantityTwo = page.getByTestId('chat-action-select-quantity').filter({ hasText: '2' });
        await expect(quantityTwo).toBeVisible({ timeout: 15000 });
        await quantityTwo.click();

        const productCardAdd = page.getByTestId('chat-action-confirm-order');
        await expect(productCardAdd).toContainText('Yes, add to cart', { timeout: 15000 });
        await productCardAdd.click();

        const productCheckout = page.getByTestId('chat-action-checkout');
        await expect(productCheckout).toContainText('Go to checkout', { timeout: 15000 });
        await productCheckout.click(); 

        const chatStreet = page.locator('.message-content').filter({ hasText: 'Please enter your street address:' });
        await expect(chatStreet).toBeVisible({ timeout: 15000 });
        await page.getByTestId('chat-input').fill('Any Street 123');
        await page.getByTestId('chat-input').press('Enter');

        const chatCity = page.locator('.message-content').filter({ hasText: 'Please enter your city:' });
        await expect(chatCity).toBeVisible({ timeout: 15000 });
        await page.getByTestId('chat-input').fill('New York');
        await page.getByTestId('chat-input').press('Enter');

        const chatState = page.locator('.message-content').filter({ hasText: 'Please enter your state/province:' });
        await expect(chatState).toBeVisible({ timeout: 15000 });
        await page.getByTestId('chat-input').fill('New York');
        await page.getByTestId('chat-input').press('Enter');

        const chatCountry = page.locator('.message-content').filter({ hasText: 'Please enter your country:' });
        await expect(chatCountry).toBeVisible({ timeout: 15000 });
        await page.getByTestId('chat-input').fill('US');
        await page.getByTestId('chat-input').press('Enter');

        const chatPostalCode = page.locator('.message-content').filter({ hasText: 'Please enter your postal code:' });
        await expect(chatPostalCode).toBeVisible({ timeout: 15000 });
        await page.getByTestId('chat-input').fill('10001');
        await page.getByTestId('chat-input').press('Enter');

        const chatConfirm = page.locator('.message-content').filter({ hasText: 'Please confirm your billing address:' });
        await expect(chatConfirm).toBeVisible({ timeout: 15000 });
        await page.getByTestId('chat-action-checkout-confirm-address').click();

        const chatPayment = page.locator('.message-content').filter({ hasText: 'Please select your payment method:' });
        await expect(chatPayment).toBeVisible({ timeout: 15000 });
        const cashOption = page.getByTestId('chat-action-select-payment-method').filter({ hasText: 'Cash on Delivery' });
        await cashOption.click();

        const readyToPlace = page.locator('.message-content').filter({ hasText: 'Ready to place your order?' });
        await expect(readyToPlace).toBeVisible({ timeout: 15000 });
        const confirmOrder = page.getByTestId('chat-action-checkout-confirm-order');
        await confirmOrder.click(); 

        await expect(page.locator('.message-content').filter({ hasText: 'Your order has been placed successfully!' })).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.message-content').filter({ hasText: 'Order number:' })).toBeVisible();

    });


    test('Empty cart @sprint5 @AC5', async ({ page }) => {
        // Given I select "Checkout" and my cart is empty
        // Then the message "Your cart is empty" is displayed. 
        test.fixme(true, 'Ignorando devido a exceção de JavaScript (TypeError: reading cart_items of null) no clique do Checkout com carrinho vazio.');

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`[ERRO DO NAVEGADOR] ${msg.text()}`);
            }
        });

        await expect(page.getByTestId('chat-toggle')).toBeVisible({ timeout: 10000 });
        await page.getByTestId('chat-toggle').click();

        const checkoutButton = page.getByTestId('chat-action-start-checkout');
        await expect(checkoutButton).toBeVisible({ timeout: 10000 });

        await checkoutButton.click();

        const emptyCartMessage = page.locator('.message-content').filter({ hasText: /Your cart is empty/i });
        await expect(emptyCartMessage).toBeVisible({ timeout: 10000 });

    });


});

test('Support Ticket | Guest User @sprint5 @AC6', async ({ page }) => {
    // Given I select "Support"
    // Then the chat prompts me for subject, message (min 50 chars), and optional file attachment (.txt)
    // And if not logged in, also asks for first name, last name, and email
    // And on submission, a confirmation is displayed. 
    await page.goto(baseURL);

    await expect(page.getByTestId('chat-toggle')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('chat-toggle').click();

    const supportButton = page.getByTestId('chat-action-support-ticket');
    await expect(supportButton).toBeVisible({ timeout: 10000 });
    await supportButton.click();

    const chatName = page.locator('.message-content').filter({ hasText: 'What is your first name?' });
    await expect(chatName).toBeVisible({ timeout: 15000 });
    await page.getByTestId('chat-input').fill('John');
    await page.getByTestId('chat-input').press('Enter');

    const chatLastName = page.locator('.message-content').filter({ hasText: 'What is your last name?' });
    await expect(chatLastName).toBeVisible({ timeout: 15000 });
    await page.getByTestId('chat-input').fill('Doe');
    await page.getByTestId('chat-input').press('Enter');

    const chatEmail = page.locator('.message-content').filter({ hasText: 'What is your email address?' });
    await expect(chatEmail).toBeVisible({ timeout: 15000 });
    await page.getByTestId('chat-input').fill('anyemail@example.com');
    await page.getByTestId('chat-input').press('Enter');
    
    const chatSubject = page.getByTestId('chat-action-select-subject').filter({ hasText: 'Customer service' });
    await expect(chatSubject).toBeVisible({ timeout: 15000 });
    await chatSubject.click();

    const chatIssue = page.locator('.message-content').filter({ hasText: 'Please describe your issue (minimum 50 characters):' });
    await expect(chatIssue).toBeVisible({ timeout: 15000 });
    await page.getByTestId('chat-input').fill('Any message with minimal of 50 characters that describe some problem that the user has');
    await page.getByTestId('chat-input').press('Enter');

    const chatAttachement = page.getByTestId('chat-action-skip-attachment').filter({ hasText: 'Skip' });
    await expect(chatAttachement).toBeVisible({ timeout: 15000 });
    await chatAttachement.click();

    const chatSubimitted = page.locator('.message-content').filter({ hasText: 'Your support ticket has been submitted successfully!' });
    await expect(chatSubimitted).toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId('chat-action-back-to-menu').last()).toBeVisible(); 

});