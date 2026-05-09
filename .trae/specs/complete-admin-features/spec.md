# 完善管理后台功能

## Overview
当前个人展示与工作经历功能的核心部分已经实现，但管理后台缺少统一的导航和仪表盘页面，简历功能也没有完全整合到管理后台中。需要完善这些部分以提供完整的管理体验。

## Why
- 用户登录管理后台后没有明确的入口页面
- 管理后台各个页面之间无法快速切换
- 简历上传功能虽然后端已实现，但前端管理后台缺少操作界面
- 首页的简历下载链接不正确

## What Changes
- 新增管理后台 Dashboard 页面，展示数据概览
- 新增 AdminSidebar 组件，提供统一的导航
- 新增 AdminLayout 组件，提供统一的管理后台布局
- 新增简历相关的 API hooks 和组件
- 在 ProfileEditPage 中添加简历上传功能
- 修复 HeroCard 中的简历下载链接
- 更新 App.tsx 路由结构，整合管理后台布局

## Impact
- Affected specs: 个人展示与工作经历
- Affected code:
  - frontend: `src/pages/admin/`, `src/components/`, `src/api/`, `src/hooks/`, `src/App.tsx`

## Goals
- 提供完整的管理后台导航体验
- 实现简历的上传和下载功能
- 确保管理后台功能的完整性
- 严格遵循设计规范（COMPONENT_SPEC.md）

## Non-Goals
- 不修改现有的个人资料编辑和工作经历管理的核心逻辑
- 不涉及权限管理的变更
- 暂不实现暗色模式（v2 规划）

## Background & Context
现有功能状态：
- ✅ 个人资料编辑页面已实现
- ✅ 工作经历管理页面已实现
- ✅ 后端简历 API 已实现
- ❌ 管理后台 Dashboard 缺失
- ❌ 管理后台导航缺失
- ❌ 简历上传界面缺失
- ❌ 简历下载链接错误

## Design Compliance
本功能严格遵循 `COMPONENT_SPEC.md` 设计规范：
- 使用设计令牌（Design Tokens）：色彩、间距、圆角、阴影、动效、z-index
- 使用现有组件：Skeleton、Toaster、EmptyState
- 遵循响应式断点：Mobile (<640px)、Tablet (640-1024px)、Desktop (≥1024px)
- 遵循无障碍规范：语义化标签、键盘可达、ARIA 标签、对比度、触摸目标 ≥44px
- 使用 lucide-react 图标库
- 使用 Framer Motion 实现动画（遵循 `prefers-reduced-motion`）
- 仅支持 Light 模式

## Functional Requirements

### FR-1: Admin Dashboard
管理后台应提供一个仪表盘页面，展示个人信息和数据概览。

#### Scenario: View Dashboard
- **WHEN** 管理员登录后访问 `/admin/dashboard`
- **THEN** 系统展示包含以下内容的仪表盘：
  - 个人信息卡片（头像、姓名、职位）
  - 数据统计（工作经历数量、项目数量等）
  - 快捷操作入口（编辑资料、管理经历等）
- **AND** 使用设计令牌：`--color-bg-tertiary` 背景，`--radius-xl` 卡片圆角，`--shadow-card-hover` 悬停阴影

### FR-2: Admin Sidebar Navigation
管理后台应提供一个固定的侧边栏导航。

#### Scenario: Navigate Admin Pages
- **WHEN** 管理员访问任意管理后台页面
- **THEN** 左侧显示侧边栏，包含以下导航项：
  - 仪表盘（图标：Home）
  - 个人资料（图标：User）
  - 工作经历（图标：Briefcase）
  - 作品管理（图标：FolderOpen）
  - 退出登录（图标：LogOut）
- **THEN** 当前页面对应的导航项高亮显示（`--color-accent`）
- **THEN** 点击导航项可跳转到对应页面
- **AND** 侧边栏样式：`--color-bg` 背景，`--color-border-light` 右边框，`--space-md` 内边距
- **AND** 导航项：touch target ≥44px，hover 时 `--color-accent-soft` 背景
- **AND** 响应式：Desktop 固定侧边栏，Mobile 可折叠/顶部导航

### FR-3: Resume Upload in Admin
管理后台应提供简历上传功能。

#### Scenario: Upload Resume
- **WHEN** 管理员在个人资料编辑页面
- **THEN** 页面显示简历上传区域
- **THEN** 管理员可以选择 PDF 文件上传
- **THEN** 上传成功后显示当前简历信息和下载链接
- **AND** 文件验证：PDF 格式，最大 10MB
- **AND** 错误提示使用 `sonner` toast
- **AND** 加载状态使用 Skeleton 组件

#### Scenario: Delete Resume
- **WHEN** 管理员在个人资料编辑页面且已有简历
- **THEN** 可以删除当前简历
- **AND** 删除前有确认提示

### FR-4: Resume Download on Homepage
首页的简历下载功能应正常工作。

#### Scenario: Download Resume
- **WHEN** 用户点击首页的"下载简历"按钮
- **THEN** 系统从后端获取简历文件并触发下载
- **WHEN** 无简历时
- **THEN** 下载按钮隐藏或禁用

## Non-Functional Requirements

### NFR-1: Responsive Admin Layout
管理后台布局应支持响应式设计。
- Desktop (≥1024px): 侧边栏固定在左侧，主内容区域在右侧，最大宽度 1152px
- Tablet (640-1024px): 侧边栏可折叠
- Mobile (<640px): 使用顶部导航或可折叠抽屉

### NFR-2: File Upload UX
简历上传应提供良好的用户体验：
- 显示上传进度
- 支持拖拽上传
- 显示文件验证错误（格式、大小限制）
- 使用 `sonner` toast 提供反馈

### NFR-3: Accessibility
- 所有交互元素可 Tab 聚焦，焦点环 `outline 2px solid var(--color-accent)`
- 图标按钮必须含 `aria-label`
- 使用语义化标签 `<header>`、`<nav>`、`<main>`、`<section>`
- 正文对比度 ≥4.5:1，UI 控件 ≥3:1

## Constraints

### Technical
- 使用现有的 UI 组件库和设计系统
- 简历文件限制为 PDF 格式，最大 10MB
- 继续使用 Framer Motion 实现交互动画（使用 `var(--duration-*)` 和 `var(--easing-standard)`）
- 使用 lucide-react 图标，默认尺寸 `size-4` 或 `size-5`

### Business
- 保持与现有设计风格一致
- 不影响已有的公开页面功能

## Assumptions
- 后端简历 API 已经正常工作
- MinIO 存储配置正确
- 用户已理解现有的管理后台功能

## Acceptance Criteria

### AC-1: Admin Dashboard
- **Given** 管理员已登录
- **When** 访问 `/admin/dashboard`
- **Then** 显示仪表盘页面，包含个人信息卡片和数据统计
- **And** 所有样式使用设计令牌
- **Verification**: human-judgment

### AC-2: Admin Sidebar
- **Given** 管理员在任意管理后台页面
- **When** 查看页面
- **Then** 左侧显示侧边栏导航
- **Then** 当前页面对应导航项高亮
- **Then** 点击导航项可正常跳转
- **And** 遵循无障碍规范
- **Verification**: human-judgment

### AC-3: Resume Upload
- **Given** 管理员在个人资料编辑页面
- **When** 上传 PDF 简历文件
- **Then** 文件上传成功并显示当前简历信息
- **And** 文件验证正确工作
- **Verification**: programmatic + human-judgment

### AC-4: Resume Download
- **Given** 首页已加载且有简历
- **When** 点击"下载简历"按钮
- **Then** 简历文件正常下载
- **Verification**: human-judgment

### AC-5: Responsive Admin Layout
- **Given** 在不同屏幕尺寸访问管理后台
- **When** 调整浏览器窗口大小
- **Then** 布局自适应调整
- **And** 遵循响应式断点规范
- **Verification**: human-judgment

### AC-6: Design Compliance
- **Given** 所有新实现的组件和页面
- **Then** 严格遵循 COMPONENT_SPEC.md 设计规范
- **Then** TypeScript 类型检查通过
- **Verification**: programmatic + human-judgment

## Open Questions
- 是否需要在 Dashboard 显示更多统计数据？（如访问量等）
- 作品管理页面尚未实现，是否需要在侧边栏中暂时隐藏？
