import {test, expect, Locator} from "@playwright/test"

test('Category page is displayed @sprint1 @AC1', async({page}) => {
    // Given I click on a category name
    // Then a page with products belonging to that category is displayed. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const categoryMenu = page.locator('.nav-item.dropdown');
    await categoryMenu.click();

    await expect(page.locator('.dropdown-menu.show')).toBeVisible();
    const clickCategory = page.locator('[data-test="nav-hand-tools"]')
    await clickCategory.click();
})

test('Category title @sprint1 @AC2',async({page}) => {
    // Given the category page is displayed
    // Then the category name is shown as the page title. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const categoryMenu = page.locator('.nav-item.dropdown');
    await categoryMenu.click()

    await expect(page.locator('.dropdown-menu.show')).toBeVisible();
    const clickCategory = page.locator('[data-test="nav-hand-tools"]');
    await clickCategory.click();

    await expect(page.locator('[data-test="page-title"]')).toHaveText('Category: Hand Tools');
})

test('Products from selected category @sprint1 @AC3',async({page}) => {
    // Given the category page is displayed
    // Then only products belonging to the selected category are shown. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/');
    const categoryMenu = page.locator('.nav-item.dropdown');
    await categoryMenu.click();

    await expect(page.locator('.dropdown-menu.show')).toBeVisible();
    const clickCategory = page.locator('[data-test="nav-hand-tools"]');
    await clickCategory.click();

    await page.locator('[data-test="category-3"]').click();

    await expect(page.locator('[data-test="filter_completed"]')).toBeVisible();
    await expect(page.locator('[data-test="product-name"]').first()).toContainText('Hammer');
    
})



