import { test, expect } from '@playwright/test';

test.describe('Complete Todo - Manual', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://demo.playwright.dev/todomvc');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('should mark a single todo as completed', async ({ page }) => {
        // Add "Buy groceries" to the list
        await page.locator('.new-todo').fill('Buy groceries');
        await page.locator('.new-todo').press('Enter');

        // Add second todo to have "2 items left" scenario
        await page.locator('.new-todo').fill('Walk the dog');
        await page.locator('.new-todo').press('Enter');

        // Add third todo
        await page.locator('.new-todo').fill('Read a book');
        await page.locator('.new-todo').press('Enter');

        // Click the checkbox next to "Buy groceries"
        await page.locator('.todo-list li').first().locator('.toggle').click();

        // Verify "Buy groceries" appears with completed styling
        await expect(page.locator('.todo-list li').first()).toHaveClass(/completed/);

        // Verify the item has strikethrough (completed class adds this via CSS)
        const firstTodo = page.locator('.todo-list li').first();
        await expect(firstTodo).toHaveClass(/completed/);

        // verify the count shows "2 items left" (3 total - 1 completed = 2 left)
        await expect(page.locator('.todo-count')).toHaveText('2 items left');
    });
});