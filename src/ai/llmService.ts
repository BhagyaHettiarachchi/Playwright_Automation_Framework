import OpenAI from 'openai';
import { config } from '../config/config';
import { TestCase, TestStep } from '../models/TestCase';

export class LLMService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
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
    } catch (error) {
      console.error('Error generating test from user story:', error);
      throw error;
    }
  }

  async convertTestToPlaywrightCode(testCase: TestCase): Promise<string> {
    const prompt = `
Convert the following test case into executable Playwright TypeScript code.

Test Case:
${JSON.stringify(testCase, null, 2)}

Generate complete Playwright test code with:
- Proper imports
- Test describe block
- Before/after hooks if needed
- Assertions for expected results
- Error handling
- Comments explaining key steps

Return ONLY the TypeScript code, no markdown formatting.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a Playwright expert. Generate clean, production-ready test code.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      return completion.choices[0].message.content || '';
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