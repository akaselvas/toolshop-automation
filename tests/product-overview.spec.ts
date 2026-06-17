import {test, expect, Locator} from "@playwright/test"

test('Product overview is displayed @sprint1 @AC1', async ({ page }) => {
    // Given I navigate to the home page
    // Then a grid of product cards is displayed showing all products. 
    
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    await expect(page.locator('.card')).toHaveCount(9);
});

test('Product card information @sprint1 @AC2', async ({page}) =>{
    // Given the product overview is displayed
    // Then each product card shows: a product imagem, the product name, the product price
    
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const cards = await page.locator('.card').all();
    for (const card of cards){
        // The test in Chromium failed. The first time I increased the timeout, 
        // but it continued to fail, so I added 'scrollIntoViewIfNeeded()' to force lazy loading.
        await card.scrollIntoViewIfNeeded();
        await expect(card.locator('img')).toBeVisible({timeout:10000});
        await expect(card.locator('[data-test="product-name"]')).toBeVisible();
        await expect(card.locator('[data-test="product-price"]')).toBeVisible();
    }
})

test('Navigating to product detail @sprint1 @AC3', async ({page}) => {
    // Given the product overview is displayed
    // When I click on a product card
    // Then I am navigated to the product detail page for that product. 
   
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const firstCard = page.locator('.card').first();
    const targetUrl = await firstCard.getAttribute('href');
    // Since I want to avoid hardcoding a volatile product URL, I used a dynamic RegExp.
    // To prevent TypeScript from flagging 'targetUrl' as potentially NULL,
    // I added a non-null assertion with the help of 'expect().not.toBeNull()'.
    expect(targetUrl).not.toBeNull();
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(targetUrl!));
})

