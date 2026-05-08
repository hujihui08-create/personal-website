# 项目环境配置规范 (Project Environment Setup)

## Why

需要根据项目规则文档、基建文档和组件规范文档，搭建完整的开发环境，确保前后端项目结构标准化、开发工具配置统一、代码规范可执行。

## What Changes

- 创建符合规范的前后端项目目录结构
- 配置 Docker Compose 开发环境（PostgreSQL + Redis + MinIO）
- 初始化前端项目（React + TypeScript + Vite + Tailwind + shadcn/ui）
- 初始化后端项目（Go + Gin + GORM）
- 配置 ESLint + Prettier 代码规范工具
- 配置 Git Hooks（lint-staged）
- 创建环境变量配置文件模板

## Impact

- Affected specs: 项目基建文档 v1.0、组件规范文档 v1.1
- Affected code: 前端项目 `frontend/`、后端项目 `backend/`、配置文件

---

## ADDED Requirements

### Requirement: 项目目录结构

前端项目 `frontend/` 必须包含以下目录：

| 目录 | 说明 |
|------|------|
| `src/components/` | 通用组件（含 `ui/` shadcn组件、`layout/` 布局组件） |
| `src/pages/` | 页面组件（含 `home/`、`projects/`、`agent/`、`booking/`、`admin/`） |
| `src/hooks/` | 自定义Hooks |
| `src/lib/` | 工具函数 |
| `src/stores/` | Zustand状态管理 |
| `src/types/` | TypeScript类型定义 |
| `src/api/` | API请求封装 |
| `src/styles/` | 全局样式（含 `theme.css` 设计令牌） |

后端项目 `backend/` 必须包含以下目录：

| 目录 | 说明 |
|------|------|
| `cmd/server/` | 入口文件 |
| `internal/config/` | 配置模块 |
| `internal/middleware/` | 中间件 |
| `internal/handler/` | HTTP处理器 |
| `internal/service/` | 业务逻辑 |
| `internal/repository/` | 数据访问层 |
| `internal/model/` | 数据模型 |
| `internal/router/` | 路由配置 |
| `internal/pkg/` | 工具包 |

### Requirement: Docker 开发环境

系统 SHALL 支持通过 `docker-compose -f docker-compose.dev.yml up -d` 启动：

- PostgreSQL 15（含 pgvector 扩展）
- Redis 7
- MinIO（文件存储服务）

### Requirement: 前端开发环境

系统 SHALL 支持：

- `npm run dev` 启动开发服务器（默认端口由 Vite 分配）
- `npm run lint` 运行 ESLint 检查
- `npm run build` 构建生产版本

### Requirement: 后端开发环境

系统 SHALL 支持：

- `go run cmd/server/main.go` 启动后端服务（端口 8080）
- `go test ./...` 运行测试
- Swagger 文档自动生成（`swag init`）

### Requirement: 代码规范工具

| 工具 | 配置项 |
|------|--------|
| ESLint | `extends: [eslint:recommended, plugin:@typescript-eslint/recommended, prettier]` |
| Prettier | 自动格式化 `.ts` `.tsx` `.json` `.md` 文件 |
| lint-staged | 提交前自动修复和格式化 |

---

## Acceptance Criteria

### AC-1: 目录结构验证
- **Given**: 项目根目录
- **When**: 执行目录检查
- **Then**: `frontend/` 和 `backend/` 目录存在且包含规范要求的子目录
- **Verification**: `human-judgment`

### AC-2: Docker 环境启动
- **Given**: Docker Desktop 运行中
- **When**: 执行 `docker-compose -f docker-compose.dev.yml up -d`
- **Then**: PostgreSQL、Redis、MinIO 三个服务全部 Running
- **Verification**: `programmatic`

### AC-3: 前端依赖安装
- **Given**: Node.js 18+ 已安装
- **When**: 执行 `npm install`
- **Then**: `node_modules/` 目录存在，所有依赖安装成功
- **Verification**: `programmatic`

### AC-4: 后端依赖安装
- **Given**: Go 1.21+ 已安装
- **When**: 执行 `go mod tidy`
- **Then**: `go.mod` 和 `go.sum` 文件存在
- **Verification**: `programmatic`

### AC-5: ESLint + Prettier 配置生效
- **Given**: 代码存在
- **When**: 执行 `npm run lint`
- **Then**: ESLint 检查通过（或仅警告）
- **Verification**: `programmatic`

---

## Open Questions

- [ ] 是否需要配置 CI/CD 流水线？（当前仅配置开发环境）
- [ ] 前端是否需要配置 `.env.development` 和 `.env.production` 分离？
