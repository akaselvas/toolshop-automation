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
        await expect(firstRow.getByRole('link', { name: 'Edit' })).toBeVisible({ timeout: 10000 });
        
        await page.getByTestId('product-add').click();
        await page.waitForURL('**/admin/products/add', { timeout: 10000 });

        const productName = 'NewTool' + Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 5);
        await page.getByTestId('name').fill(productName);
        await page.getByTestId('description').fill('This is a valid product description of a dynamic tool.');
        await page.getByTestId('stock').fill('1');
        await page.getByTestId('price').fill('1.0');
        await page.getByTestId('co2-rating').selectOption({ index: 2 });
        await page.getByTestId('brand-id').selectOption({ index: 2 });
        await page.getByTestId('category-id').selectOption({ index: 2 });
        await page.getByTestId('product-image-id').selectOption({ index: 2 });
        await page.getByTestId('product-submit').click();
        await expect(page.getByText(/Product saved/i)).toBeVisible({ timeout: 10000 });

        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-products').click();
        await expect(page.getByTestId('product-search-submit')).toBeVisible({ timeout: 15000 });
        await page.getByTestId('product-search-query').fill(productName);
        await page.getByTestId('product-search-query').blur(); 
        await page.getByTestId('product-search-submit').click();

        const row = page.locator('table tbody tr').first();
        await expect(row).toBeVisible({timeout:15000});
        await expect(row).toContainText(productName, { timeout: 15000 });

        // EDIT
        await row.getByRole('link', { name: 'Edit' }).click();
        await page.waitForURL('**/admin/products/edit/**', { timeout: 10000 });
        const editedName = productName + 'Edited';
        await page.getByTestId('name').fill(editedName);
        await page.getByTestId('description').fill('This is a valid product description of a dynamic tool.');
        await page.getByTestId('price').fill('1.0');
        await page.getByTestId('co2-rating').selectOption({ index: 2 });
        await page.getByTestId('brand-id').selectOption({ index: 2 });
        await page.getByTestId('category-id').selectOption({ index: 2 });
        await page.getByTestId('product-image-id').selectOption({ index: 2 });
        await page.getByTestId('location-offer').check();
        await page.getByTestId('location-offer').uncheck();
        await page.getByTestId('rental').check();
        await page.getByTestId('rental').uncheck();
        await page.getByTestId('stock').fill('1');
        const editResponsePromise = page.waitForResponse(response =>
            response.url().includes('/products/') &&
            response.request().method() === 'PUT',
            { timeout: 15000 }
        );
        await page.getByTestId('product-submit').click();
        await editResponsePromise;
        await expect(page.getByText(/Product saved/i)).toBeVisible({ timeout: 10000 });

        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-products').click();
        await expect(page.getByTestId('product-search-submit')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
        await page.getByTestId('product-search-query').fill(editedName);
        await page.getByTestId('product-search-query').blur(); 
        await page.getByTestId('product-search-submit').click();
        const editedRow = page.locator('table tbody tr').first();
        await expect(editedRow).toBeVisible({timeout:15000})
        await expect(editedRow).toContainText(editedName, { timeout: 15000 });

        await editedRow.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('Product deleted.')).toBeVisible({ timeout: 10000 });

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


    test('Disable and enable user accounts @sprint5 @AC7', async ({ page, browser }) => {
        // Given I am editing a user account in the admin panel
        // Then an "Enabled" toggle is available
        // And disabling the account immediately prevents the user from logging in
        // And re-enabling the account restores the user's access. 

        const userEmail = `admin-toggle-user-${Date.now()}@example.com`;
        const userPassword = 'AnyP@ssworld11!';

        const registerUser = await page.request.post(apiURL + '/users/register', {
            data: {
                first_name: 'John', last_name: 'Doe', dob: '1990-01-01', phone: '1234567890',
                email: userEmail, password: userPassword,
                address: { street: 'Any Street', postal_code: '12345', city: 'Any City', state: 'NY', country: 'US' },
            },
        });
        expect(registerUser.status()).toBe(201);
        const targetId = (await registerUser.json()).id;

        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-users').click();
        await page.getByTestId('user-search-query').fill(userEmail);
        await page.getByTestId('user-search-submit').click();

        const row = page.locator('table tbody tr').first();
        await expect(row).toContainText(userEmail, { timeout: 10000 });
        await row.getByRole('link', { name: 'Edit' }).click();
        await page.waitForURL(`**/admin/users/edit/${targetId}`, { timeout: 10000 });

        const enabledToggle = page.getByTestId('enabled');
        await expect(enabledToggle).toBeVisible();
        await expect(enabledToggle).toBeChecked();

        await enabledToggle.uncheck();
        await page.getByTestId('user-submit').click();
        await expect(page.getByText('User saved!')).toBeVisible({ timeout: 10000 });

        const customerContext = await browser.newContext();
        const customerPage = await customerContext.newPage();

        await customerPage.goto(baseURL + '/auth/login');
        await customerPage.getByTestId('email').fill(userEmail);
        await customerPage.getByTestId('password').fill(userPassword);
        await customerPage.getByTestId('login-submit').click();
        await expect(customerPage.getByText('Account disabled')).toBeVisible({ timeout: 10000 });
        expect(customerPage.url()).not.toContain('/account'); // não entrou

        await enabledToggle.check();
        await page.getByTestId('user-submit').click();
        await expect(page.getByText('User saved!')).toBeVisible({ timeout: 10000 });

        await customerPage.goto(baseURL + '/auth/login');
        await customerPage.getByTestId('email').fill(userEmail);
        await customerPage.getByTestId('password').fill(userPassword);
        const reLoginResponsePromise = customerPage.waitForResponse(
            r => r.url().includes('/users/login') && r.request().method() === 'POST',
            { timeout: 20000 }
        );
        
        await customerPage.getByTestId('login-submit').click();
        await reLoginResponsePromise;
        await customerPage.waitForURL('**/account', { timeout: 20000 });
        await customerContext.close();

        const adminToken = await page.evaluate(() => localStorage.getItem('auth-token'));
        const deleteResponse = await page.request.delete(`${apiURL}/users/${targetId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(deleteResponse.status()).toBe(204);

    });


    test('Message management @sprint5 @AC8', async ({ page }) => {
        // Given I navigate to the messages management page
        // Then I can view all contact messages, view details, and reply.
        const customerEmail = `admin-msg-customer-${Date.now()}@example.com`;
        const customerPassword = 'AnyP@ssworld11!';

        const registerUser = await page.request.post(apiURL + '/users/register', {
            data: {
                first_name: 'Alice', last_name: 'Customer', dob: '1990-01-01', phone: '1234567890',
                email: customerEmail, password: customerPassword,
                address: { street: 'Any Street', postal_code: '12345', city: 'Any City', state: 'NY', country: 'US' },
            },
        });
        expect(registerUser.status()).toBe(201);

        const loginResponse = await page.request.post(apiURL + '/users/login', {
            data: { email: customerEmail, password: customerPassword },
        });
        const customerToken = (await loginResponse.json()).access_token;

        const messageSubject = `admin-review-${Date.now()}`;
        const messageResponse = await page.request.post(apiURL + '/messages', {
            headers: { Authorization: `Bearer ${customerToken}` },
            data: {
                name: 'Alice Customer',
                email: customerEmail,
                subject: messageSubject,
                message: 
                'Message created by a customer, admin should be able to see and reply to it.',
            },
        });
        expect(messageResponse.status()).toBe(200);

        const getMessages = await page.request.get(apiURL + '/messages', {
            headers: { Authorization: `Bearer ${customerToken}` },
        });
        const messageId = (await getMessages.json()).data[0].id;

        await page.getByTestId('nav-menu').click();
        await page.getByTestId('nav-admin-messages').click();

        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Subject' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible();

        await expect(page.getByText(messageSubject)).toBeVisible({ timeout: 10000 });

        await page.getByTestId(`message-details-${messageId}`).click();
        await page.waitForURL(`**/admin/messages/${messageId}`, { timeout: 10000 });

        const cardHeader = page.locator('.card-header').first();
        await expect(cardHeader).toContainText('Alice Customer');
        await expect(cardHeader).toContainText(messageSubject);
        await expect(cardHeader.locator('span.badge')).toHaveText('NEW');
        await expect(page.locator('.card-text').first()).toContainText(
            'Message created by a customer');

        const adminReplyText = 'Thanks for reaching out, we are looking into this.';
        await page.getByTestId('message').fill(adminReplyText);

        const replyResponsePromise = page.waitForResponse(
            r => r.url().includes('/reply') && r.request().method() === 'POST'
        );
        await page.getByTestId('reply-submit').click();
        await replyResponsePromise;

        const replyTexts = page.locator('.card.bg-light .card-text');
        await expect(replyTexts).toHaveCount(1, { timeout: 10000 });
        await expect(replyTexts.last()).toHaveText(adminReplyText);

    });


    test('Message management @sprint5 @AC9', async ({ page }) => {
        // Given I navigate to the reports section
        // Then I can view monthly sales, weekly sales, and general statistics. 
        await page.getByTestId('nav-menu').click();
        await page.locator('.reports.nav-item.dropdown').hover();
        await page.getByTestId('nav-average-month-sales').click();
        await page.waitForURL('**/admin/reports/average-sales-per-month', { timeout: 10000 });
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('page-title')).toContainText('Average sales per month', { timeout: 10000 } );
        await expect(page.locator('canvas.chart')).toBeVisible({ timeout: 10000 });

        await page.getByTestId('nav-menu').click();
        await page.locator('.reports.nav-item.dropdown').hover();
        await page.getByTestId('nav-average-week-sales').click();
        await page.waitForURL('**/admin/reports/average-sales-per-week', { timeout: 10000 });
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('page-title')).toContainText('Average sales per week', { timeout: 10000 } );
        await expect(page.locator('canvas.chart')).toBeVisible({ timeout: 10000 });

        await page.getByTestId('nav-menu').click();
        await page.locator('.reports.nav-item.dropdown').hover();
        await page.getByTestId('nav-admin-statistics').click();
        await page.waitForURL('**/admin/reports/statistics', { timeout: 10000 });
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('page-title')).toContainText('Statistics', { timeout: 10000 } );
        await expect(page.getByRole('heading', { name: 'Top 10 Best Selling Categories' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Top 10 Most Purchased Products' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Customers By Country' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Total Sales Per Country' })).toBeVisible();

    });
    




});