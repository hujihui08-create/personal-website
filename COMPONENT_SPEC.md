# 组件规范文档（Component Specification）

> 个人简介网站 · 简约风格组件库
> 版本：**v1.1** · 更新日期：2026-05-07
> **范围声明**：v1 仅支持 **Light 模式**，Dark 模式留作后续迭代。所有令牌已在 `src/styles/theme.css` 中定义并接入 Tailwind v4 `@theme inline`。

---

## 一、设计令牌（Design Tokens）

所有组件均基于以下设计令牌构建。组件中应优先使用令牌值，避免硬编码。

### 1.1 色彩 Tokens

| Token | 值 | 用途 |
|------|----|------|
| `--color-primary` | `#1A1A1A` | 主文字、主按钮背景 |
| `--color-secondary` | `#666666` | 次要文字、说明 |
| `--color-accent` | `#0066FF` | 链接、选中状态、焦点 |
| `--color-bg` | `#FFFFFF` | 主背景 |
| `--color-bg-secondary` | `#F5F5F5` | 卡片/标签灰底 |
| `--color-bg-tertiary` | `#FAFAFA` | 输入背景、轻量区块 |
| `--color-border-light` | `#E5E5E5` | 默认边框 |
| `--color-border-medium` | `#D4D4D4` | 强调边框、Outline 按钮 |
| `--color-success` | `#10B981` | 成功 |
| `--color-warning` | `#F59E0B` | 警告 |
| `--color-error` | `#EF4444` | 错误 |
| `--color-info` | `#3B82F6` | 信息提示 |

### 1.2 间距 Tokens（基础单位 8px）

| Token | 值 | Tailwind |
|-------|----|----------|
| `space-xs` | 4px | `gap-1` |
| `space-sm` | 8px | `gap-2` |
| `space-md` | 16px | `gap-4` |
| `space-lg` | 24px | `gap-6` |
| `space-xl` | 32px | `gap-8` |
| `space-2xl` | 48px | `gap-12` |
| `space-3xl` | 64px | `gap-16` |

### 1.3 圆角 Tokens

| Token | 值 | 适用 |
|-------|----|-----|
| `radius-sm` | 6px | 按钮、输入框、Tag |
| `radius-md` | 8px | 默认卡片 |
| `radius-lg` | 12px | 项目卡片、容器 |
| `radius-xl` | 16-24px | Hero 卡片、对话框 |
| `radius-full` | 9999px | 头像、圆形按钮、Pill 标签 |

### 1.4 阴影 Tokens

| Token | 值 | 适用 |
|-------|----|-----|
| `shadow-card-hover` | `0 4px 12px rgba(0,0,0,0.08)` | 卡片 hover |
| `shadow-card-strong` | `0 8px 24px rgba(0,0,0,0.08)` | 项目卡片 hover |
| `shadow-focus-ring` | `0 0 0 3px rgba(0,102,255,0.10)` | 输入框聚焦光环 |

### 1.5 动效 Tokens

| Token | 值 | 用途 |
|-------|----|-----|
| `duration-fast` | 150ms | 按钮按下、Tab 切换 |
| `duration-base` | 200ms | 默认交互过渡 |
| `duration-slow` | 500ms | 图片缩放、淡入 |
| `easing-standard` | `cubic-bezier(0.4,0,0.2,1)` | 默认缓动 |

### 1.6 Z-index 层级 Tokens

| Token | 值 | 用途 |
|-------|----|-----|
| `--z-base` | 1 | 默认内容 |
| `--z-nav` | 30 | Navbar / MobileTabBar |
| `--z-dropdown` | 40 | 下拉菜单 / Popover |
| `--z-modal` | 50 | Dialog / Drawer |
| `--z-toast` | 60 | Toast / 通知最高层 |

### 1.7 响应式断点 Tokens

| 名称 | 范围 | Tailwind 别名 | 适配 |
|------|------|--------------|------|
| Mobile | `< 640px` | 默认 | 单列、底部 Tab |
| Tablet | `640–1024px` | `sm:` ~ `md:` | 2 列、顶部导航 |
| Desktop | `≥ 1024px` | `lg:` | 3 列、最大宽度 1152px |

### 1.8 动效与无障碍

- 全局已注入 `@media (prefers-reduced-motion: reduce)` 规则，自动将动画/过渡降级为 0.01ms。
- 任何自定义动画必须使用 `var(--duration-*)` 与 `var(--easing-standard)`，避免硬编码毫秒值。
- 所有可聚焦元素继承 `:focus-visible` 全局样式：`outline 2px solid var(--color-accent) + offset 2px`。

---

## 二、组件清单

| 组件 | 文件 | 职责 |
|------|------|------|
| `Navbar` | `Navbar.tsx` | 顶部导航（PC） |
| `MobileTabBar` | `MobileTabBar.tsx` | 移动端底部 Tab |
| `HeroCard` | `HeroCard.tsx` | 个人介绍卡片 |
| `FeaturedProjects` | `FeaturedProjects.tsx` | 精选作品网格 |
| `ProjectCard` | `FeaturedProjects.tsx`（内联） | 单个作品卡片 |
| `AgentPrompt` | `AgentPrompt.tsx` | AI 助手入口 |
| `Timeline` | `Timeline.tsx` | 经历时间线（工作/教育/成就） |
| `EmptyState` | `EmptyState.tsx` | 通用空态（无数据/无结果）|
| `Skeleton` | `ui/skeleton.tsx`（shadcn） | 加载骨架屏 |
| `Toaster` / `toast` | `ui/sonner.tsx` + `sonner` | 全局 Toast 通知 |

---

## 三、组件规范

### 3.1 Navbar — 顶部导航

**用途**：PC 端固定在视口顶部，提供主要页面入口与 CTA。

**Props**

| 名称 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|-----|-------|------|
| `active` | `"home" \| "projects" \| "agent" \| "book"` | 否 | `"home"` | 当前激活项 |
| `onNavigate` | `(key: string) => void` | 否 | — | 切换回调 |

**视觉规范**

- 高度：`64px`
- 背景：`bg-white/80` + `backdrop-blur-md`（半透明毛玻璃）
- 底部边框：`1px solid #E5E5E5`
- 内容最大宽度：`1152px`（max-w-6xl），内边距 `24px`
- 链接默认色 `#666666`，激活色 `#0066FF`，hover 色 `#1A1A1A`
- CTA 按钮：Primary 风格

**响应式**

- `< 768px`：隐藏导航链接与 CTA，仅保留 Logo（移动端使用 `MobileTabBar`）

**无障碍**

- 使用 `<header>` + `<nav>` 语义
- 激活项需添加 `aria-current="page"`（建议增强）

---

### 3.2 MobileTabBar — 移动端底部导航

**用途**：移动端固定在视口底部，提供 4 个主要入口。

**Props**

| 名称 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|-----|-------|------|
| `active` | `string` | 否 | `"home"` | 当前激活 Tab |
| `onChange` | `(key: string) => void` | 否 | — | 切换回调 |

**视觉规范**

- 仅在 `< 768px` 显示（`md:hidden`）
- 4 等分网格
- 触摸目标高度 ≥ `48px`，符合 WCAG 触控规范
- 图标尺寸 `20px`（`size-5`），文字 `12px`
- 激活色 `#0066FF`，默认色 `#666666`
- 顶部边框 `1px solid #E5E5E5`，背景 `bg-white/95` + `backdrop-blur`

**Tab 项**

| key | 图标 | 文案 |
|-----|------|------|
| `home` | `Home` | 首页 |
| `projects` | `Briefcase` | 作品 |
| `agent` | `MessageCircle` | Agent |
| `book` | `Calendar` | 预约 |

---

### 3.3 HeroCard — 个人介绍卡片

**用途**：首页核心卡片，展示头像、姓名、职位、技能、社交链接与三大 CTA。

**Props**：无（数据后续可改为接收 `profile` Prop 接入接口）。

**结构**

```
HeroCard
├── Avatar (96–112 px, 4px 灰色光环)
├── h1 姓名
├── 职位副标题
├── 简介段落 (最大宽度 ~36em)
├── 技能 Badge 组 (Pill 样式)
├── 社交链接组 (icon + 文本，hover 变蓝)
└── CTA 组
    ├── Primary  下载简历
    ├── Secondary 查看作品
    └── Outline   预约面试
```

**视觉规范**

- 容器：`rounded-2xl` + `border #E5E5E5` + `padding 32–48px`
- Hover：阴影 `0 4px 24px rgba(0,0,0,0.06)`（轻微提升）
- 头像：`Avatar` 组件，环形 ring `4px #F5F5F5`
- 技能 Badge：`rounded-full` + `bg-#F5F5F5`，hover `bg-#EEEEEE`
- 社交链接：`hover:text-#0066FF`，过渡 200ms

**响应式**

- 移动端：内边距 `24px`，CTA 自动换行（`flex-wrap`）
- PC 端：居中布局，最大宽度 `~640px` 文本段

**交互**

- 入场动画：父级 `animate-in fade-in duration-500`
- 下载简历：建议触发 Toast 进度提示（待接入）

---

### 3.4 FeaturedProjects — 精选作品

**用途**：以网格展示精选项目，PC 端 3 列、平板 2 列、移动端 1 列。

**Props**：无（内置 mock 数据；建议改造为 `projects: Project[]`）。

**Project 数据结构**

```ts
interface Project {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  cover: string;          // 图片 URL
  type: "enterprise" | "personal";
}
```

**布局栅格**

| 断点 | 列数 | 间距 |
|------|------|------|
| `< 640px` | 1 | `24px` |
| `≥ 640px` | 2 | `24px` |
| `≥ 1024px` | 3 | `24px` |

**Section Header**

- 左：H2 + 副标题
- 右：「查看全部」链接（PC 端可见，移动端隐藏）

---

### 3.5 ProjectCard — 项目卡片

> 当前作为 `FeaturedProjects` 内联实现，建议未来抽出为独立组件。

**Props（建议）**

| 名称 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `project` | `Project` | 是 | 项目数据 |
| `onClick` | `() => void` | 否 | 点击进入详情 |

**视觉规范**

| 状态 | 样式 |
|-----|------|
| 默认 | `bg #FFF`，`border 1px #E5E5E5`，`radius 12px` |
| Hover | `translate-y(-4px)` + `shadow 0 8px 24px rgba(0,0,0,0.08)` |
| 封面 | `aspect-ratio 16/10`，背景占位 `#F5F5F5` |
| 封面 Hover | 图片 `scale(1.05)`，过渡 `500ms` |

**结构**

```
Card
├── Cover (aspect-[16/10], object-cover)
└── Body (padding 20px)
    ├── Type Badge (outline, 企业项目 / 个人项目)
    ├── h3 标题
    ├── 摘要 (line-clamp-2)
    └── Tag List (技术栈，灰底圆角)
```

---

### 3.6 AgentPrompt — AI 助手入口

**用途**：首页底部入口，提供文本/语音问答触发与推荐问题。

**Props**：无（建议后续接入 `onSend(value: string)`、`onVoice()` 回调）。

**结构**

```
AgentPrompt (rounded-2xl, bg #FAFAFA)
├── Header
│   ├── 图标方块 (size-8, bg #1A1A1A, 白色 Sparkles)
│   ├── h2 "AI 助手"
│   └── 副标题
├── 输入栏 (圆角容器, focus-within 蓝色光环)
│   ├── Input  (无边框, transparent)
│   ├── 语音按钮 (Mic, ghost)
│   └── 发送按钮 (Primary square, SendHorizontal)
└── 推荐问题 Pill 组 (hover 蓝色描边)
```

**视觉规范**

- 容器底色 `#FAFAFA`，与 HeroCard 形成对比
- 输入容器：`bg-white` + `border #E5E5E5`
- 聚焦态（`focus-within`）：`border #0066FF` + `ring 4px rgba(0,102,255,0.10)`
- 推荐 Pill：默认灰边白底，hover 变蓝

**交互**

- 点击推荐问题 → 写入 `value`（已实现）
- Enter/点击发送 → 触发 `onSend`（待接入）
- 麦克风按钮 → 启动 Web Speech API（待接入）

**无障碍**

- 麦克风、发送按钮均包含 `aria-label`
- 推荐问题为原生 `<button>`，可键盘聚焦

---

### 3.7 Timeline — 经历时间线

**用途**：在首页以时间轴形式展示工作经历、教育背景与重要成就，倒序排列（最新在上）。

**Props**

| 名称 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|-----|-------|------|
| `items` | `TimelineItem[]` | 否 | 内置 mock | 时间线条目数组 |

**TimelineItem 数据结构**

```ts
type TimelineType = "work" | "education" | "achievement";

interface TimelineItem {
  id: string;
  type: TimelineType;
  startDate: string;       // 形如 "2023.06"
  endDate?: string;        // 缺省视作单点事件，存在则展示区间
  title: string;           // 职位 / 学位 / 成就名
  org: string;             // 公司 / 学校 / 来源
  description?: string;
  tags?: string[];
}
```

**视觉规范**

- 主轴：`width 1px`，颜色 `var(--color-border-light)`，左偏移 `16px`（移动）/`20px`（PC）
- 节点（圆形 Icon Badge）：尺寸 `36–40px`，背景 `var(--color-bg)`，边框 `1px var(--color-border-light)`
- 节点图标：
  - `work` → `Briefcase`
  - `education` → `GraduationCap`
  - `achievement` → `Award`
- 内容卡片：`rounded-xl` + `border` + `padding 16-20px`，hover `shadow-card-hover`
- 类型标签（type chip）使用对应状态色的浅色底：

| 类型 | 文字色 | 背景色 |
|-----|------|-------|
| work | `--color-accent` | `--color-accent-soft` |
| education | `--color-success` | `rgba(16,185,129,0.10)` |
| achievement | `--color-warning` | `rgba(245,158,11,0.10)` |

**结构**

```
Timeline (section)
├── Header  (h2 + 副标题)
└── ol  (列表, 主轴线 absolute)
    └── li (relative pl-12 sm:pl-16)
        ├── Icon Badge (absolute left-0)
        └── Card
            ├── 时间区间 (time chip) + 类型 chip
            ├── h3 标题
            ├── 组织机构
            ├── 描述
            └── 标签组
```

**响应式**

- 移动端：`pl-12`，节点 `36px`
- 桌面端：`pl-16`，节点 `40px`
- 单列布局，不换行

**无障碍**

- 使用 `<ol>` + `<li>`，类型 chip 用 `aria-label`
- 时间使用 `<time>` 语义标签
- 节点图标 Badge 包含 `aria-label="工作经历"` 等

---

## 四、状态规范汇总

### 4.1 按钮（基于 shadcn `Button`）

| 变体 | 默认 | Hover | Disabled |
|-----|------|-------|---------|
| Primary | `bg-#1A1A1A text-white` | `bg-#333333` | `bg-#E5E5E5 text-#999` |
| Secondary | `bg-#F5F5F5 text-#1A1A1A` | `bg-#EEEEEE` | 同上 |
| Outline | `border-#D4D4D4 text-#1A1A1A` | `bg-#F5F5F5` | 同上 |
| Ghost | 无背景 | `bg-#F5F5F5` | — |

> 所有按钮高度 `40–48px`，内边距 `12px 24px`，圆角 `6px`。

### 4.2 输入框

| 状态 | 边框 | 背景 |
|-----|------|------|
| 默认 | `1px solid #D4D4D4` | `#FFFFFF` |
| 聚焦 | `2px solid #0066FF` + ring | `#FFFFFF` |
| 错误 | `2px solid #EF4444` | `#FFFFFF` |
| 禁用 | `1px solid #E5E5E5` | `#F5F5F5` |

### 4.3 卡片

| 状态 | 阴影 | Transform |
|-----|------|-----------|
| 默认 | 无 | — |
| Hover（信息卡） | `0 4px 12px rgba(0,0,0,0.06)` | — |
| Hover（项目卡） | `0 8px 24px rgba(0,0,0,0.08)` | `translate-y(-4px)` |
| 选中 | `border 2px #0066FF` | — |

---

## 五、响应式断点

| 名称 | 范围 | Tailwind | 适配策略 |
|------|------|---------|---------|
| Mobile | `< 640px` | 默认 | 单列、底部 Tab、内边距 16px |
| Tablet | `640–1024px` | `sm:` ~ `md:` | 2 列、顶部导航出现 |
| Desktop | `≥ 1024px` | `lg:` | 3 列、最大宽度 1152px |

---

## 六、无障碍（A11y）规范

1. **语义化标签**：`<header>`、`<nav>`、`<main>`、`<section>`、`<article>`、`<footer>` 必须正确使用。
2. **键盘可达**：所有交互元素须可 Tab 聚焦，焦点环 `outline 2px solid #0066FF`。
3. **ARIA 标签**：图标按钮必须含 `aria-label`（如 Mic / Send）。
4. **对比度**：正文 ≥ 4.5:1，UI 控件 ≥ 3:1。
5. **图片替代文本**：`<ImageWithFallback>` 必须提供 `alt`。
6. **触摸目标**：移动端可点击区域 ≥ 44×44px。

---

## 七、命名与代码规范

- **文件名**：组件 PascalCase（`HeroCard.tsx`），Hook camelCase（`useFoo.ts`）。
- **导出**：组件统一**具名导出**（除 `App` 默认导出外）。
- **样式**：优先 Tailwind 原子类；颜色用十六进制配合设计令牌；避免 inline style。
- **图标**：统一 `lucide-react`，默认尺寸 `size-4` (16px) 或 `size-5` (20px)。
- **图片**：统一使用 `components/figma/ImageWithFallback`。
- **目录结构**：

```
src/app/
├── App.tsx
└── components/
    ├── Navbar.tsx
    ├── MobileTabBar.tsx
    ├── HeroCard.tsx
    ├── FeaturedProjects.tsx
    ├── AgentPrompt.tsx
    ├── COMPONENT_SPEC.md      ← 本文档
    ├── figma/
    └── ui/                    ← shadcn 基础组件
```

---

## 八、基础组件规范

### 8.1 EmptyState — 空态

**Props**

| 名称 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `icon` | `LucideIcon` | 是 | 状态图标 |
| `title` | `string` | 是 | 标题 |
| `description` | `string` | 否 | 副标题 |
| `action` | `{ label, onClick }` | 否 | 操作按钮 |

**预设场景（PRD §8.2）**

| 场景 | 图标 | 标题 | 描述 |
|-----|------|------|------|
| 无作品 | `FolderOpen` | 暂无作品 | 管理员尚未添加任何作品 |
| 无预约 | `Calendar` | 暂无预约 | 还没有人预约面试 |
| 无通知 | `Bell` | 暂无通知 | 您没有新的消息 |
| 搜索无结果 | `Search` | 未找到相关内容 | 请尝试其他关键词 |

### 8.2 Skeleton — 骨架屏

直接使用 shadcn `Skeleton`：`<Skeleton className="h-4 w-2/3" />`。

- 列表容器：3 项默认占位
- 项目卡片占位：`aspect-[16/10]` 封面 + 3 行文本骨架
- 不要在骨架上叠加额外动画，使用组件内置 pulse

### 8.3 Toast — 全局通知

通过 `sonner` 提供。在 `App` 顶层挂载 `<Toaster position="top-center" />`，业务侧使用：

```ts
import { toast } from "sonner";

toast.success("操作成功");
toast.error("网络错误", { description: "请检查网络后重试" });
toast.message("信息提示", { description: "..." });
```

| 类型 | 用途 | 默认时长 |
|-----|------|---------|
| `success` | 操作成功 | 4s |
| `error` | 错误提示 | 5s |
| `message` | 普通信息 | 4s |
| `loading` | 异步操作中 | 手动关闭 |

**位置**：`top-center`（PRD §8.3 网络错误规范）。

---

## 九、后续优化路线

| 优先级 | 项 | 状态 |
|-------|----|------|
| ~~P0~~ | 抽离 `ProjectCard` 为独立组件 | ✅ v1.1 已完成 |
| ~~P0~~ | `HeroCard` 接受 `profile` Props | ✅ v1.1 已完成 |
| ~~P0~~ | 设计令牌入驻 `theme.css` | ✅ v1.1 已完成 |
| ~~P1~~ | `AgentPrompt` 增加 `onSend` / `onVoice` | ✅ v1.1 已完成 |
| ~~P1~~ | 增加 Skeleton / EmptyState / Toast | ✅ v1.1 已完成 |
| ~~P1~~ | 修正字号字重行高 + 字体族 | ✅ v1.1 已完成 |
| ~~P1~~ | `aria-current` + 焦点环 | ✅ v1.1 已完成 |
| ~~P1~~ | Z-index 层级 + reduced-motion | ✅ v1.1 已完成 |
| P2 | 接入 `motion/react` 做入场动画分级 | 待办 |
| P2 | 暗色模式 v2 | 待办 |
| P2 | Form 组件统一校验态规范 | 待办 |

---

*本文档与 `src/app/components/` 内组件保持同步，若有变更请同时更新本文件。*
