
# 首页布局优化计划

## 需求分析
1. 移除工作经历的外层卡片容器
2. 使工作经历与精选作品的标题和内容对齐
3. 统一字体样式

## 代码分析

### 当前状态
- **精选作品**（`home/index.tsx`）：
  - 使用 `motion.section` 容器，无背景卡片
  - 标题：`text-xl sm:text-2xl font-bold`
  - 有 flex 布局的标题行（含"查看全部"链接）

- **工作经历**（`WorkExperienceTimeline.tsx`）：
  - 有外层卡片：`bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] shadow-[var(--shadow-card-hover)]`
  - 标题：`text-xl font-bold`（缺少响应式 `sm:text-2xl`）

## 修改方案

### 1. 修改 `WorkExperienceTimeline.tsx`
**文件路径**: `frontend/src/components/WorkExperienceTimeline.tsx`

**修改内容**:
1. 移除外层卡片的背景、边框、圆角、padding 和 shadow
2. 更新标题样式，与精选作品一致（`text-xl sm:text-2xl`）
3. 同样修改骨架屏（TimelineSkeleton）
4. 保持内部内容布局不变

**具体修改**:
- 主容器：移除背景相关类名，保持简洁的 section 结构
- 标题：添加 `sm:text-2xl` 响应式样式
- 骨架屏：同样移除外层卡片

## 修改文件
- `frontend/src/components/WorkExperienceTimeline.tsx`
