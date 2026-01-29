export interface TestStep {
  action: string;
  selector: string;
  value?: string;
  description: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  userStory?: string;
  steps: TestStep[];
  expectedResults: string[];
  priority: number;
  generatedBy: 'AI' | 'MANUAL';
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface SelectorHistory {
  selector: string;
  elementId: string;
  timestamp: Date;
  confidence: number;
  attributes: Record<string, string>;
  xpathAlternatives: string[];
}

export interface SelectorPrediction {
  selector: string;
  confidence: number;
  reasoning: string;
  alternatives: string[];
}