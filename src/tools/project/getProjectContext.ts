/**
 * 获取当前项目上下文信息工具
 * 用于让AI了解当前工作的项目环境和配置
 */

import { z } from "zod";
import { detectProject, getProjectDataDir } from "../../utils/projectDetector.js";
import { getServerInstance } from "../../utils/serverInstance.js";
import path from "path";
import fs from "fs/promises";

/**
 * 获取项目上下文的输入schema
 */
export const getProjectContextSchema = z.object({
  includeEnvVars: z.boolean().optional().default(false).describe("是否包含环境变量信息"),
  includeDataDir: z.boolean().optional().default(true).describe("是否包含数据目录信息"),
});

export type GetProjectContextInput = z.infer<typeof getProjectContextSchema>;

/**
 * 获取当前项目上下文信息
 * @param input 输入参数
 * @returns 项目上下文信息
 */
export async function getProjectContext(input: GetProjectContextInput) {
  try {
    const server = getServerInstance();
    const projectInfo = await detectProject();
    
    // 获取基础数据目录和项目特定目录
    const baseDataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
    const projectDataDir = await getProjectDataDir(baseDataDir);
    
    // 构建项目上下文信息
    const context: any = {
      project: {
        detected: !!projectInfo,
        info: projectInfo ? {
          id: projectInfo.id,
          source: projectInfo.source,
          path: projectInfo.path,
          rawName: projectInfo.rawName,
        } : null,
      },
      autoDetection: {
        enabled: process.env.PROJECT_AUTO_DETECT === 'true',
        method: projectInfo?.source || 'none',
      },
    };

    // 包含数据目录信息
    if (input.includeDataDir) {
      context.dataDirectory = {
        base: baseDataDir,
        project: projectDataDir,
        tasksFile: path.join(projectDataDir, "tasks.json"),
      };
      
      // 检查任务文件是否存在
      try {
        await fs.access(path.join(projectDataDir, "tasks.json"));
        context.dataDirectory.tasksFileExists = true;
      } catch {
        context.dataDirectory.tasksFileExists = false;
      }
    }

    // 包含环境变量信息（可选）
    if (input.includeEnvVars) {
      context.environment = {
        PROJECT_AUTO_DETECT: process.env.PROJECT_AUTO_DETECT || null,
        DATA_DIR: process.env.DATA_DIR || null,
        TEMPLATES_USE: process.env.TEMPLATES_USE || null,
      };
    }

    // 生成用户友好的摘要
    const summary = generateContextSummary(context);

    return {
      content: [
        {
          type: "text" as const,
          text: `# 🎯 当前项目上下文信息

${summary}

## 📋 详细信息

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

## 💡 说明

- **项目检测**: ${context.project.detected ? '✅ 成功' : '❌ 失败'}
- **数据隔离**: ${context.autoDetection.enabled ? '✅ 启用' : '❌ 禁用'}
- **任务存储**: \`${context.dataDirectory?.project || baseDataDir}\`

${context.project.detected ? 
  `当前工作在项目 **${context.project.info.rawName}** (ID: \`${context.project.info.id}\`)，任务将存储在独立的项目目录中。` :
  '⚠️ 未检测到项目信息，任务将存储在默认目录中。'
}`,
        },
      ],
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ 获取项目上下文失败: ${errorMsg}`,
        },
      ],
    };
  }
}

/**
 * 生成项目上下文摘要
 */
function generateContextSummary(context: any): string {
  const lines: string[] = [];
  
  if (context.project.detected) {
    lines.push(`**当前项目**: ${context.project.info.rawName} (${context.project.info.source})`);
    lines.push(`**项目ID**: \`${context.project.info.id}\``);
    lines.push(`**项目路径**: \`${context.project.info.path}\``);
  } else {
    lines.push(`**项目状态**: ⚠️ 未检测到项目`);
  }
  
  if (context.autoDetection) {
    lines.push(`**自动检测**: ${context.autoDetection.enabled ? '✅ 启用' : '❌ 禁用'}`);
    if (context.autoDetection.method !== 'none') {
      lines.push(`**检测方式**: ${context.autoDetection.method}`);
    }
  }
  
  if (context.dataDirectory) {
    lines.push(`**任务存储**: \`${context.dataDirectory.project}\``);
    lines.push(`**任务文件**: ${context.dataDirectory.tasksFileExists ? '✅ 存在' : '❌ 不存在'}`);
  }
  
  return lines.join('\n');
}
