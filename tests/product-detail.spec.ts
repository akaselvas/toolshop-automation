import {test, expect, Locator} from "@playwright/test"

test('Product detail page is displayed @sprint1 @AC1', async ({page}) =>{
    // Given I click on a product from the overview or category page
    // Then the product detail page is displayed.
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    await expect(page.getByRole('button', {name:'Add to cart'})).toBeVisible();
})

test('Product information shown @sprint1 @AC2', async ({page}) =>{
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


test('Related products @sprint1 @AC3', async({page}) =>{
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


