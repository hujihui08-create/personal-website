# 应用项目规则到开发环境 - 验证清单

## Task 1: Trae IDE 规则文件

- [x] `.trae/rules/` 目录已创建
- [x] `.trae/rules/project_rules.md` 文件存在
- [x] 文件包含命名规范（文件、目录、代码）
- [x] 文件包含技术栈信息
- [x] 文件包含设计令牌规范
- [x] 文件包含 Git 提交规范摘要

## Task 2: LoginPage.tsx 颜色规范化

- [x] `bg-[#FAFAFA]` 已替换为 `bg-background-tertiary`
- [x] `bg-white` 已替换为 `bg-background`
- [x] `border-[#E5E5E5]` 已替换为 `border-border-light`
- [x] `text-[#1A1A1A]` 已替换为 `text-primary`
- [x] `text-[#666666]` 已替换为 `text-secondary`
- [x] `text-[#EF4444]` 已替换为 `text-error`
- [x] `text-[#999999]` 已替换为等效 Tailwind 类
- [x] `bg-[#1A1A1A]` 已替换为 `bg-primary`
- [x] `hover:bg-[#333333]` 已替换为 `hover:bg-secondary`
- [x] `focus:ring-[rgba(0,102,255,0.10)]` 已替换为 `focus:ring-accent-soft`
- [x] `focus:border-[#0066FF]` 已替换为 `focus:border-accent`
- [x] `focus:ring-[#0066FF]` 已替换为 `focus:ring-accent`
- [x] `border-[#D4D4D4]` 已替换为 `border-border-medium`
- [x] `bg-[#F5F5F5]` 已替换为 `bg-background-secondary`
- [x] `shadow-[0_4px_12px_rgba(0,0,0,0.08)]` 已替换为 `shadow-card-hover`
- [x] 文件中无其他硬编码颜色值

## Task 3: Prettier 配置

- [x] `frontend/prettier.config.js` 文件存在
- [x] 配置包含 `semi: false`
- [x] 配置包含 `singleQuote: true`
- [x] 配置包含 `trailingComma: 'es5'`

## Task 4: Go 依赖完整性

- [x] `backend/go.mod` 包含 `github.com/golang-jwt/jwt/v5`
- [x] `backend/go.mod` 包含 `github.com/redis/go-redis/v9`
- [x] `backend/go.mod` 包含 `golang.org/x/crypto`（direct 或 indirect）
- [x] `go mod tidy` 执行成功
- [x] `backend/go.sum` 文件非空且包含新增依赖

## Task 5: 前端页面目录

- [x] `frontend/src/pages/home/` 目录存在
- [x] `frontend/src/pages/projects/` 目录存在
- [x] `frontend/src/pages/agent/` 目录存在
- [x] `frontend/src/pages/booking/` 目录存在
- [x] `frontend/src/pages/admin/` 目录存在

## Task 6: API 导出完整性

- [x] `frontend/src/api/index.ts` 包含 `export * from './auth'`
- [x] `frontend/src/api/index.ts` 包含 `export * from './projects'`
- [x] `frontend/src/api/index.ts` 导出 `apiClient`
