import { test, expect } from '@playwright/test';
import { SelfHealingManager } from '../src/core/selfHealing';

test('demo self-healing console output', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
  
  const healingManager = new SelfHealingManager();
  
  // This will trigger healing because selector doesn't exist
  const result = await healingManager.findElementWithHealing(
    page,
    '.wrong-class-that-does-not-exist',
    'Fill the todo input field'
  );
  
  // Use the healed locator
  await result.locator.fill('Buy groceries');
  await result.locator.press('Enter');
  
  // Verify it worked
  await expect(page.locator('.todo-list li').first()).toHaveText('Buy groceries');
  
  console.log('\n✅ Test completed successfully!');
  console.log(`Healing was used: ${result.healed}`);
  console.log(`New selector: ${result.newSelector}`);
});