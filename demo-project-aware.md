# 🎯 项目感知功能演示

## ✅ **功能已实现**

我们成功实现了 DATA_DIR 项目感知功能！现在不同的 IDE 会话或项目可以使用独立的 task.json 文件。

## 🔍 **项目检测结果**

```
📁 当前工作目录: C:\github\mcp-shrimp-task-manager
✅ 项目检测成功:
  - 项目ID: mcp-shrimp-task-manager
  - 检测来源: git
  - 项目路径: C:/github/mcp-shrimp-task-manager
  - 原始名称: mcp-shrimp-task-manager
```

## 📂 **数据目录结构**

### 禁用项目检测时（向后兼容）
```
DATA_DIR/
└── tasks.json
```

### 启用项目检测时
```
DATA_DIR/
├── projects/
│   └── mcp-shrimp-task-manager/
│       ├── tasks.json
│       ├── memory/
│       └── WebGUI.md
└── tasks.json (legacy, 向后兼容)
```

## ⚙️ **配置方式**

### 1. 环境变量配置

在 `.env` 文件中添加：

```bash
# 启用项目自动检测
PROJECT_AUTO_DETECT=true

# 可选：手动指定项目名称
PROJECT_NAME=my-custom-project
```

### 2. MCP 配置

在 Cursor 的 `mcp.json` 中：

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/path/to/global/data",
        "PROJECT_AUTO_DETECT": "true",
        "TEMPLATES_USE": "en",
        "ENABLE_GUI": "false"
      }
    }
  }
}
```

## 🎯 **使用场景**

### 场景1：多项目开发
```bash
# 项目A
cd /path/to/project-a
# 任务存储在: DATA_DIR/projects/project-a/tasks.json

# 项目B  
cd /path/to/project-b
# 任务存储在: DATA_DIR/projects/project-b/tasks.json
```

### 场景2：Git 仓库自动识别
- 自动使用 Git 仓库名称作为项目标识符
- 支持嵌套仓库和子模块

### 场景3：Node.js 项目识别
- 自动读取 `package.json` 中的 `name` 字段
- 支持 monorepo 结构

## 🔧 **检测优先级**

1. **环境变量 PROJECT_NAME**（最高优先级）
2. **Git 仓库名称**
3. **package.json 中的 name 字段**
4. **当前工作目录名称**（最低优先级）

## 🛡️ **向后兼容性**

- **默认禁用**: `PROJECT_AUTO_DETECT=false`
- **现有用户**: 无需任何配置变更
- **数据安全**: 不会影响现有的任务数据
- **渐进式启用**: 可以逐步为不同项目启用

## 🚀 **立即使用**

1. **更新代码**: 已在 `feature/project-aware-data-dir` 分支
2. **编译项目**: `npm run build`
3. **配置环境**: 在 `.env` 中设置 `PROJECT_AUTO_DETECT=true`
4. **享受隔离**: 每个项目的任务数据自动分离！

## 📋 **测试验证**

运行测试脚本验证功能：
```bash
node test-project-detection.js
```

功能完全正常工作！🎉
