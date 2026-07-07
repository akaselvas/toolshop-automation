import { test, expect, Page, APIRequestContext } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

test('Forgot password form @sprint5 @AC1', async ({page}) => {
    // Given I click "Forgot password" on the login page
    // Then a form with an email input is displayed. 
    await page.goto(baseURL + '/auth/login');

    await page.getByTestId('forgot-password-link').click(); 
    await expect(page.getByTestId('email')).toBeVisible();
    
})


test('Email validation, positive case, VALID RFC  @sprint5 @AC2', async ({ page }) => {
    // Given I enter an email address
    // Then it must match a valid RFC-compliant format. 
    await page.goto(baseURL + '/auth/forgot-password');
    
    await page.getByTestId('email').fill('customer3@practicesoftwaretesting.com');
    await page.getByTestId('forgot-password-submit').click(); 

    await expect(page.locator('.alert.alert-success')).toBeVisible();
    
})

test('Email validation, negative case, INVALID RFC @sprint5 @AC2', async ({ page }) => {
    // Given I enter an email address
    // Then it must match a valid RFC-compliant format. 
    await page.goto(baseURL + '/auth/forgot-password');
    
    await page.getByTestId('email').fill('customer3@practicesoftwaretesting com');
    await page.getByTestId('forgot-password-submit').click();

    await expect(page.getByTestId('email-error')).toBeVisible({ timeout: 10000 });
});


test('Successful reset @sprint5 @AC3', async ({ page }) => {
    // Given I enter a registered email
    // When I submit the form
    // Then a new password is generated and sent to my email address
    // And a confirmation message is displayed and fades out after 3 seconds. 
    await page.goto(baseURL + '/auth/forgot-password');
    
    await page.getByTestId('email').fill('customer3@practicesoftwaretesting.com');
    await page.getByTestId('forgot-password-submit').click();

    const successAlert = page.locator('.alert.alert-success');
    await expect(successAlert).toBeVisible();

    await expect(successAlert).toBeHidden({ timeout: 5000 }); 

    await page.goto(baseURL + '/auth/login');

    await page.getByTestId('email').fill('customer3@practicesoftwaretesting.com');
    await page.getByTestId('password').fill('welcome02');

});


test('Non-existent email @sprint5 @AC4', async ({ page }) => {
    // Given I enter an unregistered email
    // When I submit the form
    // Then an error message is displayed. 
    await page.goto(baseURL + '/auth/forgot-password');
    
    await page.getByTestId('email').fill('any@email.com');
    await page.getByTestId('forgot-password-submit').click();

    await expect(page.getByText('The selected email is invalid.')).toBeVisible({ timeout: 10000 });

});