# 个人简介网站 - 项目规则文档

## 1. 文档概述

本文档定义了个人简介网站项目的开发规范、代码标准、协作流程和部署策略。所有团队成员必须遵守这些规则，确保项目的一致性和可维护性。

---

## 2. 命名规范

### 2.1 文件命名

| 文件类型 | 命名规则 | 示例 |
|---------|---------|------|
| 组件文件 | PascalCase | `HeroCard.tsx`, `MobileTabBar.tsx` |
| Hook 文件 | `use` + camelCase | `useAuth.ts`, `useToast.ts` |
| 工具函数 | camelCase | `formatDate.ts`, `apiClient.ts` |
| 类型定义 | PascalCase | `types.ts`, `Project.ts` |
| 配置文件 | kebab-case | `tailwind.config.ts`, `vite.config.ts` |
| 文档文件 | 数字前缀 + 中文 | `01-项目基础搭建.md`, `02-管理员认证.md` |

### 2.2 目录命名

| 目录用途 | 命名规则 | 示例 |
|---------|---------|------|
| 组件目录 | 小写复数 | `components/`, `pages/`, `hooks/` |
| 配置目录 | `config/`, `lib/` | `lib/utils.ts`, `config/env.ts` |
| 静态资源 | `public/`, `assets/` | `public/images/`, `assets/icons/` |

### 2.3 代码命名

| 元素类型 | 命名规则 | 示例 |
|---------|---------|------|
| 变量 | camelCase | `userName`, `isLoading` |
| 常量 | UPPER_CASE | `MAX_RETRY`, `API_BASE_URL` |
| 函数/方法 | camelCase | `getUserInfo`, `formatDate` |
| 类/接口 | PascalCase | `interface User`, `class AuthService` |
| React组件 | PascalCase | `function HeroCard()`, `const Navbar = () => {}` |
| Props类型 | `组件名Props` | `HeroCardProps`, `ProjectCardProps` |

---

## 3. 代码规范

### 3.1 TypeScript 规范

#### 3.1.1 类型定义
- 优先使用 `interface` 定义对象类型，使用 `type` 定义联合类型或交叉类型
- 避免使用 `any`，使用 `unknown` 替代
- 导出类型时使用 `export interface` 或 `export type`

#### 3.1.2 组件规范
- 函数组件优先使用箭头函数：`const Component = () => {}`
- Props 使用接口定义，禁止使用内联类型
- 事件处理函数命名：`handle` + 事件名，如 `handleClick`, `handleSubmit`

#### 3.1.3 示例

```typescript
// 推荐
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const UserCard = ({ user }: { user: UserProfile }) => {
  const handleClick = () => console.log(user.id);
  return <div onClick={handleClick}>{user.name}</div>;
};

// 不推荐
const UserCard = (props: any) => {
  return <div onClick={() => {}}>{props.user.name}</div>;
};
```

### 3.2 React 规范

#### 3.2.1 组件结构
- 一个文件只包含一个主要组件
- 组件内部顺序：Props定义 → 状态 → 副作用 → 事件处理 → 渲染

#### 3.2.2 Hooks 使用
- Hooks 必须在组件顶层调用
- 自定义 Hook 以 `use` 开头
- 避免在循环、条件或嵌套函数中调用 Hooks

#### 3.2.3 样式规范
- 优先使用 Tailwind CSS 原子类
- 复杂样式使用 CSS Modules 或 Tailwind 的 `@apply`
- 禁止使用 `style` 属性（特殊情况除外）

### 3.3 Go 后端规范

#### 3.3.1 文件结构
```
backend/
├── cmd/server/main.go      # 入口文件
├── internal/
│   ├── handler/           # HTTP处理器
│   ├── service/           # 业务逻辑
│   ├── repository/        # 数据访问
│   ├── model/             # 数据模型
│   ├── router/            # 路由配置
│   └── middleware/        # 中间件
├── migrations/            # 数据库迁移
└── pkg/                   # 工具包
```

#### 3.3.2 代码风格
- 使用 `go fmt` 自动格式化代码
- 函数命名使用 PascalCase
- 变量命名使用 camelCase
- 注释使用 `//`，包级别注释使用 `/* */`

---

## 4. Git 协作规范

### 4.1 分支管理策略

采用 **Git Flow** 变体模式：

| 分支类型 | 命名规则 | 用途 |
|---------|---------|------|
| 主分支 | `main` | 生产环境代码 |
| 开发分支 | `develop` | 集成分支 |
| 功能分支 | `feature/xxx` | 新功能开发 |
| 修复分支 | `fix/xxx` | Bug修复 |
| 发布分支 | `release/x.x.x` | 版本发布准备 |
| 热修复分支 | `hotfix/xxx` | 生产紧急修复 |

### 4.2 分支创建规范

```bash
# 功能开发
git checkout -b feature/user-auth

# Bug修复
git checkout -b fix/login-error

# 版本发布
git checkout -b release/1.0.0

# 紧急修复
git checkout -b hotfix/critical-bug
```

### 4.3 提交规范

采用 **Conventional Commits** 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### 类型说明

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响逻辑） |
| `refactor` | 代码重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具更新 |
| `perf` | 性能优化 |

#### 示例

```
feat(auth): 实现管理员登录功能

- 添加 JWT 认证中间件
- 实现密码加密存储
- 添加登录失败次数限制

fix(profile): 修复头像上传失败问题

docs(readme): 更新项目说明文档

refactor(utils): 重构日期格式化工具函数
```

### 4.4 代码审查流程

1. **创建 PR**：完成功能开发后，从功能分支向 `develop` 分支发起 PR
2. **自动检查**：CI 自动运行测试和代码检查
3. **代码审查**：至少需要 1 位 reviewer 批准
4. **合并**：审查通过后，使用 **Squash Merge** 合并到 `develop`
5. **删除分支**：合并后删除功能分支

---

## 5. 开发环境规范

### 5.1 环境配置

#### 前端环境变量

```bash
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:8080/api
VITE_UPLOAD_URL=http://localhost:9000
```

#### 后端环境变量

```bash
# backend/.env.development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=devpassword
DB_NAME=portfolio_dev
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev-jwt-secret-key
JWT_EXPIRATION=168h
```

### 5.2 Docker 开发环境

启动开发环境：

```bash
# 启动基础服务
docker-compose -f docker-compose.dev.yml up -d

# 启动前端开发服务器
cd frontend && npm run dev

# 启动后端服务
cd backend && go run cmd/server/main.go
```

### 5.3 开发工具配置

#### ESLint + Prettier

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### Git Hooks

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 6. 测试规范

### 6.1 测试类型

| 测试类型 | 说明 | 覆盖范围 |
|---------|------|---------|
| 单元测试 | 测试单个函数/方法 | 工具函数、业务逻辑 |
| 集成测试 | 测试模块间交互 | API接口、数据库操作 |
| E2E测试 | 模拟用户操作 | 关键用户流程 |

### 6.2 测试文件结构

```
frontend/
├── src/
│   ├── components/
│   │   └── Button.test.tsx    # 组件测试
│   ├── hooks/
│   │   └── useAuth.test.ts    # Hook测试
│   └── lib/
│       └── utils.test.ts      # 工具函数测试

backend/
├── internal/
│   ├── service/
│   │   └── auth_test.go       # 服务测试
│   └── repository/
│       └── user_test.go       # 仓库测试
```

### 6.3 测试命令

```bash
# 前端测试
cd frontend && npm test

# 后端测试
cd backend && go test ./...

# 覆盖率报告
cd backend && go test ./... -coverprofile=coverage.out
```

---

## 7. 部署规范

### 7.1 环境区分

| 环境 | 用途 | 分支来源 |
|------|------|---------|
| 开发环境 | 本地开发测试 | `develop` |
| 测试环境 | 功能验证 | `develop` |
| 预发布环境 | 上线前验证 | `release/*` |
| 生产环境 | 正式上线 | `main` |

### 7.2 部署流程

```
开发完成 → PR 审查 → 合并到 develop → 测试环境部署 → 测试验证
    ↓
发布分支 → 预发布环境验证 → 合并到 main → 生产环境部署
```

### 7.3 Docker 生产配置

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
      - minio
```

---

## 8. 代码质量保障

### 8.1 静态检查

- **前端**: ESLint + TypeScript 类型检查
- **后端**: `go vet` + `golangci-lint`

### 8.2 代码覆盖率

- 单元测试覆盖率 ≥ 80%
- 关键业务逻辑必须有测试覆盖

### 8.3 安全规范

- 禁止硬编码敏感信息
- 密码必须加密存储（bcrypt）
- API 请求必须验证权限
- SQL 查询使用参数化防止注入
- 文件上传必须校验类型和大小

---

## 9. 文档规范

### 9.1 代码注释

- 公共 API 必须有 JSDoc/Go Doc 注释
- 复杂逻辑必须有注释说明
- 避免冗余注释（代码本身应清晰）

### 9.2 文档结构

```
portfolio-docs/
├── README.md              # 项目总览
├── 01-项目基础搭建.md      # 基础架构
├── 02-管理员认证.md        # 认证模块
├── 03-个人展示与工作经历.md
├── 04-作品展示.md
├── 05-意向预约.md
├── 06-通知系统.md
├── 07-AI智能助手Agent.md
├── 08-响应式与移动端适配.md
└── 09-部署与监控.md
```

### 9.3 API 文档

使用 Swagger 自动生成 API 文档：

```bash
cd backend && swag init
```

---

## 10. 技术栈与依赖管理

### 10.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.2.0 | UI 框架 |
| TypeScript | ^5.3.3 | 类型系统 |
| Vite | ^5.0.11 | 构建工具 |
| Tailwind CSS | ^3.4.1 | 原子化 CSS |
| React Router | ^6.21.0 | 路由管理 |
| React Query | ^5.17.0 | 数据获取与缓存 |
| Zustand | ^4.4.7 | 状态管理 |
| Framer Motion | ^11.0.0 | 动画库 |
| Lucide React | ^0.303.0 | 图标库 |
| Sonner | ^1.3.1 | Toast 通知 |

### 10.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Go | 1.21+ | 编程语言 |
| Gin | ^1.9.1 | Web 框架 |
| GORM | ^1.25.5 | ORM 框架 |
| PostgreSQL | 15 | 主数据库 |
| Redis | 7 | 缓存 |
| MinIO | ^7.0.66 | 对象存储 |
| JWT | ^5.2.0 | 认证 |

### 10.3 依赖更新规范

- 定期执行 `npm audit` 检查前端依赖安全漏洞
- Go 依赖使用 `go mod tidy` 清理未使用依赖
- 大版本升级需经过充分测试后方可合并

---

## 11. 设计令牌规范

### 11.1 颜色令牌

所有颜色必须通过 CSS 变量定义，禁止在组件中硬编码色值。

```css
:root {
  --color-primary: #1A1A1A;
  --color-secondary: #666666;
  --color-accent: #0066FF;
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-bg-tertiary: #FAFAFA;
  --color-border-light: #E5E5E5;
  --color-border-medium: #D4D4D4;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```

### 11.2 间距令牌

基础单位为 `8px`，所有间距应使用以下令牌：

| Token | 值 | Tailwind |
|-------|----|----------|
| `--space-xs` | 4px | `gap-1` |
| `--space-sm` | 8px | `gap-2` |
| `--space-md` | 16px | `gap-4` |
| `--space-lg` | 24px | `gap-6` |
| `--space-xl` | 32px | `gap-8` |
| `--space-2xl` | 48px | `gap-12` |
| `--space-3xl` | 64px | `gap-16` |

### 11.3 圆角令牌

| Token | 值 | 适用 |
|-------|----|-----|
| `--radius-sm` | 6px | 按钮、输入框、Tag |
| `--radius-md` | 8px | 默认卡片 |
| `--radius-lg` | 12px | 项目卡片、容器 |
| `--radius-xl` | 16px | Hero 卡片、对话框 |
| `--radius-full` | 9999px | 头像、圆形按钮、Pill 标签 |

### 11.4 阴影与动效令牌

```css
:root {
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-card-strong: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-focus-ring: 0 0 0 3px rgba(0, 102, 255, 0.3);

  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 500ms;
  --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 12. 响应式与无障碍规范

### 12.1 断点定义

| 名称 | 范围 | Tailwind 别名 | 适配策略 |
|------|------|--------------|---------|
| Mobile | `< 640px` | 默认 | 单列、底部 Tab、内边距 16px |
| Tablet | `640–1024px` | `sm:` ~ `md:` | 2 列、顶部导航出现 |
| Desktop | `≥ 1024px` | `lg:` | 3 列、最大宽度 1152px |

### 12.2 无障碍（A11y）规范

1. **语义化标签**：`<header>`、`<nav>`、`<main>`、`<section>`、`<article>`、`<footer>` 必须正确使用
2. **键盘可达**：所有交互元素须可 Tab 聚焦，焦点环 `outline 2px solid #0066FF`
3. **ARIA 标签**：图标按钮必须含 `aria-label`（如 Mic / Send）
4. **对比度**：正文 ≥ 4.5:1，UI 控件 ≥ 3:1
5. **图片替代文本**：所有图片必须提供 `alt` 属性
6. **触摸目标**：移动端可点击区域 ≥ 44×44px
7. **动画降级**：全局已注入 `@media (prefers-reduced-motion: reduce)` 规则，自动将动画/过渡降级

---

## 13. 性能规范

### 13.1 性能指标

| 指标 | 目标 |
|------|------|
| 首屏加载 | < 2秒 |
| 接口响应 | < 500ms |
| Agent首字响应 | < 1秒 |
| 图片加载 | 支持懒加载 |
| 动画帧率 | 60fps 流畅运行 |

### 13.2 优化措施

- 图片使用 WebP 格式，配置懒加载
- 组件按需加载，路由级别代码分割
- API 响应启用压缩（Gzip/Brotli）
- 静态资源使用 CDN 加速
- 数据库查询添加索引，避免 N+1 问题

---

## 14. 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-05-07 | 初始版本，定义项目基础规则 |
| v1.1 | 2026-05-07 | 补充技术栈与依赖管理、设计令牌规范、响应式与无障碍规范、性能规范 |

---

**文档版本**: v1.1  
**更新日期**: 2026-05-07  
**适用范围**: 个人简介网站项目全体开发人员
