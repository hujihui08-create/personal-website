# 环境补全任务列表

## 任务概览

根据 **COMPONENT_SPEC.md（设计文档，冲突时以此为准）**、project_rules.md、基建文档补全所有缺失的目录结构与配置。

---

## [x] Task 1: 创建前端组件目录结构

- **Priority**: P0
- **Depends On**: 无
- **Description**: 创建 `frontend/src/components/` 及其子目录（以 COMPONENT_SPEC.md §七 为准）
  - [x] 创建 `components/ui/` 目录（shadcn/ui 基础组件：Button, Skeleton, Sonner 等）
  - [x] 创建 `components/layout/` 目录（布局组件：Navbar, MobileTabBar）
  - [x] 创建 `components/shared/` 目录（共享组件：EmptyState, Skeleton 封装）
  - [x] 创建 `components/figma/` 目录（Figma 导出组件：ImageWithFallback）
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic`: 验证 `components/ui/`、`components/layout/`、`components/shared/`、`components/figma/` 目录存在 ✅

## [x] Task 2: 创建前端页面目录结构

- **Priority**: P0
- **Depends On**: 无
- **Description**: 创建 `frontend/src/pages/` 及其子目录
  - [x] 创建 `pages/home/` 目录
  - [x] 创建 `pages/projects/` 目录
  - [x] 创建 `pages/agent/` 目录
  - [x] 创建 `pages/booking/` 目录
  - [x] 创建 `pages/admin/` 目录
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic`: 验证所有页面目录存在 ✅

## [x] Task 3: 创建后端分层目录结构

- **Priority**: P0
- **Depends On**: 无
- **Description**: 创建 `backend/internal/` 及其子目录
  - [x] 创建 `middleware/` 目录
  - [x] 创建 `handler/` 目录
  - [x] 创建 `service/` 目录
  - [x] 创建 `repository/` 目录
  - [x] 创建 `model/` 目录
  - [x] 创建 `pkg/` 目录
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic`: 验证所有 internal 子目录存在 ✅

## [x] Task 4: 补全设计令牌

- **Priority**: P1
- **Depends On**: 无
- **Description**: 根据 COMPONENT_SPEC.md 补全 `theme.css` 缺失的设计令牌
  - [x] 添加 `--color-accent-soft: rgba(0, 102, 255, 0.10)`（COMPONENT_SPEC.md §3.7 Timeline 类型标签使用）
  - [x] 验证现有令牌与 COMPONENT_SPEC.md §1.1 一致
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic`: 验证 CSS 变量存在 ✅

## [x] Task 5: 生成 Go 依赖锁定文件

- **Priority**: P1
- **Depends On**: Go 1.21+ 已安装
- **Description**: 在后端项目执行 `go mod tidy` 生成 `go.sum`
  - [x] 执行 `go mod tidy`（Go 1.26.1 已安装）
  - [x] 验证 `go.sum` 文件生成
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic`: 验证 `go.sum` 文件存在且非空 ✅

---

## 任务依赖关系

```
Task 1 (前端组件目录) ✅ ─┐
                          ├─ 并行执行
Task 2 (前端页面目录) ✅ ─┤
                          │
Task 3 (后端目录)     ✅ ─┤
                          │
Task 4 (设计令牌)     ✅ ─┤
                          │
Task 5 (Go依赖)       ✅ ─┴─ Go 1.26.1 已安装
```

---

## 进度标记

- [x] Task 1: 创建前端组件目录结构 ✅
- [x] Task 2: 创建前端页面目录结构 ✅
- [x] Task 3: 创建后端分层目录结构 ✅
- [x] Task 4: 补全设计令牌 ✅
- [x] Task 5: 生成 Go 依赖锁定文件 ✅
