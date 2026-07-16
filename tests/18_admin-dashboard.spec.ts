import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

test.describe('Admin Dashboard Management Suite', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);

        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill('admin@practicesoftwaretesting.com');
        await page.getByTestId('password').fill('welcome01');
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/admin/dashboard', { timeout: 20000 });
    });


    test('Dashboard @sprint5 @AC1', async ({ page }) => {
        // Given I am logged in as an admin
        // When I navigate to /admin/dashboard
        // Then a bar chart of total sales by year and 
        // a paginated list of recent invoices are displayed. 
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });

        await expect(page.locator('canvas.chart')).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Latest orders' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Invoice Number' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Billing Address' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Invoice Date' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
        await expect(page.locator('table tbody tr').first()).toBeVisible();

        await expect(page.getByTestId('pagination-next')).toBeVisible();

    });


    test('Product management @sprint5 @AC2', async ({ page }) => {
        // Given I navigate to the products management page
        // Then I can list, create, edit, and delete products. 

        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-products').click();

        await expect(page.getByTestId('product-search-submit')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('product-add')).toBeVisible({ timeout: 10000 });

        const firstRow = page.locator('table tbody tr').first();
        await expect(firstRow.getByRole('link', {name: 'Edit'})).toBeVisible({ timeout: 10000 });
        await expect(firstRow.getByRole('button', {name: 'Delete'})).toBeVisible();

    });


    test('Category management @sprint5 @AC3', async ({ page }) => {
        // Given I navigate to the categories management page
        // Then I can list, create, edit, and delete categories (with optional parent category). 

        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-categories').click();

        await expect(page.getByTestId('category-search-submit')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('category-add')).toBeVisible({ timeout: 10000 });

        const firstRow = page.locator('table tbody tr').first();
        await expect(firstRow.getByRole('link', {name: 'Edit'})).toBeVisible({ timeout: 10000 });
        await expect(firstRow.getByRole('button', {name: 'Delete'})).toBeVisible();

        await expect(page.getByRole('columnheader', { name: 'Parent_id' })).toBeVisible();

    });


    test('Brand management @sprint5 @AC4', async ({ page }) => {
        // Given I navigate to the brands management page
        // Then I can list, create, edit, and delete brands. 
        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-brands').click();

        await expect(page.getByTestId('brand-search-submit')).toBeVisible({timeout:10000});
        await expect(page.getByTestId('brand-add')).toBeVisible({timeout:10000});

        const firstRow = page.locator('table tbody tr').first();
        await expect(firstRow.getByRole('link', {name: 'Edit'})).toBeVisible({timeout:10000});
        await expect(firstRow.getByRole('button', {name: 'Delete'})).toBeVisible({timeout:10000});

    });


    test('Order management @sprint5 @AC5', async ({ page }) => {
        // Given I navigate to the orders management page 
        // Then I can list all orders, view details, and update order status
        // And the available status values are: 
        // AWAITING_FULFILLMENT, ON_HOLD, AWAITING_SHIPMENT, SHIPPED, COMPLETED. 
        
        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-orders').click();

        await expect(page.getByTestId('order-search-submit')).toBeVisible({timeout:10000});
        await expect(page.getByRole('columnheader', {name: 'Invoice Number'})).toBeVisible({timeout:10000});
        await expect(page.getByRole('columnheader', {name: 'Billing Address'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Invoice Date'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Status'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Total'})).toBeVisible();
        
        const firstRow = page.locator('table tbody tr').first();
        const editBtn = firstRow.getByRole('link', {name: 'Edit'});
        await expect(editBtn).toBeVisible({timeout:10000});
        await editBtn.click();

        await page.waitForURL('**/admin/orders/edit/**',{ timeout: 20000 });
        
        await expect(page.getByRole("heading", {name: 'General Information'})).toBeVisible({timeout:10000});
        await expect(page.getByRole("heading", {name: 'Payment Information'})).toBeVisible({timeout:10000});
        await expect(page.getByRole("heading", {name: 'Billing Address'})).toBeVisible({timeout:10000});
        await expect(page.getByRole("heading", {name: 'Products'})).toBeVisible({timeout:10000});

        const statusDropdownMenu = page.getByTestId('order-status');
        await expect(statusDropdownMenu.locator('option')).toContainText([
            'AWAITING_FULFILLMENT ',
            'ON_HOLD ',
            'AWAITING_SHIPMENT ',
            'SHIPPED ',
            'COMPLETED ',
        ]);

    });


    test('User management @sprint5 @AC6', async ({ page }) => {
        // Given I navigate to the users management page
        // Then I can list, view, edit, and delete user accounts.   
        const userEmail = `admin-edit-user-${Date.now()}@example.com`;
        const registerUser = await page.request.post(apiURL + '/users/register', {
            data: {
                first_name: 'John', last_name: 'Doe', dob: '1990-01-01', phone: '1234567890',
                email: userEmail, password: 'AnyP@ssworld11!',
                address: { 
                    street: 'Any Street', postal_code: '12345', city: 'Any City', state: 'NY', country: 'US' },
            },
        })
        expect(registerUser.status()).toBe(201);
        const targetID = (await registerUser.json()).id;
        
        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-users').click();

        const firstRow = page.locator('table tbody tr').first();
        await expect(firstRow.getByRole('link', {name: 'Edit'})).toBeVisible({ timeout: 10000 });
        await expect(firstRow.getByRole('button', {name: 'Delete'})).toBeVisible();

        await page.getByTestId('user-search-query').fill(userEmail);
        await page.getByTestId('user-search-submit').click();
        await expect(firstRow).toContainText(userEmail, { timeout: 10000 });
        await firstRow.getByRole('link', { name: 'Edit' }).click();

        await page.waitForURL(`**/admin/users/edit/${targetID}`, { timeout: 10000 });

        await expect(page.getByTestId('first-name')).toHaveValue('John', { timeout: 10000 });
        await page.getByTestId('first-name').fill('John Edited');
        await page.getByTestId('user-submit').click()

        await expect(page.getByText('User saved!')).toBeVisible({ timeout: 10000 });

        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-users').click();
        await page.getByTestId('user-search-query').fill(userEmail);
        await page.getByTestId('user-search-submit').click();
        await expect(page.locator('table tbody tr').first()).toContainText('John Edited', { timeout: 10000 });

        const deleteButton = firstRow.getByRole('button', { name: 'Delete' });
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        await expect(page.getByText('User deleted.')).toBeVisible({ timeout: 10000 });

        await expect(page.locator('table tbody')).not.toContainText(userEmail, { timeout: 10000 });

    });

    

});