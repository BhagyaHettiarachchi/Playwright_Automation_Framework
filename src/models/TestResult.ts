export interface TestResult {
  testCaseId: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'FLAKY';
  executionTime: number;
  timestamp: Date;
  errors?: string[];
  screenshots?: string[];
  selfHealingApplied: boolean;
  healingDetails?: {
    originalSelector: string;
    newSelector: string;
    reason: string;
  };
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
}