/**
 * MCP环境诊断工具测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { diagnoseMcpEnvironment } from '@/tools/project/diagnoseMcpEnvironment';
import * as projectDetector from '@/utils/projectDetector';
import fs from 'fs/promises';
import os from 'os';

// Mock dependencies
vi.mock('@/utils/projectDetector');
vi.mock('fs/promises');
vi.mock('os');
vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('diagnoseMcpEnvironment', () => {
  const mockProjectContext = {
    projectRoot: 'C:/test/project',
    projectId: 'test-project',
    projectName: 'Test Project',
    projectType: {
      hasGit: true,
      hasPackageJson: true,
      hasNodeModules: false,
      hasPyprojectToml: false,
      hasCargoToml: false,
      hasGoMod: false
    },
    packageInfo: {
      name: 'test-project',
      version: '1.0.0'
    },
    metadata: {
      detectionMethod: 'environment' as const,
      isMcpEnvironment: true,
      timestamp: new Date()
    }
  };

  const originalEnv = process.env;
  const originalCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.cwd = vi.fn().mockReturnValue('C:/test/project');
    
    vi.mocked(projectDetector.getProjectContext).mockResolvedValue(mockProjectContext);
    vi.mocked(os.platform).mockReturnValue('win32');
    vi.mocked(os.arch).mockReturnValue('x64');
    vi.mocked(os.release).mockReturnValue('10.0.19041');
    vi.mocked(os.homedir).mockReturnValue('C:/Users/test');
  });

  afterEach(() => {
    process.env = originalEnv;
    process.cwd = originalCwd;
  });

  describe('basic diagnosis', () => {
    it('should perform MCP environment diagnosis successfully', async () => {
      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: true,
        includeProcessInfo: true,
        includeRecommendations: true
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('🔍 MCP环境诊断报告');
    });

    it('should include system information when requested', async () => {
      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: true,
        includeProcessInfo: false,
        includeRecommendations: false
      });

      expect(result.content[0].text).toContain('💻 系统信息');
      expect(result.content[0].text).toContain('操作系统: win32');
      expect(result.content[0].text).toContain('架构: x64');
    });

    it('should include process information when requested', async () => {
      process.env.NODE_ENV = 'test';
      process.env.PWD = 'C:/test/pwd';

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: true,
        includeRecommendations: false
      });

      expect(result.content[0].text).toContain('⚙️ 进程信息');
      expect(result.content[0].text).toContain('Node.js版本');
      expect(result.content[0].text).toContain('当前工作目录');
    });

    it('should include recommendations when requested', async () => {
      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: false,
        includeRecommendations: true
      });

      expect(result.content[0].text).toContain('💡 修复建议');
    });

    it('should exclude sections when not requested', async () => {
      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: false,
        includeRecommendations: false
      });

      expect(result.content[0].text).not.toContain('💻 系统信息');
      expect(result.content[0].text).not.toContain('⚙️ 进程信息');
      expect(result.content[0].text).not.toContain('💡 修复建议');
    });
  });

  describe('working directory issue detection', () => {
    it('should detect fallback detection method issues', async () => {
      const mockContext = {
        ...mockProjectContext,
        metadata: {
          ...mockProjectContext.metadata,
          detectionMethod: 'fallback' as const
        }
      };
      vi.mocked(projectDetector.getProjectContext).mockResolvedValue(mockContext);

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: false,
        includeRecommendations: false
      });

      expect(result.content[0].text).toContain('🔴 使用回退检测方法');
    });

    it('should detect suspicious installation directories', async () => {
      process.cwd = vi.fn().mockReturnValue('C:/Program Files/Windsurf/app');

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: false,
        includeRecommendations: false
      });

      expect(result.content[0].text).toContain('🟡 当前目录疑似程序安装目录');
    });

    it('should detect missing environment variables', async () => {
      delete process.env.PWD;
      delete process.env.INIT_CWD;

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: false,
        includeRecommendations: false
      });

      expect(result.content[0].text).toContain('🟡 缺少PWD和INIT_CWD环境变量');
    });

    it('should show no issues when everything is normal', async () => {
      const mockContext = {
        ...mockProjectContext,
        metadata: {
          ...mockProjectContext.metadata,
          detectionMethod: 'environment' as const
        }
      };
      vi.mocked(projectDetector.getProjectContext).mockResolvedValue(mockContext);
      
      process.env.PWD = 'C:/test/project';
      process.env.INIT_CWD = 'C:/test/project';

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: false,
        includeRecommendations: false
      });

      expect(result.content[0].text).toContain('✅ 未检测到明显的工作目录问题');
    });
  });

  describe('environment variable analysis', () => {
    it('should analyze relevant environment variables', async () => {
      process.env.PWD = 'C:/test/pwd';
      process.env.INIT_CWD = 'C:/test/init';
      process.env.HOME = 'C:/Users/test';
      process.env.USERPROFILE = 'C:/Users/test';

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: true,
        includeRecommendations: false
      });

      expect(result.content[0].text).toContain('PWD: C:/test/pwd');
      expect(result.content[0].text).toContain('INIT_CWD: C:/test/init');
      expect(result.content[0].text).toContain('HOME: C:/Users/test');
    });

    it('should handle missing environment variables', async () => {
      delete process.env.PWD;
      delete process.env.HOME;

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: false,
        includeProcessInfo: true,
        includeRecommendations: false
      });

      expect(result.content[0].text).toContain('PWD: undefined');
      expect(result.content[0].text).toContain('HOME: undefined');
    });
  });

  describe('error handling', () => {
    it('should handle projectDetector errors', async () => {
      vi.mocked(projectDetector.getProjectContext).mockRejectedValue(new Error('Detection failed'));

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: true,
        includeProcessInfo: true,
        includeRecommendations: true
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('❌ MCP环境诊断失败');
    });

    it('should handle system info errors gracefully', async () => {
      vi.mocked(os.platform).mockImplementation(() => {
        throw new Error('OS error');
      });

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: true,
        includeProcessInfo: false,
        includeRecommendations: false
      });

      // Should still complete, just with error handling
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
    });
  });

  describe('default parameters', () => {
    it('should use default values when no parameters provided', async () => {
      const result = await diagnoseMcpEnvironment({});

      expect(result.content[0].text).toContain('💻 系统信息');
      expect(result.content[0].text).toContain('⚙️ 进程信息');
      expect(result.content[0].text).toContain('💡 修复建议');
    });
  });

  describe('detailed analysis', () => {
    it('should provide comprehensive diagnosis information', async () => {
      process.env.PWD = 'C:/test/pwd';
      process.env.NODE_ENV = 'production';

      const result = await diagnoseMcpEnvironment({
        includeSystemInfo: true,
        includeProcessInfo: true,
        includeRecommendations: true
      });

      const text = result.content[0].text;
      expect(text).toContain('🔍 MCP环境诊断报告');
      expect(text).toContain('🚨 工作目录问题检测');
      expect(text).toContain('📊 诊断总结');
    });
  });
});
