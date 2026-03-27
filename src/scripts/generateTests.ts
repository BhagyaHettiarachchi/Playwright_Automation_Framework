import { TestGenerator } from '../core/testGenerator';
import fs from 'fs/promises';
import path from 'path';

const USER_STORIES_DIR = './examples/user-stories';
const APP_URL          = 'https://demo.playwright.dev/todomvc';
const OUTPUT_DIR       = './tests/generated';

async function main() {
  console.log('\n🤖 AI Test Generator');
  console.log('='.repeat(60));
  console.log(`📂 Reading stories from : ${USER_STORIES_DIR}`);
  console.log(`🌐 Target app URL       : ${APP_URL}`);
  console.log(`📁 Output directory     : ${OUTPUT_DIR}`);
  console.log('='.repeat(60));

  // ── Step 1: Read all .txt files ──────────────────────────
  let files: string[] = [];
  try {
    const all = await fs.readdir(USER_STORIES_DIR);
    files = all.filter(f => f.endsWith('.txt'));
  } catch {
    console.error(`\n❌ Folder not found: ${USER_STORIES_DIR}`);
    console.error('   Please make sure your .txt files are in examples/user-stories/');
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('\n❌ No .txt files found in examples/user-stories/');
    process.exit(1);
  }

  console.log(`\n📋 Found ${files.length} user story files:`);
  files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));

  const userStories: { story: string; fileName: string }[] = [];

// Define desired order
const desiredOrder = [
  'add-todo',
  'add-multiple-todos',
  'complete-todo',
  'edit-todo',
  'delete-todo'
];

console.log('\n📖 Loading user story content...');

// Load files in specific order
for (let i = 0; i < desiredOrder.length; i++) {
  const fileName = desiredOrder[i];
  const file = `${fileName}.txt`;
  const filePath = path.join(USER_STORIES_DIR, file);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    userStories.push({
      story: content.trim(),
      fileName: `${i + 1}-${fileName}`, // Add number prefix: "1-add-todo"
    });
    
    console.log(`   ✅ Loaded: ${file} → ${i + 1}-${fileName}.spec.ts`);
  } catch (error) {
    console.warn(`   ⚠️  Skipped: ${file} (not found)`);
  }
}

  // ── Step 3: Use your existing TestGenerator (LLM) ────────
  console.log('\n' + '='.repeat(60));
  console.log('🧠 Sending all stories to OpenAI via TestGenerator...');
  console.log('   (This may take a few minutes)');
  console.log('='.repeat(60));

  const generator = new TestGenerator(OUTPUT_DIR);

  // ✅ CHANGED: generateBatchTests() now accepts { story, fileName }[]
  const result = await generator.generateBatchTests(userStories, APP_URL);

  // ── Step 4: Print per-story results ──────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Results');
  console.log('='.repeat(60));

  result.testCases.forEach((tc, i) => {
    console.log(`\n  ${i + 1}. ✅ ${tc.title}`);
    console.log(`     Test ID  : ${tc.id}`);
    console.log(`     Steps    : ${tc.steps.length}`);
    console.log(`     Tags     : ${tc.tags.join(', ')}`);
    console.log(`     File     : ${OUTPUT_DIR}/${tc.id}.spec.ts`);
  });

  // ── Step 5: List generated .spec.ts files ────────────────
  console.log('\n' + '='.repeat(60));
  const generatedFiles = await generator.listGeneratedTests();

  console.log(`\n📁 ${generatedFiles.length} test files generated in ${OUTPUT_DIR}/:`);
  generatedFiles.forEach(f => console.log(`   • ${f}`));

  // ── Step 6: Summary ──────────────────────────────────────
  const succeeded = result.summary.successful;
  const failed    = result.summary.failed;

  console.log('\n' + '='.repeat(60));
  console.log('✅ Summary');
  console.log('='.repeat(60));
  console.log(`  User stories found    : ${result.summary.total}`);
  console.log(`  Tests generated (LLM) : ${succeeded}`);
  console.log(`  Failed                : ${failed}`);

  if (failed > 0) {
    console.log('\n  ⚠️  Some stories failed to generate.');
    console.log('  Check your OPENAI_API_KEY in .env');
    console.log('\n  Failed stories:');
    result.summary.details
      .filter(d => !d.success)
      .forEach(d => console.log(`     • ${d.fileName}: ${d.error || 'Unknown error'}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🚀 Next steps:');
  console.log('   npm test                 → run all generated tests');
  console.log('   npm run test:headed      → run with browser visible');
  console.log('   npm run report           → view HTML report');
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  console.error('   Make sure OPENAI_API_KEY is set in your .env file');
  process.exit(1);
});