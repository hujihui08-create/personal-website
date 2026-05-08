# 个人简介网站

一个集个人展示、作品管理、智能问答、求职预约于一体的现代化个人简介网站。

## 技术栈

### 前端
- React 18.x + TypeScript 5.x
- Vite 5.x
- Tailwind CSS 3.x
- shadcn/ui
- Zustand（状态管理）
- React Query（数据获取）
- Framer Motion（动画）

### 后端
- Go 1.21+
- Gin Web 框架
- GORM（ORM）
- PostgreSQL 15 + pgvector
- Redis 7
- MinIO（对象存储）

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
