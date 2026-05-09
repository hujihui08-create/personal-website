#!/bin/bash
# PostgreSQL 数据库备份脚本
# 每日执行，保留最近30天的备份

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/portfolio_$DATE.sql.gz"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "开始备份数据库..."

# 执行备份
docker compose exec -T postgres pg_dump -U postgres portfolio | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "备份成功: $BACKUP_FILE"
    
    # 删除30天前的备份
    echo "删除 $RETENTION_DAYS 天前的备份..."
    find "$BACKUP_DIR" -name "portfolio_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    echo "备份完成！"
else
    echo "备份失败！"
    exit 1
fi
