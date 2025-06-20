获取和管理AI生成文档的存储路径。此工具提供简单的接口供AI调用，确保所有文档创建操作都使用正确的项目特定路径。

## 🎯 核心功能

- **路径获取**: 获取项目特定的文档存储路径
- **路径验证**: 验证文件名和子目录名的安全性
- **目录创建**: 自动创建必要的目录结构
- **错误处理**: 提供详细的错误信息和调试建议

## 📁 路径结构

此工具基于统一的项目数据目录结构：

```
$DATA_DIR/projects/$PROJECT_NAME/
├── tasks.json             # 项目任务
├── memory/                # AI记忆存储
├── logs/                  # 项目日志
├── config/                # 项目配置
└── docs/                  # 文档存储 ← 此工具管理的目录
    ├── analysis/          # 分析文档
    ├── reflection/        # 反思文档
    ├── research/          # 研究文档
    └── summary/           # 总结文档
```

## 🔧 使用场景

- **分析文档**: 存储项目分析和技术调研文档
- **反思总结**: 保存任务执行后的反思和总结
- **研究记录**: 记录研究过程和发现
- **团队协作**: 生成团队共享的文档资料

## 💡 最佳实践

1. **使用子目录**: 通过 `subDir` 参数组织不同类型的文档
2. **规范命名**: 使用清晰的文件名，避免特殊字符
3. **自动创建**: 保持 `createDir: true` 以确保目录结构完整

## ⚠️ 安全特性

- 文件名安全验证，防止路径遍历攻击
- 系统保留名称检查（Windows兼容）
- 文件名长度限制
- 子目录名安全验证

**使用说明：** 在创建任何项目文档之前，请使用此工具获取正确的存储路径，确保文档统一管理和项目隔离。
