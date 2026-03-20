import { TestGenerator } from '../core/testGenerator';
import fs from 'fs/promises';
import path from 'path';

const APP_URL = 'https://demo.playwright.dev/todomvc';
const OUTPUT_DIR = './tests/generated';

async function main() {
  // Get filename directly from command line (no --file flag needed)
  const args = process.argv.slice(2);
  
  console.log('🔍 Debug: Received arguments:', args);
  
  if (args.length === 0) {
    console.error('\n❌ Error: File path required');
    console.error('   Usage: npm run generate:add-todo');
    console.error('   Or:    npx ts-node src/scripts/generateSingleTest.ts examples/user-stories/add-todo.txt');
    process.exit(1);
  }

  const filePath = args[0]; // ✅ Take first argument directly (no --file flag)

  console.log('\n🤖 AI Test Generator - Single File Mode');
  console.log('='.repeat(60));
  console.log(`📂 Reading story from : ${filePath}`);
  console.log(`🌐 Target app URL     : ${APP_URL}`);
  console.log(`📁 Output directory   : ${OUTPUT_DIR}`);
  console.log('='.repeat(60));

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    console.error(`\n❌ File not found: ${filePath}`);
    console.error(`   Looking for: ${path.resolve(filePath)}`);
    process.exit(1);
  }

  // Read the single user story
  const content = await fs.readFile(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.txt');

  console.log(`\n📖 Loading user story: ${fileName}`);

  const userStories = [{
    story: content.trim(),
    fileName: fileName,
  }];

  const generator = new TestGenerator(OUTPUT_DIR);

  console.log('\n' + '='.repeat(60));
  console.log('🧠 Sending story to OpenAI via TestGenerator...');
  console.log('='.repeat(60));

  const result = await generator.generateBatchTests(userStories, APP_URL);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Result');
  console.log('='.repeat(60));

  if (result.testCases.length > 0) {
    const tc = result.testCases[0];
    console.log(`\n  ✅ ${tc.title}`);
    console.log(`     Test ID  : ${tc.id}`);
    console.log(`     Steps    : ${tc.steps.length}`);
    console.log(`     Tags     : ${tc.tags.join(', ')}`);
    console.log(`     File     : ${OUTPUT_DIR}/${fileName}.spec.ts`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Summary');
  console.log('='.repeat(60));
  console.log(`  Test generated: ${result.summary.successful === 1 ? 'SUCCESS' : 'FAILED'}`);

  if (result.summary.failed > 0) {
    console.log('\n  ⚠️  Generation failed.');
    console.log('  Check your OPENAI_API_KEY in .env');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🚀 Next step:');
  console.log(`   npx playwright test tests/generated/${fileName}.spec.ts`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  console.error('   Make sure OPENAI_API_KEY is set in your .env file');
  process.exit(1);
});