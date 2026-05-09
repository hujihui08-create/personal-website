# AI 智能助手 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 后端 Repository 层实现
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 实现 `ChatSessionRepository`，负责会话的 CRUD 操作
  - 实现 `KnowledgeDocRepository`，负责知识库文档的 CRUD 及向量检索
- **Acceptance Criteria Addressed**: [AC-6, AC-7, AC-8]
- **Test Requirements**:
  - `programmatic` TR-1.1: `ChatSessionRepository` 可以创建、查询、更新会话
  - `programmatic` TR-1.2: `KnowledgeDocRepository` 可以创建、查询、删除文档
  - `programmatic` TR-1.3: `KnowledgeDocRepository` 可以通过向量相似度检索 Top-K 文档
- **Notes**: 使用 pgvector 进行向量相似度检索

## [ ] Task 2: 后端 Service 层 - 文档解析和 RAG
- **Priority**: P0
- **Depends On**: [Task 1]
- **Description**: 
  - 实现文档解析服务，支持 PDF、TXT、Markdown 格式
  - 实现文本分块服务（递归字符分割，512 tokens，重叠 50 tokens）
  - 实现 Embedding 服务（支持 OpenAI 和 Anthropic）
  - 实现 RAG 检索服务
- **Acceptance Criteria Addressed**: [AC-7, AC-8]
- **Test Requirements**:
  - `programmatic` TR-2.1: 可以解析 PDF 文档并提取文本
  - `programmatic` TR-2.2: 可以将文本分块为合适大小
  - `programmatic` TR-2.3: 可以生成文本的 embedding 向量
  - `programmatic` TR-2.4: 可以根据查询检索相关文档块
- **Notes**: 使用 Go 语言的 PDF 解析库（如 github.com/pdfcpu/pdfcpu）

## [ ] Task 3: 后端 Service 层 - LLM 对话
- **Priority**: P0
- **Depends On**: [Task 2]
- **Description**: 
  - 实现 LLM 客户端（支持 OpenAI 和 Anthropic）
  - 实现对话服务，包括意图识别、RAG 检索、回答生成
  - 实现 SSE 流式响应
  - 实现每日调用次数限制
- **Acceptance Criteria Addressed**: [AC-2, AC-3]
- **Test Requirements**:
  - `programmatic` TR-3.1: 可以调用 LLM API 生成回答
  - `programmatic` TR-3.2: 可以通过 SSE 流式返回数据
  - `programmatic` TR-3.3: 每日调用次数超过限制时返回错误
- **Notes**: 使用 Redis 存储每日调用计数

## [ ] Task 4: 后端 Handler 层实现
- **Priority**: P0
- **Depends On**: [Task 3]
- **Description**: 
  - 实现 Agent 对话 Handler（POST /api/agent/chat）
  - 实现历史记录 Handler（GET /api/agent/history）
  - 实现知识库管理 Handler（GET/POST/DELETE /api/knowledge, POST /api/knowledge/reindex）
- **Acceptance Criteria Addressed**: [AC-2, AC-6, AC-7, AC-8]
- **Test Requirements**:
  - `programmatic` TR-4.1: POST /api/agent/chat 返回 SSE 流式响应
  - `programmatic` TR-4.2: GET /api/agent/history 返回会话历史
  - `programmatic` TR-4.3: POST /api/knowledge 可以上传文档
  - `programmatic` TR-4.4: DELETE /api/knowledge/:id 可以删除文档
  - `programmatic` TR-4.5: POST /api/knowledge/reindex 可以重新索引所有文档
- **Notes**: 知识库管理接口需要认证

## [ ] Task 5: 后端 Router 配置
- **Priority**: P0
- **Depends On**: [Task 4]
- **Description**: 
  - 在 `router.go` 中注册 Agent 和 Knowledge 相关路由
- **Acceptance Criteria Addressed**: [AC-2, AC-6, AC-7, AC-8]
- **Test Requirements**:
  - `programmatic` TR-5.1: 所有 Agent 和 Knowledge 路由正常注册
- **Notes**: 知识库管理路由需要使用 AuthMiddleware

## [ ] Task 6: 前端 API 层实现
- **Priority**: P0
- **Depends On**: [Task 5]
- **Description**: 
  - 在 `frontend/src/api/` 下创建 `agent.ts` 和 `knowledge.ts`
  - 实现 SSE 客户端
- **Acceptance Criteria Addressed**: [AC-2, AC-3, AC-6, AC-7, AC-8]
- **Test Requirements**:
  - `programmatic` TR-6.1: API 函数正确封装后端接口
  - `programmatic` TR-6.2: SSE 客户端可以接收流式数据
- **Notes**: 遵循项目 API 层的现有风格

## [ ] Task 7: 前端类型定义
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 `frontend/src/types/index.ts` 中添加 Agent 和 Knowledge 相关类型
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-6]
- **Test Requirements**:
  - `programmatic` TR-7.1: 类型定义与后端模型一致
- **Notes**: 遵循项目类型定义的现有风格

## [ ] Task 8: 前端 Zustand Store
- **Priority**: P1
- **Depends On**: [Task 7]
- **Description**: 
  - 在 `frontend/src/stores/` 下创建 `agent.ts` store
  - 管理对话状态、会话历史
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `programmatic` TR-8.1: Store 正确管理对话状态
  - `programmatic` TR-8.2: 会话历史正确保存和恢复
- **Notes**: 遵循项目 store 的现有风格

## [ ] Task 9: 前端 Agent 页面实现
- **Priority**: P0
- **Depends On**: [Task 6, Task 8]
- **Description**: 
  - 实现完整的 Agent 对话界面
  - 包含消息列表、输入框、发送按钮、语音按钮
  - 实现推荐问题功能
  - 实现响应式布局（PC 和移动端）
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4, AC-9]
- **Test Requirements**:
  - `human-judgment` TR-9.1: 界面在 PC 端正常显示
  - `human-judgment` TR-9.2: 界面在移动端正常显示
  - `human-judgment` TR-9.3: 流式回答正常显示
  - `human-judgment` TR-9.4: 推荐问题可以点击
- **Notes**: 遵循项目设计规范，使用现有组件库

## [ ] Task 10: 前端语音输入功能
- **Priority**: P1
- **Depends On**: [Task 9]
- **Description**: 
  - 实现 Web Speech API 语音识别
  - 添加降级方案（不支持时隐藏语音按钮）
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `human-judgment` TR-10.1: 语音识别可以正常工作
  - `human-judgment` TR-10.2: 不支持的浏览器隐藏语音按钮
- **Notes**: 处理语音识别错误情况

## [ ] Task 11: 前端知识库管理页面
- **Priority**: P1
- **Depends On**: [Task 6]
- **Description**: 
  - 在管理后台添加知识库管理页面
  - 实现文档列表、上传、删除、重新索引功能
- **Acceptance Criteria Addressed**: [AC-7, AC-8]
- **Test Requirements**:
  - `human-judgment` TR-11.1: 页面正常显示
  - `programmatic` TR-11.2: 可以上传文档
  - `programmatic` TR-11.3: 可以删除文档
  - `programmatic` TR-11.4: 可以重新索引
- **Notes**: 页面放在 `/admin/knowledge` 路由

## [ ] Task 12: 前端导航更新
- **Priority**: P2
- **Depends On**: [Task 11]
- **Description**: 
  - 在管理后台侧边栏添加知识库管理入口
- **Acceptance Criteria Addressed**: [AC-7]
- **Test Requirements**:
  - `human-judgment` TR-12.1: 导航入口正常显示
- **Notes**: 遵循现有导航风格

## [ ] Task 13: 环境变量示例更新
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 更新 `.env.example`，添加 LLM 相关配置项
- **Acceptance Criteria Addressed**: [AC-9]
- **Test Requirements**:
  - `programmatic` TR-13.1: `.env.example` 包含所有必要配置
- **Notes**: 包含 OpenAI 和 Anthropic 的配置示例

## [ ] Task 14: 数据库初始化脚本更新
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 更新 `scripts/init-db.sql`，添加 pgvector 扩展和相关表
- **Acceptance Criteria Addressed**: [AC-7, AC-8]
- **Test Requirements**:
  - `programmatic` TR-14.1: SQL 脚本可以正常执行
- **Notes**: 包含向量索引创建

## [ ] Task 15: 集成测试
- **Priority**: P1
- **Depends On**: [Task 12]
- **Description**: 
  - 测试完整的对话流程
  - 测试知识库管理流程
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9]
- **Test Requirements**:
  - `programmatic` TR-15.1: 端到端对话流程正常
  - `programmatic` TR-15.2: 知识库管理流程正常
- **Notes**: 测试各种边缘情况
