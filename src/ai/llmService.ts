/*import OpenAI from 'openai';
import { config } from '../config/config';
import { TestCase, TestStep } from '../models/TestCase';

export class LLMService {
  private openai: OpenAI;
  private useMockMode: boolean;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    // Enable mock mode if no API key or quota issues
    this.useMockMode = !config.openaiApiKey || config.openaiApiKey === 'your_openai_api_key_here';
  }

  async generateTestFromUserStory(userStory: string, appUrl: string): Promise<TestCase> {
    // MOCK MODE - for development without API credits
    if (this.useMockMode || process.env.MOCK_LLM === 'true') {
      console.log('⚠️  Running in MOCK MODE (no OpenAI API calls)');
      return this.generateMockTest(userStory, appUrl);
    }

    // REAL MODE - actual OpenAI API call
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

Use Playwright best practices. Return ONLY valid JSON.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          { role: 'system', content: 'You are a QA automation expert specializing in Playwright test generation.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const responseContent = completion.choices[0].message.content || '{}';
      const generatedTest = JSON.parse(responseContent);

      return {
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
    } catch (error: any) {
      // If quota exceeded, fall back to mock mode
      if (error.code === 'insufficient_quota' || error.status === 429) {
        console.log('⚠️  Quota exceeded, falling back to MOCK MODE');
        return this.generateMockTest(userStory, appUrl);
      }
      throw error;
    }
  }

  // Mock test generator - simulates LLM output
  private generateMockTest(userStory: string, appUrl: string): TestCase {
    console.log('📝 Generating mock test from user story...');
    
    // Parse user story for basic information
    const title = this.extractTitle(userStory);
    const steps = this.generateMockSteps(userStory, appUrl);
    
    return {
      id: `mock-${Date.now()}`,
      title: title,
      description: `Mock test generated from: ${userStory.substring(0, 100)}...`,
      userStory,
      steps: steps,
      expectedResults: [
        'Test should execute successfully',
        'All steps should complete without errors'
      ],
      priority: 5,
      generatedBy: 'AI',
      createdAt: new Date(),
      lastModified: new Date(),
      tags: ['mock', 'generated'],
      metadata: {
        mockMode: true,
        note: 'This is a simulated test. Replace with real LLM generation when API is available.'
      }
    };
  }

  private extractTitle(userStory: string): string {
    // Try to extract title from user story
    const lines = userStory.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('scenario:')) {
        return line.replace(/scenario:/i, '').trim();
      }
      if (line.toLowerCase().startsWith('as a')) {
        return 'Test: ' + line.trim();
      }
    }
    return 'Generated Test Case';
  }

  private generateMockSteps(userStory: string, appUrl: string): TestStep[] {
    const steps: TestStep[] = [];
    
    // Always start with navigation
    steps.push({
      action: 'navigate',
      selector: appUrl,
      description: `Navigate to ${appUrl}`
    });

    // Parse user story for keywords
    const lowerStory = userStory.toLowerCase();
    
    if (lowerStory.includes('login') || lowerStory.includes('sign in')) {
      steps.push(
        {
          action: 'fill',
          selector: 'input[type="email"], input[name="email"]',
          value: 'test@example.com',
          description: 'Enter email address'
        },
        {
          action: 'fill',
          selector: 'input[type="password"], input[name="password"]',
          value: 'password123',
          description: 'Enter password'
        },
        {
          action: 'click',
          selector: 'button[type="submit"], button:has-text("Login")',
          description: 'Click login button'
        }
      );
    }
    
    if (lowerStory.includes('todo') || lowerStory.includes('task')) {
      steps.push(
        {
          action: 'fill',
          selector: '.new-todo, input[placeholder*="todo"]',
          value: 'Buy groceries',
          description: 'Enter new todo item'
        },
        {
          action: 'press',
          selector: '.new-todo',
          value: 'Enter',
          description: 'Press Enter to add todo'
        }
      );
    }
    
    if (lowerStory.includes('click') || lowerStory.includes('button')) {
      steps.push({
        action: 'click',
        selector: 'button, .button, [role="button"]',
        description: 'Click the button'
      });
    }

    // If no specific steps detected, add generic ones
    if (steps.length === 1) {
      steps.push(
        {
          action: 'wait',
          selector: '1000',
          description: 'Wait for page to load'
        },
        {
          action: 'click',
          selector: 'button:first-of-type',
          description: 'Interact with first button'
        }
      );
    }

    return steps;
  }

  async convertTestToPlaywrightCode(testCase: TestCase): Promise<string> {
    // Mock mode for code conversion
    if (this.useMockMode || process.env.MOCK_LLM === 'true') {
      return this.generateMockPlaywrightCode(testCase);
    }

    // Real OpenAI call here...
    try {
      const prompt = `Convert the following test case into executable Playwright TypeScript code...`;
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          { role: 'system', content: 'You are a Playwright expert.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });
      return completion.choices[0].message.content || '';
    } catch (error: any) {
      if (error.code === 'insufficient_quota' || error.status === 429) {
        return this.generateMockPlaywrightCode(testCase);
      }
      throw error;
    }
  }

  private generateMockPlaywrightCode(testCase: TestCase): string {
    return `import { test, expect } from '@playwright/test';

// ${testCase.metadata?.mockMode ? '⚠️ MOCK MODE - This is a simulated test' : ''}
// Test ID: ${testCase.id}
// Generated by: ${testCase.generatedBy}

test.describe('${testCase.title}', () => {
  test('${testCase.description}', async ({ page }) => {
    ${testCase.steps.map((step, index) => {
      switch (step.action) {
        case 'navigate':
          return `// Step ${index + 1}: ${step.description}\n    await page.goto('${step.value || step.selector}');`;
        case 'click':
          return `// Step ${index + 1}: ${step.description}\n    await page.locator('${step.selector}').click();`;
        case 'fill':
          return `// Step ${index + 1}: ${step.description}\n    await page.locator('${step.selector}').fill('${step.value}');`;
        case 'press':
          return `// Step ${index + 1}: ${step.description}\n    await page.locator('${step.selector}').press('${step.value}');`;
        case 'wait':
          return `// Step ${index + 1}: ${step.description}\n    await page.waitForTimeout(${step.selector});`;
        default:
          return `// Step ${index + 1}: ${step.description}\n    // ${step.action} on ${step.selector}`;
      }
    }).join('\n    ')}
    
    // Assertions
    ${testCase.expectedResults.map(result => 
      `// Expect: ${result}`
    ).join('\n    ')}
  });
});
`;
  }

  async suggestBetterSelector(currentSelector: string, elementHtml: string, context: string): Promise<string> {
    // For mock mode, return a simple improvement
    if (this.useMockMode || process.env.MOCK_LLM === 'true') {
      return `[data-testid="${currentSelector}"]`;
    }
    
    // Real OpenAI call...
    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          { role: 'system', content: 'You are a Playwright selector optimization expert.' },
          { role: 'user', content: `Suggest better selector for: ${currentSelector}` },
        ],
        temperature: 0.1,
        max_tokens: 100,
      });
      return completion.choices[0].message.content?.trim() || currentSelector;
    } catch (error: any) {
      return currentSelector;
    }
  }
}*/

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

  async generateTestFromUserStory(userStory: string, appUrl: string): Promise<TestCase> {
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

      const responseContent = completion.choices[0].message.content || '{}';
      
      // Clean any markdown formatting
      const cleanedContent = responseContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const generatedTest = JSON.parse(cleanedContent);

      return {
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
    } catch (error) {
      console.error('Error generating test from user story:', error);
      throw error;
    }
  }

  /*async convertTestToPlaywrightCode(testCase: TestCase): Promise<string> {
    const prompt = `
Convert the following test case into executable Playwright TypeScript code.

Test Case:
${JSON.stringify(testCase, null, 2)}

Generate complete Playwright test code with:
- Proper imports from '@playwright/test'
- Test describe block
- Before/after hooks if needed
- Assertions for expected results
- Error handling
- Comments explaining key steps
- Use async/await properly
- Include proper waits

CRITICAL IMPORT RULES:
1. Use: import { test, expect } from '@playwright/test';
2. Use: import { SelfHealingManager } from '../../src/core/selfHealing';  // ← NAMED EXPORT with curly braces
3. Do NOT use default imports (import X from '...')

Example correct imports:
import { test, expect } from '@playwright/test';
import { SelfHealingManager } from '../../src/core/selfHealing';

const selfHealing = new SelfHealingManager();

Return ONLY the TypeScript code, no markdown formatting or backticks.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a Playwright expert. Generate clean, production-ready test code with proper TypeScript syntax.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      let code = completion.choices[0].message.content || '';
      
      // Clean any markdown formatting
      code = code
        .replace(/```typescript\n?/g, '')
        .replace(/```ts\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return code;
    } catch (error) {
      console.error('Error converting test to Playwright code:', error);
      throw error;
    }
  }*/

  async convertTestToPlaywrightCode(testCase: TestCase): Promise<string> {
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

    let code = completion.choices[0].message.content || '';
    
    // Clean any markdown formatting
    code = code
      .replace(/```typescript\n?/g, '')
      .replace(/```ts\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return code;
  } catch (error) {
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