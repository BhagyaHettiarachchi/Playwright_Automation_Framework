import dotenv from 'dotenv';
dotenv.config();

export interface FrameworkConfig {
  openaiApiKey: string;
  openaiModel: string;
  playwrightConfig: {
    headless: boolean;
    timeout: number;
    retries: number;
  };
  selfHealing: {
    enabled: boolean;
    maxAttempts: number;
    similarityThreshold: number;
  };
  visualRegression: {
    enabled: boolean;
    threshold: number;
  };
  reporting: {
    outputDir: string;
    format: string[];
  };
}

export const config: FrameworkConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4',
  playwrightConfig: {
    headless: process.env.HEADLESS === 'true',
    timeout: parseInt(process.env.TIMEOUT || '30000'),
    retries: parseInt(process.env.RETRIES || '2'),
  },
  selfHealing: {
    enabled: process.env.SELF_HEALING_ENABLED === 'true',
    maxAttempts: 3,
    similarityThreshold: 0.7,
  },
  visualRegression: {
    enabled: process.env.VISUAL_REGRESSION_ENABLED === 'true',
    threshold: 0.1,
  },
  reporting: {
    outputDir: './reports',
    format: ['html', 'json'],
  },
};

export default config;