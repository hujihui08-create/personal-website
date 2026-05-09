# 意向预约功能 - Product Requirement Document

## Overview
- **Summary**: 为求职者提供在线预约面试功能，支持时段选择、冲突校验；为管理员提供预约管理和时段设置功能
- **Purpose**: 简化面试预约流程，避免时间冲突，方便管理员高效管理面试安排
- **Target Users**: 求职者（公开预约页面）、网站管理员（后台管理功能）

## Goals
- 求职者能够选择日期和时段提交预约
- 系统能够自动校验和防止时段冲突
- 管理员能够查看、确认、拒绝和完成预约
- 管理员能够设置可预约的时段
- 页面支持PC端和移动端适配

## Non-Goals (Out of Scope)
- 不实现邮件通知功能（Step 6）
- 不实现支付功能
- 不实现视频会议集成
- 不实现日历同步功能

## Background & Context
- 项目已有完整的技术栈（Go + Gin + GORM + PostgreSQL/Redis 后端，React + TypeScript + Vite 前端）
- 已有用户认证系统和后台管理架构
- 遵循项目规范和设计规范进行开发

## Functional Requirements
- **FR-1**: 求职者能够查看某天的可预约时段
- **FR-2**: 求职者能够填写预约信息并提交
- **FR-3**: 系统能够防止重复预约和冲突
- **FR-4**: 管理员能够查看所有预约列表（支持筛选）
- **FR-5**: 管理员能够更新预约状态（确认、拒绝、完成、取消）
- **FR-6**: 管理员能够设置可预约的时段
- **FR-7**: 表单验证和防刷机制

## Non-Functional Requirements
- **NFR-1**: 预约提交响应时间 < 2秒
- **NFR-2**: 时段数据缓存5分钟
- **NFR-3**: 同一IP每小时最多提交5次预约
- **NFR-4**: 同一邮箱每天最多提交3次预约
- **NFR-5**: 页面在各种设备上正确显示

## Constraints
- **Technical**: 使用项目已有技术栈，遵循项目规范
- **Business**: 仅支持工作日预约（周一至周五）
- **Dependencies**: PostgreSQL 数据库、Redis 缓存

## Assumptions
- 数据库连接和 Redis 连接已配置
- 管理员认证系统已正常工作
- 项目现有架构可复用

## Acceptance Criteria

### AC-1: 查看可预约时段
- **Given**: 用户访问预约页面
- **When**: 选择一个日期
- **Then**: 显示该日期的所有可预约时段，已约时段标记为不可选
- **Verification**: `programmatic`
- **Notes**: 非工作日显示不可预约提示

### AC-2: 提交预约
- **Given**: 用户选择了可用时段并填写了完整信息
- **When**: 点击提交预约按钮
- **Then**: 预约成功保存，状态为pending，显示成功提示
- **Verification**: `programmatic`

### AC-3: 时段冲突校验
- **Given**: 有用户尝试预约已被占用的时段
- **When**: 提交预约
- **Then**: 提示时段已被预约，无法提交
- **Verification**: `programmatic`

### AC-4: 管理预约列表
- **Given**: 管理员已登录
- **When**: 访问预约管理页面
- **Then**: 显示所有预约列表，支持按状态筛选和按公司搜索
- **Verification**: `programmatic`

### AC-5: 更新预约状态
- **Given**: 管理员查看某个预约
- **When**: 点击确认/拒绝/完成/取消按钮
- **Then**: 预约状态更新成功
- **Verification**: `programmatic`

### AC-6: 时段设置
- **Given**: 管理员已登录
- **When**: 访问时段设置页面并修改设置
- **Then**: 设置保存成功，后续预约按新设置显示
- **Verification**: `programmatic`

### AC-7: 表单验证
- **Given**: 用户填写预约表单
- **When**: 提交时字段不符合要求
- **Then**: 显示相应的错误提示
- **Verification**: `human-judgment`

### AC-8: 响应式设计
- **Given**: 用户在不同设备上访问
- **When**: 查看预约页面
- **Then**: 页面在PC和移动端都能正常显示和操作
- **Verification**: `human-judgment`

## Open Questions
- 暂无
