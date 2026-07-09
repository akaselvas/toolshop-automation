import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

test.describe('Favorites Management - with favorites', () => {
    let testEmail: string = '';
    let testPassword: string = '';
    let favoriteProducts: any[] = []; 

    test.beforeEach(async ({ page }) => {
        testEmail = `favorites-user-${Date.now()}@example.com`;
        testPassword = 'AnyP@ssworld11!';

        const registerResponse = await page.request.post(apiURL + '/users/register', {
            data: {
                first_name: 'Jane', last_name: 'Doe',
                dob: '1990-01-01', phone: '1234567890',
                email: testEmail, password: testPassword,
                address: {
                    street: 'Test Street 123', postal_code: '12345',
                    city: 'Test City', state: 'Test State', country: 'US'
                },
            },
        });
        expect(registerResponse.status()).toBe(201);

        const apiLoginResponse = await page.request.post(apiURL + '/users/login', {
            data: { email: testEmail, password: testPassword }
        });
        expect(apiLoginResponse.status()).toBe(200);
        const { access_token } = await apiLoginResponse.json();

        const productsResponse = await page.request.get(apiURL + '/products');
        expect(productsResponse.status()).toBe(200);
        const productsData = await productsResponse.json();
        const rawProducts = productsData.data.slice(0, 3);
        expect(rawProducts.length).toBe(3);

        // salva os favoritos e guarda o ID DO FAVORITO junto com o produto
        favoriteProducts = [];
        for (const product of rawProducts) {
            const addFav = await page.request.post(apiURL + '/favorites', {
                headers: { Authorization: 'Bearer ' + access_token },
                data: { product_id: product.id }
            });
            expect(addFav.status()).toBe(201);
            const favData = await addFav.json();
            favoriteProducts.push({ ...product, favoriteId: favData.id });
        }

        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account', { timeout: 20000 });
        await page.goto(baseURL + '/account/favorites');
    });


    test('Favorites page @sprint5 @AC1', async ({ page }) => {
        // Given I am logged in
        // When I navigate to my favorites page
        // Then a list of my favorite products is 
        // displayed showing image, name, and description (truncated to 250 characters). 
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });

        for (const product of favoriteProducts) {
            const card = page.getByTestId('favorite-' + product.favoriteId); 
            await expect(card).toBeVisible({ timeout: 10000 });

            await expect(card.getByTestId('product-name')).toHaveText(product.name);

            const productImg = card.locator('img.card-img');
            await expect(productImg).toBeVisible();
            await expect(productImg).toHaveAttribute('alt', product.name);

            const truncatedDesc = product.description.slice(0, 240);
            await expect(card.getByTestId('product-description')).toContainText(truncatedDesc);
        }
    });


    test('Remove a favorite @sprint5 @AC3', async ({ page }) => {
        // Given the favorites list is displayed
        // When I click the delete button on a favorite
        // Then the product is removed and the list refreshes. 
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        const favoriteCards = page.locator('app-favorites .card');

       await expect(favoriteCards).toHaveCount(3, { timeout: 10000 });

        const deletePromise = page.waitForResponse(response => 
            response.url().includes('/favorites/') && 
            response.request().method() === 'DELETE' &&
            response.status() === 204
        );

        await favoriteCards.first().getByTestId('delete').click();

        await deletePromise;

        await expect(favoriteCards).toHaveCount(2, { timeout: 10000 });

    });


});



test.describe('Favorites Management - empty state', () => {
    let testEmail: string = '';
    let testPassword: string = '';

    test.beforeEach(async ({ page }) => {
        testEmail = `favorites-empty-${Date.now()}@example.com`;
        testPassword = 'AnyP@ssworld11!';

        const registerResponse = await page.request.post(apiURL + '/users/register', {
            data: {
                first_name: 'Jane', last_name: 'Doe',
                dob: '1990-01-01', phone: '1234567890',
                email: testEmail, password: testPassword,
                address: {
                    street: 'Test Street 123', postal_code: '12345',
                    city: 'Test City', state: 'Test State', country: 'US'
                },
            },
        });
        expect(registerResponse.status()).toBe(201);

        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        const loginResponsePromise = page.waitForResponse(
            r => r.url().includes('/users/login') && r.request().method() === 'POST',
            { timeout: 20000 }
        );
        await page.getByTestId('login-submit').click();
        await loginResponsePromise;
        await page.waitForURL('**/account', { timeout: 20000 });
        await page.goto(baseURL + '/account/favorites');
    });


    test('Empty favorites @sprint5 @AC2', async ({ page }) => {
        // Given I have no favorites
        // Then a message indicating no favorites is displayed. 
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        
        await expect(page.getByText('There are no favorites yet.')).toBeVisible({ timeout: 10000 });

    });
   
});