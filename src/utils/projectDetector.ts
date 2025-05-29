/**
 * 项目检测工具
 * 自动检测当前工作项目的名称和信息
 */

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Root } from "@modelcontextprotocol/sdk/types.js";
import { getServerInstance } from "./serverInstance.js";

const execPromise = promisify(exec);

/**
 * 项目信息接口
 */
export interface ProjectInfo {
  /** 项目标识符 */
  id: string;
  /** 检测来源 */
  source: 'env' | 'git' | 'package' | 'directory';
  /** 项目路径 */
  path: string;
  /** 原始名称（未清理） */
  rawName?: string;
}

/**
 * 项目检测缓存
 */
let projectCache: ProjectInfo | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30秒缓存

/**
 * MCP roots信息缓存
 */
let rootsCache: Root[] | null = null;
let rootsCacheTimestamp = 0;
const ROOTS_CACHE_DURATION = 30000; // 30秒缓存

/**
 * 清理项目ID中的特殊字符
 * @param name 原始项目名称
 * @returns 清理后的项目ID
 */
function sanitizeProjectId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50); // 限制长度
}

/**
 * 查找Git仓库根目录
 * @param startPath 开始搜索的路径
 * @returns Git仓库根目录路径，如果未找到返回null
 */
async function findGitRoot(startPath: string): Promise<string | null> {
  try {
    const { stdout } = await execPromise('git rev-parse --show-toplevel', {
      cwd: startPath,
      timeout: 5000
    });
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

/**
 * 查找package.json文件
 * @param startPath 开始搜索的路径
 * @returns package.json信息，如果未找到返回null
 */
async function findPackageJson(startPath: string): Promise<{ name?: string; path: string } | null> {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;

  while (currentPath !== root) {
    const packageJsonPath = path.join(currentPath, 'package.json');
    
    try {
      await fs.access(packageJsonPath);
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageData = JSON.parse(content);
      
      return {
        name: packageData.name,
        path: currentPath
      };
    } catch (error) {
      // 继续向上查找
      currentPath = path.dirname(currentPath);
    }
  }

  return null;
}

/**
 * 检测当前项目信息
 * @param workingDir 工作目录，默认为process.cwd()
 * @param server MCP服务器实例，用于获取roots信息
 * @returns 项目信息，如果检测失败返回null
 */
export async function detectProject(workingDir?: string, server?: Server): Promise<ProjectInfo | null> {
  let cwd = workingDir || process.cwd();
  const now = Date.now();

  // 如果提供了server，尝试从roots获取工作目录
  if (server) {
    try {
      const roots = await getRootsFromClient(server);
      if (roots.length > 0) {
        const primaryRoot = roots[0];
        // 将URI转换为本地路径
        const rootPath = new URL(primaryRoot.uri).pathname;
        // 在Windows上，需要移除开头的斜杠
        const normalizedPath = process.platform === 'win32' && rootPath.startsWith('/')
          ? rootPath.substring(1)
          : rootPath;
        cwd = normalizedPath;
        console.log(`🔍 Using root path from MCP client: ${cwd}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to get roots information, falling back to working directory:', error);
    }
  }

  // 检查缓存
  if (projectCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return projectCache;
  }

  try {
    let projectInfo: ProjectInfo | null = null;

    // 1. Git 仓库检测（优先级最高）
    const gitRoot = await findGitRoot(cwd);
    if (gitRoot) {
      const rawName = path.basename(gitRoot);
      projectInfo = {
        id: sanitizeProjectId(rawName),
        source: 'git',
        path: gitRoot,
        rawName
      };
      console.log(`✅ Project detected from Git repository: ${rawName} (${gitRoot})`);
    }

    // 2. package.json 检测
    if (!projectInfo) {
      const packageInfo = await findPackageJson(cwd);
      if (packageInfo?.name) {
        projectInfo = {
          id: sanitizeProjectId(packageInfo.name),
          source: 'package',
          path: packageInfo.path,
          rawName: packageInfo.name
        };
      }
    }

    // 4. 工作目录名称（最后的回退选项）
    if (!projectInfo) {
      const rawName = path.basename(cwd);
      projectInfo = {
        id: sanitizeProjectId(rawName),
        source: 'directory',
        path: cwd,
        rawName
      };
    }

    // 更新缓存
    projectCache = projectInfo;
    cacheTimestamp = now;

    return projectInfo;
  } catch (error) {
    console.error('Project detection failed:', error);
    return null;
  }
}

/**
 * 清除项目检测缓存
 */
export function clearProjectCache(): void {
  projectCache = null;
  cacheTimestamp = 0;
}

/**
 * 从MCP客户端获取roots信息
 * @param server MCP服务器实例
 * @returns roots信息数组
 */
export async function getRootsFromClient(server: Server): Promise<Root[]> {
  const now = Date.now();

  // 检查缓存有效性
  if (rootsCache && (now - rootsCacheTimestamp) < ROOTS_CACHE_DURATION) {
    return rootsCache;
  }

  try {
    // 使用MCP SDK的listRoots方法获取roots信息
    const result = await server.listRoots();
    rootsCache = result.roots;
    rootsCacheTimestamp = now;

    console.log(`Retrieved ${rootsCache.length} roots from MCP client`);
    return rootsCache;
  } catch (error) {
    console.warn('Failed to get roots from MCP client:', error);
    // 返回空数组作为fallback
    return [];
  }
}

/**
 * 清除roots缓存
 */
export function clearRootsCache(): void {
  rootsCache = null;
  rootsCacheTimestamp = 0;
}

/**
 * 获取项目特定的数据目录路径
 * @param baseDataDir 基础数据目录
 * @param workingDir 工作目录
 * @returns 项目特定的数据目录路径
 */
export async function getProjectDataDir(baseDataDir: string, workingDir?: string): Promise<string> {
  // 检查是否启用项目检测
  const autoDetect = process.env.PROJECT_AUTO_DETECT === 'true';

  if (!autoDetect) {
    return baseDataDir; // 向后兼容，保持原有行为
  }

  // 获取全局server实例
  const server = getServerInstance();
  const projectInfo = await detectProject(workingDir, server || undefined);

  if (projectInfo) {
    return path.join(baseDataDir, 'projects', projectInfo.id);
  }

  // 如果检测失败，回退到原有行为
  return baseDataDir;
}
