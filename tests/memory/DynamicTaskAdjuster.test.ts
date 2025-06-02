/**
 * DynamicTaskAdjuster 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DynamicTaskAdjuster, TaskInsertionRequest } from '../../src/memory/DynamicTaskAdjuster.js';
import { TaskMemoryManager } from '../../src/memory/TaskMemoryManager.js';
import { Task, TaskStatus } from '../../src/types/index.js';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

// Mock getAllTasks and batchCreateOrUpdateTasks
vi.mock('../../src/models/taskModel.js', () => ({
  getAllTasks: vi.fn().mockResolvedValue([]),
  batchCreateOrUpdateTasks: vi.fn().mockResolvedValue(undefined)
}));

// Mock getProjectContext
vi.mock('../../src/utils/projectDetector.js', () => ({
  getProjectContext: vi.fn().mockResolvedValue({
    projectName: 'test-project',
    projectId: 'test-project',
    projectRoot: '/test/project',
    projectType: {
      hasGit: true,
      hasPackageJson: true,
      hasNodeModules: false,
      hasPyprojectToml: false,
      hasCargoToml: false,
      hasGoMod: false
    }
  })
}));

describe('DynamicTaskAdjuster', () => {
  let taskAdjuster: DynamicTaskAdjuster;
  let memoryManager: TaskMemoryManager;
  let testDir: string;

  beforeEach(() => {
    // 创建临时测试目录
    testDir = path.join(tmpdir(), `dynamic-adjuster-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    
    memoryManager = new TaskMemoryManager(testDir);
    taskAdjuster = new DynamicTaskAdjuster(memoryManager);
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('智能任务插入', () => {
    it('应该能够智能插入新任务', async () => {
      const insertionRequest: TaskInsertionRequest = {
        title: '新的安全检查任务',
        description: '对系统进行全面的安全检查',
        priority: 8,
        urgency: 'high',
        context: '在代码审查过程中发现需要加强安全检查'
      };

      const result = await taskAdjuster.insertTaskIntelligently(insertionRequest);

      expect(result.success).toBe(true);
      expect(result.insertedTask).toBeDefined();
      expect(result.insertedTask!.name).toBe('新的安全检查任务');
      expect(result.summary).toContain('智能插入任务');
    });

    it('应该能够在指定任务后插入', async () => {
      const insertionRequest: TaskInsertionRequest = {
        title: '代码审查任务',
        description: '对新功能进行代码审查',
        insertAfter: 'task-001',
        priority: 7
      };

      const result = await taskAdjuster.insertTaskIntelligently(insertionRequest);

      expect(result.success).toBe(true);
      expect(result.insertedTask).toBeDefined();
      expect(result.summary).toContain('在指定位置插入任务');
    });

    it('应该能够在指定任务前插入', async () => {
      const insertionRequest: TaskInsertionRequest = {
        title: '环境准备任务',
        description: '准备开发环境',
        insertBefore: 'task-002',
        priority: 9,
        urgency: 'critical'
      };

      const result = await taskAdjuster.insertTaskIntelligently(insertionRequest);

      expect(result.success).toBe(true);
      expect(result.insertedTask).toBeDefined();
      expect(result.insertedTask!.name).toBe('环境准备任务');
    });

    it('应该处理无效的插入位置', async () => {
      const insertionRequest: TaskInsertionRequest = {
        title: '测试任务',
        description: '测试任务描述',
        insertAfter: 'non-existent-task'
      };

      const result = await taskAdjuster.insertTaskIntelligently(insertionRequest);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('指定的插入位置任务不存在，将使用智能选择');
    });

    it('应该生成调整建议', async () => {
      const insertionRequest: TaskInsertionRequest = {
        title: '性能优化任务',
        description: '优化系统性能',
        priority: 6,
        relatedTasks: ['task-001', 'task-002']
      };

      const result = await taskAdjuster.insertTaskIntelligently(insertionRequest);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('基于上下文的任务调整', () => {
    it('应该能够基于执行上下文调整任务', async () => {
      // 创建模拟的执行上下文
      const mockContext = {
        taskId: 'task-001',
        executionId: 'exec-001',
        startTime: new Date(),
        status: 'completed' as const,
        steps: [],
        decisions: [],
        discoveries: [
          {
            discoveryId: 'discovery-001',
            timestamp: new Date(),
            type: 'insight' as const,
            title: '性能瓶颈发现',
            description: '发现数据库查询是主要性能瓶颈',
            impact: 'high' as const,
            actionRequired: true,
            relatedTasks: [],
            evidence: [],
            confidence: 0.9
          }
        ],
        environment: {
          os: 'linux',
          runtime: 'node',
          version: '18.0.0',
          dependencies: {},
          configuration: {}
        },
        resources: [],
        artifacts: [],
        knowledgeGenerated: [],
        knowledgeConsumed: [],
        checkpoints: []
      };

      const result = await taskAdjuster.adjustTasksBasedOnContext(mockContext);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.summary).toContain('基于执行上下文');
    });

    it('应该识别高影响的发现', async () => {
      const mockContext = {
        taskId: 'task-002',
        executionId: 'exec-002',
        startTime: new Date(),
        status: 'completed' as const,
        steps: [],
        decisions: [],
        discoveries: [
          {
            discoveryId: 'discovery-002',
            timestamp: new Date(),
            type: 'risk' as const,
            title: '安全漏洞发现',
            description: '发现潜在的SQL注入漏洞',
            impact: 'critical' as const,
            actionRequired: true,
            relatedTasks: [],
            evidence: [],
            confidence: 0.95
          }
        ],
        environment: {
          os: 'linux',
          runtime: 'node',
          version: '18.0.0',
          dependencies: {},
          configuration: {}
        },
        resources: [],
        artifacts: [],
        knowledgeGenerated: [],
        knowledgeConsumed: [],
        checkpoints: []
      };

      const result = await taskAdjuster.adjustTasksBasedOnContext(mockContext);

      expect(result.success).toBe(true);
      expect(result.suggestions.some(s => s.adjustmentType === 'priority')).toBe(true);
      expect(result.suggestions.some(s => s.confidence > 0.8)).toBe(true);
    });

    it('应该处理决策影响', async () => {
      const mockContext = {
        taskId: 'task-003',
        executionId: 'exec-003',
        startTime: new Date(),
        status: 'completed' as const,
        steps: [],
        decisions: [
          {
            decisionId: 'decision-001',
            timestamp: new Date(),
            context: '技术选型',
            options: [
              { id: 'react', description: 'React框架' },
              { id: 'vue', description: 'Vue框架' }
            ],
            chosen: 'react',
            reasoning: '团队更熟悉React',
            impact: 'high' as const,
            reversible: false
          }
        ],
        discoveries: [],
        environment: {
          os: 'linux',
          runtime: 'node',
          version: '18.0.0',
          dependencies: {},
          configuration: {}
        },
        resources: [],
        artifacts: [],
        knowledgeGenerated: [],
        knowledgeConsumed: [],
        checkpoints: []
      };

      const result = await taskAdjuster.adjustTasksBasedOnContext(mockContext);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('依赖关系管理', () => {
    it('应该检测和解决循环依赖', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: '任务1',
          description: '第一个任务',
          status: TaskStatus.PENDING,
          dependencies: [{ taskId: 'task-2', type: 'blocks' }],
          relatedFiles: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'task-2',
          name: '任务2',
          description: '第二个任务',
          status: TaskStatus.PENDING,
          dependencies: [{ taskId: 'task-1', type: 'blocks' }],
          relatedFiles: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = taskAdjuster.resolveDependencyConflicts(tasks);

      expect(result.hasConflicts).toBe(true);
      expect(result.circularDependencies).toHaveLength(1);
      expect(result.tasks).toHaveLength(2);
      // 应该移除循环依赖
      expect(result.tasks.some(t => t.dependencies.length === 0)).toBe(true);
    });

    it('应该处理复杂的依赖关系', () => {
      const tasks: Task[] = [
        {
          id: 'task-a',
          name: '任务A',
          description: '任务A',
          status: TaskStatus.PENDING,
          dependencies: [{ taskId: 'task-b', type: 'blocks' }],
          relatedFiles: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'task-b',
          name: '任务B',
          description: '任务B',
          status: TaskStatus.PENDING,
          dependencies: [{ taskId: 'task-c', type: 'blocks' }],
          relatedFiles: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'task-c',
          name: '任务C',
          description: '任务C',
          status: TaskStatus.PENDING,
          dependencies: [],
          relatedFiles: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = taskAdjuster.resolveDependencyConflicts(tasks);

      expect(result.hasConflicts).toBe(false);
      expect(result.circularDependencies).toHaveLength(0);
      expect(result.tasks).toHaveLength(3);
    });
  });

  describe('智能位置选择', () => {
    it('应该根据优先级选择插入位置', () => {
      const tasks: Task[] = [
        {
          id: 'task-low',
          name: '低优先级任务',
          description: '低优先级',
          status: TaskStatus.PENDING,
          priority: 3,
          dependencies: [],
          relatedFiles: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'task-high',
          name: '高优先级任务',
          description: '高优先级',
          status: TaskStatus.PENDING,
          priority: 9,
          dependencies: [],
          relatedFiles: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const newTask: Task = {
        id: 'task-medium',
        name: '中等优先级任务',
        description: '中等优先级',
        status: TaskStatus.PENDING,
        priority: 6,
        dependencies: [],
        relatedFiles: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const position = taskAdjuster.findOptimalInsertionPosition(tasks, newTask);

      expect(position).toBeDefined();
      expect(typeof position).toBe('number');
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(tasks.length);
    });
  });

  describe('错误处理', () => {
    it('应该处理空的任务列表', async () => {
      const insertionRequest: TaskInsertionRequest = {
        title: '第一个任务',
        description: '在空列表中插入任务'
      };

      const result = await taskAdjuster.insertTaskIntelligently(insertionRequest);

      expect(result.success).toBe(true);
      expect(result.insertedTask).toBeDefined();
    });

    it('应该处理无效的上下文', async () => {
      const invalidContext = {
        taskId: '',
        executionId: '',
        startTime: new Date(),
        status: 'unknown' as any,
        steps: [],
        decisions: [],
        discoveries: [],
        environment: {} as any,
        resources: [],
        artifacts: [],
        knowledgeGenerated: [],
        knowledgeConsumed: [],
        checkpoints: []
      };

      const result = await taskAdjuster.adjustTasksBasedOnContext(invalidContext);

      expect(result.success).toBe(false);
      expect(result.summary).toContain('无效的执行上下文');
    });
  });
});
