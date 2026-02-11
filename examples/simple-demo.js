const { chromium } = require('playwright');

async function runBasicPlaywrightTest() {
  console.log('🚀 Basic Playwright Demo (No AI Required)\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('\n📝 Test 1: Adding Todo Item');
    await page.goto('https://demo.playwright.dev/todomvc');
    await page.fill('.new-todo', 'Buy groceries');
    await page.press('.new-todo', 'Enter');
    
    const todoCount = await page.locator('.todo-list li').count();
    console.log(`   ✅ Todos in list: ${todoCount}`);
    
    console.log('\n✔️  Test 2: Mark Todo as Complete');
    await page.click('.toggle');
    const completedCount = await page.locator('.completed').count();
    console.log(`   ✅ Completed todos: ${completedCount}`);
    
    console.log('\n✨ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runBasicPlaywrightTest().catch(console.error);