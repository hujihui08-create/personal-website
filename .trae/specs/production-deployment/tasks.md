# 生产环境部署 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 完善生产环境 docker-compose.yml 配置
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 添加 Certbot 服务用于自动获取和续期 Let's Encrypt 证书
  - 配置生产环境的 Nginx 支持 HTTPS
  - 配置数据卷持久化
- **Acceptance Criteria Addressed**: AC-1, AC-5
- **Test Requirements**:
  - `programmatic` TR-1.1: docker-compose config 验证通过
  - `programmatic` TR-1.2: 所有服务定义正确
- **Notes**: 使用 Certbot 的 webroot 模式

## [x] Task 2: 完善 Nginx 配置支持 HTTPS
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 更新 nginx/conf.d/default.conf 支持 HTTPS
  - 配置 HTTP 自动跳转 HTTPS
  - 配置安全头
- **Acceptance Criteria Addressed**: AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-2.1: Nginx 配置语法检查通过
  - `human-judgement` TR-2.2: 访问 HTTP 自动跳转到 HTTPS
- **Notes**: 预留证书文件路径

## [x] Task 3: 创建生产环境环境变量模板
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建 .env.production 模板
  - 配置生产环境所需的所有环境变量
  - 包含强密码和密钥提示
- **Acceptance Criteria Addressed**: AC-1, FR-4
- **Test Requirements**:
  - `programmatic` TR-3.1: 所有必需变量都有定义
  - `human-judgement` TR-3.2: 模板包含清晰的说明
- **Notes**: 不要提交真实密钥，只留模板

## [x] Task 4: 创建数据库备份脚本
- **Priority**: P1
- **Depends On**: None
- **Description**:
  - 创建 PostgreSQL 每日备份脚本
  - 配置备份保留策略
- **Acceptance Criteria Addressed**: FR-5
- **Test Requirements**:
  - `programmatic` TR-4.1: 备份脚本可执行
  - `programmatic` TR-4.2: 备份文件正确生成
- **Notes**: 备份文件存储在单独的目录

## [x] Task 5: 创建部署指南文档
- **Priority**: P1
- **Depends On**: Task 1, Task 2, Task 3, Task 4
- **Description**:
  - 创建完整的部署步骤文档
  - 包含服务器准备、域名解析、证书获取、服务启动等
  - 包含常见问题排查
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `human-judgement` TR-5.1: 文档清晰易懂
  - `human-judgement` TR-5.2: 步骤完整可操作
- **Notes**: 使用 Markdown 格式

## [x] Task 6: 更新前端 API 基础 URL 配置
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 确保前端构建时使用相对路径或可配置的 API 地址
  - 更新 Vite 配置支持生产环境
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-6.1: 前端构建成功
  - `programmatic` TR-6.2: API 请求正确路由
- **Notes**: 使用相对路径 /api（已配置）

## [x] Task 7: 验证部署配置完整性
- **Priority**: P0
- **Depends On**: Task 1, Task 2, Task 3, Task 6
- **Description**:
  - 本地测试 docker-compose 配置
  - 验证所有服务正常启动
  - 验证 Nginx 配置正确
- **Acceptance Criteria Addressed**: AC-1, AC-6
- **Test Requirements**:
  - `programmatic` TR-7.1: docker-compose up -d 成功
  - `programmatic` TR-7.2: 所有容器健康状态正常
  - `programmatic` TR-7.3: /health 端点返回 200
