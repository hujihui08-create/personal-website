# Checklist - 个人展示与工作经历

## 数据库
- [x] `profiles` 表 DDL 正确（name, title, bio, avatar_url, github_url, linkedin_url, email, skills, updated_at）
- [x] `work_experiences` 表 DDL 正确（company_name, position, start_date, end_date, description, sort_order）
- [x] `experience_projects` 关联表 DDL 正确（experience_id, project_id, sort_order, UNIQUE 约束）
- [x] 种子数据包含示例 profile 和 work experience 记录

## 后端 API
- [x] `GET /api/profile` 返回个人资料（公开）
- [x] `PUT /api/profile` 更新个人资料（需登录）
- [x] `POST /api/profile/avatar` 上传头像（需登录）
- [x] `GET /api/experiences` 返回工作经历列表（按 sort_order 倒序，含关联项目）
- [x] `POST /api/experiences` 创建工作经历（需登录）
- [x] `PUT /api/experiences/:id` 更新工作经历（需登录）
- [x] `DELETE /api/experiences/:id` 删除工作经历（需登录）
- [x] `GET /api/resume` 获取简历下载链接（公开）
- [x] `POST /api/resume` 上传简历（需登录）
- [x] 所有响应使用统一 `ApiResponse` 包装格式

## 首页展示（PC端）
- [x] HeroCard 正确显示头像、姓名、职位、简介
- [x] 技能标签正确渲染
- [x] 社交链接（GitHub/LinkedIn/Email）可点击
- [x] 操作按钮（下载简历/查看作品/预约面试）存在并响应
- [x] 工作经历按时间倒序排列
- [x] 关联项目标签可点击跳转
- [x] 展开/收起功能正常（平滑过渡动画）

## 首页展示（移动端）
- [x] 移动端布局正确适配（< 640px）
- [x] 触摸目标 ≥ 44×44px

## 管理后台
- [x] 个人资料编辑页面可加载当前资料
- [x] 头像上传功能正常
- [x] 表单保存后数据持久化
- [x] 工作经历列表展示所有经历
- [x] 可创建新的工作经历
- [x] 可编辑已有工作经历
- [x] 可删除工作经历
- [x] 管理后台路由受 ProtectedRoute 保护

## 交互体验
- [x] 页面加载有淡入动画
- [x] 卡片悬停有上浮阴影效果
- [x] 工作经历滚动渐入动画
- [x] 展开/收起平滑过渡
- [x] 简历下载显示进度提示

## 缓存策略
- [x] Profile 数据 staleTime 设为 1 小时
- [x] Experiences 数据 staleTime 设为 1 小时

## 代码质量
- [x] TypeScript 类型检查通过（tsc --noEmit）
- [x] 前端类型定义与后端模型字段对齐
- [x] API 响应格式符合 `ApiResponse<T>` 规范
- [x] 遵循项目命名规范（PascalCase 组件、camelCase 变量等）
- [x] 使用设计令牌（CSS 变量）而非硬编码颜色
