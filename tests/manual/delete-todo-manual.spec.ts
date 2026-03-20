import { test, expect} from '@playwright/test';
import { AsyncLocalStorage } from 'async_hooks';

test.describe('Delete ToDo - manual', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://demo.playwright.dev/todomvc');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
     });
     
     test('should delete a todo item', async ({ page }) => {
         // Add "Bye groceries" to the list
         await page.locator('.new-todo').fill('Bye groceries');
         await page.locator('.new-todo').press('Enter');

         // Verify the todo item is added
         await expect(page.locator('.todo-list li').first()).toHaveText('Bye groceries');

         // Hover over "Bye groceries" to reveal the delete button
         await page.locator('.todo-list li').first().hover();

         // Click the delete button
         await page.locator('.todo-list li').first().locator('.destroy').click();

         // verify "Bye groceries" is removed from the list
         await expect(page.locator('.todo-list li')).toHaveCount(0);
     });
 });