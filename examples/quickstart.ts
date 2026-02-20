/*import { chromium } from 'playwright';
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

main().catch(console.error);*/

import { chromium } from 'playwright';
import { TestGenerator } from '../src/core/testGenerator';
import { AITestRunner } from '../src/core/testRunner';
import { TestCase } from '../src/models/TestCase';

async function main() {
  console.log('🚀 AI-Augmented Playwright Framework - Quick Start\n');
  console.log('='.repeat(60));

  const runner = new AITestRunner();

  // ✅ Manually define a test case with BROKEN selectors
  // Self-healing will automatically fix them at runtime
  const testCaseWithBrokenSelectors: TestCase = {
    id: `demo-${Date.now()}`,
    title: 'Add Todo Item - Self-Healing Demo',
    description: 'Demonstrates self-healing with broken selectors',
    generatedBy: 'AI',
    priority: 1,
    createdAt: new Date(),
    lastModified: new Date(),
    tags: ['demo', 'self-healing'],
    steps: [
      {
        action: 'navigate',
        selector: 'https://demo.playwright.dev/todomvc',
        value: 'https://demo.playwright.dev/todomvc',
        description: 'Navigate to TodoMVC app'
      },
      {
        action: 'fill',
        // ❌ BROKEN selector - class doesn't exist
        selector: '.todo-input-broken',
        value: 'Buy groceries',
        description: 'Type into the todo input field'
      },
      {
        action: 'press',
        // ❌ BROKEN selector - wrong ID
        selector: '#wrong-input-id',
        value: 'Enter',
        description: 'Press Enter to add the todo'
      },
      {
        action: 'click',
        // ❌ BROKEN selector - old class name
        selector: '.toggle-old-class',
        description: 'Mark todo as complete'
      }
    ],
    expectedResults: [
      'Todo item is visible in the list',
      'Counter shows 0 items left'
    ]
  };

  console.log('\n🧪 Running test with BROKEN selectors...');
  console.log('   Watch self-healing fix them automatically!\n');
  console.log('-'.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const result = await runner.runTestCaseWithAI(page, testCaseWithBrokenSelectors);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Test Results');
  console.log('='.repeat(60));
  console.log(`Status:               ${result.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Execution Time:       ${(result.executionTime / 1000).toFixed(2)}s`);
  console.log(`Self-Healing Used:    ${result.selfHealingApplied ? '✅ YES - Selectors were fixed!' : '❌ No'}`);

  if (result.selfHealingApplied && result.healingDetails) {
    console.log('\n🔧 Self-Healing Details:');
    console.log(`   Original Selector: ${result.healingDetails.originalSelector}`);
    console.log(`   Fixed Selector:    ${result.healingDetails.newSelector}`);
    console.log(`   Reason:            ${result.healingDetails.reason}`);
  }

  if (result.errors && result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.forEach(e => console.log(`   - ${e}`));
  }

  // Show healing log summary
  await showHealingLog();

  await browser.close();

  const reportPath = await runner.generateComprehensiveReport();
  console.log(`\n📄 Full Report: ${reportPath}`);
}

// ─────────────────────────────────────────────
// Helper: Print healing log from file
// ─────────────────────────────────────────────
async function showHealingLog() {
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const logPath = path.join('./data/selectors', 'healing-log.json');
    const content = await fs.readFile(logPath, 'utf-8');
    const logs = JSON.parse(content);

    if (logs.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🔧 Self-Healing Log (All Healings This Session)');
      console.log('='.repeat(60));

      logs.slice(-5).forEach((log: any, index: number) => {
        console.log(`\n${index + 1}. ❌ Broken:  ${log.originalSelector}`);
        console.log(`   ✅ Fixed:   ${log.newSelector}`);
        console.log(`   📝 Reason:  ${log.reason}`);
        console.log(`   🕐 Time:    ${new Date(log.timestamp).toLocaleTimeString()}`);
      });

      console.log('\n' + '='.repeat(60));
      console.log(`✅ Total healings saved: ${logs.length}`);
      console.log(`📁 Full log: ./data/selectors/healing-log.json`);
    }
  } catch {
    console.log('\n⚠️  No healing log found yet');
  }
}

main().catch(console.error);