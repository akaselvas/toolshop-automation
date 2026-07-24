import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';

const LANGUAGES = [
    { name: 'English', locale: 'en-US', code: 'EN', contactText: 'Contact', selectorId: 'en'},
    { name: 'German', locale: 'de-DE', code: 'DE', contactText: 'Kontakt', selectorId: 'de'},
    { name: 'Spanish', locale: 'es-ES', code: 'ES', contactText: 'Contacto', selectorId: 'es'},
    { name: 'French', locale: 'fr-FR', code: 'FR', contactText: 'Contact', selectorId: 'fr'},
    { name: 'Dutch', locale: 'nl-NL', code: 'NL', contactText: 'Contact', selectorId: 'nl'},
    { name: 'Turkish', locale: 'tr-TR', code: 'TR', contactText: 'İletişim', selectorId: 'tr' }
];


for (const lang of LANGUAGES) { 
    // Given I visit the application for the first time
    // And my browser language is set to a supported language (English, German, Spanish, French, Dutch, or Turkish)
    // Then the application automatically displays in my browser's language.        
    test.describe('Language - ' + lang.name, () => {
        test.use({ locale: lang.locale }); 

        test('Automatic browser language detection @sprint5 @AC1', async ({ page }) => {        
            await page.goto(baseURL);

            await expect(page.getByTestId('language-select')).toContainText(lang.code);
            await expect(page.getByRole('link', { name: lang.contactText })).toBeVisible({ timeout: 15000 });
        });
    });
    
}


test.describe('Unsupported Language', () => {
    // Given I visit the application for the first time
    // And my browser language is not one of the supported languages
    // Then the application defaults to English. 
    test.use({ locale: 'pt-BR' }); 

    test('Unsupported browser language fallback @sprint5 @AC2', async ({ page }) => {
        await page.goto(baseURL);

        await expect(page.getByTestId('language-select')).toContainText('EN');
        await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible({ timeout: 15000 });
    });

});


test('Language selector @sprint5 @AC3', async ({ page }) => {
    // Given I am on any page
    // Then a language selector is available in the 
    // navigation bar with: DE, EN, ES, FR, NL, TR. 
    await page.goto(baseURL);

    await expect(page.getByTestId('language-select')).toBeVisible();
    await page.getByTestId('language-select').click();

    const requiredLanguages = ['de', 'en', 'es', 'fr', 'nl', 'tr'];

    for (const lang of requiredLanguages) {
        await expect(page.getByTestId('lang-' + lang)).toBeVisible({ timeout: 10000 });
    }

});


test('Language switch @sprint5 @AC4', async ({ page }) => {
    // Given I select a language from the selector
    // Then all labels, messages, and UI elements 
    // update to the selected language. 
    await page.goto(baseURL);

    await expect(page.getByTestId('language-select')).toBeVisible({ timeout: 10000 });

    for (const lang of LANGUAGES) {
        await page.getByTestId('language-select').click();

        const langOption = page.getByTestId('lang-' + lang.selectorId);
        await expect(langOption).toBeVisible({ timeout: 10000 });
        await langOption.click();
        
        await expect(page.getByTestId('language-select')).toContainText(lang.code, { timeout: 10000 });
        await expect(page.getByRole('link', { name: lang.contactText })).toBeVisible({ timeout: 15000 });
    }

});


test.describe('Language Persistence', () => {
    test.use({ locale: 'en-US' });
    
    test('Persistence across sessions @sprint5 @AC5', async ({ page }) => {
        // Given I have selected a language
        // Then my preference is stored in the browser (localStorage)
        // And on subsequent visits my stored preference takes priority over browser language detection. 
        await page.goto(baseURL);
        await expect(page.getByTestId('language-select')).toContainText('EN');

        await page.getByTestId('language-select').click();
        await page.getByTestId('lang-de').click();
        await expect(page.getByTestId('language-select')).toContainText('DE');

        await page.reload({ waitUntil: 'domcontentloaded' });

        await expect(page.getByTestId('language-select')).toContainText('DE');
        await expect(page.getByRole('link', { name: 'Kontakt' })).toBeVisible({ timeout: 10000 });
    });

});
