import {test, expect, Locator} from "@playwright/test"

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';


test('Auto-fill for logged-in users @sprint5 @AC1', async({page}) => {
    // Given I am logged in
    // Then my first name, last name, and email are auto-filled
    // And the message "Known user, [Full Name]" is displayed
    // And the name and email fields are hidden. 
    test.setTimeout(60000);
    
    await page.goto(baseURL + '/auth/login');
    await page.getByTestId('email').fill('customer@practicesoftwaretesting.com');
    await page.getByTestId('password').fill('welcome01');
    await page.getByTestId('login-submit').click();

    await page.waitForURL('**/account', { timeout: 25000 });
    await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 15000 });
    
    await page.goto(baseURL + '/contact');

    await expect(page.getByText(/Hello Jane Doe, please fill out/i)).toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId('first-name')).not.toBeVisible()
    await expect(page.getByTestId('last-name')).not.toBeVisible()
    await expect(page.getByTestId('email')).not.toBeVisible()

})


test('Guest user fields @sprint5 @AC2',async ({page}) =>{
    // Given I am not logged in
    // Then first name, last name, 
    // and email fields are displayed and required. 
    await page.goto(baseURL + '/contact');

    await expect(page.getByTestId('first-name')).toBeVisible();
    await expect(page.getByTestId('last-name')).toBeVisible();
    await expect(page.getByTestId('email')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Subject' })).toBeVisible();
    await expect(page.getByTestId('message')).toBeVisible();

    await page.getByTestId('contact-submit').click(); 

    await expect(page.getByTestId('first-name')).toHaveClass(/is-invalid/);
    await expect(page.getByTestId('last-name')).toHaveClass(/is-invalid/);
    await expect(page.getByTestId('email')).toHaveClass(/is-invalid/);

})


test(' Subject and message @sprint5 @AC3',async({page}) => {
    // Given the form is displayed
    // Then a subject dropdown is shown with options:
    // Customer service    Webmaster    Return
    // Payments    Warranty    Status of order
    // And a message field is shown (required, minimum 50 characters). 
    await page.goto(baseURL + '/contact');

    await expect(page.getByRole('combobox', { name: 'Subject' })).toBeVisible();
    const dropDownMenu = page.getByTestId('subject');
    await expect(dropDownMenu.locator('option')).toContainText([
        'Customer service',
        'Webmaster',
        'Return',
        'Payments',
        'Warranty',
        'Status of my order'
    ])

    const fillMessage = page.getByTestId('message');
    const sendMessage = page.getByTestId('contact-submit');
    await fillMessage.fill('olá');
    await sendMessage.click();
    await expect(page.getByTestId('message-error')).toHaveText('Message must be minimal 50 characters');

})


test('File attachment @sprint5 @AC4',async({page}) => {
    // Given the form is displayed
    // Then an optional file attachment field is available
    // And only .txt files are accepted
    // And the file must be exactly 0 KB in size. 
    await page.goto(baseURL + '/contact'); 

    await expect(page.getByTestId('attachment')).toBeVisible();
    
    await page.getByTestId('attachment').setInputFiles({
        name: 'menor.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('') 
    });

    await page.getByTestId('contact-submit').click(); 
    await expect(page.getByTestId('attachment-error')).toBeHidden(); 

})


test('Invalid file type @sprint5 @AC5',async({page}) => {
    // Given I select a non-.txt file
    // Then the error "File should have a txt extension." is displayed. 
    await page.goto(baseURL + '/contact'); 

    await expect(page.getByTestId('attachment')).toBeVisible();
    
    await page.getByTestId('attachment').setInputFiles({
        name: 'nonTxt.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('') 
    });

    await page.getByTestId('contact-submit').click(); 
    await expect(page.getByTestId('attachment-error')).toHaveText('File should have a txt extension.');

})


test('Invalid file size @sprint5 @AC6',async({page}) => {
    // Given I select a file that is not 0 KB
    // Then the error "File should be empty." is displayed. 
    await page.goto(baseURL + '/contact');

    await expect(page.getByTestId('attachment')).toBeVisible();
    
    await page.getByTestId('attachment').setInputFiles({
        name: 'maior.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Este texto faz o arquivo ter mais de 0 KB') 
    });

    await page.getByTestId('contact-submit').click(); 
    await expect(page.getByTestId('attachment-error')).toHaveText('File should be empty.');

})


test('Successful submission @sprint1 @AC7',async ({page}) => {
    // Given all fields are valid
    // When I submit the form
    // Then a confirmation email is sent to the provided email address
    // And a confirmation message is displayed. 
    await page.goto(baseURL + '/contact');

    const fillFirstName = page.getByTestId('first-name');
    const fillLastName = page.getByTestId('last-name');
    const fillEmail = page.getByTestId('email');
    const fillSubject = page.getByTestId('subject');
    const fillMessage = page.getByTestId('message');
    const sendMessage = page.getByTestId('contact-submit');

    await fillFirstName.fill('Any');
    await fillLastName.fill('Name');
    await fillEmail.fill('any@email.com');
    
    await fillSubject.selectOption({ label: 'Webmaster' });
    await expect(fillSubject).toHaveValue('webmaster');

    await fillMessage.fill('some message with more than 50 characters for form validation');
    
    await sendMessage.click();

    await expect(page.locator('[role="alert"]'))
        .toContainText('Thanks for your message! We will contact you shortly');
    
    await expect(page.locator('form')).not.toBeVisible();

})

