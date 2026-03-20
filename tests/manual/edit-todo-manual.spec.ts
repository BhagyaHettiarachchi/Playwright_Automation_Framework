import { test, expect } from '@playwright/test';

test.describe('Edit Todo - manual', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://demo.playwright.dev/todomvc');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('should edit an existing todo item', async ({ page }) => {
        // Add "Read a book" to the list
        await page.locator('.new-todo').fill('Read a book');
        await page.locator('.new-todo').press('Enter');

        // Double-click on the "Read a book" to make it editable
        await page.locator('.todo-list li label').first().dblclick();

        // Wait for the edit input to appear
        const editInput = page.locator('.todo-list li.editing .edit').first();
        await expect(editInput).toBeVisible();

        // Clear the existing text and enter "Read two books"
        await editInput.clear();
        await editInput.fill('Read two books');

        // Press Enter to save the changes
        await editInput.press('Enter');

        // Verify the todo item now shows "Read two books"
        await expect(page.locator('.todo-list li label').first()).toHaveText('Read two books');
    });
});