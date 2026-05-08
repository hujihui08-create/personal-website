# 个人简介网站 - 项目规则摘要

## 命名规范

### 文件命名
- 组件文件: PascalCase (`HeroCard.tsx`, `MobileTabBar.tsx`)
- Hook 文件: `use` + camelCase (`useAuth.ts`, `useToast.ts`)
- 工具函数: camelCase (`formatDate.ts`, `apiClient.ts`)
- 类型定义: PascalCase (`types.ts`, `Project.ts`)
- 配置文件: kebab-case (`tailwind.config.ts`, `vite.config.ts`)

### 目录命名
- 业务/页面目录: 小写单数，表示功能域 (`admin/`, `agent/`, `booking/`, `home/`)
- 组件目录: 小写复数 (`pages/`, `hooks/`, `stores/`, `styles/`, `types/`)
- API 层目录: `api/`（业内通用约定，保持单数）
- 配置目录: `lib/`
- 后端 Go 包目录: 遵循 Go 惯例使用单数 (`config/`, `handler/`, `service/`, `model/`, `repository/`, `middleware/`, `router/`)

### 代码命名
- 变量: camelCase (`userName`, `isLoading`)
- 常量: UPPER_CASE (`MAX_RETRY`, `API_BASE_URL`)
- 函数/方法: camelCase (`getUserInfo`, `formatDate`)
- 类/接口: PascalCase (`interface User`, `class AuthService`)
- React组件: PascalCase (`function HeroCard()`)
- Props类型: `组件名Props` (`HeroCardProps`)

## 代码规范

### TypeScript
- 优先使用 `interface` 定义对象类型，`type` 定义联合/交叉类型
- 避免使用 `any`，使用 `unknown` 替代
- 函数组件优先使用箭头函数: `const Component = () => {}`
- Props 使用接口定义，禁止内联类型
- 事件处理函数命名: `handle` + 事件名 (`handleClick`, `handleSubmit`)

### React
- 一个文件只包含一个主要组件
- 组件内部顺序: Props定义 → 状态 → 副作用 → 事件处理 → 渲染
- Hooks 必须在组件顶层调用
- 自定义 Hook 以 `use` 开头

### 状态管理规范
- Token 统一存储在 Zustand auth store 中，API 层通过 `store.getState()` 读取，禁止直接操作 `localStorage`
- Zustand persist 的 storage key 统一使用 `{module}-storage` 格式（如 `auth-storage`）
- Store 是唯一数据源，组件和 API 层都从 store 读取状态，不重复存储
- 跨模块数据流：组件 → 调用 store action → store 更新 → API 层通过 `getState()` 读取最新 token
- 401 响应处理须调用 store 的 `logout()` 方法清理状态，而非直接删除 localStorage

### 样式规范
- 优先使用 Tailwind CSS 原子类
- 复杂样式使用 CSS Modules 或 Tailwind 的 `@apply`
- 禁止使用 `style` 属性（特殊情况除外）
- 所有颜色必须通过 CSS 变量定义，禁止硬编码色值

### Go 后端
- 使用 `go fmt` 自动格式化
- 函数命名使用 PascalCase
- 变量命名使用 camelCase
- 注释使用 `//`，包级别注释使用 `/* */`

## 技术栈

### 前端
- React ^18.2.0
- TypeScript ^5.3.3
- Vite ^5.0.11
- Tailwind CSS ^3.4.1
- React Router ^6.21.0
- React Query ^5.17.0
- Zustand ^4.4.7
- Framer Motion ^11.0.0
- Lucide React ^0.303.0
- Sonner ^1.3.1

### 后端
- Go 1.21+
- Gin ^1.9.1
- GORM ^1.25.5
- PostgreSQL 15
- Redis 7
- MinIO ^7.0.66
- JWT ^5.2.0

## 设计规范

完整的设计规范、设计令牌、组件规范、响应式断点和无障碍规范请参考：
[COMPONENT_SPEC.md](../../../COMPONENT_SPEC.md)

## Git 提交规范

采用 Conventional Commits:
```
<type>(<scope>): <description>
```

类型: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

## 自动化对接机制

### 概述

新增功能时，须自动验证已开发的既有功能的接口兼容性、数据格式一致性和流程衔接有效性，防止页面跳转失败、功能调用异常或数据传递错误。

### 自动检测接口兼容性

#### 检测范围
- 后端 API 端点：每个 handler 注册的路由是否正常响应
- 前端 API 调用：`src/api/` 下的每个请求是否与后端端点匹配
- 请求/响应结构：前端发送的数据结构与后端期望的模型是否一致
- HTTP 状态码：成功/错误场景的状态码是否按约定返回

#### 实现方式
- 后端启动后，通过测试脚本自动遍历 `router.go` 中注册的所有路由
- 对每个路由发送预定义的测试请求，验证返回的状态码和响应结构
- 前端 `src/api/` 下的每个函数对应一个端点校验，确保方法（GET/POST/PUT/DELETE）和路径匹配

### 数据格式一致性

#### 前端类型 <-> 后端模型一致性
- `src/types/index.ts` 中的接口定义必须与后端 `internal/model/` 中的结构体字段对齐
- 新增/修改后端模型时，必须同步更新前端类型定义
- 字段类型映射规则：

| Go 类型 | TypeScript 类型 | 说明 |
|---------|----------------|------|
| `string` | `string` | 字符串 |
| `int/uint` | `number` | 数字 |
| `float64` | `number` | 浮点数 |
| `bool` | `boolean` | 布尔值 |
| `time.Time` | `string` | ISO8601 格式日期字符串 |
| `[]T` | `T[]` | 数组 |
| `*T` | `T \| null` | 可选字段 |

#### API 响应格式统一性
- 所有 API 响应统一使用 `ApiResponse<T>` 包装结构：

```typescript
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}
```

- 后端新增端点时必须在测试中验证响应符合此格式

### 流程衔接有效性

#### 页面路由可达性
- 新增页面后必须更新 `src/App.tsx` 的路由表
- 路由路径与 `src/pages/` 下的目录名对应
- 自动化测试中须模拟页面导航，验证每个注册路由对应的组件可正常渲染

#### 功能调用链校验
- 新增功能涉及的跨模块调用链（如：页面 → API → Store → 组件）必须在测试中覆盖
- 关键调用链包括：
  - 管理员认证：`LoginPage → api/auth.ts → authStore → ProtectedRoute`
  - 作品展示（规划）：`ProjectsPage → api/projects.ts → projectStore → ProjectCard`
  - 意向预约（规划）：`BookingPage → api/booking.ts → bookingStore → BookingForm`
  - AI 助手（规划）：`AgentPage → ws/agent → chatStore → ChatMessage`

#### 页面跳转与路由守卫
- 受保护的路由（需认证）必须使用 `ProtectedRoute` 包裹
- 未登录访问受保护路由须自动跳转到 `/admin/login`
- Token 过期后 API 返回 401，前端须自动执行登出并跳转

### 自动化测试验证

#### 测试工具链
- 前端测试：安装并配置 Vitest（单元测试）+ Playwright（E2E 测试）
- API 契约测试：使用 `supertest`（Node.js）或 Go 内置 `httptest` 对后端端点进行契约验证
- 命令行执行：`npm run test:integration` 一键执行全部对接测试

#### 测试触发时机

| 阶段 | 执行内容 | 触发方式 |
|------|---------|---------|
| 开发中 | TypeScript 类型检查（`tsc --noEmit`） | 手动或 IDE 自动 |
| Pre-commit | ESLint + Prettier + 类型检查 | lint-staged 自动 |
| Commit 后 | 接口兼容性检测 + 数据格式校验 | 手动执行 `npm run test:integration` |
| 合并前 | 完整 E2E 流程测试 + 兼容性报告 | CI 自动执行 |

#### 测试执行流程
```
1. 启动后端服务（docker-compose up -d）
2. 运行 API 端点兼容性扫描 → 生成端点清单
3. 运行数据格式一致性校验 → 比对前后端类型定义
4. 运行流程衔接测试 → 模拟页面跳转与功能调用
5. 汇总测试结果 → 生成兼容性报告
```

### 兼容性报告

每次执行对接测试后须自动生成兼容性报告，包含以下内容：

```markdown
# 功能对接兼容性报告

## 测试时间: 2026-05-08 14:30:00

## 1. 接口兼容性
| 端点 | 状态 | 响应码 | 响应结构 | 说明 |
|------|------|--------|---------|------|
| POST /api/auth/login | ✅ | 200 | 匹配 | — |

## 2. 数据格式一致性
| 前端类型 | 后端模型 | 字段对齐 | 类型匹配 | 说明 |
|---------|---------|---------|---------|------|
| User | Admin | 部分 | ✅ | Admin 缺少 avatar 字段 |

## 3. 流程衔接有效性
| 流程路径 | 状态 | 说明 |
|---------|------|------|
| 登录流程: LoginPage → api/auth → authStore → Redirect | ✅ | 正常 |
| 作品列表: ProjectsPage → api/projects → render | ❌ | 后端端点未实现 |

## 4. 总体评估
- 接口兼容率: 6/8 (75%)
- 数据格式一致率: 4/5 (80%)
- 流程衔接成功率: 2/4 (50%)
- **综合判定: ⚠️ 部分兼容，建议修复后再合并**
```
