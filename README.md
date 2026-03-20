# 🤖 AI-Augmented Playwright Testing Framework

An intelligent, self-healing automation testing framework for web applications that combines the power of Playwright with AI-driven test generation, automatic selector recovery, and visual regression testing.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40+-green.svg)](https://playwright.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange.svg)](https://openai.com/)

## 🌟 Overview

This framework addresses three critical challenges in modern web application testing:

1. **Time-Consuming Manual Test Creation** - Writing Playwright tests manually is slow and requires technical expertise
2. **Brittle Selectors** - UI changes break 30-40% of tests, requiring constant maintenance
3. **Missed Visual Defects** - Functional tests may pass while visual regressions go undetected

Our solution integrates OpenAI's GPT-4o-mini for intelligent test generation, implements 8 hierarchical self-healing strategies for automatic selector recovery, and provides pixel-level visual regression detection - all natively integrated with Playwright.

## ✨ Key Features

### 🧠 AI-Powered Test Generation
- Generate executable Playwright tests from natural language user stories
- Automatic TypeScript code generation with proper async/await patterns
- Batch processing for multiple user stories
- 84.6% generation success rate (11/13 tests)

### 🔧 Multi-Strategy Self-Healing
- 8 hierarchical recovery strategies:
  1. Placeholder-based healing (78% success for inputs)
  2. Context-based selector detection
  3. Role-based healing (65% success with ARIA attributes)
  4. Text-based matching
  5. Attribute-based fallback
  6. Input type detection
  7. XPath alternatives
  8. AI-powered selector suggestions
- Comprehensive logging to `healing-log.json`
- Analytics dashboard showing success rates

### 👁️ Visual Regression Testing
- Pixel-level screenshot comparison using pixelmatch
- Baseline image management with approval workflows
- Annotated diff images highlighting changes
- Configurable sensitivity thresholds (default 0.1)
- Integrated with self-healing to validate healed selectors

### 🚀 CI/CD Ready
- GitHub Actions integration
- Automated test execution on push/PR/schedule
- Artifact upload (reports, screenshots, logs) with 30-day retention
- 3-minute pipeline execution (Chromium only)
- Secure API key management via GitHub Secrets


## 🏗️ Architecture

The framework follows a modular, layered architecture:
```
┌─────────────────────────────────────────────┐
│         INPUT LAYER                          │
│  User Stories | Config Files | Logs          │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│      AI & LLM INTEGRATION                    │
│      OpenAI GPT-4o-mini                      │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│      CORE MODULES                            │
│  Test Generator | Self-Healing | Visual Reg │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│      TEST EXECUTION                          │
│      AI Test Runner + Playwright             │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│      REPORTING & CI/CD                       │
│  HTML Reports | GitHub Actions               │
└─────────────────────────────────────────────┘

## 📦 Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **TypeScript**: v5.0 or higher
- **OpenAI API Key**: Required for AI test generation and LLM-powered healing
- **Git**: For version control and CI/CD


## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-playwright-framework.git
cd ai-playwright-framework
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Playwright Browsers
```bash
npx playwright install chromium
# Or install all browsers
npx playwright install
```

### 4. Verify Installation
```bash
npm run build
npx playwright --version
```

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

**Security Note:** Never commit `.env` to version control. The `.gitignore` already excludes it.

### 2. Playwright Configuration

Edit `playwright.config.ts` to customize:
```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'https://demo.playwright.dev/todomvc',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // ... other settings
});
```

### 3. Self-Healing Configuration

Modify `src/config/config.ts`:
```typescript
export const config = {
  selfHealing: {
    enabled: true,
    maxAttempts: 8,
    logPath: './data/selectors',
  },
  visualRegression: {
    enabled: true,
    threshold: 0.1, // 10% difference tolerance
    baselinePath: './screenshots/baseline',
  },
};
```

---

## 📖 Usage

### 1. AI Test Generation

#### Step 1: Write User Stories

Create `.txt` files in `examples/user-stories/`:

**Example: `examples/user-stories/add-todo.txt`**
```
As a user
I want to add a new todo item
So that I can track my tasks

Given I am on the TodoMVC application
When I enter "Buy groceries" in the new todo input
And I press Enter
Then I should see "Buy groceries" in the todo list
And the input field should be cleared
```

#### Step 2: Generate Tests
```bash
# Generate tests from all user stories
npm run generate:tests

# Or generate from a specific user story
npm run generate:tests -- --file examples/user-stories/add-todo.txt
```

**Expected Output:**
```
🤖 AI Test Generation Started
Found 13 user story files in examples/user-stories/

✅ Loaded: add-todo.txt
✅ Loaded: delete-todo.txt
✅ Loaded: edit-todo.txt
...

Generating tests with OpenAI GPT-4o-mini...

✅ Test case generated: ai-1771558578344.spec.ts
✅ Test case generated: ai-1771558578345.spec.ts
...

📊 Generation Summary:
   Total: 13
   Success: 11 (84.6%)
   Failed: 2 (15.4%)

Generated tests saved to: tests/generated/
```

#### Step 3: Review Generated Tests
```bash
# View generated test
cat tests/generated/ai-1771558578344.spec.ts
```

**Generated test example:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Add Todo Item', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should add a new todo item', async ({ page }) => {
    // Enter todo text
    await page.locator('.new-todo').fill('Buy groceries');
    await page.locator('.new-todo').press('Enter');
    
    // Verify todo appears
    await expect(page.locator('.todo-list li').first()).toHaveText('Buy groceries');
    
    // Verify input is cleared
    await expect(page.locator('.new-todo')).toHaveValue('');
  });
});
```

---

### 2. Running Tests

#### Run All Tests
```bash
npm test
```

#### Run Specific Test
```bash
npx playwright test tests/generated/ai-1771558578344.spec.ts
```

#### Run with UI Mode (Interactive)
```bash
npx playwright test --ui
```

#### Run in Headed Mode (Visible Browser)
```bash
npx playwright test --headed
```

#### Run with Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### View Test Report
```bash
npx playwright show-report
```

---

### 3. Self-Healing

Self-healing activates automatically when selectors fail. No manual configuration needed!

#### How It Works

When a test encounters a broken selector:

1. Framework detects the failure
2. Applies 8 healing strategies sequentially
3. Logs successful healing to `data/selectors/healing-log.json`
4. Test continues with healed selector

**Console Output Example:**
```
⚠️  Original selector '.old-class-name' failed
🔧 Attempting self-healing...

🔧 Trying healing strategy: placeholder-based
   ❌ placeholder-based - no match found
🔧 Trying healing strategy: context-based
   ❌ context-based - no match found
🔧 Trying healing strategy: role-based
✅ Healed using: [role="textbox"]

📝 Logged healing: .old-class-name → [role="textbox"]
   Reason: Found single textbox using role selector
```

#### View Healing Logs
```bash
# View healing log
cat data/selectors/healing-log.json

# Or open in VS Code
code data/selectors/healing-log.json
```

**Healing log format:**
```json
[
  {
    "timestamp": "2026-03-13T12:34:56.789Z",
    "originalSelector": ".old-class-name",
    "newSelector": "[role=\"textbox\"]",
    "reason": "Found single textbox using role selector"
  }
]
```

#### Healing Analytics
```bash
# View healing statistics
npm run healing:stats
```

---

### 4. Visual Regression Testing

#### Step 1: Create Baselines

First test run captures baseline screenshots:
```bash
npm test
```

Baselines are saved to `screenshots/baseline/`

#### Step 2: Approve Baselines

Review baseline images:
```bash
ls screenshots/baseline/
# add-todo-complete.png
# delete-todo-complete.png
# ...
```

If baselines look correct, commit them:
```bash
git add screenshots/baseline/
git commit -m "Add visual regression baselines"
```

#### Step 3: Detect Visual Changes

Make UI changes to your application, then run tests:
```bash
npm test
```

If visual differences detected:
```
❌ Visual regression failed: add-todo-complete
   Difference: 12.5%
   Diff image: screenshots/diff/add-todo-complete-diff.png
```

#### Step 4: Review Diff Images
```bash
# Open diff image
open screenshots/diff/add-todo-complete-diff.png
# Or on Linux
xdg-open screenshots/diff/add-todo-complete-diff.png
```

Diff images highlight changes in **pink/magenta**.

#### Step 5: Update Baselines (If Changes Are Intentional)
```bash
# Copy current screenshots to baseline
npm run visual:update-baseline

# Or manually
cp screenshots/diff/*-current.png screenshots/baseline/
```

---

## 📁 Project Structure
```
ai-playwright-framework/
│
├── 📂 .github/
│   └── workflows/
│       └── tests.yml              # GitHub Actions CI/CD workflow
│
├── 📂 src/
│   ├── ai/
│   │   └── llmService.ts          # OpenAI API integration
│   ├── config/
│   │   └── config.ts              # Framework configuration
│   ├── core/
│   │   ├── testGenerator.ts      # AI test generation
│   │   ├── selfHealing.ts        # Self-healing manager
│   │   ├── visualRegression.ts   # Visual regression testing
│   │   └── testRunner.ts         # Test execution orchestrator
│   └── models/
│       ├── TestCase.ts            # Test case data model
│       └── TestResult.ts          # Test result data model
│
├── 📂 tests/
│   ├── generated/                 # AI-generated tests
│   │   ├── *.spec.ts
│   │   └── metadata/*.json
│   └── manual/                    # Manual tests
│
├── 📂 examples/
│   └── user-stories/              # Natural language user stories
│       ├── add-todo.txt
│       ├── delete-todo.txt
│       └── ...
│
├── 📂 data/
│   ├── selectors/
│   │   └── healing-log.json       # Self-healing logs
│   └── metrics/                   # Test metrics
│
├── 📂 screenshots/
│   ├── baseline/                  # Visual regression baselines
│   ├── diff/                      # Visual difference images
│   └── failures/                  # Failure screenshots
│
├── 📂 reports/
│   ├── html/                      # HTML test reports
│   └── results.json               # JSON test results
│
├── 📄 .env.example                # Environment variables template
├── 📄 .gitignore                  # Git ignore rules
├── 📄 package.json                # Dependencies and scripts
├── 📄 playwright.config.ts        # Playwright configuration
├── 📄 tsconfig.json               # TypeScript configuration
└── 📄 README.md                   # This file
```

---

## 🔄 CI/CD Integration

### GitHub Actions Setup

The framework includes pre-configured GitHub Actions workflow.

#### Step 1: Add OpenAI API Key to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OPENAI_API_KEY`
5. Value: Your OpenAI API key
6. Click **Add secret**

#### Step 2: Push Code to Trigger Workflow
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 3: View Workflow Results

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. View test results, logs, and artifacts

#### Workflow Triggers

The workflow runs on:
- **Push** to `main` branch
- **Pull requests** to `main`
- **Schedule**: Daily at 2 AM UTC (configurable)
- **Manual trigger**: Workflow dispatch

#### Artifacts

After each run, the following artifacts are uploaded (30-day retention):

- `playwright-report` - HTML test report
- `test-results` - JSON results and screenshots
- `healing-logs` - Self-healing logs
- `generated-tests` - AI-generated test files

#### Workflow Configuration

Edit `.github/workflows/tests.yml` to customize:
```yaml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm test
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 💰 API Costs

### OpenAI API Usage

- **Model**: GPT-4o-mini
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens

### Estimated Costs

| Operation | Tokens (approx) | Cost per Operation |
|-----------|-----------------|-------------------|
| Generate 1 test | 1,500 input + 500 output | $0.01 - $0.02 |
| Generate 13 tests (batch) | 19,500 input + 6,500 output | $0.10 - $0.20 |
| AI selector healing (per attempt) | 2,000 input + 100 output | $0.01 |

### Cost Optimization Tips

1. **Batch Generation**: Generate multiple tests in one batch to share context
2. **Disable AI Healing**: Set `selfHealing.aiEnabled: false` in config to skip LLM-powered healing (strategy 8)
3. **Use Cache**: LLM responses are cached to avoid duplicate API calls
4. **Local Testing**: Disable AI features in local development, enable only in CI/CD

---

## 📊 Evaluation Results

Results from controlled experiments (Weeks 13-14):

### Test Generation Quality (RQ1)

| Metric | Result |
|--------|--------|
| **Syntactic Correctness** | 92.3% (12/13 tests compiled) |
| **Functional Correctness** | 84.6% (11/13 tests passed) |
| **Manual Edits Required** | 1.8 edits/test average |
| **Time Savings** | 73% faster than manual authoring |

### Self-Healing Effectiveness (RQ2)

| Strategy | Success Rate |
|----------|--------------|
| Placeholder-based | 78% |
| Role-based | 65% |
| Context-based | 58% |
| Text-based | 52% |
| Attribute-based | 45% |
| Input-type | 71% |
| XPath alternatives | 38% |
| AI-powered | 61% |
| **Overall Healing** | **67.8%** |

### Framework Impact

| Metric | Manual Testing | AI-Augmented | Improvement |
|--------|---------------|--------------|-------------|
| **Test Creation Time** | 15 min/test | 4 min/test | **73% faster** |
| **Maintenance Time** | 8 min/failure | 0.5 min/failure | **94% reduction** |
| **Test Reliability** | 82% pass rate | 95% pass rate | **16% improvement** |
| **False Negative Rate** | 8% | 3% | **63% reduction** |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. OpenAI API Key Not Found

**Error:**
```
Error: OpenAI API key not found in environment variables
```

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify API key is set
cat .env | grep OPENAI_API_KEY

# If missing, add it
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
```

#### 2. Test Generation Fails

**Error:**
```
Failed to generate test from user story: add-todo.txt
```

**Solutions:**
- **Check user story format**: Ensure proper Given-When-Then structure
- **Check API quota**: Verify OpenAI account has available credits
- **Check rate limits**: Wait 60 seconds and retry
- **View detailed error**: Check `logs/generation-errors.log`

#### 3. Self-Healing Not Working

**Symptom:** Tests fail instead of healing

**Solutions:**
```typescript
// Verify self-healing is enabled in config
export const config = {
  selfHealing: {
    enabled: true, // ← Check this is true
    maxAttempts: 8,
  },
};
```
```bash
# Check healing logs
cat data/selectors/healing-log.json

# If empty, healing never triggered
# Verify element actually exists on page
```

#### 4. Visual Regression False Positives

**Symptom:** Tests fail with small visual differences

**Solutions:**
```typescript
// Increase threshold in config
export const config = {
  visualRegression: {
    threshold: 0.2, // Increase from 0.1 to 0.2 (20% tolerance)
  },
};
```
```bash
# Or update baselines if changes are expected
npm run visual:update-baseline
```

#### 5. CI/CD Workflow Fails

**Error:** `npm ci` fails with dependency errors

**Solution:**
```bash
# Ensure package-lock.json is committed
git add package-lock.json
git commit -m "Add package-lock.json for CI"
git push
```

**Error:** `OPENAI_API_KEY` not found in CI

**Solution:**
1. Verify secret is added in GitHub Settings → Secrets
2. Check spelling: must be exactly `OPENAI_API_KEY`
3. Re-run workflow after adding secret

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### 1. Fork the Repository
```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/ai-playwright-framework.git
cd ai-playwright-framework
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow existing code style (TypeScript + ESLint)
- Add tests for new features
- Update documentation as needed

### 4. Run Tests
```bash
# Run all tests
npm test

# Run linter
npm run lint

# Build project
npm run build
```

### 5. Commit Changes
```bash
git add .
git commit -m "feat: add your feature description"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring

### 6. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### Code of Conduct

- Be respectful and inclusive
- Follow best practices
- Write clear, maintainable code
- Document your changes

---

## 📞 Contact

**Researcher:** Hashini Bhagya Nawanjali Hettiarachchi  
**Institution:** Yoobee College of Creative Innovation  
**Program:** Master of Software Engineering (Level 9)  
**Course:** MSE907 Industry-Based Capstone Research Project

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o-mini API enabling intelligent test generation
- **Playwright Team** for the excellent browser automation framework
- **Yoobee College** for academic support and guidance
- **TodoMVC** for providing a standard test application
- **Open Source Community** for invaluable tools and libraries

---

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
