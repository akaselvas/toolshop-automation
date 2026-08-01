import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = process.env.API_URL || 'https://api.practicesoftwaretesting.com';

test('Product detail page is displayed @sprint1 @AC1', async ({page}) =>{
    // Given I click on a product from the overview or category page
    // Then the product detail page is displayed.
    await page.goto(baseURL);
    const firstProductImg = page.locator('img.card-img-top').first();
    await expect(firstProductImg).toBeVisible({ timeout: 15000 });
    await firstProductImg.click();

    // Valida usando o Test ID oficial em vez de role genérica [15]
    await expect(page.getByTestId('add-to-cart')).toBeVisible({ timeout: 10000 });
});


test('Product information shown @sprint5 @AC1', async ({page}) =>{
    // Given the product detail page is displayed
    // Then the following information is shown:
    // product image - product name - product description
    // product price - category badge - brand badge
    await page.goto(baseURL);
    const firstProductImg = page.locator('img.card-img-top').first();
    await expect(firstProductImg).toBeVisible({ timeout: 15000 });
    await firstProductImg.click();

    // CORREÇÃO: Altera de '.figure-img' para '.img-fluid' que é a classe real da imagem [30]
    await expect(page.locator('img.img-fluid')).toBeVisible({ timeout: 10000 });
    
    await expect(page.locator('[data-test="product-name"]')).toBeVisible();
    await expect(page.locator('[data-test="product-description"]')).toBeVisible();
    await expect(page.locator('[data-test="unit-price"]')).toBeVisible();
    await expect(page.getByLabel('category')).toBeVisible();
    await expect(page.getByLabel('brand')).toBeVisible();
});

test('Discount price display @sprint5 @AC2', async({page}) => {
    // Given the product has a discount
    // Then the original price is shown with a strikethrough
    // And the discounted price and discount percentage badge are displayed. 

    await page.addInitScript(() => {
        window.localStorage.setItem('GEO_LOCATION', JSON.stringify({ lat: 52, lng: 5 }));
    });

    await page.goto(baseURL);

    const discountCard = page.locator('.card').filter({has: 
        page.getByTestId('product-discount-price')
    }).first();
    await discountCard.click();

    await expect(page.getByRole('button', {name:'Add to cart'})).toBeVisible();

    await expect(page.getByTestId('unit-price')).toBeVisible();
    await expect(page.locator('.discounted')).toBeVisible();
    await expect(page.locator('#discount-price')).toBeVisible();
    await expect(page.locator('.badge.rounded-pill.bg-danger')).toBeVisible();
})

test('Quantity selector @sprint5 @AC3', async({page}) => {
    // Given the product is in stock
    // Then a quantity input field is displayed with plus (+) and minus (-) buttons
    // And the default quantity is 1. 

    await page.goto(baseURL);

    await expect(page.getByTestId('product-name').first()).toBeVisible();

    const hasStock = page.locator('.card').filter({
        hasNot: page.getByTestId('out-of-stock')
    }).first();

    await expect(hasStock).toBeVisible();
    await hasStock.click();
    
    await page.waitForURL('**/product/**');
    
    await expect(page.getByTestId('add-to-cart')).toBeVisible();

    await expect(page.getByTestId('decrease-quantity')).toBeVisible();
    await expect(page.getByTestId('quantity')).toHaveValue('1');
    await expect(page.getByTestId('increase-quantity')).toBeVisible();

})

test('Increase quantity  @sprint5 @AC4', async({page}) => {
    // Given the quantity input is displayed
    // When I click the plus button
    // Then the quantity increases by 1. 
    await page.goto(baseURL);

    await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 10000 });

    const productCard = page.locator('.card').filter({ hasText: 'Combination Pliers' }).first();

    await expect(productCard).toBeVisible();
    await productCard.click();

    await page.waitForURL('**/product/**');

    const increaseButton = page.getByTestId('increase-quantity');
    await expect(increaseButton).toBeVisible();

    await expect(page.getByTestId('quantity')).toHaveValue('1');

    await increaseButton.click();

    await expect(page.getByTestId('quantity')).toHaveValue('2');
})

test('Decrease quantity @sprint5 @AC5', async({page}) => {
    // Given the quantity is greater than 1
    // When I click the minus button
    // Then the quantity decreases by 1. 
    await page.goto(baseURL);

    await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 10000 });

    const productCard = page.locator('.card').filter({ hasText: 'Combination Pliers' }).first();

    await expect(productCard).toBeVisible();
    await productCard.click();

    await page.waitForURL('**/product/**');

    const increaseButton = page.getByTestId('increase-quantity');
    const decreaseButton = page.getByTestId('decrease-quantity');
    await expect(increaseButton).toBeVisible();

    await expect(page.getByTestId('quantity')).toHaveValue('1');

    await increaseButton.click();

    await expect(page.getByTestId('quantity')).toHaveValue('2');

    await decreaseButton.click();

    await expect(page.getByTestId('quantity')).toHaveValue('1');
})

test('Minimum quantity @sprint5 @AC6', async({page}) => {
    // Given the quantity is 1
    // When I click the minus button
    // Then the quantity remains at 1. 
    await page.goto(baseURL);

    await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 10000 });
    const productCard = page.locator('.card').filter({ hasText: 'Combination Pliers' }).first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    await page.waitForURL('**/product/**');

    const decreaseButton = page.getByTestId('decrease-quantity');

    await expect(page.getByTestId('quantity')).toHaveValue('1');

    await decreaseButton.click();

    await expect(page.getByTestId('quantity')).toHaveValue('1');
})

test('Manual quantity entry @sprint5 @AC7', async({page}) => {
    // Given the quantity input is displayed
    // When I type a number directly into the input field
    // Then the quantity is updated to the entered value
    // And the value is clamped between 1 and 999,999,999. 
    await page.goto(baseURL);

    await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 15000 });
    const productCard = page.locator('.card').filter({ hasText: 'Combination Pliers' }).first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    await page.waitForURL('**/product/**');

    const quantityField = page.getByTestId('quantity');
    await expect(quantityField).toBeVisible({ timeout: 15000 });
    await quantityField.fill('30');
    await expect(page.getByTestId('quantity')).toHaveValue('30');

    await quantityField.fill('999999999');
    await expect(page.getByTestId('quantity')).toHaveValue('99');

    await quantityField.fill('-1');
    await expect(page.getByTestId('quantity')).toHaveValue('1');
})

test('Add to cart @sprint5 @AC8', async({page}) => {
    // Given a valid quantity is selected
    // When I click the "Add to Cart" button
    // Then the product is added to the cart with the selected quantity
    // And a success message "Product added to shopping cart." is displayed. 
    await page.goto(baseURL);

    await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 15000 });
    const productCard = page.locator('.card').filter({ hasText: 'Combination Pliers' }).first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    await page.waitForURL('**/product/**');

    const addCartButton = page.getByTestId('add-to-cart');
    const increaseButton = page.getByTestId('increase-quantity');

    await expect(page.getByTestId('quantity')).toHaveValue('1');
    await increaseButton.click();
    await expect(page.getByTestId('quantity')).toHaveValue('2');

    await addCartButton.click();
    
    await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });

})

test('Out of stock @sprint5 @AC9', async({page}) => {
    // Given the product is not in stock and is not a rental item
    // Then the "Add to Cart" button is disabled
    // And "Out of stock" is shown in red. 
    await page.goto(baseURL);

    await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 15000 });
    const productCard = page.locator('.card').filter({ hasText: 'Out of Stock' }).first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    await page.waitForURL('**/product/**');

    const outOfStockLabel = page.getByTestId('out-of-stock');
    await expect(outOfStockLabel).toBeVisible();
    await expect(outOfStockLabel).toHaveClass(/text-danger/);
    await expect(page.getByTestId('add-to-cart')).toBeDisabled()

})

test('Rental duration slider @sprint5 @AC10', async({page}) => {
    // Given the product is a rental item
    // Then a duration slider (1–10 hours) is shown instead of plus/minus buttons
    // And the total price is calculated as hourly rate multiplied by duration. 
    await page.goto(baseURL + '/rentals');

    await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 15000 });
    const productCard = page.locator('.card.mb-3').first();
    await productCard.click();

    await page.waitForURL('**/product/**');

    const sliderHandle = page.getByRole('slider', { name: 'ngx-slider' });
    await expect(sliderHandle).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#total-price')).toBeVisible({ timeout: 15000 });

    await sliderHandle.press('ArrowRight');
    await expect(sliderHandle).toHaveAttribute('aria-valuenow', '2');

    const hourlyRateText = await page.getByTestId('unit-price').innerText();
    const hourlyRate = parseFloat(hourlyRateText.replace('$', ''));

    const durationText = await sliderHandle.getAttribute('aria-valuenow');
    const duration = parseInt(durationText!);

    const totalPriceText = await page.locator('#total-price').innerText();
    const totalPrice = parseFloat(totalPriceText.replace('$', ''));

    expect(totalPrice).toBe(hourlyRate * duration);  
})


test.describe('Favorites - Authenticated', () => {
    let testEmail: string = '';
    let testPassword: string = '';

    test.beforeEach(async ({ page }) => {        
        testEmail = `fav-setup-user-${Date.now()}@example.com`;
        testPassword = 'AnyPassword11!';
        const registerResponse = await page.request.post(apiURL + '/users/register', {
            data: {
                first_name: 'Jane', last_name: 'Doe', dob: '1990-01-01', phone: '1234567890',
                email: testEmail, password: testPassword,
                address: { street: 'Test Street 123', postal_code: '12345', city: 'Test City', state: 'Test State', country: 'US' },
            },
        });
        expect(registerResponse.status()).toBe(201);

        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account', { timeout: 20000 });

        await page.goto(baseURL);
        await expect(page.getByTestId('nav-menu')).toBeVisible({ timeout: 15000 });

    });

    test('Add to Favorites @sprint5 @AC11', async ({ page }, testInfo) => {
        // Given I am logged in
        // When I click "Add to Favorites"
        // Then a success message "Product added to your favorites list." is displayed. 
        let productToTest = 'Slip Joint Pliers';
        if (testInfo.project.name === 'firefox') {
            productToTest = 'Long Nose Pliers';
        } else if (testInfo.project.name === 'webkit') {
            productToTest = 'Pliers';
        }
        
        const productCard = page.locator('.card').filter({ hasText: productToTest }).first();
        await expect(productCard).toBeVisible({ timeout: 15000 });
        await productCard.click();
        
        await page.waitForURL('**/product/**', { timeout: 10000 });

        const addFavorites = page.getByTestId('add-to-favorites');
        await addFavorites.click();

        await expect(page.getByText(/added to.*favorites/i)).toBeVisible({ timeout: 15000 });

    });

    test('Duplicate favorite @sprint5 @AC12', async ({ page }) => {
        // Given the product is already in my favorites
        // When I click "Add to Favorites"
        // Then the message "Product already in your favorites list." is displayed. 
        const productCard = page.locator('.card').filter({ hasText: 'Combination Pliers' }).first();
        await expect(productCard).toBeVisible({ timeout: 15000 });
        await productCard.click();
        
        await page.waitForURL('**/product/**', { timeout: 10000 });

        const addFavorites = page.getByTestId('add-to-favorites');
        
        await addFavorites.click();
        await expect(page.getByText(/added to.*favorites/i)).toBeVisible({ timeout: 15000 });

        await addFavorites.click();

        await expect(page.getByText(/already in.*favorites/i)).toBeVisible({ timeout: 15000 });

    });
});

test('Not logged in @sprint5 @AC13', async ({page}) => {
    // Given I am not logged in
    // When I click "Add to Favorites"
    // Then the message "Unauthorized, can not add product to your favorite list." is displayed. 
    await page.goto(baseURL);

    await expect(page.getByTestId('product-name').first()).toBeVisible({ timeout: 15000 });
    const productCard = page.locator('.card').first();
    await productCard.click();

    await page.waitForURL('**/product/**');
    const addFavorites = page.getByTestId('add-to-favorites');
    await addFavorites.click();

    await expect(page.getByText('Unauthorized, can not add product to your favorite list')).toBeVisible({ timeout: 10000 });

})

test('Related products @sprint5 @AC14', async ({page}) => {
    // Given the product detail page is displayed
    // Then related products are shown below the main information. 
    await page.goto(baseURL);

    // CORREÇÃO: Espera o carregamento inicial dos produtos na Home de forma estável [15, 22, 35]
    const firstProductImg = page.locator('img.card-img-top').first();
    await expect(firstProductImg).toBeVisible({ timeout: 15000 });
    await firstProductImg.click();

    await page.waitForURL('**/product/**', { timeout: 10000 });
    
    const headingProducts = page.getByRole('heading', { name: 'Related products' });
    await expect(headingProducts).toBeVisible({ timeout: 10000 });

    const relatedSection = page.locator('div.row').filter({
        has: page.getByRole('heading', { name: 'Related products' })
    });
    await expect(relatedSection).toBeVisible();

    const relatedCards = relatedSection.locator('.card');
    await expect(relatedCards.first()).toBeVisible({ timeout: 10000 });

    const cards = await relatedCards.all();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
        await expect(card).toBeVisible();
    }

});

