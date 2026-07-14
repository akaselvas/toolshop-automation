import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';
const apiURL = 'https://api.practicesoftwaretesting.com';

test.describe('Messages', () => {
    test.setTimeout(60000);
    let testEmail: string;
    let testPassword: string;
    let authToken: string;
    let userMessageId: string;

    test.beforeEach(async ({ page }) => {
        testEmail = `messages-user-${Date.now()}@example.com`;
        testPassword = 'AnyP@ssworld11!';

        const registerResponse = await page.request.post(apiURL + '/users/register', {
            data: {
                first_name: 'Jane', last_name: 'Doe', dob: '1990-01-01', phone: '1234567890',
                email: testEmail, password: testPassword,
                address: { street: 'Test Street 123', postal_code: '12345', city: 'Test City', state: 'Test State', country: 'US' },
                timeout: 20000, 
            },
        });
        expect(registerResponse.status()).toBe(201);

        const loginResponse = await page.request.post(apiURL + '/users/login', {
            data: { email: testEmail, password: testPassword },
            timeout: 20000, 
        });
        expect(loginResponse.status()).toBe(200);
        const loginBody = await loginResponse.json();
        authToken = loginBody.access_token;

        const messageResponse = await page.request.post(apiURL + '/messages', {
            headers: { Authorization: 'Bearer ' + authToken }, 
            data: {
                name: 'Jane Doe',
                email: testEmail,
                subject: 'payments',
                message: 'A message with more than 50 characters to test the truncation.',
            },
            timeout: 20000, 
        });
        expect(messageResponse.status()).toBe(200);

        const getMessages = await page.request.get(apiURL + '/messages', {
            headers: { Authorization: 'Bearer ' + authToken },
        });
        expect(getMessages.status()).toBe(200);
        const messagesData = await getMessages.json();
        userMessageId = messagesData.data[0].id;

        // 4. Login via UI pros testes de navegação [16]
        await page.goto(baseURL + '/auth/login');
        await page.getByTestId('email').fill(testEmail);
        await page.getByTestId('password').fill(testPassword);
        await page.getByTestId('login-submit').click();
        await page.waitForURL('**/account', { timeout: 25000 });

    });


    test('Messages list @sprint5 @AC1', async ({ page }) => {
        // Given I am logged in
        // When I navigate to my messages page
        // Then a paginated table is displayed with columns: 
        // subject, message (truncated to 50 chars), 
        // status badge (NEW / IN_PROGRESS / RESOLVED), 
        // date, and a details link. 
        await page.goto(baseURL + '/account/messages');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout:20000 });

        await expect(page.getByRole('columnheader', { name: 'Subject'})).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Message'})).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status'})).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Date'})).toBeVisible();
        await expect(page.locator('table th').last()).toBeVisible();

        const firstRow = page.locator('table tbody tr').first();
        
        await expect(firstRow.locator('td').nth(0)).toHaveText('payments');
        
        const messageText = await firstRow.locator('td').nth(1).innerText();
        expect(messageText.length).toBe(53); 
        expect(messageText.endsWith('...')).toBe(true); 

        const statusBadge = firstRow.locator('td').nth(2).locator('span.badge');
        await expect(statusBadge).toBeVisible(); 
        await expect(statusBadge).toHaveText(/NEW|IN_PROGRESS|RESOLVED/);

        await expect(firstRow.locator('td').nth(3)).not.toBeEmpty();

        const detailsLink = firstRow.locator('td').nth(4).getByRole('link', { name: 'Details' });
        await expect(detailsLink).toBeVisible();

    });


    test('Message detail @sprint5 @AC2', async ({ page }) => {
        // Given I click on a message
        // Then the original message is displayed (sender, subject, status, full text, timestamp)
        // And any replies are listed chronologically below.

        const replyRes = await page.request.post(`${apiURL}/messages/${userMessageId}/reply`, {
            headers: { Authorization: 'Bearer ' + authToken },
            data: { message: 'This is a reply to follow up on the website issue.' },
        });
        expect(replyRes.status()).toBe(201);

        await page.goto(baseURL + '/account/messages');
        await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 20000 });

        const firstRow = page.locator('table tbody tr').first();
        await firstRow.locator('td').nth(4).getByRole('link', { name: 'Details' }).click();
        await page.waitForURL('**/account/messages/**', { timeout: 20000 });

        const messageCard = page.locator('.card').first();
        const cardHeader = messageCard.locator('.card-header');
        await expect(cardHeader).toContainText('Jane Doe', { timeout: 20000 });
        await expect(cardHeader).toContainText('payments');
        await expect(cardHeader.locator('span.badge')).toHaveText('IN_PROGRESS');

        const cardFooter = messageCard.locator('.card-footer');
        await expect(cardFooter).toContainText(/\d{4}-\d{2}-\d{2}/);

        // ordem cronológica: 2 pontos no tempo já provam a ordem
        const originalTimestampText = await cardFooter.locator('small').innerText();
        const originalDate = new Date(originalTimestampText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)![0].replace(' ', 'T'));

        const replyHeader = page.locator('.card.bg-light .card-header').first();
        const replyHeaderText = await replyHeader.innerText();
        const replyDate = new Date(replyHeaderText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)![0].replace(' ', 'T'));

        expect(originalDate.getTime()).toBeLessThanOrEqual(replyDate.getTime());

    });

    test('Reply to message @sprint5 @AC3', async ({ page }) => {
        // Given I am on the message detail page
        // When I enter a reply and submit
        // Then the reply is added and the replies list is updated.
        await page.goto(baseURL + '/account/messages/' + userMessageId);
        await expect(page.getByRole('heading', { name: 'Replies' })).toBeVisible({ timeout: 10000 });

        await expect(page.locator('.card-header').first()).toContainText('payments', { timeout: 15000 });

        const replyTexts = page.locator('.card.bg-light .card-text');
        const countBefore = await replyTexts.count();

        const myReplyText = 'This is an automated reply typed directly in the UI for AC3 validation.';
        await page.getByTestId('message').fill(myReplyText);

        const replyResponsePromise = page.waitForResponse(response =>
            response.url().includes('/reply') &&
            response.request().method() === 'POST' &&
            response.status() === 201,
            { timeout: 20000 }
        );
        await page.getByTestId('reply-submit').click();
        await replyResponsePromise;

        await expect(replyTexts).toHaveCount(countBefore + 1, { timeout: 15000 });
        await expect(replyTexts.last()).toHaveText(myReplyText);
        await expect(page.getByTestId('message')).toHaveValue('');

        
    });



});