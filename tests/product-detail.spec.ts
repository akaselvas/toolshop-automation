import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

test('Product detail page is displayed @sprint1 @AC1', async ({page}) =>{
    // Given I click on a product from the overview or category page
    // Then the product detail page is displayed.
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    await expect(page.getByRole('button', {name:'Add to cart'})).toBeVisible();
})

test('Product information shown @sprint5 @AC1', async ({page}) =>{
    // Given the product detail page is displayed
    // Then the following information is shown:
    // product image - product name - product description
    // product price - category badge - brand badge
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const firstCard = page.locator('.card').first();
    await firstCard.click();

    // using class
    await expect(page.locator('.figure-img')).toBeVisible();
    
    // using locator
    await expect(page.locator('[data-test="product-name"]')).toBeVisible();
    await expect(page.locator('[data-test="product-description"]')).toBeVisible();
    await expect(page.locator('[data-test="unit-price"]')).toBeVisible();
    
    // using getByLabel from Playwright
    await expect(page.getByLabel('category')).toBeVisible();
    await expect(page.getByLabel('brand')).toBeVisible();
})


test('Related products @sprint5 @AC14', async({page}) =>{
    // Given the product detail page is displayed
    // Then a section with related products is shown below the main product information
    // And each related product is clickable and navigates to its detail page. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const firstCard = page.locator('.card').first();
    await firstCard.click();

    await expect(page.locator('.card').first()).toBeVisible();
    const relatedCards = await page.locator('.card').all();

    expect(relatedCards.length).toBeGreaterThan(0);

    for (const card of relatedCards){
        const href = await card.getAttribute('href');
        expect(href).toContain('product');
    }

    const cardLink = await relatedCards[0].getAttribute('href');
    await relatedCards[0].click();
    expect(cardLink).not.toBeNull();
    await expect(page).toHaveURL(new RegExp (cardLink!));

})


test('Discount price display @sprint5 @AC2', async({page}) => {
    // Given the product has a discount
    // Then the original price is shown with a strikethrough
    // And the discounted price and discount percentage badge are displayed. 

    await page.addInitScript(() => {
        window.localStorage.setItem('GEO_LOCATION', JSON.stringify({ lat: 52, lng: 5 }));
    });

    await page.goto('https://practicesoftwaretesting.com/');

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

    await expect(page.getByTestId('add-to-cart')).toBeVisible();

    await expect(page.getByLabel('Decrease quantity')).toBeVisible();
    await expect(page.getByTestId('quantity')).toHaveValue('1');
    await expect(page.getByLabel('Increase quantity')).toBeVisible();

})