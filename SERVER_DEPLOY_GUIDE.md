# 服务器部署指南

## 快速自动部署（推荐）

只需执行以下3步即可完成部署：

```bash
# 1. 连接到服务器
ssh ubuntu@124.220.135.122
# 密码: Hu051419

# 2. 下载并运行自动部署脚本
cd /tmp
curl -O https://raw.githubusercontent.com/hujihui08-create/personal-website/main/server-deploy.sh
chmod +x server-deploy.sh

# 3. 使用 sudo 运行部署脚本
sudo bash server-deploy.sh
```

## 部署完成后

访问地址：http://124.220.135.122

### 创建管理员账户

```bash
cd /opt/portfolio
sudo docker-compose exec backend go run cmd/create-admin/main.go
```

### 查看日志

```bash
cd /opt/portfolio
sudo docker-compose logs -f
```

## 手动部署（如果自动脚本失败）

如果自动部署脚本有问题，可以按以下步骤手动部署：

```bash
# 1. 连接服务器
ssh ubuntu@124.220.135.122

# 2. 进入项目目录
cd /opt

# 3. 克隆项目
if [ -d portfolio ]; then sudo rm -rf portfolio; fi
sudo git clone https://github.com/hujihui08-create/personal-website.git portfolio
cd portfolio

# 4. 配置环境变量
sudo cp .env.production.example .env

# 生成随机密码
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
MINIO_SECRET_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
JWT_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 48)

# 更新环境变量
sudo sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
sudo sed -i "s/MINIO_SECRET_KEY=.*/MINIO_SECRET_KEY=$MINIO_SECRET_KEY/" .env
sudo sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sudo sed -i "s/DOMAIN=.*/DOMAIN=124.220.135.122/" .env

# 5. 启动服务
sudo docker-compose down || true
sudo docker-compose up -d --build

# 6. 查看状态
sudo docker-compose ps
```
