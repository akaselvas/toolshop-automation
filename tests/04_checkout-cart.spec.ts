import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

test.describe('checkout cart', () => {
   test.beforeEach(async ({ page }) => {
        
        await page.goto(baseURL);

        await expect(page.locator('.card-img-top').first()).toBeVisible({timeout:10000});
        const firstCard = page.locator('.card').first();
        await firstCard.click();

        await page.waitForURL('**/product/**')

        const addButton = page.getByTestId('add-to-cart');
        await addButton.click();
        
        await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });

        const cartButton = page.getByTestId('nav-cart');
        await cartButton.click();

        await page.waitForURL('**/checkout')
    });

    test('Cart contents displayed @sprint5 @AC1', async({page}) => {
    // Given I have items in my cart
    // When I navigate to the checkout page
    // Then a table is displayed with columns: Item, Quantity, Price, Total, and Actions. 
    
    await expect(page.locator('.btn.btn-danger')).toBeVisible({timeout:10000});
    await expect(page.getByRole('columnheader', { name: 'Item' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Quantity' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Price' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
    })


    test('Update quantity @sprint5 @AC2', async({page}) => {
    // Given I change the quantity of a cart item
    // Then the item total and cart total are recalculated
    // And a confirmation message "Product quantity updated." is displayed.
    // 1. Declarar os localizadores
    const quantityInput = page.getByTestId('product-quantity').first();
    const linePriceLocator = page.getByTestId('line-price').first();
    const cartTotalLocator = page.getByTestId('cart-total');

    // 2. Aguardar a carga inicial
    await expect(quantityInput).toBeVisible({ timeout: 10000 });
    await expect(linePriceLocator).toBeVisible({ timeout: 10000 });
    await expect(cartTotalLocator).toBeVisible({ timeout: 10000 });

    // 3. Capturar os valores antes da alteração
    const originalQty = parseInt(await quantityInput.inputValue());
    
    const linePriceTextBefore = await linePriceLocator.innerText();
    const linePriceBefore = parseFloat(linePriceTextBefore.replace('$', ''));

    // Calcular o preço unitário dinâmico
    const unitPrice = linePriceBefore / originalQty;

    // 4. Calcular e preencher a nova quantidade
    const newQty = originalQty + 1;
    await quantityInput.fill(newQty.toString());
    
    // Simula o "Enter" para o Angular disparar o cálculo e o Toast
    await quantityInput.press('Enter'); 
    await quantityInput.blur();

    // 5. Validar a mensagem de sucesso (usando Regex flexível)
    await expect(page.getByText('Product quantity updated')).toBeVisible({ timeout: 10000 });

    // 6. Validar que ambos foram recalculados matematicamente
    const expectedTotal = unitPrice * newQty;    
    const expectedTotalText = '$' + expectedTotal.toFixed(2);

    await expect(linePriceLocator).toHaveText(expectedTotalText);
    await expect(cartTotalLocator).toHaveText(expectedTotalText);
    
    });


    test('Delete item @sprint5 @AC3', async({page}) => {
    // Given I click the delete button on a cart item
    // Then the item is removed from the cart
    // And the cart total is recalculated. 
    await page.goto(baseURL);

    await expect(page.locator('.card-img-top').last()).toBeVisible({timeout:10000});
    const firstCard = page.locator('.card').last();
    await firstCard.click();

    await page.waitForURL('**/product/**')

    const addButton = page.getByTestId('add-to-cart');
    await addButton.click();
        
    await expect(page.getByText('Product added to shopping cart')).toBeVisible({ timeout: 10000 });

    const cartButton = page.getByTestId('nav-cart');
    await cartButton.click();

    await page.waitForURL('**/checkout')

    ///
    const cartTotalLocator = page.getByTestId('cart-total');
    const firstPriceLocator = page.getByTestId('line-price').first();
    const secondPriceLocator = page.getByTestId('line-price').nth(1);

    await expect(cartTotalLocator).toBeVisible({ timeout: 10000 });
    await expect(firstPriceLocator).toBeVisible({ timeout: 10000 });
    await expect(secondPriceLocator).toBeVisible({ timeout: 10000 });

    const originalTotalCartTxt = await cartTotalLocator.innerText();
    const originalTotalCart = parseFloat(originalTotalCartTxt.replace('$', ''));
    
    const firstPriceTxt = await firstPriceLocator.innerText();
    const firstPrice = parseFloat(firstPriceTxt.replace('$', ''));
    
    const secondPriceTxt = await secondPriceLocator.innerText();
    const secondPrice = parseFloat(secondPriceTxt.replace('$', ''));
    
    expect(originalTotalCart).toBe(firstPrice + secondPrice);

    const deleteSecondProduct = page.locator('.btn.btn-danger').nth(1);
    
    await deleteSecondProduct.click()

    await expect(page.getByText('Product deleted')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.btn.btn-danger')).toHaveCount(1, { timeout: 15000 });
    
    const expectedNewTotalText = '$' + firstPrice.toFixed(2);
    await expect(cartTotalLocator).toHaveText(expectedNewTotalText);

    })

 })