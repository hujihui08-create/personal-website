# 个人简历网站 - 前端项目

## 技术栈

- **React**: 18.x
- **TypeScript**: 5.x
- **Vite**: 5.x
- **Tailwind CSS**: 3.x
- **shadcn/ui**: UI 组件库
- **React Router**: 6.x
- **Zustand**: 4.x (状态管理)
- **React Query**: 5.x (数据获取)
- **framer-motion**: 11.x (动画)
- **lucide-react**: 图标库
- **sonner**: Toast 通知

## 项目结构

```
frontend/
├── public/                    # 静态资源
├── src/
│   ├── components/           # 通用组件
│   │   ├── ui/               # shadcn/ui 组件
│   │   ├── layout/           # 布局组件
│   │   └── shared/           # 共享组件
│   ├── pages/                # 页面
│   │   ├── home/             # 首页
│   │   ├── projects/         # 作品
│   │   ├── agent/            # Agent
│   │   ├── booking/          # 预约
│   │   └── admin/            # 管理后台
│   ├── hooks/                # 自定义 Hooks
│   ├── lib/                  # 工具函数
│   ├── stores/               # Zustand 状态
│   ├── types/                # TypeScript 类型
│   ├── api/                  # API 请求封装
│   ├── styles/               # 全局样式
│   │   └── theme.css         # 设计令牌
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码格式化
npm run format

# 代码检查
npm run lint
```

## 设计令牌

项目使用 CSS 变量定义设计令牌，详见 `src/styles/theme.css`：

- 颜色令牌
- 间距令牌 (8px 基础单位)
- 圆角令牌
- 阴影令牌
- 动效令牌
- Z-index 令牌

## 代码规范

遵循项目规则文档中的命名规范和代码规范：
- 组件文件：PascalCase
- Hook 文件：`use` + camelCase
- 工具函数：camelCase
- 类型定义：PascalCase
