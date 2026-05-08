# 环境补全规范 (Environment Completion)

## Why

当前项目基建存在目录结构缺失，需要根据 **COMPONENT_SPEC.md（设计文档）**、project_rules.md、基建文档 (01-项目基础搭建.md) 补全所有缺失的开发环境配置。如有冲突，以 COMPONENT_SPEC.md 为准。

## What Changes

- 创建前端 `components/` 目录结构（ui/, layout/, shared/, figma/）
- 创建前端 `pages/` 目录结构（home/, projects/, agent/, booking/, admin/）
- 创建后端 `internal/` 子目录结构（middleware/, handler/, service/, repository/, model/, pkg/）
- 生成后端 `go.sum` 依赖锁定文件
- 补充设计令牌缺失项（`--color-accent-soft`）
- 确保 Tailwind 配置支持 shadcn/ui 组件类名

## Impact

- Affected specs: COMPONENT_SPEC.md §七、project_rules.md §3.3、01-项目基础搭建.md §1.2
- Affected code: `frontend/src/`、`backend/internal/`、`frontend/src/styles/theme.css`

---

## ADDED Requirements

### Requirement: 前端组件目录结构（以 COMPONENT_SPEC.md 为准）

COMPONENT_SPEC.md §七 规定目录结构如下：

```
src/
├── components/
│   ├── ui/                    ← shadcn 基础组件
│   ├── layout/                ← 布局组件（Navbar, MobileTabBar）
│   ├── shared/                ← 共享组件（EmptyState, Skeleton）
│   └── figma/                 ← ImageWithFallback 等 Figma 导出组件
├── pages/
│   ├── home/
│   ├── projects/
│   ├── agent/
│   ├── booking/
│   └── admin/
```

系统 SHALL 提供以下组件目录：

| 目录 | 说明 | 规范来源 |
|------|------|---------|
| `src/components/ui/` | shadcn/ui 基础组件（Button, Skeleton, Sonner 等） | COMPONENT_SPEC.md §七 |
| `src/components/layout/` | 布局组件（Navbar, MobileTabBar） | COMPONENT_SPEC.md §二 |
| `src/components/shared/` | 共享组件（EmptyState, Skeleton 封装） | COMPONENT_SPEC.md §八 |
| `src/components/figma/` | Figma 导出组件（ImageWithFallback） | COMPONENT_SPEC.md §七 |
| `src/pages/home/` | 首页 | 01-项目基础搭建.md §1.2 |
| `src/pages/projects/` | 作品页 | 01-项目基础搭建.md §1.2 |
| `src/pages/agent/` | AI助手页 | 01-项目基础搭建.md §1.2 |
| `src/pages/booking/` | 预约页 | 01-项目基础搭建.md §1.2 |
| `src/pages/admin/` | 管理后台 | 01-项目基础搭建.md §1.2 |

### Requirement: 后端分层目录结构

系统 SHALL 提供以下后端目录（符合 Go 整洁架构）：

| 目录 | 说明 | 规范来源 |
|------|------|---------|
| `internal/middleware/` | HTTP 中间件 | project_rules.md §3.3 |
| `internal/handler/` | HTTP 处理器 | project_rules.md §3.3 |
| `internal/service/` | 业务逻辑层 | project_rules.md §3.3 |
| `internal/repository/` | 数据访问层 | project_rules.md §3.3 |
| `internal/model/` | 数据模型 | project_rules.md §3.3 |
| `internal/pkg/` | 工具包 | project_rules.md §3.3 |

### Requirement: 设计令牌补全

COMPONENT_SPEC.md §1.1 和 §3.7 使用了 `--color-accent-soft` 令牌，但当前 `theme.css` 中缺失。系统 SHALL 补全：

```css
--color-accent-soft: rgba(0, 102, 255, 0.10);
```

### Requirement: Tailwind 配置兼容 shadcn/ui

当前 Tailwind 配置使用自定义颜色命名（primary, secondary, accent 等），与 shadcn/ui 默认的 `bg-primary`、`text-primary-foreground` 类名不兼容。系统 SHALL 确保配置支持 shadcn/ui 组件类名，或提供映射方案。

### Requirement: Go 依赖锁定

系统 SHALL 生成 `go.sum` 文件锁定所有传递依赖：

- 执行 `go mod tidy` 生成依赖锁定文件
- 确保 `go.mod` 和 `go.sum` 同步

---

## Acceptance Criteria

### AC-1: 前端目录结构（COMPONENT_SPEC.md 为准）
- **Given**: 前端项目 `frontend/src/`
- **When**: 执行目录检查
- **Then**: 存在 `components/ui/`、`components/layout/`、`components/shared/`、`components/figma/`、`pages/home/`、`pages/projects/`、`pages/agent/`、`pages/booking/`、`pages/admin/`
- **Verification**: `programmatic`

### AC-2: 后端目录结构
- **Given**: 后端项目 `backend/internal/`
- **When**: 执行目录检查
- **Then**: 存在 `middleware/`、`handler/`、`service/`、`repository/`、`model/`、`pkg/`
- **Verification**: `programmatic`

### AC-3: 设计令牌完整性
- **Given**: `frontend/src/styles/theme.css`
- **When**: 检查 CSS 变量
- **Then**: 包含 `--color-accent-soft: rgba(0, 102, 255, 0.10)`
- **Verification**: `programmatic`

### AC-4: Go 依赖
- **Given**: 后端项目 `backend/`
- **When**: 执行 `go mod tidy`
- **Then**: `go.sum` 文件存在且包含所有依赖
- **Verification**: `programmatic`
