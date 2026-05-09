# 个人网站部署指南

## 概述

本指南将帮助您将个人网站部署到生产服务器上，使用 Docker Compose 进行容器化部署。

**目标服务器：**
- IP: 124.220.135.122
- 域名: dundun.store
- 系统: Ubuntu 20.04+

---

## 目录

1. [服务器准备](#1-服务器准备)
2. [域名解析](#2-域名解析)
3. [上传项目文件](#3-上传项目文件)
4. [配置环境变量](#4-配置环境变量)
5. [初始化服务](#5-初始化服务)
6. [获取 SSL 证书](#6-获取-ssl-证书)
7. [启动完整服务](#7-启动完整服务)
8. [配置自动备份](#8-配置自动备份)
9. [配置证书自动续期](#9-配置证书自动续期)
10. [验证部署](#10-验证部署)
11. [常见问题排查](#11-常见问题排查)

---

## 1. 服务器准备

### 1.1 连接到服务器

```bash
ssh root@124.220.135.122
```

### 1.2 更新系统

```bash
apt update && apt upgrade -y
```

### 1.3 安装 Docker

```bash
# 安装必要的依赖
apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io
```

### 1.4 安装 Docker Compose

```bash
# 下载 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

---

## 2. 域名解析

在您的域名注册商（如阿里云、腾讯云等）处，添加以下 DNS 记录：

| 类型 | 主机记录 | 记录值 | TTL |
|------|---------|--------|-----|
| A | @ | 124.220.135.122 | 600 |
| A | www | 124.220.135.122 | 600 |

**验证 DNS 解析：**

```bash
# 在本地终端执行
ping dundun.store
nslookup dundun.store
```

---

## 3. 上传项目文件

### 3.1 在服务器上创建项目目录

```bash
cd /opt
mkdir portfolio
cd portfolio
```

### 3.2 上传项目文件

**方式一：使用 SCP（推荐）**

在您的本地电脑上执行：

```bash
# 进入本地项目目录
cd /path/to/your/portfolio

# 上传项目文件到服务器
scp -r ./* root@124.220.135.122:/opt/portfolio/
```

**方式二：使用 Git（如果代码托管在 Git 仓库）**

```bash
# 在服务器上
git clone <your-repo-url> /opt/portfolio
cd /opt/portfolio
```

---

## 4. 配置环境变量

### 4.1 创建环境变量文件

```bash
cd /opt/portfolio

# 复制模板文件
cp .env.production.example .env.production
```

### 4.2 编辑环境变量

```bash
nano .env.production
```

填写以下内容（请替换为您的真实值）：

```env
# 域名配置
DOMAIN=dundun.store

# 数据库配置（请生成强密码）
DB_PASSWORD=your_strong_db_password_here

# MinIO 配置
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your_strong_minio_password_here
MINIO_BUCKET=portfolio

# JWT 认证配置（生成32位以上随机字符串）
JWT_SECRET=your_jwt_secret_key_here_at_least_32_chars
JWT_EXPIRATION=168h

# 邮件服务配置
EMAIL_PROVIDER=brevo
EMAIL_API_KEY=your_brevo_api_key_here
EMAIL_FROM=noreply@dundun.store
EMAIL_FROM_NAME=个人网站
EMAIL_ADMIN=your_email@example.com

# LLM API 配置（用于 Agent）
LLM_PROVIDER=dashscope
LLM_API_KEY=your_dashscope_api_key_here
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_CHAT_MODEL=qwen-plus
LLM_EMBEDDING_MODEL=text-embedding-v4
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.7
LLM_DAILY_LIMIT=50
```

**如何生成强密码？**

```bash
# 使用以下命令生成随机密码
openssl rand -base64 32
```

### 4.3 创建符号链接

```bash
ln -s .env.production .env
```

---

## 5. 初始化服务

### 5.1 创建必要的目录

```bash
cd /opt/portfolio
mkdir -p certbot/conf certbot/www backups
chmod +x scripts/backup-db.sh
```

### 5.2 先启动不包含 HTTPS 的服务

创建一个临时的 Nginx 配置用于获取证书：

```bash
cp nginx/conf.d/default.conf nginx/conf.d/default.conf.full

cat > nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name dundun.store www.dundun.store;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "Temporary server for SSL certificate issuance\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

### 5.3 启动基础服务

```bash
cd /opt/portfolio
docker-compose up -d nginx
```

检查服务状态：

```bash
docker-compose ps
```

---

## 6. 获取 SSL 证书

### 6.1 使用 Certbot 获取证书

```bash
cd /opt/portfolio

docker run -it --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  --email your_email@example.com \
  -d dundun.store \
  -d www.dundun.store \
  --agree-tos \
  --no-eff-email
```

**注意：** 替换 `your_email@example.com` 为您的真实邮箱。

### 6.2 验证证书

```bash
ls -la certbot/conf/live/dundun.store/
```

应该能看到以下文件：
- `cert.pem`
- `chain.pem`
- `fullchain.pem`
- `privkey.pem`

### 6.3 恢复完整的 Nginx 配置

```bash
cp nginx/conf.d/default.conf.full nginx/conf.d/default.conf
rm nginx/conf.d/default.conf.full
```

---

## 7. 启动完整服务

### 7.1 停止临时服务

```bash
cd /opt/portfolio
docker-compose down
```

### 7.2 启动所有服务

```bash
docker-compose up -d --build
```

### 7.3 查看服务状态

```bash
docker-compose ps
```

所有服务应该显示为 `Up` 状态。

### 7.4 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

---

## 8. 配置自动备份

### 8.1 测试备份脚本

```bash
cd /opt/portfolio
./scripts/backup-db.sh
```

### 8.2 设置定时任务

```bash
crontab -e
```

添加以下内容（每天凌晨2点备份）：

```cron
0 2 * * * cd /opt/portfolio && ./scripts/backup-db.sh >> /opt/portfolio/backups/backup.log 2>&1
```

### 8.3 验证 Cron 任务

```bash
crontab -l
```

---

## 9. 配置证书自动续期

### 9.1 创建续期脚本

```bash
cat > /opt/portfolio/scripts/renew-cert.sh << 'EOF'
#!/bin/bash
cd /opt/portfolio

# 续期证书
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot renew --quiet

# 重新加载 Nginx
docker-compose exec -T nginx nginx -s reload
EOF

chmod +x /opt/portfolio/scripts/renew-cert.sh
```

### 9.2 添加定时任务

```bash
crontab -e
```

添加以下内容（每周一凌晨3点检查续期）：

```cron
0 3 * * 1 cd /opt/portfolio && ./scripts/renew-cert.sh >> /opt/portfolio/certbot/renew.log 2>&1
```

---

## 10. 验证部署

### 10.1 访问网站

在浏览器中打开：
- https://dundun.store
- https://www.dundun.store

应该能看到您的个人网站，并且地址栏显示安全锁图标。

### 10.2 测试 HTTP 到 HTTPS 跳转

访问 http://dundun.store，应该自动跳转到 https://dundun.store。

### 10.3 测试 API

```bash
curl https://dundun.store/health
```

应该返回 `healthy`。

### 10.4 测试后端服务

```bash
curl https://dundun.store/api/config
```

### 10.5 创建管理员账户

```bash
cd /opt/portfolio
docker-compose exec backend go run cmd/create-admin/main.go
```

按照提示输入管理员用户名和密码。

---

## 11. 常见问题排查

### 11.1 服务无法启动

```bash
# 查看日志
docker-compose logs <service-name>

# 重启服务
docker-compose restart <service-name>

# 重新构建并启动
docker-compose up -d --build
```

### 11.2 证书问题

如果证书过期或有问题：

```bash
# 手动续期
cd /opt/portfolio
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot renew --force-renewal

# 重新加载 Nginx
docker-compose exec nginx nginx -s reload
```

### 11.3 数据库问题

```bash
# 进入数据库
docker-compose exec postgres psql -U postgres portfolio

# 恢复备份（如果需要）
gunzip < backups/portfolio_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U postgres portfolio
```

### 11.4 查看资源使用情况

```bash
# 查看 Docker 容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 12. 维护命令

### 12.1 常用 Docker Compose 命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 更新服务
docker-compose pull
docker-compose up -d --build
```

### 12.2 更新代码后重新部署

```bash
cd /opt/portfolio

# 拉取最新代码
git pull  # 如果使用 git

# 重新构建并启动
docker-compose up -d --build
```

---

## 13. 安全建议

1. **定期更新系统和 Docker 镜像**
2. **配置防火墙，只开放必要的端口（80, 443）**
3. **禁用 root 远程登录，使用普通用户 + sudo**
4. **启用 SSH 密钥登录，禁用密码登录**
5. **定期检查日志，发现异常及时处理**
6. **定期测试备份恢复流程**

---

## 联系与支持

如有问题，请查看项目文档或提交 Issue。

---

**祝您部署顺利！** 🚀
