# 作品展示功能 - Product Requirement Document

## Overview
- **Summary**: 根据 `portfolio-docs/04-作品展示.md` 开发作品展示功能，包括后端API、数据库模型、前端页面，以及首页精选作品展示
- **Purpose**: 提供完整的作品展示和管理功能，让访客能够查看企业项目和个人项目，支持分类筛选、详情查看，管理员可以后台管理作品
- **Target Users**: 网站访客（查看作品）、管理员（管理作品）

## Goals
- 后端实现完整的 Project 模型和 API 接口
- 前端实现作品列表页、作品详情页
- 首页添加精选作品展示模块
- 后台实现作品管理功能（创建、编辑、删除、排序）
- 与现有系统架构和设计规范保持一致

## Non-Goals (Out of Scope)
- AI 助手功能（已有单独规划）
- 预约功能（已有单独规划）
- 支付功能

## Background & Context
- 项目已使用 Go + Gin + GORM + PostgreSQL 作为后端技术栈
- 前端使用 React + TypeScript + Vite + Tailwind CSS
- 已有类似的 WorkExperience 模块可作为参考实现
- 项目已有基础的 Project 模型已存在但需要更新
- 项目设计规范和组件规范已完整

## Functional Requirements
- **FR-1**: 后端实现 Project 完整模型（符合 04-作品展示.md 要求）
- **FR-2**: 后端实现 Project API（GET /api/projects, GET /api/projects/:id, POST/PUT/DELETE /api/projects）
- **FR-3**: 前端实现作品列表页（支持分类筛选、分页）
- **FR-4**: 前端实现作品详情页（图片轮播、详情展示）
- **FR-5**: 首页添加精选作品展示模块（可跳转详情页）
- **FR-6**: 后台实现作品管理页面（CRUD + 排序）

## Non-Functional Requirements
- **NFR-1**: 响应式设计，适配移动端和桌面端
- **NFR-2**: 遵循现有设计规范和组件规范
- **NFR-3**: 符合项目命名和代码规范
- **NFR-4**: 与现有系统的 API 响应格式保持一致

## Constraints
- **Technical**: 必须使用现有技术栈（Go + Gin + GORM + React + TypeScript + Tailwind CSS
- **Business**: 严格按照 portfolio-docs/04-作品展示.md 文档要求开发
- **Dependencies**: 依赖现有 MinIO 文件上传系统、JWT 认证系统

## Assumptions
- 文件上传功能已实现（file.go handler）
- JWT 认证已实现
- 数据库已配置正确

## Acceptance Criteria

### AC-1: 后端 Project 模型完整实现
- **Given**: 数据库存在且可连接
- **When**: 应用启动时
- **Then**: Project 表结构符合 04-作品展示.md 要求，包括 type, start_date, end_date, summary, description, cover_image, images, github_url, demo_url, tags, sort_order 等字段
- **Verification**: `programmatic`

### AC-2: 后端 Project API 实现完整
- **Given**: 后端服务运行中
- **When**: 调用 GET /api/projects?type=enterprise&page=1&page_size=20 时
- **Then**: 返回符合 ApiResponse<PaginatedResponse<Project>> 格式的响应
- **Verification**: `programmatic`

### AC-3: 作品列表页正确展示
- **Given**: 访问 /projects 页面
- **When**: 有作品数据时
- **Then**: 展示作品卡片网格，支持企业/个人项目 Tab 切换，分页功能正常
- **Verification**: `human-judgment`

### AC-4: 作品详情页正确展示
- **Given**: 访问 /projects/:id 页面
- **When**: 有作品数据时
- **Then**: 展示作品详情，包括图片轮播、项目介绍、技术标签、GitHub 和 Demo 链接
- **Verification**: `human-judgment`

### AC-5: 首页精选作品展示
- **Given**: 访问首页
- **When**: 有精选作品数据时
- **Then**: 展示精选作品卡片，点击可跳转到详情页
- **Verification**: `human-judgment`

### AC-6: 后台作品管理功能
- **Given**: 已登录管理员
- **When**: 访问 /admin/projects 页面
- **Then**: 可以创建、编辑、删除、排序作品
- **Verification**: `human-judgment`

## Open Questions
- [ ] 首页精选作品的筛选条件？（基于 featured 标记？还是 sort_order 前 N 个？）
- [ ] 是否需要实现 Redis 缓存？（04-作品展示.md 提到了缓存策略）
