import { chromium } from 'playwright';
import { TestGenerator } from '../src/core/testGenerator';
import { AITestRunner } from '../src/core/testRunner';

async function main() {
  console.log('🚀 AI-Augmented Playwright Framework - Quick Start\n');
  console.log('='.repeat(60));
  
  const generator = new TestGenerator();
  const runner = new AITestRunner();
  
  const userStory = `
    As a user
    I want to visit the TodoMVC application
    And add a new todo item
    So that I can track my tasks
    
    Scenario: Add a new todo
    Given I am on the TodoMVC page
    When I enter "Buy groceries" in the todo input
    And I press Enter
    Then I should see "Buy groceries" in the todo list
  `;
  
  console.log('\n🤖 Step 3: Generating test case with AI...');
  
  try {
    const testCase = await generator.generateFromUserStory(
      userStory,
      'https://demo.playwright.dev/todomvc'
    );
    
    console.log('\n✅ Test case generated successfully!');
    console.log(`   Test ID: ${testCase.id}`);
    console.log(`   Title: ${testCase.title}`);
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const result = await runner.runTestCaseWithAI(page, testCase);
    
    console.log('\n📊 Test Results');
    console.log(`Status: ${result.status}`);
    console.log(`Execution Time: ${(result.executionTime / 1000).toFixed(2)}s`);
    console.log(`Self-Healing Applied: ${result.selfHealingApplied ? 'Yes ✨' : 'No'}`);
    
    await browser.close();
    
    const reportPath = await runner.generateComprehensiveReport();
    console.log(`\n📄 Report: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ Error occurred:', error);
  }
}

main().catch(console.error);