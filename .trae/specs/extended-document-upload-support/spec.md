# 扩展文档格式支持 - Product Requirement Document

## Overview
- **Summary**: 为知识库管理系统扩展支持 PDF、DOC、DOCX、XLS、XLSX 等常见办公文档格式的上传和解析功能，使用第三方文档解析库来提取文本内容用于 AI 问答。
- **Purpose**: 解决当前仅支持 TXT 和 MD 格式的局限性，让用户能够上传更丰富的文档格式，增强知识库内容。
- **Target Users**: 个人网站管理员，需要上传个人简历、项目文档、工作报告等各类文档到知识库。

## Goals
- 支持 PDF 文档格式的文本提取
- 支持 Word 文档（.doc, .docx）的文本提取
- 支持 Excel 文档（.xls, .xlsx）的文本提取
- 保持向后兼容现有的 TXT 和 MD 格式
- 提供清晰的错误提示和用户反馈

## Non-Goals (Out of Scope)
- 不实现文档预览功能
- 不实现文档编辑功能
- 不实现 OCR（光学字符识别）功能
- 不支持其他格式如 PPT、图片等

## Background & Context
当前系统仅支持纯文本（.txt）和 Markdown（.md）格式的文档解析，使用简单的 `io.ReadAll 读取文本内容。对于更复杂的文档格式，需要使用专门的文档解析库。

### 当前技术栈：
- 后端：Go 1.25, Gin 框架
- 前端：React 18, TypeScript
- 数据库：PostgreSQL + pgvector
- 已有的文档解析接口：`document_parser.go`

### 技术选型考虑：
- PDF 解析：使用 `github.com/ledongthuc/pdf` 或类似库
- Word 解析：使用适合的库解析 docx 格式
- Excel 解析：使用 Excel 库解析 xlsx 格式

## Functional Requirements
- **FR-1**: 支持 PDF 文档的上传和文本提取
- **FR-2**: 支持 DOCX 文档的上传和文本提取
- **FR-3**: 支持 XLSX 文档的上传和文本提取
- **FR-4**: 保持对现有 TXT 和 MD 格式的支持
- **FR-5**: 提供清晰的错误提示信息
- **FR-6**: 文件大小限制合理限制

## Non-Functional Requirements
- **NFR-1**: 文档解析时间应在合理时间内完成（小文件 < 5秒）
- **NFR-2**: 系统应能处理至少 10MB 大小的文档
- **NFR-3**: 保持 API 响应时间 < 30秒（文档解析和索引）
- **NFR-4**: 错误提示应该友好，提供清晰的错误信息

## Constraints
- **Technical**: Go 语言生态系统库的限制
- **Business**: 无
- **Dependencies**: 需要引入新的第三方 Go 文档解析库

## Assumptions
- 用户上传的文档主要是文本为主，不包含复杂的格式或加密文档
- 文档解析能够提取主要文本内容用于 AI 问答
- 用户能够接受某些复杂文档可能无法完美解析

## Acceptance Criteria

### AC-1: PDF 文档上传
- **Given**: 用户在知识库管理页面
- **When**: 用户上传一个有效的 PDF 文档（非空）
- **Then**: 文档成功上传，文本内容被提取并存储到数据库中，知识库列表中显示该文档
- **Verification**: `programmatic`
- **Notes**: 需要验证文本内容提取质量

### AC-2: DOCX 文档上传
- **Given**: 用户在知识库管理页面
- **When**: 用户上传一个有效的 DOCX 文档
- **Then**: 文档成功上传，文本内容被提取并存储到数据库中，知识库列表中显示该文档
- **Verification**: `programmatic`

### AC-3: XLSX 文档上传
- **Given**: 用户在知识库管理页面
- **When**: 用户上传一个有效的 XLSX 文档
- **Then**: 文档成功上传，文本内容被提取并存储到数据库中，知识库列表中显示该文档
- **Verification**: `programmatic`

### AC-4: 不支持的格式提示
- **Given**: 用户在知识库管理页面
- **When**: 用户尝试上传一个不支持的格式文档
- **Then**: 显示清晰的错误提示，告知用户支持的格式列表
- **Verification**: `human-judgment`

### AC-5: 向后兼容性
- **Given**: 系统更新后
- **When**: 用户上传之前支持的 TXT 或 MD 文档
- **Then**: 文档能正常上传和解析，功能与之前一致
- **Verification**: `programmatic`

### AC-6: 文件大小限制
- **Given**: 用户在知识库管理页面
- **When**: 用户尝试上传过大的文件（>10MB）
- **Then**: 显示文件过大的错误提示
- **Verification**: `programmatic`

### AC-7: 错误处理
- **Given**: 用户在知识库管理页面
- **When**: 上传的文档格式支持但解析失败
- **Then**: 显示友好的错误信息，告诉用户解析失败的原因
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要支持 .doc (旧版 Word) 格式？
- [ ] 文件大小限制具体设为多少合适？
- [ ] 是否需要支持压缩文件？
