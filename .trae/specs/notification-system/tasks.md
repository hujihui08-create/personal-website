# 通知系统 - 实施计划（分解后的优先级任务列表）

## [ ] 任务 1：创建后端通知数据模型
- **优先级**：P0
- **依赖**：无
- **描述**：
  - 创建 Notification 模型结构体
  - 添加数据库迁移
- **验收标准**：AC-1
- **测试要求**：
  - `programmatic` 验证表结构和字段定义
  - `programmatic` 验证索引创建
- **备注**：遵循 GORM 约定

## [ ] 任务 2：创建后端通知 Repository
- **优先级**：P0
- **依赖**：任务 1
- **描述**：
  - 实现通知数据访问层
  - 支持创建通知、查询列表、标记已读、全部已读、统计未读数量
- **验收标准**：AC-1, AC-2, AC-3, AC-4, AC-5
- **测试要求**：
  - `programmatic` 测试各 Repository 方法
- **备注**：

## [ ] 任务 3：创建后端通知 Service
- **优先级**：P0
- **依赖**：任务 2
- **描述**：
  - 实现通知业务逻辑层
  - 封装通知创建、查询、标记已读等操作
- **验收标准**：AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- **测试要求**：
  - `programmatic` 测试 Service 方法
- **备注**：

## [ ] 任务 4：创建后端通知 Handler
- **优先级**：P0
- **依赖**：任务 3
- **描述**：
  - 实现通知 API 端点
  - GET /api/notifications - 获取列表
  - PUT /api/notifications/:id/read - 标记已读
  - PUT /api/notifications/read-all - 全部已读
  - GET /api/notifications/unread - 未读数量
- **验收标准**：AC-2, AC-3, AC-4, AC-5
- **测试要求**：
  - `programmatic` 测试各 API 端点响应
- **备注**：使用认证中间件保护端点

## [ ] 任务 5：注册通知路由
- **优先级**：P0
- **依赖**：任务 4
- **描述**：
  - 在 router.go 中注册通知路由
  - 初始化 NotificationRepository、Service、Handler
- **验收标准**：AC-2, AC-3, AC-4, AC-5
- **测试要求**：
  - `programmatic` 验证路由可访问
- **备注**：

## [ ] 任务 6：在预约流程中集成通知触发
- **优先级**：P0
- **依赖**：任务 3
- **描述**：
  - 在 BookingService 的 CreateBooking 中触发新预约通知
  - 在 UpdateBookingStatus 中触发状态变更通知
- **验收标准**：AC-6, AC-7
- **测试要求**：
  - `programmatic` 验证通知被正确创建
- **备注**：第一阶段同步创建通知，后续可优化为异步

## [ ] 任务 7：创建前端通知类型定义
- **优先级**：P0
- **依赖**：无
- **描述**：
  - 在 src/types/index.ts 中添加 Notification 接口
  - 添加相关分页响应类型
- **验收标准**：AC-8
- **测试要求**：
  - `programmatic` TypeScript 类型检查
- **备注**：与后端模型保持一致

## [ ] 任务 8：创建前端通知 API 客户端
- **优先级**：P0
- **依赖**：任务 7
- **描述**：
  - 在 src/api/ 下创建 notifications.ts
  - 封装通知相关 API 调用
- **验收标准**：AC-2, AC-3, AC-4, AC-5
- **测试要求**：
  - `programmatic` 类型检查和基本功能验证
- **备注**：复用 api/client.ts 的基础客户端

## [ ] 任务 9：创建前端通知列表页面
- **优先级**：P0
- **依赖**：任务 8
- **描述**：
  - 创建 src/pages/admin/NotificationManagePage.tsx
  - 实现通知列表展示
  - 实现标记单条已读功能
  - 实现全部标记已读功能
  - 实现加载更多/分页
  - 遵循设计规范使用设计令牌
- **验收标准**：AC-8
- **测试要求**：
  - `human-judgment` UI 检查和交互测试
- **备注**：参考其他管理页面的风格

## [ ] 任务 10：在 AdminLayout 中添加通知导航
- **优先级**：P0
- **依赖**：任务 9
- **描述**：
  - 在 AdminLayout 的导航项中添加通知入口
  - 显示未读数量徽章
- **验收标准**：AC-9
- **测试要求**：
  - `human-judgment` UI 检查
- **备注**：使用 React Query 定期刷新未读数量

## [ ] 任务 11：在 App.tsx 中添加通知页面路由
- **优先级**：P0
- **依赖**：任务 9
- **描述**：
  - 添加 /admin/notifications 路由
- **验收标准**：AC-8
- **测试要求**：
  - `programmatic` 路由可达性验证
- **备注**：使用 ProtectedRoute 保护

## [ ] 任务 12：添加数据库初始化脚本
- **优先级**：P1
- **依赖**：任务 1
- **描述**：
  - 在 scripts/init-db.sql 中添加 notifications 表
  - 添加相关索引
- **验收标准**：AC-1
- **测试要求**：
  - `programmatic` 验证 SQL 可执行
- **备注**：
