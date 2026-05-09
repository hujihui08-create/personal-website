# AI 智能助手 - Verification Checklist

## 后端功能检查
- [ ] ChatSessionRepository 实现完整，可以创建、查询、更新会话
- [ ] KnowledgeDocRepository 实现完整，可以 CRUD 文档和向量检索
- [ ] 文档解析服务支持 PDF、TXT、Markdown 格式
- [ ] 文本分块服务正常工作（512 tokens，重叠 50 tokens）
- [ ] Embedding 服务支持 OpenAI 和 Anthropic
- [ ] RAG 检索服务可以找到相关文档块
- [ ] LLM 客户端可以调用 API 生成回答
- [ ] SSE 流式响应正常工作
- [ ] 每日调用次数限制正常工作
- [ ] Agent Handler 实现完整（/api/agent/chat 和 /api/agent/history）
- [ ] Knowledge Handler 实现完整（知识库管理接口）
- [ ] Router 配置正确，所有路由正常注册
- [ ] 数据库初始化脚本包含 pgvector 扩展和相关表
- [ ] 环境变量示例包含所有 LLM 配置项

## 前端功能检查
- [ ] API 层（agent.ts 和 knowledge.ts）实现完整
- [ ] SSE 客户端可以接收流式数据
- [ ] 类型定义与后端模型一致
- [ ] Agent Store 正确管理对话状态和会话历史
- [ ] Agent 页面在 PC 端正常显示
- [ ] Agent 页面在移动端正常显示
- [ ] 文字输入可以正常发送并接收回答
- [ ] 流式回答逐字显示
- [ ] 推荐问题可以点击并发送
- [ ] 语音输入在支持的浏览器中正常工作
- [ ] 不支持语音的浏览器隐藏语音按钮
- [ ] 刷新页面后会话历史正确恢复
- [ ] 知识库管理页面正常显示
- [ ] 可以上传知识库文档
- [ ] 可以删除知识库文档
- [ ] 可以重新索引知识库
- [ ] 管理后台导航包含知识库管理入口

## 集成测试检查
- [ ] 完整对话流程正常工作
- [ ] 知识库管理流程正常工作
- [ ] 端到端测试通过

## 代码质量检查
- [ ] 遵循项目命名规范
- [ ] 遵循项目代码风格
- [ ] 遵循项目设计规范
- [ ] 无 TypeScript 类型错误
- [ ] 无 Go 编译错误
