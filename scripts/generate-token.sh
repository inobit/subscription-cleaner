#!/bin/bash
#
# JWT Token 生成脚本
# 用法: ./scripts/generate-token.sh [有效期月数]
# 默认有效期: 3个月
#

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 读取有效期参数（默认为3个月）
MONTHS="${1:-3}"

# 验证参数为正整数
if ! [[ "$MONTHS" =~ ^[1-9][0-9]*$ ]]; then
    echo "错误: 有效期必须是正整数（月数）"
    echo "用法: $0 [月数]"
    echo "示例: $0 3    # 生成3个月有效期的token"
    echo "      $0 12   # 生成1年有效期的token"
    exit 1
fi

# 检查 .env 文件是否存在
if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
    echo "错误: 未找到 .env 文件"
    echo "请先创建 .env 文件并设置 JWT_SECRET"
    exit 1
fi

# 加载环境变量
export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)

# 检查 JWT_SECRET
if [[ -z "$JWT_SECRET" ]]; then
    echo "错误: JWT_SECRET 未设置"
    exit 1
fi

# 计算过期时间（秒级Unix时间戳）
DAYS_PER_MONTH=30
SECONDS_PER_DAY=86400
EXPIRATION=$(($(date +%s) + MONTHS * DAYS_PER_MONTH * SECONDS_PER_DAY))

# 创建JWT payload
PAYLOAD=$(printf '{"sub":"subscription-user","exp":%d}' "$EXPIRATION")

# Base64 URL 编码（去除填充）
base64url_encode() {
    base64 | tr '+/' '-_' | tr -d '='
}

# 编码 header
HEADER='{"alg":"HS256","typ":"JWT"}'
ENCODED_HEADER=$(echo -n "$HEADER" | base64url_encode)

# 编码 payload
ENCODED_PAYLOAD=$(echo -n "$PAYLOAD" | base64url_encode)

# 创建签名
SIGNATURE=$(echo -n "${ENCODED_HEADER}.${ENCODED_PAYLOAD}" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64url_encode)

# 组装 JWT
TOKEN="${ENCODED_HEADER}.${ENCODED_PAYLOAD}.${SIGNATURE}"

# 输出结果
echo "========================================"
echo "✅ JWT Token 生成成功"
echo "========================================"
echo ""
echo "Token:"
echo "$TOKEN"
echo ""
echo "有效期: ${MONTHS} 个月"
echo "过期时间: $(date -d "@$EXPIRATION" "+%Y-%m-%d %H:%M:%S")"
echo ""
echo "使用方式:"
echo "  Header: Authorization: Bearer $TOKEN"
echo "  Query:  ?token=$TOKEN"
echo ""
