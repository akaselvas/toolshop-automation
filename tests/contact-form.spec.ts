import {test, expect, Locator} from "@playwright/test"

test('Contact form is accessible @sprint1 @AC1', async({page}) => {
    // Given I navigate to the contact page
    // Then a contact form is displayed. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com/');
    const clickContact = page.locator('[data-test="nav-contact"]');
    await clickContact.click();

    await expect(page.locator('app-contact form')).toBeVisible();
    await expect(page.locator('app-contact h3')).toHaveText('Contact');
    await expect(page.locator('[data-test="contact-submit"]')).toBeVisible();
})

test('Required fields @sprint1 @AC2',async ({page}) =>{
    // Given the contact form is displayed
    // Then the following fields are shown:
    // First name (required) | Last name (required)  | Email (required, must be valid format)
    // Subject (required, dropdown) | Message (required, minimum 50 characters)
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/contact');

    await expect(page.getByLabel('First name')).toBeVisible();
    await expect(page.getByLabel('Last name')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('combobox', {name: 'Subject'})).toBeVisible();
    await expect(page.getByLabel('Message')).toBeVisible();
})

test('Subject options @sprint1 @AC3',async({page}) => {
    // Given the subject dropdown is displayed
    // Then it includes the following options:
    // Customer service | Webmaster | Return
    // Payments | Warranty | Status of order
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/contact');

    const dropDownMenu = page.locator('[data-test="subject"] option');
    await expect(dropDownMenu).toContainText([
        'Customer service',
        'Webmaster',
        'Return',
        'Payments',
        'Warranty',
        'Status of my order'
    ]);
})

test('Message minimum length @sprint1 @AC4', async({page}) => {
    // Given I enter a message with fewer than 50 characters
    // Then a validation error is shown indicating the message must be at least 50 characters. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/contact');

    const fillMessage = page.locator('#message');
    const sendMessage = page.locator('[data-test="contact-submit"]');
    await fillMessage.fill('olá');
    await sendMessage.click();

    await expect(page.locator('[data-test="message-error"]')).toHaveText('Message must be minimal 50 characters');
})

/* VERSION THAT FIND A BUG
test('Successful submission @sprint1 @AC5',async ({page}) => {
    // Given all required fields are filled in with valid data
    // When I submit the contact form
    // Then a confirmation message is displayed
    // And the form is hidden. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/contact');

    const fillFirstName = page.locator('[data-test="first-name"]');
    const fillLastName = page.locator('[data-test="last-name"]');
    const fillEmail = page.locator('[data-test="email"]');
    const fillSubject = page.locator('[data-test="subject"]');
    const fillMessage = page.locator('[data-test="message"]');
    const sendMessage = page.locator('[data-test="contact-submit"]');

    await fillFirstName.fill('Any');
    await fillLastName.fill('Name');
    await fillEmail.fill('any@email.com');
    await fillSubject.waitFor({state: 'visible'});
    await fillSubject.selectOption('webmaster');
    await expect(fillSubject).toHaveValue('webmaster');
    await fillMessage.fill('some message with more than 50 characters for form validation');
    await sendMessage.click();

    await expect(page.locator('[role="alert"]')).toContainText('Thanks for your message! We will contact you shortly');
    await expect(page.locator('form')).not.toBeVisible();

})
 */

test('Successful submission @sprint1 @AC5',async ({page}) => {
    // Given all required fields are filled in with valid data
    // When I submit the contact form
    // Then a confirmation message is displayed
    // And the form is hidden. 
    await page.goto('https://with-bugs.practicesoftwaretesting.com/#/contact');

    const fillFirstName = page.locator('[data-test="first-name"]');
    const fillLastName = page.locator('[data-test="last-name"]');
    const fillEmail = page.locator('[data-test="email"]');
    const fillSubject = page.locator('[data-test="subject"]');
    const fillMessage = page.locator('[data-test="message"]');
    const sendMessage = page.locator('[data-test="contact-submit"]');

    await fillFirstName.fill('Any');
    await fillLastName.fill('Name');
    await fillEmail.fill('any@email.com');
    await fillSubject.waitFor({state: 'visible'});
    await fillSubject.click();
    
    await page.locator('#subject option').filter({ hasText: 'Webmaster' }).click();
    await expect(fillSubject).toHaveValue('webmaster');

    await fillMessage.fill('some message with more than 50 characters for form validation');
    await sendMessage.click();

    await expect(page.locator('[role="alert"]')).toContainText('Thanks for your message! We will contact you shortly');
    await expect(page.locator('form')).not.toBeVisible();

})

