import { test, expect} from '@playwright/test';

test.describe('Add Multiple Todos - Manual', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://demo.playwright.dev/todomvc');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('should add multiple todos', async ({ page }) => {
        // Add first todo: "Buy groceries"
        await page.locator('.new-todo').fill('Buy groceries');
        await page.locator('.new-todo').press('Enter');

        // Add second todo: "Walk the dog"
        await page.locator('.new-todo').fill('Walk the dog');
        await page.locator('.new-todo').press('Enter');

        // Add third todo: "Read a book"
        await page.locator('.new-todo').fill('Read a book');
        await page.locator('.new-todo').press('Enter');

        // Verify all 3 items appear in the todo list
        await expect(page.locator('.todo-list li')).toHaveCount(3);

        // Verify the todo count shows "3 items left"
        await expect(page.locator('.todo-count')).toHaveText('3 items left');

    });
});