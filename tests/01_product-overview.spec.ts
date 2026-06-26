import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

//------ SPRINT 1 --------------------------------------------------//

test('Product overview is displayed @AC1', async ({ page }) => {
    // Given I navigate to the home page
    // Then a grid of product cards is displayed showing all products. 
    await page.goto(baseURL);
    await expect(page.locator('.card')).toHaveCount(9);
})

test('Product card information @AC2', async ({page}) =>{
    // Given the product overview is displayed
    // Then each product card shows: a product imagem, the product name, the product price
    
    await page.goto(baseURL);
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

test('Navigating to product detail @AC3', async ({page}) => {
    // Given the product overview is displayed
    // When I click on a product card
    // Then I am navigated to the product detail page for that product. 
   
    await page.goto(baseURL);
    const firstCard = page.locator('.card').first();
    const targetUrl = await firstCard.getAttribute('href');
    // Since I want to avoid hardcoding a volatile product URL, I used a dynamic RegExp.
    // To prevent TypeScript from flagging 'targetUrl' as potentially NULL,
    // I added a non-null assertion with the help of 'expect().not.toBeNull()'.
    expect(targetUrl).not.toBeNull();
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(targetUrl!));
})

test('Search @AC4', async({page}) =>{
    // Given I enter a valid search query (3–40 characters) and submit
    // Then the product grid updates to show only matching products
    // And all active filters are reset. 
    await page.goto(baseURL);
    
    const searchQuery = page.locator('[data-test="search-query"]');
    await expect(searchQuery).toBeVisible();
    await searchQuery.fill('Hammer');

    const searchButton = page.locator('[data-test="search-submit"]');
    await searchButton.click();

    await expect(page.locator('[data-test="search-term"]')).toBeVisible();
    await expect(page.locator('[data-test="search-term"]')).toContainText('Hammer', {ignoreCase: true});

    const notFilters = await page.locator('[type="checkbox"]').all();
    
    for (const checkboxes of notFilters){
        await expect(checkboxes).not.toBeChecked();
    }

})


test('Category filter @AC5', async({page}) =>{
    // Given I check one or more category checkboxes in the sidebar
    // Then the product grid updates to show only products from those categories. 
    await page.goto(baseURL);

    await expect(page.locator('div[data-test="filters"]')).toBeVisible();

    const checkHammer = page.locator('[data-test="category-3"]');
    const constHandSaw = page.locator('[data-test="category-4"]');
    await checkHammer.check();
    await constHandSaw.check();

    await expect(page.locator('[data-test="filter_completed"]')).toBeVisible();
    
    const allowedCategories = /Hammer|Saw/i;

    await expect(page.locator('[data-test="product-name"]').first()).toContainText(allowedCategories);

    const eachCard = await page.locator('.card').all();
    for (const card of eachCard) {
        await expect(card.locator('[data-test="product-name"]')).toContainText(allowedCategories);
    }
        
})

test(' Hierarchical category selection @AC6',async ({page}) => {
    // Given a parent category has child categories
    // When I check the parent category checkbox
    // Then all child category checkboxes are also checked
    // And unchecking all children unchecks the parent. 
    await page.goto(baseURL);

    await expect(page.locator('div[data-test="filters"]')).toBeVisible();

    const checkParent = page.locator('[data-test="category-01KVGGMXRC3H67A5WQD37VP3MM"]');
    await checkParent.check();
    
    const handToolsGroup = page.locator('div.checkbox').filter({ 
        has: page.locator('[data-test="category-01KVGGMXRC3H67A5WQD37VP3MM"]')});

    const checkedChilds = await handToolsGroup.locator('ul input[type="checkbox"]').all();

    for (const checked of checkedChilds){
        await expect(checked).toBeChecked();
    };

    for (const unchecked of checkedChilds){
        await  unchecked.uncheck();
    };
    
    await expect(checkParent).not.toBeChecked;

})

test('Brand filter @AC7', async ({page}) => {
    // Given I check one or more brand checkboxes in the sidebar
    // Then the product grid updates to show only products from those brands
    await page.goto(baseURL);

    await expect(page.locator('div[data-test="filters"]')).toBeVisible();

    const checkBrand = page.locator('[data-test="brand-01KVGM2STDYRDBAA5FMPT8D4PW"]');
    await checkBrand.click();  

    const refreshedCards = page.locator('[data-test="filter_completed"]');
    await expect(refreshedCards).toBeVisible();
    const firstCard = refreshedCards.locator('.card').first();
    await firstCard.click();

    await expect(page).toHaveURL(/product/);
    await expect(page.getByLabel('brand')).toContainText('ForgeFlex Tools');

})

test('Combining filters @AC8', async ({page}) => {
    // Given I have selected categories and brands
    // Then the product grid shows only products matching both filters. 
    await page.goto(baseURL);

    await expect(page.locator('div[data-test="filters"]')).toBeVisible();

    const checkBrand = page.locator('[data-test="brand-01KVGM2STDYRDBAA5FMPT8D4PW"]');
    await checkBrand.click();

    const checkCategory = page.locator('[data-test="category-01KVGM2T5VEQ2HH7WZKMS8DNEN"]');
    await checkCategory.click();

    const refreshedCards = page.locator('[data-test="filter_completed"]');
    await expect(refreshedCards).toBeVisible();

    const firstCard = refreshedCards.locator('.card').first();
    await firstCard.click();

    await expect(page).toHaveURL(/product/);
    await expect(page.getByLabel('brand')).toContainText('ForgeFlex Tools');
    await expect(page.getByLabel('category')).toContainText('Hammer');
})

test('Sorting @AC9', async ({page}) => {
    // Given I select a sort option (Name A-Z, Name Z-A, Price High-Low, Price Low-High)
    // Then the product grid reloads with products ordered accordingly. 
    await page.goto(baseURL);

    await expect(page.getByTestId('sort')).toBeVisible();
    
    const selectSortMenu = page.getByTestId('sort');
    await selectSortMenu.selectOption({label: 'Price (Low - High)'})

    const refreshCards = page.getByTestId('sorting_completed');
    await expect(refreshCards).toBeVisible();

    const priceText1 = await page.getByTestId('product-price').first().innerText();
    const priceText2 = await page.getByTestId('product-price').nth(1).innerText();

    const price1 = parseFloat(priceText1.replace('$', ''));
    const price2 = parseFloat(priceText2.replace('$', ''));

    expect(price1).toBeLessThanOrEqual(price2);
})

test('Price range slider @AC10', async ({page}) => {
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
    
})

test('Adjusting the price range @AC11', async ({page}) => {
    // Given I drag the slider handles to a new minimum and maximum
    // Then the product grid updates to show only products within the selected price range
    await page.goto(baseURL);

    const minSlider = page.locator('.ngx-slider-pointer-min');
    const maxSlider = page.locator('.ngx-slider-pointer-max');
    await expect(minSlider).toBeVisible();
    await expect(maxSlider).toBeVisible();

    //ARRASTO DO MÍNIMO VIA MOUSE (Move o centro do ponteiro 50px para a direita)
    const minBox = await minSlider.boundingBox();
    if (minBox) {
        await page.mouse.move(minBox.x + minBox.width / 2, minBox.y + minBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(minBox.x + 50, minBox.y + minBox.height / 2);
        await page.mouse.up();
    }

    // ARRASTO DO MÁXIMO VIA MOUSE (Move o centro do ponteiro 80px para a esquerda)
    const maxBox = await maxSlider.boundingBox();
    if (maxBox) {
        await page.mouse.move(maxBox.x + maxBox.width / 2, maxBox.y + maxBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(maxBox.x - 80, maxBox.y + maxBox.height / 2);
        await page.mouse.up();
    }

    // LEITURA DINÂMICA DOS VALORES ALCANÇADOS
    const minValText = await minSlider.getAttribute('aria-valuenow');
    const maxValText = await maxSlider.getAttribute('aria-valuenow');
    const minVal = parseFloat(minValText || '0');
    const maxVal = parseFloat(maxValText || '200');

    console.log(`FAIXA FILTRADA DINAMICAMENTE: Mínimo = ${minVal} | Máximo = ${maxVal}`);

    // VALIDAÇÃO DINÂMICA EM LOOP (toBeVisible)
    await expect.poll(async () => {
        const priceText1 = await page.getByTestId('product-price').first().innerText();
        const priceText2 = await page.getByTestId('product-price').last().innerText();
        
        console.log(`PREÇOS LIDOS DA TELA: Mínimo = ${priceText1} | Máximo = ${priceText2}`);
        
        const price1 = parseFloat(priceText1.replace('$', ''));
        const price2 = parseFloat(priceText2.replace('$', ''));
        
        return price1 >= minVal && price2 <= maxVal;
    }, { timeout: 15000 }).toBe(true);
});

test('Discount price display @AC12', async ({ page }) => {
    // Given a product has a discount (location-based or otherwise)
    // Then the product card shows the original price with a strikethrough and the discounted price below. 
    
    // Para verificar manualmente ver o que tem no localStorage agora:
    // localStorage.getItem('GEO_LOCATION')
    // Se vier null ou {}, setar manualmente para Amsterda e recarregar:
    // localStorage.setItem('GEO_LOCATION', JSON.stringify({ lat: 52, lng: 5 })) location.reload()
    
    // Injeta coordenadas de Amsterdã antes da página carregar
    // para simular um usuário elegível a desconto por localização
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