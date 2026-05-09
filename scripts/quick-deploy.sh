#!/bin/bash
# 个人网站快速部署脚本
# 使用方法：bash quick-deploy.sh <your-github-repo-url>

set -e

echo "========================================="
echo "  个人网站快速部署脚本"
echo "========================================="

# 检查参数
if [ $# -eq 0 ]; then
    echo "错误：请提供 GitHub 仓库地址"
    echo "使用方法：$0 <your-github-repo-url>"
    exit 1
fi

REPO_URL="$1"
PROJECT_DIR="/opt/portfolio"

echo ""
echo "[1/10] 更新系统..."
apt update && apt upgrade -y

echo ""
echo "[2/10] 安装必要工具..."
apt install -y git curl wget nano

echo ""
echo "[3/10] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    apt install -y apt-transport-https ca-certificates software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io
fi

echo ""
echo "[4/10] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo ""
echo "[5/10] 克隆项目代码..."
if [ -d "$PROJECT_DIR" ]; then
    echo "项目目录已存在，进行备份..."
    mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo ""
echo "[6/10] 配置环境变量..."
if [ ! -f ".env.production" ]; then
    cp .env.production.example .env.production
    
    echo ""
    echo "========================================="
    echo "  请配置环境变量"
    echo "========================================="
    echo ""
    echo "正在打开编辑器，请修改以下内容："
    echo "- DB_PASSWORD (数据库密码)"
    echo "- MINIO_SECRET_KEY (MinIO密码)"
    echo "- JWT_SECRET (JWT密钥)"
    echo "- EMAIL_API_KEY (邮件API密钥，如需要)"
    echo "- LLM_API_KEY (LLM API密钥，如需要)"
    echo ""
    read -p "按回车键继续编辑 .env.production..."
    nano .env.production
fi

ln -sf .env.production .env

echo ""
echo "[7/10] 创建必要目录..."
mkdir -p certbot/conf certbot/www backups
chmod +x scripts/backup-db.sh scripts/*.sh 2>/dev/null || true

echo ""
echo "[8/10] 先启动临时 Nginx 用于获取证书..."
cp nginx/conf.d/default.conf nginx/conf.d/default.conf.full
cat > nginx/conf.d/default.conf << 'TEMP_CONF'
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
TEMP_CONF

docker-compose up -d nginx
sleep 5

echo ""
echo "[9/10] 获取 SSL 证书..."
read -p "请输入您的邮箱地址（用于证书续期通知）：" EMAIL

docker run -it --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  --email "$EMAIL" \
  -d dundun.store \
  -d www.dundun.store \
  --agree-tos \
  --no-eff-email

echo ""
echo "证书获取成功！恢复完整 Nginx 配置..."
cp nginx/conf.d/default.conf.full nginx/conf.d/default.conf
rm nginx/conf.d/default.conf.full

echo ""
echo "[10/10] 启动所有服务..."
docker-compose down
docker-compose up -d --build

echo ""
echo "========================================="
echo "  部署完成！"
echo "========================================="
echo ""
echo "服务状态："
docker-compose ps
echo ""
echo "访问地址："
echo "- https://dundun.store"
echo "- https://www.dundun.store"
echo ""
echo "下一步操作："
echo "1. 查看服务日志：docker-compose logs -f"
echo "2. 创建管理员账户：docker-compose exec backend go run cmd/create-admin/main.go"
echo "3. 配置自动备份：查看 DEPLOYMENT.md"
echo ""
echo "部署成功！🎉"
