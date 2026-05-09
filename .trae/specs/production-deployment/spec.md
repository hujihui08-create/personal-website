# 生产环境部署 - Product Requirement Document

## Overview
- **Summary**: 将个人简介网站部署到生产服务器，配置域名、HTTPS 证书，确保服务稳定运行。
- **Purpose**: 完成从开发环境到生产环境的迁移，提供可公开访问的个人网站服务。
- **Target Users**: 网站访客、管理员

## Goals
- 实现 Docker Compose 一键部署所有服务
- 配置域名解析和 HTTPS 证书
- 确保生产环境安全配置
- 建立数据备份和恢复机制
- 实现服务自动重启和健康检查

## Non-Goals (Out of Scope)
- CI/CD 自动化部署流程（本次不涉及）
- 监控告警系统（本次不涉及）
- 日志收集系统（本次不涉及）

## Background & Context
项目已具备完整的 docker-compose.yml 配置，包含前端、后端、PostgreSQL、Redis、MinIO 和 Nginx 服务。现在需要将其部署到生产服务器，并配置域名和 HTTPS。

## Functional Requirements
- **FR-1**: Docker Compose 一键启动所有服务
- **FR-2**: 域名解析配置
- **FR-3**: Let's Encrypt HTTPS 证书配置与自动续期
- **FR-4**: 生产环境安全配置（密码、密钥等）
- **FR-5**: 数据库持久化和备份
- **FR-6**: 服务自动重启和健康检查

## Non-Functional Requirements
- **NFR-1**: 服务启动时间 < 5 分钟
- **NFR-2**: HTTPS 证书自动续期
- **NFR-3**: 数据库每日自动备份
- **NFR-4**: 服务故障自动重启

## Constraints
- **Technical**: 使用 Docker + Docker Compose 部署
- **Business**: 使用 Let's Encrypt 免费证书
- **Dependencies**: 需要服务器有公网 IP 和域名

## Assumptions
- 服务器已安装 Docker 和 Docker Compose
- 域名已购买并可配置 DNS
- 服务器操作系统为 Linux（推荐 Ubuntu 20.04+）
- 有服务器的 SSH 访问权限

## Acceptance Criteria

### AC-1: Docker Compose 一键部署
- **Given**: 服务器已安装 Docker 和 Docker Compose
- **When**: 执行 `docker-compose up -d`
- **Then**: 所有服务（frontend、backend、postgres、redis、minio、nginx）成功启动
- **Verification**: `programmatic`

### AC-2: 域名正常访问
- **Given**: 域名 DNS 已解析到服务器 IP
- **When**: 在浏览器访问域名
- **Then**: 网站正常显示
- **Verification**: `human-judgment`

### AC-3: HTTPS 正常工作
- **Given**: 证书已配置
- **When**: 访问 https://your-domain.com
- **Then**: 显示安全锁标志，证书有效
- **Verification**: `human-judgment`

### AC-4: HTTP 自动跳转 HTTPS
- **Given**: HTTPS 已配置
- **When**: 访问 http://your-domain.com
- **Then**: 自动重定向到 https
- **Verification**: `programmatic`

### AC-5: 数据持久化
- **Given**: 服务已运行并写入数据
- **When**: 重启 Docker 服务
- **Then**: 数据不丢失
- **Verification**: `programmatic`

### AC-6: 服务健康检查
- **Given**: 服务正常运行
- **When**: 访问 /health 端点
- **Then**: 返回 200 状态码
- **Verification**: `programmatic`

## Open Questions
- [ ] 域名是什么？
- [ ] 服务器的操作系统和配置？
- [ ] 是否需要配置邮件服务？
- [ ] 是否需要配置 LLM API（用于 Agent 功能）？
