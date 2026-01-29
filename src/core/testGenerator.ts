import { LLMService } from '../ai/llmService';
import { TestCase } from '../models/TestCase';
import fs from 'fs/promises';
import path from 'path';

export class TestGenerator {
  private llmService: LLMService;
  private outputDir: string;

  constructor(outputDir: string = './tests/generated') {
    this.llmService = new LLMService();
    this.outputDir = outputDir;
  }

  async generateFromUserStory(userStory: string, appUrl: string): Promise<TestCase> {
    console.log('Generating test case from user story...');
    const testCase = await this.llmService.generateTestFromUserStory(userStory, appUrl);
    
    await this.saveTestCase(testCase);
    
    const playwrightCode = await this.llmService.convertTestToPlaywrightCode(testCase);
    await this.savePlaywrightTest(testCase.id, playwrightCode);
    
    console.log(`Test case generated: ${testCase.id}`);
    return testCase;
  }

  async generateBatchTests(
    userStories: string[],
    appUrl: string
  ): Promise<TestCase[]> {
    console.log(`Generating ${userStories.length} test cases in batch...`);
    const testCases: TestCase[] = [];
    
    for (const story of userStories) {
      try {
        const testCase = await this.generateFromUserStory(story, appUrl);
        testCases.push(testCase);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate test for story: ${story}`, error);
      }
    }
    
    return testCases;
  }

  private async saveTestCase(testCase: TestCase): Promise<void> {
    const dir = path.join(this.outputDir, 'metadata');
    await fs.mkdir(dir, { recursive: true });
    
    const filePath = path.join(dir, `${testCase.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(testCase, null, 2));
  }

  private async savePlaywrightTest(testId: string, code: string): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const filePath = path.join(this.outputDir, `${testId}.spec.ts`);
    await fs.writeFile(filePath, code);
  }

  async loadTestCase(testId: string): Promise<TestCase> {
    const filePath = path.join(this.outputDir, 'metadata', `${testId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async listGeneratedTests(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.outputDir);
      return files.filter(f => f.endsWith('.spec.ts'));
    } catch {
      return [];
    }
  }
}