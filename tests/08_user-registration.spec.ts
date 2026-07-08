import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';


test('Registration form fields @sprint5 @AC1', async ({ page }) => {
    // Given the registration form is displayed
    // Then the following required fields are shown:
    // First name    Last name    Date of birth (ISO format YYYY-MM-DD)
    // Street    Postal code (numeric)    City    State
    // Country (dropdown)      Phone (numeric only)  
    // Email (max 256 characters, RFC-compliant format)     Password
    
    await page.goto(baseURL + '/auth/register');

    await expect(page.getByRole('heading', { name: 'Customer registration' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByTestId('first-name')).toBeVisible();
    await expect(page.getByTestId('last-name')).toBeVisible();
    await expect(page.getByTestId('dob')).toBeVisible();
    await expect(page.getByTestId('street')).toBeVisible();
    await expect(page.getByTestId('postal_code')).toBeVisible();
    await expect(page.getByTestId('city')).toBeVisible();
    await expect(page.getByTestId('state')).toBeVisible();
    await expect(page.getByTestId('country')).toBeVisible();
    await expect(page.getByTestId('phone')).toBeVisible();
    await expect(page.getByTestId('email')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();

});


test('Password requirements displayed @sprint5 @AC2', async ({ page }) => {
    // Given the password input is focused
    // Then a list of requirements is displayed:
    // at least 8 characters long
    // both uppercase and lowercase letters
    // at least one number
    // at least one special character
    await page.goto(baseURL + '/auth/register');

    await expect(page.getByRole('heading', { name: 'Customer registration' })).toBeVisible({ timeout: 10000 });

    await page.getByTestId('password').focus();
    await expect(page.locator('#passwordHelp li')).toContainText([
        'Be at least 8 characters long',
        'Contain both uppercase and lowercase letters',
        'Include at least one number',
        'Have at least one special symbol'
    ])
});


test('Real-time password validation @sprint5 @AC3', async ({ page }) => {
    // Given I type in the password field
    // Then the requirements update immediately to reflect which rules are fulfilled. 
    await page.goto(baseURL + '/auth/register');

    await expect(page.getByRole('heading', { name: 'Customer registration' })).toBeVisible({ timeout: 10000 });

    const passwordFill = page.getByTestId('password');
    await passwordFill.focus();
    await passwordFill.pressSequentially('Any1Password@');
    await passwordFill.blur();

    await expect(page.locator('#passwordHelp li.text-success')).toContainText([
        'Be at least 8 characters long',
        'Contain both uppercase and lowercase letters',
        'Include at least one number',
        'Have at least one special symbol'
    ])

});


test('Password strength indicator @sprint5 @AC4', async ({ page }) => {
    // Given I am entering a password
    // Then a strength indicator is displayed with levels:
    // Weak (1 criterion met, 20% bar)
    // Moderate (2 criteria met, 40% bar)
    // Strong (3 criteria met, 60% bar)
    // Very Strong (4 criteria met, 80% bar)
    // Excellent (all criteria met, 100% bar)

    //test.fixme(true, 'Ignorando devido a bug conhecido de instabilidade no Password Strength do site original.');

    await page.goto(baseURL + '/auth/register');
    await expect(page.getByRole('heading', { name: 'Customer registration' })).toBeVisible({ timeout: 10000 });

    const strengthTestCases = [
        { password: 'a',            label: 'Weak',        width: '20%' },
        { password: 'aB',           label: 'Moderate',     width: '40%' },
        { password: 'aB1',          label: 'Strong',       width: '60%' },
        { password: 'aB1!',         label: 'Very Strong',  width: '80%' },
        { password: 'aB1!aaaaaaaa', label: 'Excellent',    width: '100%' },
    ];

    const passwordFill = page.getByTestId('password');

    for (const testPassword of strengthTestCases) {
        await passwordFill.fill('');
        await passwordFill.pressSequentially(testPassword.password);

        // força a sincronia que o updateOn:'blur' atrasa, e depois força o handler
        // (input) a rodar de novo agora que f['password'].value já está correto
        await passwordFill.blur();
        await passwordFill.dispatchEvent('input');

        await expect(page.locator('.strength-labels span.active')).toHaveText(testPassword.label);
        await expect(page.locator('.strength-bar .fill')).toHaveAttribute('style', `width: ${testPassword.width};`);
    }
    
});


test('Duplicate email @sprint5 @AC5', async ({ page }) => {
    // Given the email is already registered
    // Then the error "Email is already in use." is displayed.
    await page.goto(baseURL + '/auth/register');
    await expect(page.getByRole('heading', { name: 'Customer registration' })).toBeVisible({ timeout: 10000 });

    await page.getByTestId('first-name').fill('John');
    await page.getByTestId('last-name').fill('Doe');
    await page.getByTestId('dob').fill('2000-01-01');
    await page.getByTestId('street').fill('Any Street');
    await page.getByTestId('house_number').fill('1122');
    await page.getByTestId('postal_code').fill('19813130');
    await page.getByTestId('city').fill('Rio de Janeiro');
    await page.getByTestId('state').fill('RJ');
    await page.getByTestId('country').selectOption({ label: 'Brazil' });
    await page.getByTestId('phone').fill('11999991111');
    await page.getByTestId('email').fill('customer@practicesoftwaretesting.com');
    await page.getByTestId('password').fill('An1Password@');

    await page.getByTestId('register-submit').click();

    await expect(page.getByText('A customer with this email address already exists.')).toBeVisible({ timeout: 10000 });

});


test('Successful registration @sprint5 @AC6', async ({ page }) => {
    // Given all fields are valid
    // When I submit the form
    // Then the account is created
    // And a confirmation email is sent to the registered email address
    // And I am redirected to the login page. 
    await page.goto(baseURL + '/auth/register');
    await expect(page.getByRole('heading', { name: 'Customer registration' })).toBeVisible({ timeout: 10000 });

    await page.getByTestId('first-name').fill('John');
    await page.getByTestId('last-name').fill('Doe');
    await page.getByTestId('dob').fill('2000-01-01');
    await page.getByTestId('street').fill('Any Street');
    await page.getByTestId('house_number').fill('1122');
    await page.getByTestId('postal_code').fill('19813130');
    await page.getByTestId('city').fill('Rio de Janeiro');
    await page.getByTestId('state').fill('RJ');
    await page.getByTestId('country').selectOption({ label: 'Brazil' });
    await page.getByTestId('phone').fill('11999991111');
    const uniqueEmail = `user_${Date.now()}@practicesoftwaretesting.com`;
    await page.getByTestId('email').fill(uniqueEmail);
    await page.getByTestId('password').fill('An1Password@');
    await page.getByTestId('register-submit').click();

    await expect(page).toHaveURL(baseURL + '/auth/login', { timeout: 10000 });

});