# 完善管理后台功能 - 任务清单

## [ ] Task 1: 创建简历 API 层
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 在 `frontend/src/api/` 中创建 `resume.ts`
  - 实现 getResume、uploadResume、deleteResume API 函数
  - 更新 `frontend/src/api/index.ts` 导出新 API
  - 遵循项目代码规范和类型定义
- **Acceptance Criteria Addressed**: FR-3, FR-4
- **Test Requirements**:
  - `programmatic` API 函数类型正确
  - `human-judgment` API 调用格式与后端一致
  - `programmatic` TypeScript 类型检查通过

## [ ] Task 2: 创建简历相关 Hooks
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 在 `frontend/src/hooks/` 中创建 `useResume.ts`
  - 实现 useResume、useUploadResume、useDeleteResume hooks
  - 使用 React Query，设置适当的 staleTime（参考现有 hooks）
  - 更新 `frontend/src/hooks/index.ts` 导出新 hooks
  - 使用 sonner toast 提供用户反馈
- **Acceptance Criteria Addressed**: FR-3, FR-4, NFR-2
- **Test Requirements**:
  - `programmatic` hooks 类型正确
  - `human-judgment` 数据获取和更新逻辑正确
  - `human-judgment` 错误提示使用 sonner toast

## [ ] Task 3: 创建 AdminSidebar 组件
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 在 `frontend/src/components/` 中创建 `AdminSidebar.tsx`
  - 实现固定侧边栏布局
  - 包含导航项：仪表盘（Home）、个人资料（User）、工作经历（Briefcase）、作品管理（FolderOpen）、退出登录（LogOut）
  - 当前页面高亮显示（`--color-accent`）
  - 支持响应式设计：Desktop 固定侧边栏，Mobile 可折叠
  - 使用 Framer Motion 实现动画效果（使用 `var(--duration-*)` 和 `var(--easing-standard)`）
  - 使用 lucide-react 图标，默认尺寸 size-4/size-5
  - 遵循无障碍规范：touch target ≥44px，aria-label，键盘可达
  - 使用设计令牌：`--color-bg` 背景，`--color-border-light` 边框，`--space-md` 间距
- **Acceptance Criteria Addressed**: FR-2, NFR-1, NFR-3, AC-6
- **Test Requirements**:
  - `human-judgment` 导航功能正常
  - `human-judgment` 响应式布局正常
  - `human-judgment` 所有样式使用设计令牌
  - `human-judgment` 遵循无障碍规范

## [ ] Task 4: 创建 AdminLayout 组件
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - 在 `frontend/src/components/` 中创建 `AdminLayout.tsx`
  - 整合 AdminSidebar 和内容区域
  - 提供统一的管理后台布局
  - 使用语义化标签 `<header>`、`<nav>`、`<main>`
  - 响应式布局：Desktop 最大宽度 1152px
  - 背景使用 `--color-bg-tertiary`
- **Acceptance Criteria Addressed**: FR-2, NFR-1, NFR-3, AC-6
- **Test Requirements**:
  - `human-judgment` 布局显示正常
  - `human-judgment` 所有样式使用设计令牌
  - `human-judgment` 遵循无障碍规范

## [ ] Task 5: 创建 Dashboard 页面
- **Priority**: high
- **Depends On**: Task 2, Task 4
- **Description**:
  - 在 `frontend/src/pages/admin/` 中创建 `DashboardPage.tsx`
  - 显示个人信息卡片
  - 显示数据统计（工作经历数量、项目数量等）
  - 提供快捷操作入口
  - 使用 AdminLayout 包裹
  - 使用设计令牌：`--radius-xl` 卡片圆角，`--shadow-card-hover` 悬停阴影
  - 加载状态使用 Skeleton 组件
  - 使用 Framer Motion 实现入场动画
- **Acceptance Criteria Addressed**: FR-1, AC-6
- **Test Requirements**:
  - `human-judgment` 页面显示正常
  - `human-judgment` 数据展示正确
  - `human-judgment` 所有样式使用设计令牌
  - `human-judgment` 加载状态使用 Skeleton

## [ ] Task 6: 在 ProfileEditPage 中添加简历上传功能
- **Priority**: medium
- **Depends On**: Task 2
- **Description**:
  - 修改 `frontend/src/pages/admin/ProfileEditPage.tsx`
  - 添加简历上传区域
  - 显示当前简历信息（文件名、上传时间、大小）
  - 提供下载和删除功能
  - 支持文件拖拽上传
  - 文件验证（PDF格式，最大10MB）
  - 使用 sonner toast 提供成功/错误反馈
  - 删除前有确认提示
  - 遵循按钮规范：Primary/Secondary/Outline 变体
  - 遵循输入框规范：默认/聚焦/错误/禁用状态
- **Acceptance Criteria Addressed**: FR-3, NFR-2, AC-6
- **Test Requirements**:
  - `programmatic` 文件上传成功
  - `human-judgment` UI 交互流畅
  - `human-judgment` 反馈使用 sonner toast
  - `human-judgment` 遵循按钮和输入框规范

## [ ] Task 7: 修复 HeroCard 中的简历下载链接
- **Priority**: medium
- **Depends On**: Task 2
- **Description**:
  - 修改 `frontend/src/components/HeroCard.tsx`
  - 使用 useResume hook 获取简历信息
  - 实现正确的下载功能
  - 无简历时隐藏或禁用下载按钮
  - 下载时使用 sonner toast 提供进度反馈
  - 保持现有 HeroCard 设计规范不变
- **Acceptance Criteria Addressed**: FR-4, AC-6
- **Test Requirements**:
  - `human-judgment` 下载功能正常
  - `human-judgment` 无简历时按钮正确处理
  - `human-judgment` 保持现有设计风格

## [ ] Task 8: 更新 App.tsx 路由结构
- **Priority**: high
- **Depends On**: Task 4, Task 5
- **Description**:
  - 修改 `frontend/src/App.tsx`
  - 使用 AdminLayout 包裹所有管理后台路由
  - 更新 Dashboard 路由使用新的 DashboardPage
  - 确保 ProtectedRoute 正常工作
  - 保持现有公开页面路由不变
- **Acceptance Criteria Addressed**: FR-1, FR-2, AC-6
- **Test Requirements**:
  - `programmatic` 路由跳转正常
  - `human-judgment` 布局显示正确
  - `programmatic` TypeScript 类型检查通过

## Task Dependencies
```
Task 1 (简历 API) → Task 2 (简历 Hooks) → Task 6 (ProfileEditPage 添加简历) → Task 7 (修复 HeroCard 下载)
Task 3 (AdminSidebar) → Task 4 (AdminLayout) → Task 5 (Dashboard) → Task 8 (更新路由)
```
