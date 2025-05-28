#!/usr/bin/env node

/**
 * 测试项目检测功能
 */

import { detectProject, getProjectDataDir } from './dist/utils/projectDetector.js';
import path from 'path';

async function testProjectDetection() {
  console.log('🔍 测试项目检测功能...\n');

  try {
    // 测试1: 检测当前项目
    console.log('📁 当前工作目录:', process.cwd());
    const projectInfo = await detectProject();
    
    if (projectInfo) {
      console.log('✅ 项目检测成功:');
      console.log('  - 项目ID:', projectInfo.id);
      console.log('  - 检测来源:', projectInfo.source);
      console.log('  - 项目路径:', projectInfo.path);
      console.log('  - 原始名称:', projectInfo.rawName);
    } else {
      console.log('❌ 项目检测失败');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试2: 测试数据目录生成
    const baseDataDir = './test-data';
    
    console.log('📂 测试数据目录生成:');
    console.log('  - 基础数据目录:', baseDataDir);
    
    // 禁用项目检测
    process.env.PROJECT_AUTO_DETECT = 'false';
    const dataDir1 = await getProjectDataDir(baseDataDir);
    console.log('  - 禁用项目检测时:', dataDir1);
    
    // 启用项目检测
    process.env.PROJECT_AUTO_DETECT = 'true';
    const dataDir2 = await getProjectDataDir(baseDataDir);
    console.log('  - 启用项目检测时:', dataDir2);

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试3: 测试手动项目名称
    console.log('🏷️  测试手动项目名称:');
    process.env.PROJECT_NAME = 'my-custom-project';
    const dataDir3 = await getProjectDataDir(baseDataDir);
    console.log('  - 手动设置项目名称时:', dataDir3);
    
    // 清理环境变量
    delete process.env.PROJECT_NAME;
    delete process.env.PROJECT_AUTO_DETECT;

    console.log('\n✅ 测试完成!');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testProjectDetection();
