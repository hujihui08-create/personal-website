# Step 7: AI智能助手（Agent）

## 7.1 功能概述

基于RAG的智能问答Agent，支持文字和语音输入，多Agent意图路由。

## 7.2 数据库表

```sql
-- 知识库文档表
CREATE TABLE knowledge_docs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agent会话表
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_knowledge_docs_embedding ON knowledge_docs 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
```

## 7.3 API设计

### 对话

```
POST   /api/agent/chat              # 发送消息（SSE流式响应）
GET    /api/agent/history           # 获取历史记录
```

**POST /api/agent/chat 请求：**
```json
{
  "message": "你的工作经验是什么？",
  "session_id": "uuid-xxx",
  "stream": true
}
```

**SSE流式响应：**
```
data: {"type": "thinking", "content": ""}
data: {"type": "chunk", "content": "我"}
data: {"type": "chunk", "content": "有"}
data: {"type": "chunk", "content": "5年"}
data: {"type": "chunk", "content": "的"}
data: {"type": "chunk", "content": "前端"}
data: {"type": "chunk", "content": "开发"}
data: {"type": "chunk", "content": "经验"}
data: {"type": "done", "session_id": "uuid-xxx"}
```

### 知识库管理（需登录）

```
GET    /api/knowledge               # 获取文档列表
POST   /api/knowledge               # 上传文档
DELETE /api/knowledge/:id           # 删除文档
POST   /api/knowledge/reindex       # 重新索引
```

## 7.4 Agent架构

```
用户输入（文字/语音）
       │
       ▼
┌─────────────────┐
│   语音识别       │  ← Web Speech API（前端）
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  意图识别层      │  ← LLM分类
│  ├─ 个人介绍类   │
│  ├─ 项目咨询类   │
│  ├─ 技术栈类     │
│  └─ 其他问题     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  RAG检索层       │  ← pgvector向量检索
│  1. 查询向量化   │
│  2. 相似度检索   │
│  3. Top-K文档块  │
│  4. 上下文组装   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  生成回答层      │  ← LLM生成（流式）
│  Prompt构建      │
│  流式输出(SSE)   │
│  保存会话历史   │
└─────────────────┘
```

## 7.5 RAG知识库

### 文档分块策略

| 参数 | 值 | 说明 |
|-----|-----|------|
| Chunk大小 | 512 tokens | 每个文档块大小 |
| 重叠窗口 | 50 tokens | 块间重叠，保持上下文 |
| 分割方式 | 递归字符分割 | 按段落→句子→字符递归 |
| Embedding模型 | text-embedding-3-small | OpenAI 1536维 |

### 知识库文档类型

| 类型 | 说明 |
|-----|------|
| 个人简历 | PDF/TXT，自动解析 |
| 项目文档 | Markdown/TXT |
| 技术文章 | Markdown/TXT |
| 自定义FAQ | JSON/CSV |

## 7.6 页面布局

### Agent页面 - PC端

```
┌─────────────────────────────────────────────────────────────────────┐
│  Logo      Home    Projects    Agent    Book                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  AI助手                                                     │  │
│   │                                                             │  │
│   │  ┌─────────────────────────────────────────────────────┐    │  │
│   │  │ 👤 你的工作经验是什么？                              │    │  │
│   │  └─────────────────────────────────────────────────────┘    │  │
│   │                                                             │  │
│   │  ┌─────────────────────────────────────────────────────┐    │  │
│   │  │ 🤖 我有5年的前端开发经验，曾在ABC科技担任高级       │    │  │
│   │  │ 前端工程师，负责核心产品架构设计...                   │    │  │
│   │  └─────────────────────────────────────────────────────┘    │  │
│   │                                                             │  │
│   │  推荐问题:                                                  │  │
│   │  [你的工作经验？] [擅长哪些框架？] [如何联系你？]          │  │
│   │                                                             │  │
│   │  ┌─────────────────────────────────┐  [🎤]  [发送]         │  │
│   │  │ 在这里输入你的问题...           │                       │  │
│   │  └─────────────────────────────────┘                       │  │
│   │                                                             │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent页面 - 移动端

```
┌─────────────────────────────┐
│  AI助手                     │
│                             │
│  ┌─────────────────────┐   │
│  │ 👤 你的工作经验？   │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 🤖 我有5年的前端... │   │
│  └─────────────────────┘   │
│                             │
│  [工作经验?] [技术栈?]     │
│                             │
├─────────────────────────────┤
│  [输入问题...]  [🎤] [发送]│
├─────────────────────────────┤
│  🏠    💼    💬    📅      │
└─────────────────────────────┘
```

### 管理后台 - 知识库管理

```
┌─────────────────────────────────────────────────────────────┐
│  管理后台 > 知识库                          [上传文档]       │
│                                     [重新索引全部文档]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  文档名                    大小     上传时间     操作       │
│  ─────────────────────────────────────────────────────      │
│  个人简历_2026.pdf          2.1MB   2026-05-01  [删除]     │
│  项目经验汇总.md            15KB    2026-05-01  [删除]     │
│  技术栈说明.md              8KB     2026-05-01  [删除]     │
│  FAQ.json                   3KB     2026-05-01  [删除]     │
│                                                             │
│  共4个文档，已索引4个                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 7.7 语音输入

### 前端实现（Web Speech API）

```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = 'zh-CN';
recognition.continuous = false;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setInputValue(transcript);
};
```

### 降级方案

- 不支持Web Speech API的浏览器：隐藏语音按钮
- 语音识别失败：显示错误提示，引导使用文字输入

## 7.8 LLM配置

| 配置项 | 值 |
|-------|-----|
| LLM服务商 | OpenAI / Claude |
| 模型 | GPT-4o-mini / Claude-3-Haiku |
| 最大Token | 2048 |
| 温度 | 0.7 |
| 流式输出 | SSE |
| 成本控制 | 每用户每天最多50次提问 |

## 7.9 验收标准

- [ ] Agent页面正常渲染
- [ ] 文字输入正常返回回答
- [ ] 流式输出正常显示
- [ ] 推荐问题可点击
- [ ] 语音输入正常工作（支持的浏览器）
- [ ] 会话历史正确保存
- [ ] 知识库文档上传正常
- [ ] 知识库重新索引正常
- [ ] 移动端全屏对话正常
