import {test, expect} from '@playwright/test';

test.describe('Add Todo - Manual', () => {
    test.beforeEach(async ({page, context}) => {
        // Navigate to TodoMVC
        await page.goto('https://demo.playwright.dev/todomvc');

        // Clear any existing todos
        await context.clearCookies();
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('should add a new todo item', async ({page}) => {
        // Click on the todo input field
        await page.locator('.new-todo').click();

        // type "Buy groceries"
        await page.locator('.new-todo').fill('Buy groceries');

        // Press Enter
        await page.locator('.new-todo').press('Enter');

        // Verify "Buy groceries" appears in the todo list
        await expect(page.locator('.todo-list li')).toHaveText('Buy groceries');

        // Verify the todo count shows "1 item left"
        await expect(page.locator('.todo-count')).toHaveText('1 item left');
    });
});
        