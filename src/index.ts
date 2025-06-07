/**
 * MCP Shrimp Task Manager - 主入口文件
 * 简化的应用程序启动器，使用模块化架构
 */

import "dotenv/config";
import { ApplicationBootstrap } from "./core/ApplicationBootstrap.js";

async function main() {
  try {
    // 创建并启动应用程序
    const app = new ApplicationBootstrap();
    await app.start();
  } catch (error) {
    console.error("应用程序启动失败:", error);
    process.exit(1);
  }
}

// 启动应用程序
main().catch(console.error);