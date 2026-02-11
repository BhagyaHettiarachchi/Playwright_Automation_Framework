import { Page, Locator } from '@playwright/test';
import { LLMService } from '../ai/llmService';
import fs from 'fs/promises';
import path from 'path';

export class SelfHealingManager {
  private llmService: LLMService;
  private selectorHistoryPath: string;

  constructor(selectorHistoryPath: string = './data/selectors') {
    this.llmService = new LLMService();
    this.selectorHistoryPath = selectorHistoryPath;
  }

  async findElementWithHealing(
    page: Page,
    originalSelector: string,
    elementContext?: string
  ): Promise<{ locator: Locator; healed: boolean; newSelector?: string }> {
    try {
      const locator = page.locator(originalSelector);
      const count = await locator.count();
      
      if (count === 1) {
        return { locator, healed: false };
      }
      
      if (count === 0) {
        console.log(`Element not found with selector: ${originalSelector}`);
        console.log('Attempting self-healing...');
        return await this.healSelector(page, originalSelector, elementContext);
      }
      
      if (count > 1) {
        console.log(`Multiple elements found (${count}). Refining selector...`);
        return await this.refineSelector(page, originalSelector, elementContext);
      }
    } catch (error) {
      console.error('Error finding element:', error);
    }
    
    throw new Error(`Failed to locate element: ${originalSelector}`);
  }

  private async healSelector(
    page: Page,
    originalSelector: string,
    elementContext?: string
  ): Promise<{ locator: Locator; healed: boolean; newSelector: string }> {
    const strategies = [
      () => this.tryRoleBasedSelector(page, originalSelector),
      () => this.tryTextBasedSelector(page, originalSelector),
      () => this.tryAttributeBasedSelector(page, originalSelector),
      () => this.tryXPathAlternatives(page, originalSelector),
      () => this.tryAISelector(page, originalSelector, elementContext),
    ];

    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (result) {
          await this.logHealing(originalSelector, result.selector, result.reason);
          return {
            locator: page.locator(result.selector),
            healed: true,
            newSelector: result.selector,
          };
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error(`Self-healing failed for selector: ${originalSelector}`);
  }

  private async tryRoleBasedSelector(
    page: Page,
    originalSelector: string
  ): Promise<{ selector: string; reason: string } | null> {
    const textMatch = originalSelector.match(/text[=~]?["']([^"']+)["']/);
    
    if (textMatch) {
      const text = textMatch[1];
      const roles = ['button', 'link', 'textbox', 'heading', 'listitem'];
      
      for (const role of roles) {
        try {
          const locator = page.getByRole(role as any, { name: text });
          const count = await locator.count();
          
          if (count === 1) {
            return {
              selector: `getByRole('${role}', { name: '${text}' })`,
              reason: 'Switched to role-based selector for better stability',
            };
          }
        } catch {
          continue;
        }
      }
    }
    
    return null;
  }

  private async tryTextBasedSelector(
    page: Page,
    originalSelector: string
  ): Promise<{ selector: string; reason: string } | null> {
    try {
      const elements = await page.$$('button, a, input, label');
      
      for (const element of elements) {
        const text = await element.textContent();
        const value = await element.getAttribute('value');
        const placeholder = await element.getAttribute('placeholder');
        
        const searchText = text || value || placeholder;
        
        if (searchText && originalSelector.includes(searchText)) {
          const locator = page.getByText(searchText, { exact: true });
          const count = await locator.count();
          
          if (count === 1) {
            return {
              selector: `getByText('${searchText}', { exact: true })`,
              reason: 'Found element by visible text',
            };
          }
        }
      }
    } catch {
      return null;
    }
    
    return null;
  }

  private async tryAttributeBasedSelector(
    page: Page,
    originalSelector: string
  ): Promise<{ selector: string; reason: string } | null> {
    const attributes = ['data-testid', 'id', 'name', 'aria-label'];
    
    for (const attr of attributes) {
      try {
        const elements = await page.$$(`[${attr}]`);
        
        for (const element of elements) {
          const attrValue = await element.getAttribute(attr);
          
          if (attrValue) {
            const locator = page.locator(`[${attr}="${attrValue}"]`);
            const count = await locator.count();
            
            if (count === 1) {
              return {
                selector: `[${attr}="${attrValue}"]`,
                reason: `Found stable element using ${attr} attribute`,
              };
            }
          }
        }
      } catch {
        continue;
      }
    }
    
    return null;
  }

  private async tryXPathAlternatives(
    page: Page,
    originalSelector: string
  ): Promise<{ selector: string; reason: string } | null> {
    const alternatives = [
      originalSelector.replace(/\[\d+\]/, ''),
      originalSelector.replace(/div/g, '*'),
      `(${originalSelector})[1]`,
    ];

    for (const xpath of alternatives) {
      try {
        const locator = page.locator(xpath);
        const count = await locator.count();
        
        if (count === 1) {
          return {
            selector: xpath,
            reason: 'Found using alternative XPath',
          };
        }
      } catch {
        continue;
      }
    }
    
    return null;
  }

  private async tryAISelector(
    page: Page,
    originalSelector: string,
    elementContext?: string
  ): Promise<{ selector: string; reason: string } | null> {
    try {
      const bodyHtml = await page.content();
      const context = elementContext || 'General page interaction';
      
      const suggestedSelector = await this.llmService.suggestBetterSelector(
        originalSelector,
        bodyHtml.substring(0, 5000),
        context
      );
      
      const locator = page.locator(suggestedSelector);
      const count = await locator.count();
      
      if (count === 1) {
        return {
          selector: suggestedSelector,
          reason: 'AI-suggested selector based on page context',
        };
      }
    } catch (error) {
      console.error('AI selector suggestion failed:', error);
    }
    
    return null;
  }

  private async refineSelector(
    page: Page,
    originalSelector: string,
    elementContext?: string
  ): Promise<{ locator: Locator; healed: boolean; newSelector: string }> {
    const refinements = [
      `${originalSelector}:first-of-type`,
      `${originalSelector}:visible`,
    ];

    for (const refined of refinements) {
      try {
        const locator = page.locator(refined);
        const count = await locator.count();
        
        if (count === 1) {
          await this.logHealing(originalSelector, refined, 'Refined selector to match single element');
          return {
            locator,
            healed: true,
            newSelector: refined,
          };
        }
      } catch {
        continue;
      }
    }

    const locator = page.locator(originalSelector).first();
    await this.logHealing(originalSelector, `${originalSelector}.first()`, 'Multiple matches, using first');
    
    return {
      locator,
      healed: true,
      newSelector: `${originalSelector}.first()`,
    };
  }

  private async logHealing(
    originalSelector: string,
    newSelector: string,
    reason: string
  ): Promise<void> {
    const healingEntry = {
      timestamp: new Date().toISOString(),
      originalSelector,
      newSelector,
      reason,
    };
    
    await fs.mkdir(this.selectorHistoryPath, { recursive: true });
    const logPath = path.join(this.selectorHistoryPath, 'healing-log.json');
    
    try {
      const existing = await fs.readFile(logPath, 'utf-8');
      const logs = JSON.parse(existing);
      logs.push(healingEntry);
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    } catch {
      await fs.writeFile(logPath, JSON.stringify([healingEntry], null, 2));
    }
    
    console.log(`✓ Self-healing applied: ${originalSelector} → ${newSelector}`);
    console.log(`  Reason: ${reason}`);
  }

  async getHealingStats(): Promise<any> {
    try {
      const logPath = path.join(this.selectorHistoryPath, 'healing-log.json');
      const content = await fs.readFile(logPath, 'utf-8');
      const logs = JSON.parse(content);
      
      return {
        totalHealings: logs.length,
        recentHealings: logs.slice(-10),
        successRate: (logs.length / (logs.length + 1)) * 100,
      };
    } catch {
      return { totalHealings: 0, recentHealings: [], successRate: 0 };
    }
  }
}