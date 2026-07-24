import { test, expect } from '@playwright/test';

const baseURL = process.env.URL || 'https://practicesoftwaretesting.com';


test('Privacy page accessible @sprint5 @AC1', async ({ page }) => {
    // Given I navigate to /privacy
    // Then the privacy policy is displayed covering: 
    // Google Sign-In integration, data collection, 
    // automatic data removal (hourly), third-party services, 
    // data security, and contact information. 
    await page.goto(baseURL + '/privacy', { waitUntil: 'domcontentloaded' });

    const requiredTopics = [
        'Information We Collect:',
        'Use of Google Sign-In:',
        'Data Removal:',
        'Third-Party Services:',
        'Data Security:',
        'Information Sharing',
        'Changes to the Privacy Policy:',
        'Contact Us:'
    ];

    for (const topic of requiredTopics) {
        await expect(page.getByText(topic)).toBeVisible({ timeout: 10000 });
    }

});