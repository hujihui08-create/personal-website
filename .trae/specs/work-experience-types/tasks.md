# 工作经历类型功能 - 实施计划（分解和优先级化的任务列表）

## [ ] 任务 1: 更新后端数据模型
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 `backend/internal/model/work_experience.go` 中添加 Type 字段
  - 字段类型为 string，默认值为 'work'
  - 添加 GORM 标签：`gorm:"column:type;default:'work';not null"`
- **Acceptance Criteria Addressed**: AC-1, AC-5
- **Test Requirements**:
  - `programmatic` TR-1.1: 检查模型定义是否包含 Type 字段
  - `programmatic` TR-1.2: 验证默认值设置为 'work'
- **Notes**: 不需要创建新的迁移文件，GORM AutoMigrate 会自动处理

## [ ] 任务 2: 更新后端服务层
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 在 `backend/internal/service/work_experience.go` 中更新 ExperienceResponse，添加 Type 字段
  - 更新 CreateExperienceRequest，添加可选的 Type 字段
  - 更新 UpdateExperienceRequest，添加可选的 Type 字段
  - 更新 toExperienceResponse 函数，从模型中读取 Type 字段
  - 更新 Create 和 Update 函数，处理 Type 字段
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-2.1: 检查请求和响应结构是否包含 Type 字段
  - `programmatic` TR-2.2: 验证创建和更新时 Type 字段正确处理

## [ ] 任务 3: 更新前端类型定义
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 在 `frontend/src/types/index.ts` 中更新 WorkExperience 接口的 type 字段
  - 将类型从 `'work' | 'education' | 'achievement'` 改为 `'study' | 'internship' | 'work'`
  - 添加默认值处理
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-3.1: 检查类型定义是否更新为新的三种类型
  - `programmatic` TR-3.2: 验证类型定义包含默认值逻辑

## [ ] 任务 4: 更新前端 API 层
- **Priority**: P0
- **Depends On**: 任务 3
- **Description**:
  - 在 `frontend/src/api/experiences.ts` 中更新请求和响应类型
  - 添加 type 字段支持
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 检查 API 类型定义是否包含 type 字段

## [ ] 任务 5: 更新管理后台表单
- **Priority**: P0
- **Depends On**: 任务 4
- **Description**:
  - 在 `frontend/src/pages/admin/ExperienceManagePage.tsx` 中添加类型选择器
  - 添加下拉选择组件，包含"学习"、"实习"、"工作"三个选项
  - 更新表单数据结构，包含 type 字段
  - 默认值设置为 "work"
  - 在编辑时正确回显类型值
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgment` TR-5.1: 验证表单中显示类型下拉选择器
  - `human-judgment` TR-5.2: 验证添加和编辑时类型选择功能正常
  - `human-judgment` TR-5.3: 验证默认值为"工作"

## [ ] 任务 6: 更新前台时间线组件
- **Priority**: P0
- **Depends On**: 任务 3
- **Description**:
  - 在 `frontend/src/components/WorkExperienceTimeline.tsx` 中更新 typeConfig
  - 将配置改为三种类型：study（学习）、internship（实习）、work（工作）
  - 为每种类型配置对应的图标、标签、文本颜色和背景色
  - 确保向后兼容，旧数据默认按 work 类型处理
- **Acceptance Criteria Addressed**: AC-3, AC-5
- **Test Requirements**:
  - `human-judgment` TR-6.1: 验证不同类型显示不同的图标和样式
  - `human-judgment` TR-6.2: 验证没有 type 字段的旧数据默认显示为工作类型
  - `human-judgment` TR-6.3: 验证时间线节点的图标和标签正确显示

## [ ] 任务 7: 集成测试和验证
- **Priority**: P1
- **Depends On**: 任务 2, 任务 5, 任务 6
- **Description**:
  - 启动后端服务，验证 AutoMigrate 正常工作
  - 在管理后台测试添加不同类型的工作经历
  - 在前台验证不同类型的显示效果
  - 测试编辑功能，验证类型可以修改
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-7.1: 验证数据库表结构包含 type 字段
  - `human-judgment` TR-7.2: 端到端测试完整流程
