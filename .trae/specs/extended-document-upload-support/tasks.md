# 扩展文档格式支持 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 添加第三方文档解析库依赖
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 研究并选择适合的 Go 语言文档解析库
  - 添加 PDF 解析库依赖 (如 github.com/ledongthuc/pdf)
  - 添加 Word (DOCX) 解析库依赖
  - 添加 Excel (XLSX) 解析库依赖
  - 更新 go.mod 并运行 go mod tidy
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-1.1: 新依赖库能成功导入和编译
  - `human-judgement` TR-1.2: 选择的库适合项目需求，文档齐全
- **Notes**: 优先选择活跃维护、文档完善的库

## [x] Task 2: 实现 PDF 文档解析功能
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在 document_parser.go 中添加 parsePDF 函数
  - 使用 PDF 解析库从文件中提取文本内容
  - 处理简单的中文文本
  - 添加必要的错误处理
- **Acceptance Criteria Addressed**: AC-1, AC-5
- **Test Requirements**:
  - `programmatic` TR-2.1: 能成功解析简单的 PDF 文档
  - `programmatic` TR-2.2: 返回的文本内容非空
  - `human-judgement` TR-2.3: 解析的文本质量合理，包含主要内容

## [x] Task 3: 实现 DOCX 文档解析功能
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在 document_parser.go 中添加 parseDOCX 函数
  - 使用 Word 解析库从 DOCX 文件中提取文本内容
  - 处理表格和列表等常见元素
  - 添加必要的错误处理
- **Acceptance Criteria Addressed**: AC-2, AC-5
- **Test Requirements**:
  - `programmatic` TR-3.1: 能成功解析简单的 DOCX 文档
  - `programmatic` TR-3.2: 返回的文本内容非空
  - `human-judgement` TR-3.3: 解析的文本质量合理

## [x] Task 4: 实现 XLSX 文档解析功能
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在 document_parser.go 中添加 parseXLSX 函数
  - 使用 Excel 解析库从 XLSX 文件中提取文本内容
  - 将表格内容转换为可读文本格式
  - 添加必要的错误处理
- **Acceptance Criteria Addressed**: AC-3, AC-5
- **Test Requirements**:
  - `programmatic` TR-4.1: 能成功解析简单的 XLSX 文档
  - `programmatic` TR-4.2: 返回的文本内容非空
  - `human-judgement` TR-4.3: 表格数据转换为可读格式

## [x] Task 5: 更新 Parse 函数支持新格式
- **Priority**: P0
- **Depends On**: Task 2, Task 3, Task 4
- **Description**: 
  - 更新 document_parser.go 的 Parse 函数
  - 添加 .pdf、.docx、.xlsx 格式的 case
  - 调用对应的解析函数
  - 保持对 .txt 和 .md 的现有支持
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-5
- **Test Requirements**:
  - `programmatic` TR-5.1: Parse 函数能正确路由到对应解析器
  - `programmatic` TR-5.2: 旧格式 .txt 和 .md 仍然正常工作
  - `programmatic` TR-5.3: 新格式能被正确识别

## [x] Task 6: 添加文件大小验证
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 在 knowledge.go 中添加上传前的文件大小检查
  - 设置合理的文件大小限制（如 10MB）
  - 超出限制时返回友好的错误提示
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-6.1: 超过大小限制的文件会被拒绝
  - `programmatic` TR-6.2: 返回正确的错误信息
  - `human-judgement` TR-6.3: 错误提示清晰易懂

## [x] Task 7: 改进错误处理和用户反馈
- **Priority**: P1
- **Depends On**: Task 5
- **Description**: 
  - 在解析失败时提供更具体的错误信息
  - 在前端显示友好的错误提示
  - 添加日志记录以便调试
- **Acceptance Criteria Addressed**: AC-4, AC-7
- **Test Requirements**:
  - `programmatic` TR-7.1: 错误状态码正确
  - `human-judgement` TR-7.2: 错误提示清晰友好
  - `human-judgement` TR-7.3: 错误信息包含有用的建议

## [x] Task 8: 更新前端支持提示
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 更新前端页面的文件格式提示
  - 确保前端 accept 属性包含所有新支持的格式
  - 优化用户体验
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgement` TR-8.1: 前端正确显示支持的格式列表
  - `programmatic` TR-8.2: 文件选择器只允许支持的格式
