import { Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

interface VisualDiff {
  hasDifference: boolean;
  diffPercentage: number;
  diffImagePath?: string;
  baselineImagePath: string;
  currentImagePath: string;
}

export class VisualRegressionManager {
  private baselinePath: string;
  private diffPath: string;
  private threshold: number;

  constructor(
    baselinePath: string = './screenshots/baseline',
    diffPath: string = './screenshots/diff',
    threshold: number = 0.1
  ) {
    this.baselinePath = baselinePath;
    this.diffPath = diffPath;
    this.threshold = threshold;
  }

  async captureAndCompare(
    page: Page,
    screenshotName: string,
    options?: {
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
    }
  ): Promise<VisualDiff> {
    const sanitizedName = screenshotName.replace(/[^a-z0-9]/gi, '-');
    const baselineImagePath = path.join(this.baselinePath, `${sanitizedName}.png`);
    const currentImagePath = path.join(this.diffPath, `${sanitizedName}-current.png`);
    const diffImagePath = path.join(this.diffPath, `${sanitizedName}-diff.png`);

    await fs.mkdir(path.dirname(currentImagePath), { recursive: true });
    await page.screenshot({
      path: currentImagePath,
      fullPage: options?.fullPage || false,
      clip: options?.clip,
    });

    try {
      await fs.access(baselineImagePath);
    } catch {
      await fs.mkdir(path.dirname(baselineImagePath), { recursive: true });
      await fs.copyFile(currentImagePath, baselineImagePath);
      
      console.log(`✓ Baseline created: ${screenshotName}`);
      return {
        hasDifference: false,
        diffPercentage: 0,
        baselineImagePath,
        currentImagePath,
      };
    }

    const diff = await this.compareImages(
      baselineImagePath,
      currentImagePath,
      diffImagePath
    );

    if (diff.hasDifference && diff.diffPercentage > this.threshold) {
      console.log(`✗ Visual regression detected in ${screenshotName}`);
      console.log(`  Difference: ${diff.diffPercentage.toFixed(2)}%`);
    } else {
      console.log(`✓ Visual test passed: ${screenshotName}`);
    }

    return diff;
  }

  private async compareImages(
    baselinePath: string,
    currentPath: string,
    diffPath: string
  ): Promise<VisualDiff> {
    const baseline = PNG.sync.read(await fs.readFile(baselinePath));
    const current = PNG.sync.read(await fs.readFile(currentPath));

    const { width, height } = baseline;
    
    if (current.width !== width || current.height !== height) {
      return {
        hasDifference: true,
        diffPercentage: 100,
        baselineImagePath: baselinePath,
        currentImagePath: currentPath,
      };
    }

    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1,
        includeAA: false,
      }
    );

    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    if (numDiffPixels > 0) {
      await fs.mkdir(path.dirname(diffPath), { recursive: true });
      await fs.writeFile(diffPath, PNG.sync.write(diff));
    }

    return {
      hasDifference: diffPercentage > this.threshold,
      diffPercentage,
      diffImagePath: numDiffPixels > 0 ? diffPath : undefined,
      baselineImagePath: baselinePath,
      currentImagePath: currentPath,
    };
  }

  async updateBaseline(screenshotName: string): Promise<void> {
    const sanitizedName = screenshotName.replace(/[^a-z0-9]/gi, '-');
    const currentImagePath = path.join(this.diffPath, `${sanitizedName}-current.png`);
    const baselineImagePath = path.join(this.baselinePath, `${sanitizedName}.png`);

    await fs.copyFile(currentImagePath, baselineImagePath);
    console.log(`✓ Baseline updated: ${screenshotName}`);
  }
}