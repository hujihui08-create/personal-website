# 个人简介网站

一个集个人展示、作品管理、智能问答、求职预约于一体的现代化个人简介网站。

## 技术栈

### 架构概览

```
[用户浏览器]
     ↓
[Vite Dev Server / Nginx]    ← 静态资源服务
     ↓
[Gin API Server]             ← RESTful API（Go）
     ↓                ↓                ↓
[PostgreSQL]    [Redis]         [MinIO]
  关系数据        缓存/会话       文件存储
   + pgvector
  向量检索
```

---

### 🎨 前端 (`frontend/`)

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **核心框架** | React | ^18.2.0 | UI 组件化构建 |
| **开发语言** | TypeScript | ^5.3.3 | 类型安全的 JavaScript |
| **构建工具** | Vite | ^5.0.11 | 开发服务器与生产构建 |
| **路由** | React Router | ^6.21.0 | 前端路由与导航守卫 |
| **状态管理** | Zustand | ^4.4.7 | 轻量全局状态（认证 token 等） |
| **数据获取** | TanStack React Query | ^5.17.0 | 服务端数据缓存与同步 |
| **HTTP 客户端** | Axios | ^1.16.0 | API 请求封装与拦截器 |
| **动画引擎** | Framer Motion | ^11.0.0 | 页面过渡与交互动画 |
| **图标库** | Lucide React | ^0.303.0 | 统一图标系统 |
| **样式框架** | Tailwind CSS | ^3.4.1 | 原子化 CSS 工具类 |
| **UI 工具** | class-variance-authority | ^0.7.0 | 组件变体管理 |
| | clsx + tailwind-merge | — | 类名合并与冲突解决 |
| **通知组件** | Sonner | ^1.3.1 | 全局 toast 通知 |
| **单元测试** | Vitest + Testing Library | — | 组件与逻辑测试 |
| **E2E 测试** | Playwright | ^1.59.1 | 端到端流程测试 |
| **代码规范** | ESLint + Prettier | — | 代码质量与格式化 |

### ⚙️ 后端 (`backend/`)

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **开发语言** | Go | 1.25 | 高性能编译型语言 |
| **Web 框架** | Gin | ^1.9.1 | HTTP 路由与中间件 |
| **ORM** | GORM | ^1.31.1 | 数据库对象关系映射 |
| **主数据库** | PostgreSQL 15 | — | 关系型数据存储 |
| **向量数据库** | pgvector | ^0.3.0 | 向量检索（RAG 知识库） |
| **数据库驱动** | lib/pq + pgx | — | PostgreSQL Go 驱动 |
| **缓存** | Redis 7（go-redis v9） | — | 会话管理 / 缓存加速 |
| **对象存储** | MinIO | ^7.0.66 | 文件与图片存储 |
| **认证** | golang-jwt | ^5.2.0 | JWT Token 签发与验证 |
| **AI 集成** | go-openai | ^1.41.2 | OpenAI API 调用（AI 助手） |
| **文档解析** | unioffice | ^1.39.0 | Word 文档解析 |
| | excelize | ^2.10.1 | Excel 文件读写 |
| | ledongthuc/pdf | — | PDF 文件解析 |
| **配置管理** | godotenv | ^1.5.1 | .env 环境变量加载 |
| **CORS** | gin-contrib/cors | ^1.5.0 | 跨域资源共享 |

### 🐳 基础设施与部署

| 类别 | 技术 | 用途 |
|------|------|------|
| **容器化** | Docker + Docker Compose | 环境隔离与服务编排 |
| **反向代理** | Nginx | 静态资源托管 + API 反向代理 |
| **CI/CD** | GitHub Actions（计划中） | 自动构建与部署 |

### 🔧 功能模块技术要点

| 功能模块 | 涉及技术 | 关键实现 |
|---------|---------|---------|
| **个人展示** | React + Tailwind + Framer Motion | HeroCard 动画、响应式布局 |
| **作品展示** | React Query + Zustand + MinIO | 分页列表、图片上传、分类筛选 |
| **AI 助手** | go-openai + pgvector + WebSocket | RAG 检索增强、流式对话、知识库管理 |
| **意向预约** | GORM + Redis + 邮件通知 | 时间段管理、冲突检测、状态流转 |
| **管理后台** | AdminLayout + ProtectedRoute | 认证守卫、权限控制、CRUD 管理 |

## 项目结构

```
portfolio/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── components/         # 组件
│   │   ├── pages/              # 页面
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── lib/                # 工具函数
│   │   ├── stores/             # 状态管理
│   │   ├── types/              # 类型定义
│   │   ├── api/                # API 请求
│   │   └── styles/             # 样式
│   └── ...
├── backend/                     # 后端项目
│   ├── cmd/server/             # 入口
│   ├── internal/               # 内部包
│   │   ├── config/             # 配置
│   │   ├── handler/            # 处理器
│   │   ├── service/            # 业务逻辑
│   │   ├── repository/         # 数据访问
│   │   ├── model/              # 模型
│   │   ├── router/             # 路由
│   │   └── middleware/         # 中间件
│   ├── migrations/             # 数据库迁移
│   └── ...
├── docker-compose.yml           # 生产环境
├── docker-compose.dev.yml      # 开发环境
├── nginx/                       # Nginx 配置
└── scripts/                     # 脚本
```

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd 个人简历
```

### 2. 启动开发环境

```bash
# 启动基础服务（PostgreSQL, Redis, MinIO）
docker-compose -f docker-compose.dev.yml up -d

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
go mod tidy

# 启动前端开发服务器
cd ../frontend
npm run dev

# 启动后端服务（新终端）
cd ../backend
go run cmd/server/main.go
```

### 3. 访问服务

- 前端：http://localhost:3000（Vite 默认端口）
- 后端 API：http://localhost:8080
- MinIO Console：http://localhost:9001

### 4. 环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
```

详细配置请参考各模块的 `.env.development` 文件。

## 开发指南

### 代码规范

项目使用 ESLint + Prettier 进行代码规范检查：

```bash
# 检查代码
npm run lint

# 格式化代码
npm run format
```

### 提交代码

使用 Conventional Commits 规范：

```bash
git commit -m "feat(auth): 添加登录功能"
git commit -m "fix(profile): 修复头像上传问题"
```

### 测试

```bash
# 前端测试
cd frontend && npm test

# 后端测试
cd ../backend && go test ./...
```

## 功能模块

| 模块 | 说明 |
|------|------|
| 个人展示 | 个人介绍、简历下载 |
| 作品展示 | 企业项目 + 个人项目详情 |
| AI 助手 | 基于 RAG 的智能问答 |
| 意向预约 | 面试时间预约 |
| 管理后台 | 内容管理与通知 |

## 部署

### 生产环境部署

```bash
# 构建前端
cd frontend && npm run build

# 启动所有服务
docker-compose -f docker-compose.yml up -d
```

### Nginx 配置

参考 `nginx/nginx.conf` 和 `nginx/conf.d/default.conf` 进行配置。

## 文档

- [项目规则文档](project_rules.md)
- [组件规范文档](COMPONENT_SPEC.md)
- [PRD 文档](个人简介网站_PRD.md)
- [开发文档](portfolio-docs/)

## 许可证

MIT License
