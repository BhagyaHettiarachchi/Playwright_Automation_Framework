import OpenAI from 'openai';
import { config } from '../config/config';
import { TestCase, TestStep } from '../models/TestCase';

export class LLMService {
  private openai: OpenAI;

  constructor() {
    // ✅ Validate API key on initialization
    if (!config.openaiApiKey || config.openaiApiKey === '') {
      console.error('\n❌ ERROR: OPENAI_API_KEY not found in .env file');
      console.error('   Please add your OpenAI API key to .env:');
      console.error('   OPENAI_API_KEY=sk-proj-your-key-here\n');
      throw new Error('Missing OPENAI_API_KEY');
    }

    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });

    console.log('✅ OpenAI API initialized with key: ' + config.openaiApiKey.substring(0, 20) + '...');
  }

  async generateTestFromUserStory(userStory: string, appUrl: string): Promise<{ testCase: TestCase; apiTime: number }> {
  console.log('   🧠 Calling OpenAI API (generateTestFromUserStory)...');
  
  // ⏱️ START TIMER
  const apiStartTime = Date.now();
  
  const prompt = `
You are an expert QA automation engineer. Generate a Playwright test case from the following user story.

User Story:
${userStory}

Application URL: ${appUrl}

Generate a test case in the following JSON format:
{
  "title": "Test title",
  "description": "Test description",
  "steps": [
    {
      "action": "navigate|click|fill|select|check|press|wait",
      "selector": "CSS selector or role-based selector",
      "value": "optional value for fill/select actions",
      "description": "What this step does"
    }
  ],
  "expectedResults": ["list of expected outcomes"],
  "tags": ["relevant tags"]
}

Use Playwright best practices:
- Prefer role-based selectors (e.g., getByRole, getByLabel)
- Use data-testid when appropriate
- Include proper waits and assertions
- Make tests resilient and maintainable

Return ONLY valid JSON, no markdown or explanations.
`;

  try {
    const completion = await this.openai.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: 'You are a QA automation expert specializing in Playwright test generation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    // ⏱️ END TIMER
    const apiEndTime = Date.now();
    const apiTime = (apiEndTime - apiStartTime) / 1000;
    
    console.log(`   ✅ API response received in ${apiTime.toFixed(2)} seconds`);

    const responseContent = completion.choices[0].message.content || '{}';
    
    // Clean any markdown formatting
    const cleanedContent = responseContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const generatedTest = JSON.parse(cleanedContent);

    const testCase: TestCase = {
      id: `ai-${Date.now()}`,
      title: generatedTest.title,
      description: generatedTest.description,
      userStory,
      steps: generatedTest.steps,
      expectedResults: generatedTest.expectedResults,
      priority: 5,
      generatedBy: 'AI',
      createdAt: new Date(),
      lastModified: new Date(),
      tags: generatedTest.tags || [],
    };

    return { testCase, apiTime };
    
  } catch (error) {
    // ⏱️ TIMER ON ERROR
    const apiEndTime = Date.now();
    const apiTime = (apiEndTime - apiStartTime) / 1000;
    
    console.error(`   ❌ API call failed after ${apiTime.toFixed(2)} seconds`);
    console.error('Error generating test from user story:', error);
    throw error;
  }
}

async convertTestToPlaywrightCode(testCase: TestCase): Promise<{ code: string; apiTime: number }> {
  console.log('   🧠 Calling OpenAI API (convertTestToPlaywrightCode)...');
  
  // ⏱️ START TIMER
  const apiStartTime = Date.now();
  
  const prompt = `
Convert the following test case into executable Playwright TypeScript code that MUST use the SelfHealingManager for ALL element interactions AND VisualRegressionManager for screenshot comparison.

Test Case:
${JSON.stringify(testCase, null, 2)}

CRITICAL REQUIREMENTS:

1. ALWAYS import and use SelfHealingManager AND VisualRegressionManager:
   import { test, expect } from '@playwright/test';
   import { SelfHealingManager } from '../../src/core/selfHealing';
   import { VisualRegressionManager } from '../../src/core/visualRegression';

2. Initialize self-healing AND visual regression in beforeEach:
   let selfHealing: SelfHealingManager;
   let visual: VisualRegressionManager;
   
   test.beforeEach(async ({ page }) => {
     selfHealing = new SelfHealingManager('./data/selectors');
     visual = new VisualRegressionManager();
     
     await page.goto('https://demo.playwright.dev/todomvc');
     
     // Clear localStorage for clean test state
     await page.evaluate(() => localStorage.clear());
     await page.reload();
     
     await page.waitForLoadState('networkidle');
   });

3. FOR EVERY ELEMENT INTERACTION, use this pattern:
   const { locator } = await selfHealing.findElementWithHealing(
     page,
     'css-selector',
     'human-readable description of the element'
   );
   await locator.click(); // or .fill(), .check(), etc.

4. Common TodoMVC selectors (use these as the first parameter):
   - Input field: '.new-todo' or '[placeholder="What needs to be done?"]'
   - Todo item: '.todo-list li'
   - Checkbox: '.toggle'
   - Delete button: '.destroy'
   - Edit input: '.edit'
   - Filter links: use page.getByRole('link', { name: 'Active' }) directly (no healing needed)
   - Toggle all: '.toggle-all'
   - Clear completed: '.clear-completed'
   - Todo count: '.todo-count'

5. EXAMPLE of correct code:
   // ✅ CORRECT - uses self-healing
   const { locator: input } = await selfHealing.findElementWithHealing(
     page, '.new-todo', 'Main todo input field'
   );
   await input.fill('Buy groceries');
   await input.press('Enter');

   // ✅ CORRECT - uses self-healing for checkbox
   const { locator: checkbox } = await selfHealing.findElementWithHealing(
     page, '.toggle', 'Checkbox to complete todo'
   );
   await checkbox.first().click();

   // ❌ WRONG - never do this
   await page.fill('.new-todo', 'Buy groceries');
   await page.check('.toggle');

6. For assertions with locators that may match multiple elements, always use .first():
   await expect(page.locator('.todo-list li').first()).toHaveText('Buy groceries');
   await expect(page.locator('text=Buy groceries').first()).toBeVisible();

7. CRITICAL: When asserting count is 0, do NOT add text or visibility checks:
   await expect(page.locator('.todo-list li')).toHaveCount(0);
   // Rule: If count is 0, that's sufficient. No additional checks needed.

8. For assertions, you can use page.locator() directly:
   await expect(page.locator('.todo-list li')).toHaveCount(3);

9. ALWAYS capture visual regression screenshot at the END of each test:
   // Add this as the LAST line in every test
   await visual.captureAndCompare(page, 'descriptive-test-name', { fullPage: true });
   
   // Use descriptive names based on the test scenario
   // Examples:
   await visual.captureAndCompare(page, 'add-todo-complete', { fullPage: true });
   await visual.captureAndCompare(page, 'delete-todo-empty-state', { fullPage: true });

10. Return ONLY valid TypeScript code with no markdown, no backticks, no explanations.

Generate the complete test file now:
`;

  try {
    const completion = await this.openai.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: 'You are a Playwright expert who ALWAYS uses SelfHealingManager for element interactions. Generate clean, working test code that follows the exact patterns specified.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    // ⏱️ END TIMER
    const apiEndTime = Date.now();
    const apiTime = (apiEndTime - apiStartTime) / 1000;
    
    console.log(`   ✅ API response received in ${apiTime.toFixed(2)} seconds`);

    let code = completion.choices[0].message.content || '';
    
    // Clean any markdown formatting
    code = code
      .replace(/```typescript\n?/g, '')
      .replace(/```ts\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return { code, apiTime };
    
  } catch (error) {
    // ⏱️ TIMER ON ERROR
    const apiEndTime = Date.now();
    const apiTime = (apiEndTime - apiStartTime) / 1000;
    
    console.error(`   ❌ API call failed after ${apiTime.toFixed(2)} seconds`);
    console.error('Error converting test to Playwright code:', error);
    throw error;
  }
}

  async suggestBetterSelector(
    currentSelector: string,
    elementHtml: string,
    context: string
  ): Promise<string> {
    const prompt = `
Analyze this element and suggest a more robust Playwright selector.

Current Selector: ${currentSelector}
Element HTML: ${elementHtml}
Context: ${context}

Suggest the best selector following Playwright best practices:
1. Prefer user-facing attributes (role, label, text)
2. Use data-testid for stable elements
3. Avoid fragile CSS selectors with generated classes
4. Ensure uniqueness

Return ONLY the selector string, nothing else.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a Playwright selector optimization expert.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 100,
      });

      return completion.choices[0].message.content?.trim() || currentSelector;
    } catch (error) {
      console.error('Error suggesting better selector:', error);
      return currentSelector;
    }
  }
}