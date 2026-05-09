# Tasks

## Task 1: 数据库迁移 - 新增 profiles/work_experiences/experience_projects 表
- [x] 在 `scripts/init-db.sql` 中添加 profiles, work_experiences, experience_projects 表的 DDL
- [x] 在 `scripts/seed-data.sql` 中添加示例种子数据
- [x] 在 `backend/cmd/server/main.go` 中添加 GORM AutoMigrate 新模型

## Task 2: 后端模型层 - Profile & WorkExperience 模型定义
- [x] 创建 `backend/internal/model/profile.go` - Profile 结构体（name, title, bio, avatar_url, github_url, linkedin_url, email, skills）
- [x] 创建 `backend/internal/model/work_experience.go` - WorkExperience + ExperienceProject 结构体

## Task 3: 后端仓库层 - Profile & WorkExperience Repository
- [x] 创建 `backend/internal/repository/profile.go` - ProfileRepository（Get/Update/Upsert）
- [x] 创建 `backend/internal/repository/work_experience.go` - WorkExperienceRepository（List/Create/Update/Delete/Reorder）

## Task 4: 后端服务层 - Profile & WorkExperience Service
- [x] 创建 `backend/internal/service/profile.go` - ProfileService（GetProfile/UpdateProfile/UploadAvatar）
- [x] 创建 `backend/internal/service/work_experience.go` - ExperienceService（List/Create/Update/Delete/Reorder）
- [x] 创建 `backend/internal/service/resume.go` - ResumeService（GetResumeURL/UploadResume via MinIO）

## Task 5: 后端 Handler + 路由注册
- [x] 创建 `backend/internal/handler/profile.go` - ProfileHandler（Get/Update/UploadAvatar）
- [x] 创建 `backend/internal/handler/work_experience.go` - ExperienceHandler（List/Create/Update/Delete/Reorder）
- [x] 修改 `backend/internal/router/router.go` - 注册所有新路由

## Task 6: 前端类型定义 + API 层
- [x] 更新 `frontend/src/types/index.ts` - 更新 WorkExperience, 新增 Profile 类型
- [x] 创建 `frontend/src/api/profile.ts` - Profile API（get/update/uploadAvatar）
- [x] 创建 `frontend/src/api/experiences.ts` - Experience API（getAll/create/update/delete/reorder）
- [x] 更新 `frontend/src/api/index.ts` - 导出新 API

## Task 7: 前端 Hooks（React Query 数据获取）
- [x] 创建 `frontend/src/hooks/useProfile.ts` - useProfile hook（staleTime: 1h）
- [x] 创建 `frontend/src/hooks/useExperiences.ts` - useExperiences hook（staleTime: 1h）
- [x] 更新 `frontend/src/hooks/index.ts` - 导出新 hooks

## Task 8: 前端首页组件 - HeroCard + 工作经历时间线
- [x] 创建 `frontend/src/components/HeroCard.tsx` - 个人简介卡片（头像、姓名、职位、简介、技能标签、社交链接、操作按钮）
- [x] 创建 `frontend/src/components/WorkExperienceTimeline.tsx` - 工作经历时间线组件
- [x] 创建 `frontend/src/pages/home/index.tsx` - 首页页面，组合 HeroCard + Timeline

## Task 9: 管理后台页面 - 个人资料编辑 + 工作经历管理
- [x] 创建 `frontend/src/pages/admin/ProfileEditPage.tsx` - 个人资料编辑表单（头像上传、基本信息、社交链接、技能标签）
- [x] 创建 `frontend/src/pages/admin/ExperienceManagePage.tsx` - 工作经历列表 + 创建/编辑表单
- [x] 创建 `frontend/src/stores/profile.ts` - Profile Zustand store

## Task 10: 路由配置 + 集成
- [x] 更新 `frontend/src/App.tsx` - 添加 Home 路由、Admin ProfileEdit/ExperienceManage 路由
- [x] TypeScript 类型检查验证

# Task Dependencies
- Task 1 (数据库迁移) → Task 2 (模型层) → Task 3 (仓库层) → Task 4 (服务层) → Task 5 (Handler+路由)
- Task 6 (类型+API) → Task 7 (Hooks) → Task 8 (首页组件) + Task 9 (管理后台) → Task 10 (路由集成)
