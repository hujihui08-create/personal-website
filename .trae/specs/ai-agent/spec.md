# AI 智能助手 - Product Requirement Document

## Overview
- **Summary**: 构建一个基于 RAG 的智能问答 Agent，支持文字和语音输入，通过 LLM 提供关于个人简历、项目经验、技术栈等信息的回答，并支持管理员后台管理知识库文档。
- **Purpose**: 为访客提供智能对话服务，快速了解个人背景和项目经验，同时为管理员提供便捷的知识库管理功能。
- **Target Users**: 网站访客（使用 Agent 对话）和网站管理员（管理知识库）。

## Goals
- 实现基于 RAG 的智能问答功能
- 支持文字和语音输入
- 提供 SSE 流式响应
- 实现知识库文档管理（上传、删除、重新索引）
- 支持 LLM 配置在后台调整
- 实现会话历史保存

## Non-Goals (Out of Scope)
- 不实现多轮对话的高级上下文管理（仅保存历史记录）
- 不实现复杂的 Agent 工具调用
- 不实现用户账号系统（访客无需登录即可使用 Agent）

## Background & Context
- 项目已有基础模型：`ChatSession` 和 `KnowledgeDoc`
- 项目已有 LLM 配置结构：`LLMConfig`
- 技术栈：React + TypeScript + Gin + PostgreSQL + Redis
- 文档位于：`portfolio-docs/07-AI智能助手Agent.md`

## Functional Requirements
- **FR-1**: 用户可以通过文字输入与 Agent 对话
- **FR-2**: 用户可以通过语音输入与 Agent 对话（使用 Web Speech API）
- **FR-3**: Agent 回答以 SSE 流式方式显示
- **FR-4**: 用户可以查看推荐问题并点击快速提问
- **FR-5**: 会话历史自动保存
- **FR-6**: 管理员可以上传知识库文档
- **FR-7**: 管理员可以删除知识库文档
- **FR-8**: 管理员可以重新索引知识库
- **FR-9**: LLM 配置可通过环境变量调整

## Non-Functional Requirements
- **NFR-1**: 响应时间：首字响应 < 3 秒
- **NFR-2**: 可用性：Agent 页面在所有主流浏览器正常显示
- **NFR-3**: 成本控制：每用户每日最多 50 次提问
- **NFR-4**: 响应式：支持 PC 和移动端

## Constraints
- **Technical**: 使用已有的技术栈（React + TypeScript + Gin + PostgreSQL）
- **Business**: LLM API Key 通过环境变量配置，不提交到代码库
- **Dependencies**: OpenAI 或 Anthropic API 服务

## Assumptions
- PostgreSQL 已安装 pgvector 扩展
- LLM API Key 已配置
- MinIO 用于存储上传的文档
- 支持的文档格式：PDF、TXT、Markdown

## Acceptance Criteria

### AC-1: Agent 页面正常渲染
- **Given**: 用户访问 /agent 页面
- **When**: 页面加载完成
- **Then**: 对话界面正常显示，包含输入框、发送按钮、语音按钮和推荐问题
- **Verification**: `human-judgment`

### AC-2: 文字输入正常返回回答
- **Given**: 用户在 Agent 页面
- **When**: 用户输入文字问题并点击发送
- **Then**: Agent 返回基于知识库的回答
- **Verification**: `programmatic`

### AC-3: 流式输出正常显示
- **Given**: Agent 正在生成回答
- **When**: 服务器发送 SSE 数据
- **Then**: 回答逐字显示在界面上
- **Verification**: `human-judgment`

### AC-4: 推荐问题可点击
- **Given**: 用户在 Agent 页面
- **When**: 用户点击推荐问题
- **Then**: 该问题自动填入输入框并发送
- **Verification**: `human-judgment`

### AC-5: 语音输入正常工作
- **Given**: 浏览器支持 Web Speech API
- **When**: 用户点击语音按钮并说话
- **Then**: 语音识别结果填入输入框
- **Verification**: `human-judgment`

### AC-6: 会话历史正确保存
- **Given**: 用户已进行对话
- **When**: 用户刷新页面
- **Then**: 之前的对话历史正确显示
- **Verification**: `programmatic`

### AC-7: 知识库文档上传正常
- **Given**: 管理员已登录
- **When**: 管理员上传文档
- **Then**: 文档被正确解析、分块、向量化并存储
- **Verification**: `programmatic`

### AC-8: 知识库重新索引正常
- **Given**: 管理员已登录
- **When**: 管理员点击重新索引
- **Then**: 所有知识库文档被重新向量化
- **Verification**: `programmatic`

### AC-9: 移动端全屏对话正常
- **Given**: 用户使用移动设备
- **When**: 访问 Agent 页面
- **Then**: 界面适配移动端，体验良好
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要支持更多文档格式（如 Word、Excel）？
- [ ] 是否需要实现对话清理功能？
- [ ] 是否需要显示 Agent 的思考过程？
