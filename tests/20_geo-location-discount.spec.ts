import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

const CITIES = [
    { name: 'New York', lat: 41, lng: 74, discount: 5 },
    { name: 'Mumbai', lat: 19, lng: 73, discount: 10 },
    { name: 'Tokyo', lat: 35, lng: 139, discount: 15 },
    { name: 'Amsterdam', lat: 52, lng: 5, discount: 20 },
    { name: 'London', lat: 51, lng: 0, discount: 25 },
];

const NEUTRAL_LOCATION = { name: 'Neutral (Rio)', lat: -22, lng: -43, discount: 0 };

async function setGeoLocation(page: any, lat: number, lng: number) {
    await page.addInitScript(({ lat, lng }) => {
        window.localStorage.setItem('GEO_LOCATION', JSON.stringify({ lat, lng }));
    }, { lat, lng });
}

test.describe('Geo-Location Discount', () => {
    let locationProductId: string = '';
    let locationProductPrice: number = 0;


    test.beforeAll(async ({ request }) => {
        const productsResponse = await request.get(apiURL + '/products');
        expect(productsResponse.status()).toBe(200);
        const productsData = await productsResponse.json();
        const locationProduct = productsData.data.find(
            (p: any) => p.is_location_offer === true || p.is_location_offer === 1
        );
        expect(locationProduct).toBeDefined();
        locationProductId = locationProduct.id; 
    });


    for (const city of CITIES) {
        test('Discount applied based on location ' + city.discount + '% applied in ' + city.name + ' @sprint5 @AC1', async ({ page }) => {
            // Given my browser geo-location matches a 
            // supported city and a product is a location offer
            // Then the following discount is applied:
            // New York: 5%     Mumbai: 10%     Tokyo: 15%
            // Amsterdam: 20%     London: 25%
            
            await setGeoLocation(page, city.lat, city.lng);
            await page.goto(baseURL + '/product/' + locationProductId);

            const expectedBadgeText = '-' + city.discount + '%';
            await expect(page.getByText(expectedBadgeText)).toBeVisible({ timeout: 15000 });
        });

    }

    
    for (const city of CITIES) {
        test('Discount display in ' + city.name + ' @sprint5 @AC2', async ({ page }) => {
            // Given a location discount is applied
            // Then the original price is shown with a 
            // strikethrough and the discounted price is shown below. 

            await setGeoLocation(page, city.lat, city.lng);
            await page.goto(baseURL + '/product/' + locationProductId);

            const originalPrice = page.locator('span.discounted').first();
            await expect(originalPrice).toBeVisible({ timeout: 15000 });

            const discountedPrice = page.getByTestId('offer-price');
            await expect(discountedPrice).toBeVisible({ timeout: 15000 });
        });

    }

    
    test('No match City and discount @sprint5 @AC3', async ({ page }) => {
        // Given my location does not match any supported city
        // Then no location discount is applied
        await setGeoLocation(page, NEUTRAL_LOCATION.lat, NEUTRAL_LOCATION.lng);
        await page.goto(baseURL + '/product/' + locationProductId);
        await expect(page.locator('span.discounted')).toBeHidden({ timeout: 15000 });
        await expect(page.getByTestId('offer-price')).toBeHidden({ timeout: 10000 });

    });


    test('Discounted price is used for the cart line item - Amsterdam (20%) @sprint5 @AC4', async ({ page }) => {
        
        await setGeoLocation(page, 52, 5);

        
        const expectedDiscountedPrice = locationProductPrice * 0.8; 

        await page.goto(baseURL + '/product/' + locationProductId);
        
        const addBtn = page.getByTestId('add-to-cart');
        await expect(addBtn).toBeVisible({ timeout: 10000 });
        await addBtn.click();
        
        await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });

        await page.getByTestId('nav-cart').click();
        await page.waitForURL('**/checkout', { timeout: 20000 });

        await expect(page.getByTestId('cart-subtotal')).toBeVisible({ timeout: 15000 });

        const subtotalText = await page.getByTestId('cart-subtotal').innerText();
        const subtotalValue = parseFloat(subtotalText.replace('$', '').trim());

        expect(subtotalValue).toBeCloseTo(expectedDiscountedPrice, 2); 
        
    });


});

