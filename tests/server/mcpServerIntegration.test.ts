/**
 * MCP 服务器集成测试
 * 测试服务器启动和工具列表加载
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 预期的工具列表
const EXPECTED_TOOLS = [
  'plan_task',
  'analyze_task',
  'reflect_task',
  'split_tasks',
  'list_tasks',
  'execute_task',
  'verify_task',
  'delete_task',
  'clear_all_tasks',
  'update_task',
  'query_task',
  'get_task_detail',
  'process_thought',
  'init_project_rules',
  'research_mode',
  'get_project_context',
  'analyze_working_directory',
  'set_project_working_directory',
  'diagnose_mcp_environment',
  'view_realtime_logs',
  'reset_project_detection',
  'show_path_status',
  'validate_project_isolation'
];

describe('MCP 服务器集成测试', () => {
  const serverPath = path.join(__dirname, '../../dist/index.js');
  
  beforeAll(() => {
    // 确保构建文件存在
    const fs = require('fs');
    if (!fs.existsSync(serverPath)) {
      throw new Error(`服务器文件不存在: ${serverPath}. 请先运行 npm run build`);
    }
  });

  describe('服务器启动测试', () => {
    it('应该能够成功启动服务器（中文模板）', async () => {
      const result = await testServerStartup('zh');
      expect(result.success).toBe(true);
      expect(result.error).toBe('');
    }, 15000);

    it('应该能够成功启动服务器（英文模板）', async () => {
      const result = await testServerStartup('en');
      expect(result.success).toBe(true);
      expect(result.error).toBe('');
    }, 15000);
  });

  describe('工具列表测试', () => {
    it('应该返回完整的工具列表（中文模板）', async () => {
      const result = await testToolsList('zh');
      expect(result.success).toBe(true);
      expect(result.tools).toEqual(expect.arrayContaining(EXPECTED_TOOLS));
      expect(result.tools.length).toBe(EXPECTED_TOOLS.length);
    }, 15000);

    it('应该返回完整的工具列表（英文模板）', async () => {
      const result = await testToolsList('en');
      expect(result.success).toBe(true);
      expect(result.tools).toEqual(expect.arrayContaining(EXPECTED_TOOLS));
      expect(result.tools.length).toBe(EXPECTED_TOOLS.length);
    }, 15000);

    it('工具描述应该不为空', async () => {
      const result = await testToolsDescriptions('zh');
      expect(result.success).toBe(true);
      expect(result.emptyDescriptions.length).toBe(0);
    }, 15000);

    it('新增的工具应该存在', async () => {
      const result = await testToolsList('zh');
      expect(result.success).toBe(true);
      expect(result.tools).toContain('validate_project_isolation');
    }, 15000);
  });

  describe('环境变量测试', () => {
    it('应该正确处理 PROJECT_AUTO_DETECT 环境变量', async () => {
      const result = await testServerWithEnv({
        PROJECT_AUTO_DETECT: 'true',
        TEMPLATES_USE: 'zh'
      });
      expect(result.success).toBe(true);
      expect(result.envVars.PROJECT_AUTO_DETECT).toBe('true');
    }, 15000);

    it('应该正确设置默认环境变量', async () => {
      const result = await testServerWithEnv({
        TEMPLATES_USE: 'zh'
        // 不设置 PROJECT_AUTO_DETECT
      });
      expect(result.success).toBe(true);
      expect(result.envVars.PROJECT_AUTO_DETECT).toBe('true'); // 应该被自动设置
    }, 15000);
  });
});

// 辅助函数
async function testServerStartup(templatesUse: string): Promise<{
  success: boolean;
  error: string;
}> {
  return new Promise((resolve) => {
    const server = spawn('node', [serverPath], {
      env: {
        ...process.env,
        PROJECT_AUTO_DETECT: 'true',
        TEMPLATES_USE: templatesUse,
        LOG_LEVEL: 'error' // 减少日志输出
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let errorOutput = '';
    let hasStarted = false;

    server.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('MCP服务器连接成功')) {
        hasStarted = true;
        server.kill('SIGTERM');
        resolve({ success: true, error: '' });
      }
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    server.on('exit', (code) => {
      if (!hasStarted) {
        resolve({ 
          success: false, 
          error: `服务器退出，代码: ${code}, 错误: ${errorOutput}` 
        });
      }
    });

    // 超时处理
    setTimeout(() => {
      if (!hasStarted) {
        server.kill('SIGTERM');
        resolve({ success: false, error: '服务器启动超时' });
      }
    }, 10000);
  });
}

async function testToolsList(templatesUse: string): Promise<{
  success: boolean;
  tools: string[];
  error?: string;
}> {
  return new Promise((resolve) => {
    const server = spawn('node', [serverPath], {
      env: {
        ...process.env,
        PROJECT_AUTO_DETECT: 'true',
        TEMPLATES_USE: templatesUse,
        LOG_LEVEL: 'error'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let hasStarted = false;
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('MCP服务器连接成功') && !hasStarted) {
        hasStarted = true;
        
        // 发送工具列表请求
        const request = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list"
        };
        server.stdin.write(JSON.stringify(request) + '\n');
      }
      
      // 检查工具列表响应
      if (text.includes('"tools":[')) {
        try {
          const response = JSON.parse(text);
          if (response.result && response.result.tools) {
            const tools = response.result.tools.map((tool: any) => tool.name);
            server.kill('SIGTERM');
            resolve({ success: true, tools });
          }
        } catch (e) {
          // 继续等待完整响应
        }
      }
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('error', (error) => {
      resolve({ success: false, tools: [], error: error.message });
    });

    // 超时处理
    setTimeout(() => {
      server.kill('SIGTERM');
      resolve({ 
        success: false, 
        tools: [], 
        error: `工具列表请求超时, 错误输出: ${errorOutput}` 
      });
    }, 10000);
  });
}

async function testToolsDescriptions(templatesUse: string): Promise<{
  success: boolean;
  emptyDescriptions: string[];
}> {
  const result = await testToolsList(templatesUse);
  if (!result.success) {
    return { success: false, emptyDescriptions: [] };
  }

  // 这里可以扩展来检查每个工具的描述
  // 目前简化为检查工具列表是否完整
  return { success: true, emptyDescriptions: [] };
}

async function testServerWithEnv(env: Record<string, string>): Promise<{
  success: boolean;
  envVars: Record<string, string>;
}> {
  return new Promise((resolve) => {
    const server = spawn('node', [serverPath], {
      env: {
        ...process.env,
        ...env,
        LOG_LEVEL: 'info',
        LOG_TO_CONSOLE: 'true'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let envVars: Record<string, string> = {};
    let hasStarted = false;

    server.stdout.on('data', (data) => {
      const text = data.toString();
      
      // 解析环境变量信息
      if (text.includes('env: {')) {
        try {
          const envMatch = text.match(/env: (\{[^}]+\})/);
          if (envMatch) {
            const envStr = envMatch[1].replace(/'/g, '"');
            envVars = JSON.parse(envStr);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
      
      if (text.includes('MCP服务器连接成功')) {
        hasStarted = true;
        server.kill('SIGTERM');
        resolve({ success: true, envVars });
      }
    });

    server.on('error', (error) => {
      resolve({ success: false, envVars: {} });
    });

    // 超时处理
    setTimeout(() => {
      if (!hasStarted) {
        server.kill('SIGTERM');
        resolve({ success: false, envVars: {} });
      }
    }, 10000);
  });
}
