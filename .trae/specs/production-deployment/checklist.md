# 生产环境部署 - Verification Checklist

- [x] Checkpoint 1: docker-compose.yml 文件包含所有必需服务（frontend、backend、postgres、redis、minio、nginx、certbot）
- [x] Checkpoint 2: Nginx 配置支持 HTTPS 和 HTTP 自动跳转
- [x] Checkpoint 3: 存在 .env.production 环境变量模板
- [x] Checkpoint 4: 前端构建配置使用相对路径 /api
- [x] Checkpoint 5: 存在数据库备份脚本
- [x] Checkpoint 6: 部署指南文档完整且清晰
- [x] Checkpoint 7: docker-compose config 验证通过
- [x] Checkpoint 8: 所有数据卷配置正确
- [x] Checkpoint 9: 服务重启策略配置为 unless-stopped
- [x] Checkpoint 10: 健康检查配置正确
