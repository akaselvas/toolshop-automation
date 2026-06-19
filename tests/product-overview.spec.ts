import {test, expect, Locator} from "@playwright/test"


//------ SPRINT 1 --------------------------------------------------//

test('Product overview is displayed @AC1', async ({ page }) => {
    // Given I navigate to the home page
    // Then a grid of product cards is displayed showing all products. 
    
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    await expect(page.locator('.card')).toHaveCount(9);
})

test('Product card information @AC2', async ({page}) =>{
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

test('Navigating to product detail @AC3', async ({page}) => {
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

test('Search @AC4', async({page}) =>{
    // Given I enter a valid search query (3–40 characters) and submit
    // Then the product grid updates to show only matching products
    // And all active filters are reset. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com');
    
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
    await page.goto('https://with-bugs.practicesoftwaretesting.com');

    await expect(page.locator('div[data-test="filters"]')).toBeVisible();

    const checkHammer = page.locator('[data-test="category-3"]');
    const constHandSaw = page.locator('[data-test="category-4"]');
    await checkHammer.check();
    await constHandSaw.check();

    await expect(page.locator('[data-test="filter_completed"]')).toBeVisible();
    
    // 1. Declaramos a expressão de busca uma única vez
    const allowedCategories = /Hammer|Saw/i;

    // 2. Usamos fora do loop para forçar a espera do primeiro produto
    await expect(page.locator('[data-test="product-name"]').first()).toContainText(allowedCategories);

    // 3. Usamos dentro do loop para validar todos de forma curta
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
    await page.goto('https://practicesoftwaretesting.com/');

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
    await page.goto('https://practicesoftwaretesting.com/');

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
    await page.goto('https://practicesoftwaretesting.com/');

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
    await page.goto('https://practicesoftwaretesting.com/');

    await expect(page.locator('div[data-test="filters"]')).toBeVisible();
    

})
