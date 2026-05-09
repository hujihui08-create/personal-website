# 预约面试功能修复 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 分析并修复预约页面的表单处理逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 仔细检查 BookingPage 组件的代码，确认问题根源
  - 确保日期和时段选择器不受必填项填写状态影响
  - 确保只有点击提交按钮才会触发预约提交
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-1.1: 验证 DatePicker 和 TimePicker 在未填写必填项时可以正常打开
  - `programmatic` TR-1.2: 验证选择日期不会触发 handleSubmit
  - `programmatic` TR-1.3: 验证选择时段不会触发 handleSubmit
  - `programmatic` TR-1.4: 验证只有点击提交按钮才会触发 handleSubmit
- **Notes**: 重点检查表单事件处理和组件交互逻辑

## [ ] Task 2: 确保表单验证功能正常工作
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 验证 validateForm 函数逻辑正确
  - 确保表单验证只在点击提交时触发
  - 确保验证错误提示正常显示
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `programmatic` TR-2.1: 验证未填写必填项时点击提交会显示错误提示
  - `programmatic` TR-2.2: 验证填写完整必填项后可以正常提交
- **Notes**: 保持现有验证规则不变

## [ ] Task 3: 更新类型定义
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 CreateBookingRequest 接口中新增 contact_name 字段
  - 在 Booking 接口中新增 contact_name 字段
  - 将 contact_phone 从可选改为必填
- **Acceptance Criteria Addressed**: [AC-6, AC-8]
- **Test Requirements**:
  - `programmatic` TR-3.1: 验证类型定义更新正确
- **Notes**: 需要同时更新前端和后端类型定义

## [ ] Task 4: 更新预约页面表单
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 在表单中新增联系人输入框
  - 将联系电话标记为必填
  - 调整字段顺序：联系人、联系邮箱、联系电话放在选择日期上方
  - 更新表单状态管理
  - 更新验证逻辑
- **Acceptance Criteria Addressed**: [AC-6, AC-7, AC-8, AC-9]
- **Test Requirements**:
  - `programmatic` TR-4.1: 验证联系人输入框正常显示
  - `programmatic` TR-4.2: 验证联系电话标记为必填
  - `programmatic` TR-4.3: 验证联系人字段验证正常
  - `programmatic` TR-4.4: 验证联系电话字段验证正常
  - `programmatic` TR-4.5: 验证字段顺序正确（联系人、邮箱、电话在日期上方）
- **Notes**: 保持表单布局一致性

## [ ] Task 5: 更新后端 API（如果需要）
- **Priority**: P1
- **Depends On**: Task 3
- **Description**: 
  - 检查并更新后端模型定义
  - 确保后端 API 支持新增字段
- **Acceptance Criteria Addressed**: [AC-6, AC-8]
- **Test Requirements**:
  - `programmatic` TR-5.1: 验证后端 API 支持新字段
- **Notes**: 仅在需要时执行
