/*import { Page, Locator } from '@playwright/test';
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
}*/

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
      console.log(`Element not found with selector: ${originalSelector}`);
      console.log('Attempting self-healing...');
      return await this.healSelector(page, originalSelector, elementContext);
    }

    throw new Error(`Failed to locate element: ${originalSelector}`);
  }

  private async healSelector(
    page: Page,
    originalSelector: string,
    elementContext?: string
  ): Promise<{ locator: Locator; healed: boolean; newSelector: string }> {
    
    // ✅ All strategies in order
    const strategies = [
      () => this.tryPlaceholderSelector(page, originalSelector, elementContext),
      () => this.tryContextBasedSelector(page, elementContext),
      () => this.tryRoleBasedSelector(page, originalSelector, elementContext),
      () => this.tryTextBasedSelector(page, originalSelector),
      () => this.tryAttributeBasedSelector(page, originalSelector),
      () => this.tryInputTypeSelector(page, elementContext),
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

  // ─────────────────────────────────────────────────────────
  // STRATEGY 1: Placeholder-based selector (great for inputs)
  // ─────────────────────────────────────────────────────────
  private async tryPlaceholderSelector(
    page: Page,
    originalSelector: string,
    elementContext?: string
  ): Promise<{ selector: string; reason: string } | null> {
    try {
      // Try getByPlaceholder using keywords from context or selector
      const keywords = this.extractKeywords(originalSelector + ' ' + (elementContext || ''));

      const allInputs = await page.$$('input, textarea');
      for (const input of allInputs) {
        const placeholder = await input.getAttribute('placeholder');
        if (placeholder) {
          const locator = page.getByPlaceholder(placeholder);
          const count = await locator.count();
          if (count === 1) {
            return {
              selector: `[placeholder="${placeholder}"]`,
              reason: `Found input using placeholder: "${placeholder}"`,
            };
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────
  // STRATEGY 2: Context description based selector
  // ─────────────────────────────────────────────────────────
  private async tryContextBasedSelector(
    page: Page,
    elementContext?: string
  ): Promise<{ selector: string; reason: string } | null> {
    if (!elementContext) return null;

    const context = elementContext.toLowerCase();

    try {
      // Input-related context keywords
      if (context.includes('input') || context.includes('type') || context.includes('enter') || context.includes('fill')) {
        const inputs = await page.$$('input:visible, textarea:visible');
        for (const input of inputs) {
          const placeholder = await input.getAttribute('placeholder');
          const type = await input.getAttribute('type');
          const name = await input.getAttribute('name');

          // Skip hidden/submit/button types
          if (type && ['hidden', 'submit', 'button', 'checkbox', 'radio'].includes(type)) continue;

          if (placeholder) {
            const locator = page.locator(`[placeholder="${placeholder}"]`);
            const count = await locator.count();
            if (count === 1) {
              return {
                selector: `[placeholder="${placeholder}"]`,
                reason: `Context "${elementContext}" → found visible input with placeholder`,
              };
            }
          }

          if (name) {
            const locator = page.locator(`[name="${name}"]`);
            const count = await locator.count();
            if (count === 1) {
              return {
                selector: `[name="${name}"]`,
                reason: `Context "${elementContext}" → found input by name attribute`,
              };
            }
          }
        }
      }

      // Checkbox/toggle context
      if (context.includes('toggle') || context.includes('check') || context.includes('complete') || context.includes('mark')) {
        const checkboxes = await page.$$('input[type="checkbox"]:visible, .toggle:visible');
        if (checkboxes.length > 0) {
          const className = await checkboxes[0].getAttribute('class');
          if (className) {
            const locator = page.locator(`.${className.split(' ')[0]}`);
            const count = await locator.count();
            if (count >= 1) {
              return {
                selector: `.${className.split(' ')[0]}`,
                reason: `Context "${elementContext}" → found toggle/checkbox element`,
              };
            }
          }
          return {
            selector: 'input[type="checkbox"]',
            reason: `Context "${elementContext}" → found checkbox input`,
          };
        }
      }

      // Button context
      if (context.includes('button') || context.includes('click') || context.includes('submit')) {
        const buttons = await page.$$('button:visible');
        for (const button of buttons) {
          const text = await button.textContent();
          if (text && text.trim()) {
            return {
              selector: `button:has-text("${text.trim()}")`,
              reason: `Context "${elementContext}" → found button with text`,
            };
          }
        }
      }

      // Link context
      if (context.includes('link') || context.includes('filter') || context.includes('navigate')) {
        const links = await page.$$('a:visible');
        for (const link of links) {
          const text = await link.textContent();
          if (text && text.trim()) {
            return {
              selector: `a:has-text("${text.trim()}")`,
              reason: `Context "${elementContext}" → found link with text`,
            };
          }
        }
      }

    } catch {
      return null;
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────
  // STRATEGY 3: Role-based selector
  // ─────────────────────────────────────────────────────────
  private async tryRoleBasedSelector(
    page: Page,
    originalSelector: string,
    elementContext?: string
  ): Promise<{ selector: string; reason: string } | null> {
    const combined = originalSelector + ' ' + (elementContext || '');
    const textMatch = combined.match(/[a-z]([a-z\s]+)/i);

    if (textMatch) {
      const text = textMatch[1].trim();
      const roles: Array<'button' | 'link' | 'textbox' | 'heading' | 'listitem' | 'checkbox'> = [
        'button', 'link', 'textbox', 'heading', 'listitem', 'checkbox'
      ];

      for (const role of roles) {
        try {
          const locator = page.getByRole(role, { name: text });
          const count = await locator.count();
          if (count === 1) {
            return {
              selector: `getByRole('${role}', { name: '${text}' })`,
              reason: `Switched to role-based selector for better stability`,
            };
          }
        } catch {
          continue;
        }
      }
    }

    // Try generic textbox (for inputs)
    try {
      const textboxes = await page.getByRole('textbox').count();
      if (textboxes === 1) {
        return {
          selector: '[role="textbox"]',
          reason: 'Found single textbox using role selector',
        };
      }
    } catch {
      return null;
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────
  // STRATEGY 4: Text-based selector
  // ─────────────────────────────────────────────────────────
  private async tryTextBasedSelector(
    page: Page,
    originalSelector: string
  ): Promise<{ selector: string; reason: string } | null> {
    try {
      const elements = await page.$$('button, a, input, label, span, div');
      for (const element of elements) {
        const text = await element.textContent();
        const value = await element.getAttribute('value');
        const placeholder = await element.getAttribute('placeholder');
        const searchText = text?.trim() || value || placeholder;

        if (searchText && searchText.length > 2) {
          const locator = page.getByText(searchText, { exact: true });
          const count = await locator.count();
          if (count === 1) {
            return {
              selector: `text="${searchText}"`,
              reason: `Found element by visible text: "${searchText}"`,
            };
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────
  // STRATEGY 5: Attribute-based selector (expanded attributes)
  // ─────────────────────────────────────────────────────────
  private async tryAttributeBasedSelector(
    page: Page,
    originalSelector: string
  ): Promise<{ selector: string; reason: string } | null> {
    // ✅ Added placeholder, class, type to the search list
    const attributes = ['data-testid', 'id', 'name', 'aria-label', 'placeholder', 'type', 'class'];

    for (const attr of attributes) {
      try {
        const elements = await page.$$(`[${attr}]`);
        for (const element of elements) {
          const attrValue = await element.getAttribute(attr);
          if (attrValue && attrValue.length > 0) {
            const selector = `[${attr}="${attrValue}"]`;
            const locator = page.locator(selector);
            const count = await locator.count();
            if (count === 1) {
              return {
                selector,
                reason: `Found stable element using ${attr}="${attrValue}"`,
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

  // ─────────────────────────────────────────────────────────
  // STRATEGY 6: Input type fallback
  // ─────────────────────────────────────────────────────────
  private async tryInputTypeSelector(
    page: Page,
    elementContext?: string
  ): Promise<{ selector: string; reason: string } | null> {
    const context = (elementContext || '').toLowerCase();

    const inputSelectors = [
      { sel: '.new-todo',              reason: 'TodoMVC new todo input class' },
      { sel: 'input.new-todo',         reason: 'TodoMVC new todo input' },
      { sel: 'input[type="text"]',     reason: 'Generic text input' },
      { sel: 'input:not([type])',      reason: 'Input with no type (defaults to text)' },
      { sel: '.toggle',                reason: 'TodoMVC toggle checkbox class' },
      { sel: 'input[type="checkbox"]', reason: 'Generic checkbox input' },
      { sel: '.destroy',               reason: 'TodoMVC delete button' },
    ];

    for (const { sel, reason } of inputSelectors) {
      try {
        const locator = page.locator(sel);
        const count = await locator.count();
        if (count >= 1) {
          return { selector: sel, reason };
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────
  // STRATEGY 7: XPath alternatives
  // ─────────────────────────────────────────────────────────
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
          return { selector: xpath, reason: 'Found using alternative XPath' };
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────
  // STRATEGY 8: AI-based selector (requires OpenAI API key)
  // ─────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────
  // REFINE: Multiple elements found
  // ─────────────────────────────────────────────────────────
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
          await this.logHealing(originalSelector, refined, 'Refined to match single element');
          return { locator, healed: true, newSelector: refined };
        }
      } catch {
        continue;
      }
    }

    const locator = page.locator(originalSelector).first();
    await this.logHealing(originalSelector, `${originalSelector}.first()`, 'Multiple matches, using first');
    return { locator, healed: true, newSelector: `${originalSelector}.first()` };
  }

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
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