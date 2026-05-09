#!/bin/bash
# 个人网站服务器自动部署脚本
# 使用方法：bash server-deploy.sh

set -e

echo "========================================="
echo "  个人网站 - 服务器自动部署"
echo "========================================="

# 配置变量
PROJECT_DIR="/opt/portfolio"
REPO_URL="https://github.com/hujihui08-create/personal-website.git"
DOMAIN="124.220.135.122"

# 检查是否是 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 或 root 用户运行此脚本"
    echo "使用方法：sudo bash $0"
    exit 1
fi

echo ""
echo "[1/7] 检查并安装必要工具..."
apt update
apt install -y git curl wget openssl

echo ""
echo "[2/7] 检查并安装 Docker..."
if ! command -v docker &> /dev/null; then
    echo "正在安装 Docker..."
    apt install -y apt-transport-https ca-certificates software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io
else
    echo "Docker 已安装"
fi

echo ""
echo "[3/7] 检查并安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "正在安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose 已安装"
fi

echo ""
echo "[4/7] 克隆/更新项目代码..."
if [ -d "$PROJECT_DIR" ]; then
    echo "项目目录已存在，正在备份并更新..."
    if [ -d "${PROJECT_DIR}.backup" ]; then
        rm -rf "${PROJECT_DIR}.backup"
    fi
    mv "$PROJECT_DIR" "${PROJECT_DIR}.backup"
fi
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo ""
echo "[5/7] 配置环境变量..."
if [ ! -f ".env" ]; then
    cp .env.production.example .env
    
    # 生成随机密码
    DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
    MINIO_SECRET_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
    JWT_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 48)
    
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i "s/MINIO_SECRET_KEY=.*/MINIO_SECRET_KEY=$MINIO_SECRET_KEY/" .env
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env
    
    echo "环境变量已配置完成！"
fi

echo ""
echo "[6/7] 停止旧服务（如果有）..."
docker-compose down || true

echo ""
echo "[7/7] 构建并启动所有服务..."
docker-compose up -d --build

echo ""
echo "========================================="
echo "  部署成功！"
echo "========================================="
echo ""
echo "服务状态："
docker-compose ps
echo ""
echo "访问地址：http://$DOMAIN"
echo ""
echo "下一步操作："
echo "1. 创建管理员账户："
echo "   cd $PROJECT_DIR && docker-compose exec backend go run cmd/create-admin/main.go"
echo ""
echo "2. 查看服务日志："
echo "   cd $PROJECT_DIR && docker-compose logs -f"
echo ""
echo "部署完成！🎉"
