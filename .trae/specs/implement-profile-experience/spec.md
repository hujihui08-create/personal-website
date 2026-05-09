# Profile & Work Experience Feature Spec

## Why
首页无法展示个人简介和工作经历，管理后台缺少个人资料编辑和工作经历管理功能，无法满足个人品牌展示和求职场景的核心需求。

## What Changes
- 新增 `profiles`、`work_experiences`、`experience_projects` 数据库表
- 实现个人资料和工作经历的后端 CRUD API
- 实现简历文件上传/下载 API（基于 MinIO）
- 实现首页个人简介卡片（HeroCard）组件
- 实现工作经历时间线组件
- 实现管理后台个人资料编辑页面
- 实现管理后台工作经历管理页面
- 更新前端类型定义以对齐 PRD 字段规范
- 添加缓存策略（profile/experiences 使用 React Query staleTime）
- 集成交互动画（Framer Motion 淡入、悬停、滚动渐入）

## Impact
- Affected specs: 个人展示与工作经历
- Affected code:
  - backend: `internal/model/`, `internal/repository/`, `internal/service/`, `internal/handler/`, `internal/router/`, `cmd/server/main.go`, `scripts/init-db.sql`, `scripts/seed-data.sql`
  - frontend: `src/types/`, `src/api/`, `src/pages/`, `src/components/`, `src/hooks/`, `src/stores/`, `src/App.tsx`

## ADDED Requirements

### Requirement: Profile Management
The system SHALL allow displaying and editing personal profile information.

#### Scenario: View public profile
- **WHEN** user visits the home page
- **THEN** system displays profile card with name, title, bio, avatar, skills, social links
- **THEN** system provides resume download button

#### Scenario: Edit profile in admin
- **WHEN** admin navigates to profile edit page
- **THEN** system displays form with all profile fields pre-filled
- **THEN** system allows avatar upload via MinIO
- **THEN** system allows saving profile changes

### Requirement: Work Experience Management
The system SHALL display and manage work experience timeline.

#### Scenario: View work timeline
- **WHEN** user visits the home page
- **THEN** system displays work experiences in reverse chronological order
- **THEN** each experience shows company, position, date range, description
- **THEN** associated projects are displayed as clickable tags

#### Scenario: Admin CRUD experiences
- **WHEN** admin navigates to experience management page
- **THEN** system displays list of all experiences with edit/delete actions
- **THEN** system supports create/edit form with all fields
- **THEN** system supports reorder through sort_order field

### Requirement: Resume Upload/Download
The system SHALL support resume file operations.

#### Scenario: Download resume
- **WHEN** user clicks "下载简历" button
- **THEN** system retrieves resume file URL from MinIO
- **THEN** system triggers file download with progress indicator

#### Scenario: Upload resume (admin)
- **WHEN** admin uploads a resume file in admin panel
- **THEN** system stores file in MinIO and saves URL reference
- **THEN** system supports PDF format

### Requirement: Interactive Animations
The system SHALL provide smooth user interactions.

#### Scenario: Page load animation
- **WHEN** page loads
- **THEN** content fades in with Framer Motion

#### Scenario: Card hover
- **WHEN** user hovers over cards/experience items
- **THEN** card elevates with shadow effect

#### Scenario: Scroll reveal
- **WHEN** user scrolls to work experience section
- **THEN** items animate in sequentially

#### Scenario: Expand/Collapse
- **WHEN** user clicks "展开查看详情" on an experience
- **THEN** description expands with smooth transition

## MODIFIED Requirements

### Requirement: Frontend Type Definitions
The existing `WorkExperience` type SHALL be updated to match the PRD schema:
- `company` → `company_name`
- `startDate` → `start_date`
- `endDate` → `end_date`
- Remove `current`, add `projects` association
- Add `Profile` type with name, title, bio, avatar_url, github_url, linkedin_url, email, skills

### Requirement: Cache Strategy
The system SHALL implement React Query with appropriate staleTime:
- Profile data: `staleTime: 3600000` (1 hour)
- Experiences list: `staleTime: 3600000` (1 hour)
