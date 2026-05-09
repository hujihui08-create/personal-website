# 作品展示功能 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 更新后端 Project 模型
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 更新 backend/internal/model/project.go，添加 type, start_date, end_date, summary, description, cover_image, images, github_url, demo_url, tags, sort_order 等字段
  - 参考 04-作品展示.md 和 work_experience.go 的实现
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-1.1: GORM 自动迁移时能创建正确的表结构
  - `human-judgement` TR-1.2: 字段命名符合 Go 和项目规范
- **Notes**: 需要处理 pq.StringArray 类型用于 tags 和 images

## [ ] Task 2: 实现后端 Project Repository
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建 backend/internal/repository/project.go
  - 实现 List（支持 type 筛选、分页）、GetByID、Create、Update、Delete、Reorder 方法
  - 参考 work_experience.go 的 repository 实现
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-2.1: List 方法支持按 type 筛选和分页
  - `human-judgement` TR-2.2: Repository 代码结构与现有代码一致

## [ ] Task 3: 实现后端 Project Service
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 创建 backend/internal/service/project.go
  - 定义响应结构体和请求结构体
  - 实现业务逻辑，参考 work_experience.go 的 service 实现
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `programmatic` TR-3.1: Service 方法返回正确的响应格式
  - `human-judgement` TR-3.2: Service 代码结构与现有代码一致

## [ ] Task 4: 实现后端 Project Handler 和路由
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 创建 backend/internal/handler/project.go
  - 更新 backend/internal/router/router.go，添加 /api/projects 路由
  - 实现所有 API 端点：GET /api/projects, GET /api/projects/:id, POST /api/projects, PUT /api/projects/:id, DELETE /api/projects/:id, PUT /api/projects/reorder
  - 参考 work_experience.go 的 handler 实现
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `programmatic` TR-4.1: 所有 API 端点正确返回 ApiResponse 格式
  - `human-judgement` TR-4.2: 路由配置正确，认证中间件应用正确

## [ ] Task 5: 更新前端 Project 类型定义和 API 调用
- **Priority**: P0
- **Depends On**: Task 4
- **Description**: 
  - 更新 frontend/src/types/index.ts 中的 Project 接口
  - 更新 frontend/src/api/projects.ts，添加正确的 API 调用方法
  - 确保与后端响应格式一致
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `programmatic` TR-5.1: TypeScript 类型检查通过
  - `human-judgement` TR-5.2: API 调用方法与现有 API 文件风格一致

## [ ] Task 6: 创建前端 useProjects Hook
- **Priority**: P0
- **Depends On**: Task 5
- **Description**: 
  - 创建 frontend/src/hooks/useProjects.ts
  - 实现 useProjects, useCreateProject, useUpdateProject, useDeleteProject, useReorderProjects
  - 参考 useExperiences.ts 的实现
- **Acceptance Criteria Addressed**: [AC-3, AC-6]
- **Test Requirements**:
  - `programmatic` TR-6.1: React Query 使用正确
  - `human-judgement` TR-6.2: Hook 代码结构与现有 hooks 一致

## [ ] Task 7: 创建 ProjectCard 组件
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 创建 frontend/src/components/ProjectCard.tsx
  - 实现作品卡片展示，支持悬停效果、查看详情遮罩
  - 响应式设计，适配移动端和桌面端
- **Acceptance Criteria Addressed**: [AC-3, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-7.1: 卡片样式符合设计规范
  - `human-judgement` TR-7.2: 响应式布局正确

## [ ] Task 8: 实现作品列表页
- **Priority**: P1
- **Depends On**: Task 7
- **Description**: 
  - 更新 frontend/src/pages/projects/index.tsx
  - 实现 Tab 切换（企业项目/个人项目）
  - 实现作品卡片网格展示
  - 实现分页功能
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - `human-judgement` TR-8.1: Tab 切换动画流畅
  - `human-judgement` TR-8.2: 空状态正确显示
  - `human-judgement` TR-8.3: 分页功能正常

## [ ] Task 9: 创建作品详情页和路由
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 创建 frontend/src/pages/projects/[id].tsx
  - 实现图片轮播组件
  - 实现作品详情展示（项目介绍、技术标签、GitHub/Demo 链接）
  - 更新 App.tsx 添加 /projects/:id 路由
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `human-judgement` TR-9.1: 图片轮播功能正常
  - `human-judgement` TR-9.2: Markdown 详情正确渲染
  - `human-judgement` TR-9.3: 响应式布局正确

## [ ] Task 10: 在首页添加精选作品模块
- **Priority**: P1
- **Depends On**: Task 7, Task 8
- **Description**: 
  - 更新 frontend/src/pages/home/index.tsx
  - 添加精选作品展示模块（取 sort_order 靠前的 3-4 个作品）
  - 使用 ProjectCard 组件展示
  - 添加「查看全部」链接跳转到 /projects
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `human-judgement` TR-10.1: 精选作品模块与现有页面风格一致
  - `human-judgement` TR-10.2: 点击卡片正确跳转到详情页

## [ ] Task 11: 创建后台作品管理页面
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 创建 frontend/src/pages/admin/ProjectManagePage.tsx
  - 实现作品列表、创建/编辑表单、删除确认、拖拽排序
  - 参考 ExperienceManagePage.tsx 的实现
  - 更新 App.tsx 路由
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `human-judgement` TR-11.1: 管理页面风格与现有后台一致
  - `human-judgement` TR-11.2: CRUD 功能正常
  - `human-judgement` TR-11.3: 图片上传功能正常（封面 + 多图）

## [ ] Task 12: 集成测试和收尾
- **Priority**: P2
- **Depends On**: Task 11, Task 10, Task 9
- **Description**: 
  - 完整测试流程
  - 检查所有功能是否符合要求
  - 确保与现有系统正确集成
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4, AC-5, AC-6]
- **Test Requirements**:
  - `human-judgement` TR-12.1: 所有验收标准通过
  - `programmatic` TR-12.2: 类型检查、lint 检查通过
