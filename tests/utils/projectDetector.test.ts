import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { getProjectDataDir } from '../../src/utils/projectDetector.js';

describe('ProjectDetector', () => {
  const originalCwd = process.cwd();
  const testDir = path.join(process.cwd(), 'tests', 'temp-project');

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getProjectDataDir', () => {
    it('should use baseDataDir when PROJECT_AUTO_DETECT is explicitly disabled', async () => {
      const originalAutoDetect = process.env.PROJECT_AUTO_DETECT;
      process.env.PROJECT_AUTO_DETECT = 'false';

      const baseDir = '/custom/data/dir';
      const result = await getProjectDataDir(baseDir);
      expect(result).toBe(baseDir);

      // Restore original value
      if (originalAutoDetect) {
        process.env.PROJECT_AUTO_DETECT = originalAutoDetect;
      } else {
        delete process.env.PROJECT_AUTO_DETECT;
      }
    });

    it('should detect project name from package.json when auto-detect is enabled', async () => {
      // Enable auto-detection
      process.env.PROJECT_AUTO_DETECT = 'true';

      // Create a package.json file
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
      };

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Change to test directory
      process.chdir(testDir);

      const baseDir = '/base/data/dir';
      const result = await getProjectDataDir(baseDir, testDir);

      // Should include project name in path when auto-detect is enabled
      expect(result).toContain('test-project');

      // Clean up
      delete process.env.PROJECT_AUTO_DETECT;
    });

    it('should handle missing package.json gracefully', async () => {
      // Disable auto-detection for this test
      const originalAutoDetect = process.env.PROJECT_AUTO_DETECT;
      process.env.PROJECT_AUTO_DETECT = 'false';

      // Change to test directory without package.json
      process.chdir(testDir);

      const baseDir = '/base/data/dir';
      const result = await getProjectDataDir(baseDir, testDir);

      // Should return base directory when auto-detect is disabled
      expect(typeof result).toBe('string');
      expect(result).toBe(baseDir);

      // Restore original value
      if (originalAutoDetect) {
        process.env.PROJECT_AUTO_DETECT = originalAutoDetect;
      } else {
        delete process.env.PROJECT_AUTO_DETECT;
      }
    });

    it('should handle auto-detect disabled mode', async () => {
      const originalAutoDetect = process.env.PROJECT_AUTO_DETECT;
      process.env.PROJECT_AUTO_DETECT = 'false';

      const baseDir = '/test/data/dir';
      const result = await getProjectDataDir(baseDir);

      // Should return base directory when auto-detect is disabled
      expect(result).toBe(baseDir);

      // Restore original value
      if (originalAutoDetect) {
        process.env.PROJECT_AUTO_DETECT = originalAutoDetect;
      } else {
        delete process.env.PROJECT_AUTO_DETECT;
      }
    });
  });
});
