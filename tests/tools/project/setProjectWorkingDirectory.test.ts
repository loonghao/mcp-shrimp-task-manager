/**
 * 设置项目工作目录工具测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setProjectWorkingDirectory } from '@/tools/project/setProjectWorkingDirectory';
import * as pathManager from '@/utils/pathManager';
import fs from 'fs/promises';
import path from 'path';

// Mock fs
vi.mock('fs/promises');

// Mock pathManager
vi.mock('@/utils/pathManager', () => ({
  updateProjectPath: vi.fn(),
  getPathSummary: vi.fn()
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('setProjectWorkingDirectory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('input validation', () => {
    it('should reject relative paths', async () => {
      const result = await setProjectWorkingDirectory({
        projectPath: 'relative/path',
        persistent: false,
        validateProject: false
      });

      expect(result.content[0].text).toContain('项目路径必须是绝对路径');
    });

    it('should reject non-existent directories', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const result = await setProjectWorkingDirectory({
        projectPath: 'C:/non/existent/path',
        persistent: false,
        validateProject: false
      });

      expect(result.content[0].text).toContain('无法访问目录');
    });

    it('should reject files (not directories)', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => false
      } as any);

      const result = await setProjectWorkingDirectory({
        projectPath: 'C:/some/file.txt',
        persistent: false,
        validateProject: false
      });

      expect(result.content[0].text).toContain('指定路径不是目录');
    });
  });

  describe('successful operation', () => {
    beforeEach(() => {
      // Mock successful directory stat
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);

      // Mock successful file operations
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      // Mock path summary
      vi.mocked(pathManager.getPathSummary).mockResolvedValue({
        baseDataDir: 'C:/test-data',
        projectDataDir: 'C:/test-data/projects/test-project',
        logDir: 'C:/test-data/projects/test-project/logs',
        tasksFile: 'C:/test-data/projects/test-project/tasks.json',
        configDir: 'C:/test-data/projects/test-project/config',
        tempDir: 'C:/test-data/projects/test-project/temp',
        projectInfo: {
          id: 'test-project',
          rawName: 'Test Project',
          source: 'directory',
          path: 'C:/test/project'
        }
      });
    });

    it('should set project directory successfully', async () => {
      const result = await setProjectWorkingDirectory({
        projectPath: 'C:/test/project',
        persistent: false,
        validateProject: false
      });

      expect(pathManager.updateProjectPath).toHaveBeenCalledWith('C:/test/project');
      expect(result.content[0].text).toContain('✅ 项目工作目录已设置为: C:/test/project');
    });

    it('should save config when persistent is true', async () => {
      await setProjectWorkingDirectory({
        projectPath: 'C:/test/project',
        persistent: true,
        validateProject: false
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('C:/test/project', '.shrimp-config.json'),
        expect.stringContaining('"projectPath": "C:/test/project"'),
        'utf-8'
      );
    });

    it('should not save config when persistent is false', async () => {
      await setProjectWorkingDirectory({
        projectPath: 'C:/test/project',
        persistent: false,
        validateProject: false
      });

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should include path summary in response', async () => {
      const result = await setProjectWorkingDirectory({
        projectPath: 'C:/test/project',
        persistent: false,
        validateProject: false
      });

      expect(result.content[0].text).toContain('📁 路径配置摘要:');
      expect(result.content[0].text).toContain('数据目录: C:/test-data/projects/test-project');
      expect(result.content[0].text).toContain('日志目录: C:/test-data/projects/test-project/logs');
    });

    it('should validate project when validateProject is true', async () => {
      // Mock project validation files
      vi.mocked(fs.access).mockImplementation((path) => {
        if (path.toString().includes('.git') || path.toString().includes('package.json')) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('ENOENT'));
      });

      const result = await setProjectWorkingDirectory({
        projectPath: 'C:/test/project',
        persistent: false,
        validateProject: true
      });

      expect(result.content[0].text).toContain('✅ 项目工作目录已设置为');
    });
  });

  describe('error handling', () => {
    it('should handle updateProjectPath errors', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);

      vi.mocked(pathManager.updateProjectPath).mockRejectedValue(new Error('Update failed'));

      const result = await setProjectWorkingDirectory({
        projectPath: 'C:/test/project',
        persistent: false,
        validateProject: false
      });

      expect(result.content[0].text).toContain('❌ 设置项目工作目录失败');
    });

    it('should handle config save errors gracefully', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);

      // Mock updateProjectPath to succeed
      vi.mocked(pathManager.updateProjectPath).mockResolvedValue(undefined);

      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));

      vi.mocked(pathManager.getPathSummary).mockResolvedValue({
        baseDataDir: 'C:/test-data',
        projectDataDir: 'C:/test-data/projects/test-project',
        logDir: 'C:/test-data/projects/test-project/logs',
        tasksFile: 'C:/test-data/projects/test-project/tasks.json',
        configDir: 'C:/test-data/projects/test-project/config',
        tempDir: 'C:/test-data/projects/test-project/temp',
        projectInfo: null
      });

      const result = await setProjectWorkingDirectory({
        projectPath: 'C:/test/project',
        persistent: true,
        validateProject: false
      });

      // 应该仍然成功，只是配置保存失败
      expect(result.content[0].text).toContain('✅ 项目工作目录已设置为');
    });
  });
});
