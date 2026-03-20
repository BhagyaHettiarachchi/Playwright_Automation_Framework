/*import { LLMService } from '../ai/llmService';
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
}*/
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

  async generateFromUserStory(
    userStory: string, 
    appUrl: string,
    fileName?: string
  ): Promise<{ 
    testCase: TestCase; 
    totalTime: number;
    apiTime1: number;
    apiTime2: number;
    success: boolean;
  }> {
    // ⏱️ START TOTAL TIMER
    const totalStartTime = Date.now();
    
    console.log(`\n📝 Generating test from: ${fileName || 'user story'}`);
    console.log(`⏳ Started at: ${new Date(totalStartTime).toLocaleTimeString()}`);
    
    try {
      // Step 1: Generate test case structure
      const { testCase, apiTime: apiTime1 } = await this.llmService.generateTestFromUserStory(userStory, appUrl);
      
      await this.saveTestCase(testCase);
      
      // Step 2: Convert to Playwright code
      const { code: playwrightCode, apiTime: apiTime2 } = await this.llmService.convertTestToPlaywrightCode(testCase);
      //await this.savePlaywrightTest(testCase.id, playwrightCode);
      await this.savePlaywrightTest(testCase.id, playwrightCode, fileName);
      
      // ⏱️ END TOTAL TIMER
      const totalEndTime = Date.now();
      const totalTime = (totalEndTime - totalStartTime) / 1000;
      
      console.log(`✅ Generated: ${testCase.id}.spec.ts`);
      console.log(`   API time (generate): ${apiTime1.toFixed(2)} seconds`);
      console.log(`   API time (convert): ${apiTime2.toFixed(2)} seconds`);
      console.log(`   Total time: ${totalTime.toFixed(2)} seconds`);
      
      return { 
        testCase, 
        totalTime,
        apiTime1,
        apiTime2,
        success: true
      };
      
    } catch (error) {
      // ⏱️ TIMER ON ERROR
      const totalEndTime = Date.now();
      const totalTime = (totalEndTime - totalStartTime) / 1000;
      
      console.error(`❌ Failed to generate test`);
      console.error(`   Time before failure: ${totalTime.toFixed(2)} seconds`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      
      throw error;
    }
  }

  async generateBatchTests(
    userStories: { story: string; fileName: string }[],
    appUrl: string
  ): Promise<{
    testCases: TestCase[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      times: number[];
      details: any[];
    };
  }> {
    console.log(`\n🤖 AI Test Generation Started`);
    console.log(`Found ${userStories.length} user stories\n`);
    
    const summary = {
      total: userStories.length,
      successful: 0,
      failed: 0,
      times: [] as number[],
      details: [] as any[],
    };
    
    const testCases: TestCase[] = [];
    const overallStartTime = Date.now();
    
    for (const { story, fileName } of userStories) {
      try {
        const result = await this.generateFromUserStory(story, appUrl, fileName);
        
        testCases.push(result.testCase);
        summary.successful++;
        summary.times.push(result.totalTime);
        
        summary.details.push({
          fileName: fileName,
          testId: result.testCase.id,
          success: true,
          totalTime: result.totalTime,
          apiTime1: result.apiTime1,
          apiTime2: result.apiTime2,
        });
        
        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to generate test for: ${fileName}`, error);
        summary.failed++;
        
        summary.details.push({
          fileName: fileName,
          testId: null,
          success: false,
          totalTime: 0,
          apiTime1: 0,
          apiTime2: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    const overallEndTime = Date.now();
    const overallTime = (overallEndTime - overallStartTime) / 1000;
    
    // 📊 DISPLAY SUMMARY
    this.displaySummary(summary, overallTime);
    
    // 💾 SAVE TO CSV
    await this.saveTimingData(summary.details);
    
    return { testCases, summary };
  }

  private displaySummary(summary: any, overallTime: number) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tests: ${summary.total}`);
    console.log(`✅ Successful: ${summary.successful} (${((summary.successful/summary.total)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${summary.failed} (${((summary.failed/summary.total)*100).toFixed(1)}%)`);
    
    if (summary.times.length > 0) {
      const totalTime = summary.times.reduce((a: number, b: number) => a + b, 0);
      const avgTime = totalTime / summary.times.length;
      const minTime = Math.min(...summary.times);
      const maxTime = Math.max(...summary.times);
      
      console.log('\n⏱️  TIMING STATISTICS:');
      console.log(`   Overall time: ${overallTime.toFixed(2)} seconds`);
      console.log(`   Total generation time: ${totalTime.toFixed(2)} seconds`);
      console.log(`   Average per test: ${avgTime.toFixed(2)} seconds`);
      console.log(`   Fastest: ${minTime.toFixed(2)} seconds`);
      console.log(`   Slowest: ${maxTime.toFixed(2)} seconds`);
    }
    console.log('='.repeat(60));
    console.log(`\n💾 Timing data saved to: evaluation/ai-generation-times.csv\n`);
  }

  private async saveTimingData(details: any[]) {
    const csvPath = path.join(process.cwd(), 'evaluation', 'ai-generation-times.csv');
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(csvPath), { recursive: true });
    
    // Create CSV content
    const csvHeader = 'Test_Name,Test_ID,Success,API_Time1_Seconds,API_Time2_Seconds,Total_Time_Seconds,Timestamp,Error\n';
    const csvRows = details.map(d => 
      `${d.fileName},${d.testId || 'N/A'},${d.success},${d.apiTime1?.toFixed(2) || '0'},${d.apiTime2?.toFixed(2) || '0'},${d.totalTime?.toFixed(2) || '0'},${new Date().toISOString()},${d.error || ''}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    await fs.writeFile(csvPath, csvContent);
  }

  private async saveTestCase(testCase: TestCase): Promise<void> {
    const dir = path.join(this.outputDir, 'metadata');
    await fs.mkdir(dir, { recursive: true });
    
    const filePath = path.join(dir, `${testCase.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(testCase, null, 2));
  }

  /*private async savePlaywrightTest(testId: string, code: string): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const filePath = path.join(this.outputDir, `${testId}.spec.ts`);
    await fs.writeFile(filePath, code);
  }*/
 private async savePlaywrightTest(
  testId: string, 
  code: string, 
  fileName?: string
): Promise<void> {
  await fs.mkdir(this.outputDir, { recursive: true });
  
  // Use fileName if provided, otherwise use testId
  const testFileName = fileName 
    ? `${fileName}.spec.ts`
    : `${testId}.spec.ts`;
  
  const filePath = path.join(this.outputDir, testFileName);
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