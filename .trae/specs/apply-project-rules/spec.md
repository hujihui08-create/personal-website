# 应用项目规则到开发环境 Spec

## Why

项目规则文档 `project_rules.md` 定义了完整的开发规范（命名、代码风格、Git 协作、环境配置、设计令牌等），但当前项目环境中存在多处未遵循规则的情况，需要系统性地补充和修正，确保开发环境完全符合规范要求。

## What Changes

- 创建 `.trae/rules/project_rules.md` 规则文件，使 Trae IDE 能识别项目规范
- 修正前端代码中硬编码颜色值为 CSS 变量引用（`LoginPage.tsx`）
- 补全缺失的 ESLint/Prettier 独立配置文件
- 修正 `go.mod` 中缺失的依赖声明（`golang-jwt/jwt`、`go-redis`）并重新生成 `go.sum`
- 补全前端缺失的页面目录占位文件（`home/`、`projects/`、`agent/`、`booking/`）
- 补充 `api/index.ts` 导出 `authApi`

## Impact

- Affected specs: `project_rules.md` v1.1
- Affected code: `frontend/src/pages/admin/LoginPage.tsx`, `frontend/.eslintrc.cjs`, `frontend/package.json`, `backend/go.mod`, `backend/go.sum`, `frontend/src/api/index.ts`, 新增页面目录

---

## ADDED Requirements

### Requirement: Trae IDE 规则文件

系统 SHALL 在项目根目录创建 `.trae/rules/project_rules.md`，内容包含项目规则文档的核心规范摘要，使 Trae IDE 能自动识别并应用项目规范。

#### Scenario: 规则文件创建
- **WHEN** 开发者在 Trae IDE 中打开项目
- **THEN** `.trae/rules/project_rules.md` 存在且包含命名规范、代码规范、技术栈信息

### Requirement: 前端代码规范修正

系统 SHALL 修正 `frontend/src/pages/admin/LoginPage.tsx` 中所有硬编码颜色值为 CSS 变量引用，符合 project_rules.md §3.2.3 和 §11.1。

#### Scenario: 颜色规范化
- **WHEN** 检查 `LoginPage.tsx`
- **THEN** 所有颜色使用 Tailwind 类名（如 `bg-background`、`text-primary`）或 CSS 变量，无硬编码色值

### Requirement: ESLint + Prettier 配置补全

系统 SHALL 确保前端项目具备完整的代码规范配置：

- `.eslintrc.cjs` 已存在且配置正确
- `prettier.config.js` 存在并定义格式化规则
- `package.json` 中 `lint-staged` 配置已存在

#### Scenario: 配置验证
- **WHEN** 执行 `npm run lint`
- **THEN** ESLint 检查通过（或仅警告）
- **WHEN** 执行 `npm run format`
- **THEN** Prettier 格式化生效

### Requirement: Go 依赖完整性

系统 SHALL 修正 `backend/go.mod`，补充代码中已使用但未声明的依赖：

- `github.com/golang-jwt/jwt/v5`
- `github.com/redis/go-redis/v9`
- `golang.org/x/crypto`

并重新执行 `go mod tidy` 生成完整的 `go.sum`。

#### Scenario: 依赖验证
- **WHEN** 执行 `go mod tidy`
- **THEN** 无错误，所有 import 的依赖都在 `go.mod` 中声明
- **THEN** `go.sum` 包含所有传递依赖

### Requirement: 前端页面目录占位

系统 SHALL 在前端 `frontend/src/pages/` 下补全缺失的页面目录占位文件：

- `pages/home/.gitkeep`
- `pages/projects/.gitkeep`
- `pages/agent/.gitkeep`
- `pages/booking/.gitkeep`

（`admin/` 目录已存在 `LoginPage.tsx`）

#### Scenario: 目录验证
- **WHEN** 检查 `frontend/src/pages/`
- **THEN** 存在 `home/`、`projects/`、`agent/`、`booking/`、`admin/` 五个子目录

### Requirement: API 导出完整性

系统 SHALL 修正 `frontend/src/api/index.ts`，导出 `authApi`，确保其他模块可以正确导入。

#### Scenario: 导出验证
- **WHEN** 检查 `frontend/src/api/index.ts`
- **THEN** 包含 `export * from './auth'`

---

## MODIFIED Requirements

无

## REMOVED Requirements

无

---

## Acceptance Criteria

### AC-1: 规则文件存在
- **Given**: 项目根目录
- **When**: 检查 `.trae/rules/project_rules.md`
- **Then**: 文件存在且包含项目核心规范
- **Verification**: `programmatic`

### AC-2: 前端颜色规范化
- **Given**: `frontend/src/pages/admin/LoginPage.tsx`
- **When**: 搜索硬编码颜色（如 `#1A1A1A`、`#666666`、`#0066FF`）
- **Then**: 无硬编码色值，全部使用 Tailwind 类名或 CSS 变量
- **Verification**: `programmatic`

### AC-3: Prettier 配置存在
- **Given**: `frontend/` 目录
- **When**: 检查 `prettier.config.js`
- **Then**: 文件存在且包含格式化规则
- **Verification**: `programmatic`

### AC-4: Go 依赖完整
- **Given**: `backend/` 目录
- **When**: 执行 `go mod tidy`
- **Then**: 命令成功，无未声明依赖错误
- **Verification**: `programmatic`

### AC-5: 页面目录完整
- **Given**: `frontend/src/pages/`
- **When**: 检查子目录
- **Then**: 存在 `home/`、`projects/`、`agent/`、`booking/`、`admin/`
- **Verification**: `programmatic`

### AC-6: API 导出完整
- **Given**: `frontend/src/api/index.ts`
- **When**: 检查导出语句
- **Then**: 包含 `export * from './auth'`
- **Verification**: `programmatic`
