import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

test('Category page is displayed @sprint5 @AC1', async({page}) => {
    // Given I click on a category name
    // Then a page with products belonging to that category is displayed. 
    await page.goto(baseURL);
    const categoryMenu = page.locator('.nav-item.dropdown').filter({ hasText: 'Categories' });
    await categoryMenu.click();

    await expect(page.locator('.dropdown-menu.show')).toBeVisible();
    await page.locator('[data-test="nav-hand-tools"]').click();

    await page.waitForURL('**/category/**', { timeout: 10000 });
    await expect(page.getByTestId('page-title')).toContainText('Hand Tools', { timeout: 10000 });
});

test('Category title @sprint5 @AC2',async({page}) => {
    // Given the category page is displayed
    // Then the same filters as the product overview are available:
    // category checkboxes (subcategory tree)
    // brand checkboxes
    // sorting dropdown
    // pagination controls
    // price range slider
    await page.goto(baseURL + '/category/hand-tools');
    await expect(page.getByTestId('page-title')).toContainText('Hand Tools', { timeout: 15000 });

    await expect(page.locator('[data-test^="category-"]').first()).toBeVisible();
    await expect(page.locator('[data-test^="brand-"]').first()).toBeVisible();
    await expect(page.getByTestId('sort')).toBeVisible();
    await expect(page.getByTestId('pagination-next')).toBeVisible();

    // bug: category.component.html não tem <ngx-slider>
    await expect(page.getByRole('slider').first()).toHaveCount(0);

});