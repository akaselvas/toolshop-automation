import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

test('Rentals page is accessible @sprint1 @AC1', async ({page}) =>{
    // Given I navigate to the rentals page
    // Then a list of all rental products is displayed. 
    await page.goto(baseURL);

    const menuCaterogies = page.getByTestId('nav-categories')
    await expect(menuCaterogies).toBeVisible();
    await menuCaterogies.click();

    const menuRentals = page.getByTestId('nav-rentals');
    await expect(menuRentals).toBeVisible();
    await menuRentals.click();

    await page.waitForURL('**/rentals');
    
    await expect(page.getByTestId('page-title')).toBeVisible();
    const rentalProducts = page.locator('[data-test^="product-"]');
    await expect(rentalProducts.first()).toBeVisible({ timeout: 10000 });
    expect(await rentalProducts.count()).toBeGreaterThan(0);
})

test('Rental product display @sprint1 @AC2', async ({page}) =>{
    // Given the rentals page is displayed
    // Then each rental product shows a product image, name, and description. 
    await page.goto(baseURL + '/rentals');

    await expect(page.locator('.card.mb-3').first()).toBeVisible({timeout:10000});

    const cards = await page.locator('.card.mb-3').all();

    for(const card of cards){
        await expect(card.locator('.img-fluid')).toBeVisible();
        await expect(card.locator('.card-title')).toBeVisible();
        await expect(card.locator('.card-text')).toBeVisible();
    }
    
})

test('Rental detail page @sprint5 @AC3', async({page}) => {
    // Given I click on a rental product
    // Then the product detail page shows a duration slider (1–10 hours) instead of plus/minus buttons
    // And the total price is calculated as the hourly rate multiplied by the selected duration. 
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