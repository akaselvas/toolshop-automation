import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

test('Product overview is displayed @AC1', async ({ page }) => {
    // Given I navigate to the home page
    // Then a grid of product cards is displayed showing all products. 
    await page.goto(baseURL);
    
    // Garante o carregamento dos cards [15, 22]
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
    const cardCount = await page.locator('.card').count();
    expect(cardCount).toBeGreaterThan(0);
});

test('Product card information @AC2', async ({ page }) => {
    // Given the product overview is displayed
    // Then each product card shows: a product image, the product name, the product price
    await page.goto(baseURL);
    
    // 1. GARANTE que a listagem carregou completamente antes de rodar o .all() [15, 22]
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
    
    const cards = await page.locator('.card').all();
    for (const card of cards) {
        await card.scrollIntoViewIfNeeded();
        await expect(card.locator('img')).toBeVisible({ timeout: 10000 });
        await expect(card.locator('[data-test="product-name"]')).toBeVisible();
        await expect(card.locator('[data-test="product-price"]')).toBeVisible();
    }
});

test('Navigating to product detail @AC3', async ({ page }) => {
    // Given the product overview is displayed
    // When I click on a product card
    // Then I am navigated to the product detail page for that product. 
    await page.goto(baseURL);
    
    // 2. Busca diretamente pelo link semântico do produto (evita href nulo!) [15, 30]
    const firstCard = page.locator('a[href^="/product/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    const targetUrl = await firstCard.getAttribute('href');
    expect(targetUrl).not.toBeNull();
    
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(targetUrl!));
});

test('Search @AC4', async ({ page }) => {
    // Given I enter a valid search query (3–40 characters) and submit
    // Then the product grid updates to show only matching products
    // And all active filters are reset. 
    await page.goto(baseURL);

    const searchQuery = page.locator('[data-test="search-query"]');
    await expect(searchQuery).toBeVisible();
    await searchQuery.fill('Hammer');

    const searchResponsePromise = page.waitForResponse(response => 
        response.url().includes('/products') && 
        response.request().method() === 'GET' && // Corrigido método HTTP para GET [15]
        response.status() === 200
    );
    await page.locator('[data-test="search-submit"]').click();
    await searchResponsePromise;

    await expect(page.locator('[data-test="search-term"]')).toBeVisible();
    await expect(page.locator('[data-test="search-term"]')).toContainText('Hammer', { ignoreCase: true });

    const checkboxes = await page.locator('[type="checkbox"]').all();
    for (const checkbox of checkboxes) {
        await expect(checkbox).not.toBeChecked();
    }
});

test('Category filter @AC5', async ({ page }) => {
    // Given I check one or more category checkboxes in the sidebar
    // Then the product grid updates to show only products from those categories. 
    await page.goto(baseURL);

    await expect(page.locator('div[data-test="filters"]')).toBeVisible();

    // 3. Usa os nomes de checkbox (Label) do AC5 contra os IDs de bancos antigos [15, 35]
    const checkHammer = page.getByRole('checkbox', { name: 'Hammer' });
    const checkHandSaw = page.getByRole('checkbox', { name: 'Hand Saw' });
    
    await checkHammer.check();
    await checkHandSaw.check();

    await expect(page.locator('[data-test="filter_completed"]')).toBeVisible({ timeout: 15000 });
    
    const allowedCategories = /Hammer|Saw/i;
    await expect(page.locator('[data-test="product-name"]').first()).toContainText(allowedCategories);

    const eachCard = await page.locator('.card').all();
    for (const card of eachCard) {
        await expect(card.locator('[data-test="product-name"]')).toContainText(allowedCategories);
    }
});

test('Hierarchical category selection @AC6', async ({ page }) => {
    // Given a parent category has child categories
    // When I check the parent category checkbox
    // Then all child category checkboxes are also checked
    // And unchecking all children unchecks the parent. 
    await page.goto(baseURL);
    await expect(page.locator('div[data-test="filters"]')).toBeVisible({ timeout: 10000 });

    // 1. Localiza o checkbox pai de forma semântica pelo nome [15]
    const parentCheckbox = page.getByRole('checkbox', { name: 'Hand Tools' });
    await expect(parentCheckbox).toBeVisible();

    // 2. Quando eu marco o checkbox da categoria pai [17]
    await parentCheckbox.check();

    // 3. Define os nomes das subcategorias filhas oficiais do banco de dados [15, 35]
    const childCategoryNames = [
        'Hammer',
        'Hand Saw',
        'Wrench',
        'Screwdriver',
        'Pliers',
        'Chisels',
        'Measures'
    ];

    // 4. VALIDAÇÃO: Garante que todas as subcategorias filhas foram marcadas na tela [15]
    for (const name of childCategoryNames) {
        await expect(page.getByRole('checkbox', { name })).toBeChecked({ timeout: 10000 });
    }

    // 5. Desmarca todas as subcategorias filhas uma por uma [15]
    for (const name of childCategoryNames) {
        await page.getByRole('checkbox', { name }).uncheck();
    }

    // 6. VALIDAÇÃO: Garante que a categoria pai foi desmarcada automaticamente [15, 31]
    await expect(parentCheckbox).not.toBeChecked();
});

test('Brand filter @AC7', async ({ page }) => {
    // Given I check one or more brand checkboxes in the sidebar
    // Then the product grid updates to show only products from those brands
    await page.goto(baseURL);
    
    // 4. Corrigido seletor de filtros contra strict mode [15, 30]
    await expect(page.locator('div[data-test="filters"]')).toBeVisible({ timeout: 10000 });

    const filterResponsePromise = page.waitForResponse(response => 
        response.url().includes('/products') && 
        response.request().method() === 'GET' && 
        response.status() === 200
    );

    await page.getByRole('checkbox', { name: 'ForgeFlex Tools' }).check();
    await filterResponsePromise;

    const firstProductImg = page.locator('img.card-img-top').first();
    await expect(firstProductImg).toBeVisible({ timeout: 10000 });
    await firstProductImg.click();

    await page.waitForURL('**/product/**', { timeout: 10000 });
    await expect(page.getByText('ForgeFlex Tools')).toBeVisible({ timeout: 10000 });
});

test('Combining filters @AC8', async ({ page }) => {
    // Given I have selected categories and brands
    // Then the product grid shows only products matching both filters. 
    await page.goto(baseURL);
    await expect(page.locator('div[data-test="filters"]')).toBeVisible({ timeout: 10000 });

    const brandResponsePromise = page.waitForResponse(response => 
        response.url().includes('/products') && 
        response.request().method() === 'GET' && 
        response.status() === 200
    );
    await page.getByRole('checkbox', { name: 'ForgeFlex Tools' }).check();
    await brandResponsePromise; 

    const categoryResponsePromise = page.waitForResponse(response => 
        response.url().includes('/products') && 
        response.request().method() === 'GET' && 
        response.status() === 200
    );
    await page.getByRole('checkbox', { name: 'Hammer' }).check();
    await categoryResponsePromise; 

     const firstProductName = page.locator('[data-test="product-name"]').first();
    await expect(firstProductName).toContainText(/Hammer/i, { timeout: 10000 });

    const firstProductImg = page.locator('img.card-img-top').first();
    await expect(firstProductImg).toBeVisible({ timeout: 10000 });
    await firstProductImg.click();

    await page.waitForURL('**/product/**', { timeout: 10000 });

    await expect(page.getByText('ForgeFlex Tools')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('span[aria-label="category"]', { hasText: 'Hammer' })).toBeVisible({ timeout: 10000 });

});

test('Sorting @AC9', async ({ page }) => {
    // Given I select a sort option (Name A-Z, Name Z-A, Price High-Low, Price Low-High)
    // Then the product grid reloads with products ordered accordingly. 
    await page.goto(baseURL);

    await expect(page.getByTestId('sort')).toBeVisible();
    
    const selectSortMenu = page.getByTestId('sort');
    await selectSortMenu.selectOption({ label: 'Price (Low - High)' });

    const refreshCards = page.getByTestId('sorting_completed');
    await expect(refreshCards).toBeVisible();

    const priceText1 = await page.getByTestId('product-price').first().innerText();
    const priceText2 = await page.getByTestId('product-price').nth(1).innerText();

    const price1 = parseFloat(priceText1.replace('$', ''));
    const price2 = parseFloat(priceText2.replace('$', ''));

    expect(price1).toBeLessThanOrEqual(price2);
});

test('Price range slider @AC10', async ({ page }) => {
    // Given I am on the product overview page
    // Then a price range slider is displayed in the sidebar 
    // with a default range of $1 to $100 and a maximum of $200. 
    await page.goto(baseURL);

    const minSlider = page.locator('.ngx-slider-pointer-min');
    const maxSlider = page.locator('.ngx-slider-pointer-max');
    await expect(minSlider).toBeVisible();
    await expect(maxSlider).toBeVisible();

    await expect(minSlider).toHaveAttribute('aria-valuemin', '0');    
    await expect(minSlider).toHaveAttribute('aria-valuenow', '1');    
    await expect(maxSlider).toHaveAttribute('aria-valuenow', '100');
    await expect(maxSlider).toHaveAttribute('aria-valuemax', '200');
});

test('Adjusting the price range @AC11', async ({ page }) => {
    // Given I drag the slider handles to a new minimum and maximum
    // Then the product grid updates to show only products within the selected price range
    await page.goto(baseURL);

    const minSlider = page.locator('.ngx-slider-pointer-min');
    const maxSlider = page.locator('.ngx-slider-pointer-max');
    await expect(minSlider).toBeVisible();
    await expect(maxSlider).toBeVisible();

    await expect(minSlider).toHaveAttribute('aria-valuemin', '0');    
    await expect(minSlider).toHaveAttribute('aria-valuenow', '1');    
    await expect(maxSlider).toHaveAttribute('aria-valuenow', '100');
    await expect(maxSlider).toHaveAttribute('aria-valuemax', '200');
    
    const minBox = await minSlider.boundingBox();
    if (minBox) {
        await page.mouse.move(minBox.x + minBox.width / 2, minBox.y + minBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(minBox.x + 50, minBox.y + minBox.height / 2);
        await page.mouse.up();
    }

    const maxBox = await maxSlider.boundingBox();
    if (maxBox) {
        await page.mouse.move(maxBox.x + maxBox.width / 2, maxBox.y + maxBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(maxBox.x - 80, maxBox.y + maxBox.height / 2);
        await page.mouse.up();
    }

    const minValText = await minSlider.getAttribute('aria-valuenow');
    const maxValText = await maxSlider.getAttribute('aria-valuenow');
    const minVal = parseFloat(minValText || '0');
    const maxVal = parseFloat(maxValText || '200');

    console.log(`FAIXA FILTRADA DINAMICAMENTE: Mínimo = ${minVal} | Máximo = ${maxVal}`);

    // CORREÇÃO: Clica no botão de busca para aplicar o filtro de preço! [15, 22]
    const searchSubmitButton = page.getByTestId('search-submit');
    await expect(searchSubmitButton).toBeVisible();
    await searchSubmitButton.click();

    await expect.poll(async () => {
        const productPrices = await page.getByTestId('product-price').allTextContents();
        console.log(`PREÇOS LIDOS DA TELA: ${productPrices.join(' | ')}`);
        
        // Verifica se TODOS os produtos na tela estão dentro da faixa de preço
        const allPricesMatch = productPrices.every(priceText => {
            const price = parseFloat(priceText.replace('$', ''));
            return price >= minVal && price <= maxVal;
        });
        return allPricesMatch;
    }, { timeout: 15000 }).toBe(true);
});

test('Discount price display @AC12', async ({ page }) => {
    // Injeta coordenadas de Amsterdã antes da página carregar [41, 49]
    await page.addInitScript(() => {
        window.localStorage.setItem('GEO_LOCATION', JSON.stringify({ lat: 52, lng: 5 }));
    });

    await page.goto(baseURL);

    await expect(page.locator('.discounted').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-test="product-discount-price"]').first()).toBeVisible();
});

test('Out of stock indicator @AC13', async ({ page }) => {
    // Given a product has no stock available
    // Then "Out of stock" is displayed on the product card. 
    await page.goto(baseURL);

    await expect(page.getByTestId('out-of-stock')).toBeVisible();
});