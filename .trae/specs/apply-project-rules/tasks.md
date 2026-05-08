# Tasks

- [ ] Task 1: 创建 Trae IDE 规则文件 `.trae/rules/project_rules.md`
  - [ ] SubTask 1.1: 创建 `.trae/rules/` 目录
  - [ ] SubTask 1.2: 编写 `project_rules.md`，包含命名规范、代码规范、技术栈、设计令牌等核心规则摘要

- [ ] Task 2: 修正 `LoginPage.tsx` 硬编码颜色为 CSS 变量/Tailwind 类名
  - [ ] SubTask 2.1: 将 `bg-[#FAFAFA]` 替换为 `bg-background-tertiary` 或等效 Tailwind 类
  - [ ] SubTask 2.2: 将 `bg-white` 替换为 `bg-background`
  - [ ] SubTask 2.3: 将 `border-[#E5E5E5]` 替换为 `border-border-light`
  - [ ] SubTask 2.4: 将 `text-[#1A1A1A]` 替换为 `text-primary`
  - [ ] SubTask 2.5: 将 `text-[#666666]` 替换为 `text-secondary`
  - [ ] SubTask 2.6: 将 `text-[#EF4444]` 替换为 `text-error`
  - [ ] SubTask 2.7: 将 `text-[#999999]` 替换为等效次要文本色
  - [ ] SubTask 2.8: 将 `bg-[#1A1A1A]` 替换为 `bg-primary`
  - [ ] SubTask 2.9: 将 `hover:bg-[#333333]` 替换为 `hover:bg-secondary`
  - [ ] SubTask 2.10: 将 `focus:ring-[rgba(0,102,255,0.10)]` 替换为 `focus:ring-accent-soft`
  - [ ] SubTask 2.11: 将 `focus:border-[#0066FF]` 替换为 `focus:border-accent`
  - [ ] SubTask 2.12: 将 `focus:ring-[#0066FF]` 替换为 `focus:ring-accent`
  - [ ] SubTask 2.13: 将 `border-[#D4D4D4]` 替换为 `border-border-medium`
  - [ ] SubTask 2.14: 将 `bg-[#F5F5F5]` 替换为 `bg-background-secondary`
  - [ ] SubTask 2.15: 将 `shadow-[0_4px_12px_rgba(0,0,0,0.08)]` 替换为 `shadow-card-hover`

- [ ] Task 3: 补全 Prettier 独立配置文件
  - [ ] SubTask 3.1: 创建 `frontend/prettier.config.js`
  - [ ] SubTask 3.2: 配置 `semi: false`、`singleQuote: true`、`trailingComma: 'es5'` 等规则

- [ ] Task 4: 修正 Go 依赖完整性
  - [ ] SubTask 4.1: 在 `backend/go.mod` 的 `require` 块中添加 `github.com/golang-jwt/jwt/v5`
  - [ ] SubTask 4.2: 在 `backend/go.mod` 的 `require` 块中添加 `github.com/redis/go-redis/v9`
  - [ ] SubTask 4.3: 确认 `golang.org/x/crypto` 已声明（当前在 indirect 中，需评估是否提升为 direct）
  - [ ] SubTask 4.4: 执行 `go mod tidy` 重新生成 `go.sum`

- [ ] Task 5: 补全前端页面目录占位文件
  - [ ] SubTask 5.1: 创建 `frontend/src/pages/home/.gitkeep`
  - [ ] SubTask 5.2: 创建 `frontend/src/pages/projects/.gitkeep`
  - [ ] SubTask 5.3: 创建 `frontend/src/pages/agent/.gitkeep`
  - [ ] SubTask 5.4: 创建 `frontend/src/pages/booking/.gitkeep`

- [ ] Task 6: 修正 API 导出完整性
  - [ ] SubTask 6.1: 在 `frontend/src/api/index.ts` 中添加 `export * from './auth'`

# Task Dependencies

- Task 2 依赖 Task 1（了解规则后才能正确应用颜色变量）
- Task 4 依赖无（可并行）
- Task 5 依赖无（可并行）
- Task 6 依赖无（可并行）
