// 任務狀態枚舉：定義任務在工作流程中的當前階段
export enum TaskStatus {
  PENDING = "pending", // 已創建但尚未開始執行的任務
  IN_PROGRESS = "in_progress", // 當前正在執行的任務
  COMPLETED = "completed", // 已成功完成並通過驗證的任務
  BLOCKED = "blocked", // 由於依賴關係而暫時無法執行的任務
}

// 任務依賴關係：定義任務之間的前置條件關係
export interface TaskDependency {
  taskId: string; // 前置任務的唯一標識符，當前任務執行前必須完成此依賴任務
}

// 相關文件類型：定義文件與任務的關係類型
export enum RelatedFileType {
  TO_MODIFY = "TO_MODIFY", // 需要在任務中修改的文件
  REFERENCE = "REFERENCE", // 任務的參考資料或相關文檔
  CREATE = "CREATE", // 需要在任務中建立的文件
  DEPENDENCY = "DEPENDENCY", // 任務依賴的組件或庫文件
  OTHER = "OTHER", // 其他類型的相關文件
}

// 相關文件：定義任務相關的文件信息
export interface RelatedFile {
  path: string; // 文件路徑，可以是相對於項目根目錄的路徑或絕對路徑
  type: RelatedFileType; // 文件與任務的關係類型
  description?: string; // 文件的補充描述，說明其與任務的具體關係或用途
  lineStart?: number; // 相關代碼區塊的起始行（選填）
  lineEnd?: number; // 相關代碼區塊的結束行（選填）
}

// 任務介面：定義任務的完整數據結構
export interface Task {
  id: string; // 任務的唯一標識符
  name: string; // 簡潔明確的任務名稱
  description: string; // 詳細的任務描述，包含實施要點和驗收標準
  notes?: string; // 補充說明、特殊處理要求或實施建議（選填）
  status: TaskStatus; // 任務當前的執行狀態
  dependencies: TaskDependency[]; // 任務的前置依賴關係列表
  priority?: number; // 任務優先級 (1-10，數字越大優先級越高)
  urgency?: 'low' | 'medium' | 'high' | 'critical'; // 任務緊急程度
  createdAt: Date; // 任務創建的時間戳
  updatedAt: Date; // 任務最後更新的時間戳
  completedAt?: Date; // 任務完成的時間戳（僅適用於已完成的任務）
  summary?: string; // 任務完成摘要，簡潔描述實施結果和重要決策（僅適用於已完成的任務）
  relatedFiles?: RelatedFile[]; // 與任務相關的文件列表（選填）

  // 新增欄位：保存完整的技術分析結果
  analysisResult?: string; // 來自 analyze_task 和 reflect_task 階段的完整分析結果

  // 新增欄位：保存具體的實現指南
  implementationGuide?: string; // 具體的實現方法、步驟和建議

  // 新增欄位：保存驗證標準和檢驗方法
  verificationCriteria?: string; // 明確的驗證標準、測試要點和驗收條件
}

// 任務複雜度級別：定義任務的複雜程度分類
export enum TaskComplexityLevel {
  LOW = "低複雜度", // 簡單且直接的任務，通常不需要特殊處理
  MEDIUM = "中等複雜度", // 具有一定複雜性但仍可管理的任務
  HIGH = "高複雜度", // 複雜且耗時的任務，需要特別關注
  VERY_HIGH = "極高複雜度", // 極其複雜的任務，建議拆分處理
}

// 任務複雜度閾值：定義任務複雜度評估的參考標準
export const TaskComplexityThresholds = {
  DESCRIPTION_LENGTH: {
    MEDIUM: 500, // 超過此字數判定為中等複雜度
    HIGH: 1000, // 超過此字數判定為高複雜度
    VERY_HIGH: 2000, // 超過此字數判定為極高複雜度
  },
  DEPENDENCIES_COUNT: {
    MEDIUM: 2, // 超過此依賴數量判定為中等複雜度
    HIGH: 5, // 超過此依賴數量判定為高複雜度
    VERY_HIGH: 10, // 超過此依賴數量判定為極高複雜度
  },
  NOTES_LENGTH: {
    MEDIUM: 200, // 超過此字數判定為中等複雜度
    HIGH: 500, // 超過此字數判定為高複雜度
    VERY_HIGH: 1000, // 超過此字數判定為極高複雜度
  },
};

// 任務複雜度評估結果：記錄任務複雜度分析的詳細結果
export interface TaskComplexityAssessment {
  level: TaskComplexityLevel; // 整體複雜度級別
  metrics: {
    // 各項評估指標的詳細數據
    descriptionLength: number; // 描述長度
    dependenciesCount: number; // 依賴數量
    notesLength: number; // 注記長度
    hasNotes: boolean; // 是否有注記
  };
  recommendations: string[]; // 處理建議列表
}

// ===== 增强 Prompt 系统类型定义 =====

// Prompt 分类：定义 prompt 的分类信息
export interface PromptCategory {
  id: string; // 分类的唯一标识符
  name: {
    en: string; // 英文名称
    zh: string; // 中文名称
  };
  description: {
    en: string; // 英文描述
    zh: string; // 中文描述
  };
  prompts: string[]; // 该分类下的 prompt 列表
  enabled: boolean; // 是否启用该分类
}

// 链式执行步骤：定义链式 prompt 中的单个步骤
export interface ChainStep {
  promptId: string; // 步骤使用的 prompt ID
  stepName: string; // 步骤名称
  category?: string; // 所属分类（可选）
  inputMapping?: Record<string, string>; // 输入参数映射
  outputMapping?: Record<string, string>; // 输出参数映射
  retryCount?: number; // 重试次数（可选）
  timeout?: number; // 超时时间（可选）
}

// 链式 Prompt：定义完整的链式执行流程
export interface ChainPrompt {
  id: string; // 链式 prompt 的唯一标识符
  name: {
    en: string; // 英文名称
    zh: string; // 中文名称
  };
  description: {
    en: string; // 英文描述
    zh: string; // 中文描述
  };
  steps: ChainStep[]; // 执行步骤列表
  enabled: boolean; // 是否启用
}

// AI 提供商：定义 AI 服务提供商的基本信息
export interface AIProvider {
  id: string; // 提供商唯一标识符
  name: string; // 提供商名称
  apiEndpoint: string; // API 端点
  models: {
    main: string; // 主要模型
    research: string; // 研究模型
    fallback: string; // 备用模型
  };
  capabilities: string[]; // 支持的功能列表
  costPerToken: number; // 每 token 成本
  maxTokens: number; // 最大 token 数
  enabled: boolean; // 是否启用
}

// Prompt 配置：定义整个 prompt 系统的配置
export interface PromptConfig {
  version: string; // 配置版本
  description: string; // 配置描述
  categories: Record<string, PromptCategory>; // 分类配置
  chains: Record<string, ChainPrompt>; // 链式 prompt 配置
  settings: {
    defaultLanguage: string; // 默认语言
    enableHotReload: boolean; // 是否启用热重载
    cacheEnabled: boolean; // 是否启用缓存
    maxCacheSize: number; // 最大缓存大小
    loadingStrategy: 'eager' | 'lazy'; // 加载策略
  };
}

// 导出任务记忆相关类型
export * from './taskMemory.js';
