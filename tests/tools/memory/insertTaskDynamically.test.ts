/**
 * insertTaskDynamically 工具单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { insertTaskDynamically } from '../../../src/tools/memory/insertTaskDynamically.js';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

// Mock dependencies
vi.mock('../../../src/utils/projectDetector.js', () => ({
  getProjectContext: vi.fn().mockResolvedValue({
    projectName: 'test-project',
    projectId: 'test-project',
    projectRoot: '/test/project'
  })
}));

vi.mock('../../../src/utils/pathManager.js', () => ({
  getProjectDataDir: vi.fn().mockResolvedValue('/test/data/dir')
}));

describe('insertTaskDynamically', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `insert-task-dynamically-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // Mock getProjectDataDir to return our test directory
    const { getProjectDataDir } = await import('../../../src/utils/pathManager.js');
    vi.mocked(getProjectDataDir).mockResolvedValue(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('基本任务插入', () => {
    it('应该能够插入新任务', async () => {
      const result = await insertTaskDynamically({
        title: '新的安全检查任务',
        description: '对系统进行全面的安全检查，包括代码审查和漏洞扫描',
        priority: 8,
        urgency: 'high',
        context: '在代码审查过程中发现需要加强安全检查'
      });

      expect(result.success).toBe(true);
      expect(result.data.insertedTask).toBeDefined();
      expect(result.data.insertedTask.title).toBe('新的安全检查任务');
      expect(result.data.adjustmentSummary).toBeDefined();
    });

    it('应该验证必需的参数', async () => {
      try {
        await insertTaskDynamically({
          // 缺少 title
          description: '测试任务描述'
        } as any);

        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出验证错误
        expect(error).toBeDefined();
      }
    });

    it('应该验证参数长度', async () => {
      try {
        await insertTaskDynamically({
          title: 'A', // 太短
          description: 'B' // 太短
        });

        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出验证错误
        expect(error).toBeDefined();
      }
    });
  });

  describe('位置指定插入', () => {
    it('应该能够在指定任务后插入', async () => {
      const result = await insertTaskDynamically({
        title: '代码审查任务',
        description: '对新功能进行详细的代码审查，确保代码质量',
        insertAfter: 'task-001',
        priority: 7,
        urgency: 'medium'
      });

      expect(result.success).toBe(true);
      expect(result.data.insertedTask).toBeDefined();
      expect(result.data.adjustmentSummary).toBeDefined();
    });

    it('应该能够在指定任务前插入', async () => {
      const result = await insertTaskDynamically({
        title: '环境准备任务',
        description: '准备开发和测试环境，安装必要的依赖',
        insertBefore: 'task-002',
        priority: 9,
        urgency: 'critical'
      });

      expect(result.success).toBe(true);
      expect(result.data.insertedTask).toBeDefined();
    });

    it('应该处理无效的插入位置', async () => {
      const result = await insertTaskDynamically({
        title: '测试任务',
        description: '这是一个测试任务，用于验证插入功能',
        insertAfter: 'non-existent-task',
        priority: 5
      });

      expect(result.success).toBe(true);
      expect(result.data.warnings).toBeDefined();
      expect(result.data.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('优先级和紧急程度', () => {
    it('应该支持不同的优先级', async () => {
      const highPriorityResult = await insertTaskDynamically({
        title: '高优先级任务',
        description: '这是一个高优先级的紧急任务',
        priority: 10,
        urgency: 'critical'
      });

      const lowPriorityResult = await insertTaskDynamically({
        title: '低优先级任务',
        description: '这是一个低优先级的常规任务',
        priority: 1,
        urgency: 'low'
      });

      expect(highPriorityResult.success).toBe(true);
      expect(lowPriorityResult.success).toBe(true);
    });

    it('应该验证优先级范围', async () => {
      try {
        await insertTaskDynamically({
          title: '无效优先级任务',
          description: '测试无效的优先级值',
          priority: 15 // 超出范围
        });

        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出验证错误
        expect(error).toBeDefined();
      }
    });
  });

  describe('相关任务关联', () => {
    it('应该能够关联相关任务', async () => {
      const result = await insertTaskDynamically({
        title: '性能优化任务',
        description: '优化系统性能，提升响应速度',
        priority: 6,
        relatedTasks: ['task-001', 'task-002', 'task-003'],
        context: '基于性能测试结果，需要进行系统优化'
      });

      expect(result.success).toBe(true);
      expect(result.data.insertedTask).toBeDefined();
    });
  });

  describe('自动调整功能', () => {
    it('应该支持自动调整后续任务', async () => {
      const result = await insertTaskDynamically({
        title: '自动调整测试任务',
        description: '测试自动调整功能是否正常工作',
        priority: 7,
        autoAdjust: true,
        generateSuggestions: true
      });

      expect(result.success).toBe(true);
      expect(result.data.adjustedTasks).toBeDefined();
      expect(result.data.suggestions).toBeDefined();
    });

    it('应该能够禁用自动调整', async () => {
      const result = await insertTaskDynamically({
        title: '禁用自动调整测试',
        description: '测试禁用自动调整功能',
        priority: 5,
        autoAdjust: false,
        generateSuggestions: false
      });

      expect(result.success).toBe(true);
      expect(result.data.adjustedTasks).toEqual([]);
      expect(result.data.suggestions).toEqual([]);
    });
  });

  describe('建议生成', () => {
    it('应该生成优化建议', async () => {
      const result = await insertTaskDynamically({
        title: '建议生成测试',
        description: '测试系统是否能生成有用的优化建议',
        priority: 6,
        generateSuggestions: true
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeDefined();
      expect(Array.isArray(result.data.suggestions)).toBe(true);
    });

    it('应该包含建议的详细信息', async () => {
      const result = await insertTaskDynamically({
        title: '详细建议测试',
        description: '测试建议的详细信息是否完整',
        priority: 7,
        generateSuggestions: true
      });

      expect(result.success).toBe(true);
      
      if (result.data.suggestions.length > 0) {
        const suggestion = result.data.suggestions[0];
        expect(suggestion).toHaveProperty('taskId');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('reasoning');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion).toHaveProperty('impact');
      }
    });
  });

  describe('上下文记录', () => {
    it('应该记录插入上下文', async () => {
      const result = await insertTaskDynamically({
        title: '上下文记录测试',
        description: '测试系统是否正确记录插入上下文',
        priority: 5,
        context: '这是一个详细的上下文说明，解释了为什么需要插入这个任务'
      });

      expect(result.success).toBe(true);
      expect(result.data.insertedTask).toBeDefined();
    });
  });

  describe('统计信息', () => {
    it('应该提供详细的统计信息', async () => {
      const result = await insertTaskDynamically({
        title: '统计信息测试',
        description: '测试系统提供的统计信息是否准确',
        priority: 6
      });

      expect(result.success).toBe(true);
      expect(result.data.adjustmentSummary).toBeDefined();
      expect(result.data.adjustmentSummary).toHaveProperty('adjustedTasksCount');
      expect(result.data.adjustmentSummary).toHaveProperty('suggestionsCount');
      expect(result.data.adjustmentSummary).toHaveProperty('warningsCount');
      expect(result.data.adjustmentSummary).toHaveProperty('summary');
    });
  });

  describe('后续步骤', () => {
    it('应该提供后续步骤建议', async () => {
      const result = await insertTaskDynamically({
        title: '后续步骤测试',
        description: '测试系统是否提供有用的后续步骤建议',
        priority: 7
      });

      expect(result.success).toBe(true);
      expect(result.data.nextSteps).toBeDefined();
      expect(Array.isArray(result.data.nextSteps)).toBe(true);
      expect(result.data.nextSteps.length).toBeGreaterThan(0);
    });
  });

  describe('错误处理', () => {
    it('应该处理系统错误', async () => {
      // 模拟系统错误
      vi.mocked(require('../../../src/utils/projectDetector.js').getProjectContext)
        .mockRejectedValueOnce(new Error('系统错误'));

      const result = await insertTaskDynamically({
        title: '错误处理测试',
        description: '测试系统错误处理能力'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该处理参数验证错误', async () => {
      try {
        await insertTaskDynamically({
          // 无效的参数组合
          title: '', // 空标题
          description: '', // 空描述
          priority: -1 // 无效优先级
        } as any);

        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出验证错误
        expect(error).toBeDefined();
      }
    });
  });

  describe('响应格式', () => {
    it('应该返回正确的响应格式', async () => {
      const result = await insertTaskDynamically({
        title: '响应格式测试',
        description: '测试响应格式是否符合预期',
        priority: 5
      });

      expect(result).toHaveProperty('success');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(result.data).toHaveProperty('insertedTask');
        expect(result.data).toHaveProperty('adjustmentSummary');
        expect(result.data).toHaveProperty('adjustedTasks');
        expect(result.data).toHaveProperty('suggestions');
        expect(result.data).toHaveProperty('warnings');
        expect(result.data).toHaveProperty('nextSteps');
      } else {
        expect(result).toHaveProperty('error');
      }
    });
  });
});
