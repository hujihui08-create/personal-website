# 修复工作经历类型保存问题

## 问题分析
保存工作经历时，类型字段没有正确保存，总是显示为"工作"。

## 问题原因
1. **后端**: `CreateExperienceRequest` 和 `UpdateExperienceRequest` 中 `Type` 字段是 `*string` 类型
2. **前端**: 发送的是普通字符串类型，可能在序列化时出现问题
3. **数据格式不匹配**: 前后端数据类型不一致导致类型信息丢失

## 修复方案

### 1. 修改后端请求结构
- 将 `CreateExperienceRequest.Type` 从 `*string` 改为 `string`
- 保持默认值为 "work" 的逻辑
- 更新 `UpdateExperienceRequest` 保持 `*string` 用于部分更新

### 2. 确保前端正确发送数据
- 验证前端发送的 payload 包含正确的 type 字段
- 确保类型字符串正确传递

### 3. 测试验证
- 测试创建新经历时类型正确保存
- 测试编辑经历时类型正确更新
- 验证前台展示正确显示类型

## 要修改的文件
1. `backend/internal/service/work_experience.go`
2. 可能需要调整前端数据发送逻辑

## 风险
- 低风险，只涉及数据类型调整
- 保持向后兼容
