#!/bin/bash
set -e

# 配置
REPO="inobit/subscription-cleaner"
DEFAULT_INSTALL_DIR="${HOME}/subscription-cleaner"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取最新 release 版本
get_latest_release() {
    log_info "获取最新 release 版本..."
    LATEST_VERSION=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    if [ -z "$LATEST_VERSION" ]; then
        log_error "无法获取最新版本，请检查仓库地址: ${REPO}"
        exit 1
    fi
    log_info "最新版本: ${LATEST_VERSION}"
}

# 下载 release
download_release() {
    local version=$1
    local url="https://github.com/${REPO}/releases/download/${version}/subscription-cleaner-${version}.tar.gz"
    TEMP_BASE_DIR=$(mktemp -d)
    local archive="${TEMP_BASE_DIR}/subscription-cleaner.tar.gz"

    log_info "下载 release: ${url}"
    if ! curl -L -o "${archive}" "${url}"; then
        log_error "下载失败"
        rm -rf "${TEMP_BASE_DIR}"
        exit 1
    fi

    log_info "解压到临时目录..."
    tar -xzf "${archive}" -C "${TEMP_BASE_DIR}"

    # 处理可能的子目录结构
    if [ -d "${TEMP_BASE_DIR}/subscription-cleaner" ]; then
        TEMP_SOURCE_DIR="${TEMP_BASE_DIR}/subscription-cleaner"
    else
        TEMP_SOURCE_DIR="${TEMP_BASE_DIR}"
    fi
}

# 安装文件
install_files() {
    local source_dir=$1
    local install_dir=$2

    log_info "创建安装目录: ${install_dir}"
    mkdir -p "${install_dir}"

    log_info "复制文件..."
    cp -r "${source_dir}"/* "${install_dir}/" 2>/dev/null || true

    # 显式复制 .env.example 为 .env（如果目标不存在）
    if [ -f "${source_dir}/.env.example" ] && [ ! -f "${install_dir}/.env" ]; then
        cp "${source_dir}/.env.example" "${install_dir}/.env"
        log_info "已创建 .env 文件"
    fi

    # 处理配置文件
    log_info "处理配置文件..."

    # resources/sources.yaml.example -> sources.yaml
    if [ -f "${install_dir}/resources/sources.yaml.example" ] && [ ! -f "${install_dir}/resources/sources.yaml" ]; then
        mv "${install_dir}/resources/sources.yaml.example" "${install_dir}/resources/sources.yaml"
        log_info "已创建 resources/sources.yaml 文件"
    fi

    # 创建日志目录
    mkdir -p "${install_dir}/logs"

    log_info "文件安装完成"
}

# 安装依赖
install_dependencies() {
    local install_dir=$1

    log_info "检查 pnpm..."
    if ! command -v pnpm &> /dev/null; then
        log_warn "pnpm 未安装"
        echo ""
        echo "请安装 pnpm："
        echo "  npm install -g pnpm"
        echo ""
        exit 1
    fi

    log_info "安装依赖..."
    cd "${install_dir}"
    pnpm install --prod
    log_info "依赖安装完成"
}

# 显示后续步骤
show_next_steps() {
    local install_dir=$1

    echo ""
    echo "=========================================="
    echo -e "${GREEN}安装完成！${NC}"
    echo "=========================================="
    echo ""
    echo "安装目录: ${install_dir}"
    echo ""
    log_warn "请修改以下配置文件："
    echo ""
    echo "1. 编辑环境变量:"
    echo "   nano ${install_dir}/.env"
    echo ""
    echo "   必须修改:"
    echo "   - JWT_SECRET: 设置为强密码"
    echo ""
    echo "2. 编辑订阅源配置:"
    echo "   nano ${install_dir}/resources/sources.yaml"
    echo ""
    echo "   必须修改:"
    echo "   - 添加你的实际订阅源 URL"
    echo ""
    echo "3. 配置手动代理（可选）:"
    echo "   cp ${install_dir}/resources/proxies.yaml.example ${install_dir}/resources/proxies.yaml"
    echo ""
    echo "=========================================="
    echo "启动服务:"
    echo "=========================================="
    echo ""
    echo "方式1 - 直接运行（适合测试）:"
    echo "   cd ${install_dir}"
    echo "   pnpm start"
    echo ""
    echo "方式2 - 安装为 systemd 服务（适合生产）:"
    echo "   1. 查看服务模板:"
    echo "      cat ${install_dir}/tools/subscription-cleaner.service.example"
    echo ""
    echo "   2. 复制并编辑服务文件:"
    echo "      sudo cp ${install_dir}/tools/subscription-cleaner.service.example /etc/systemd/system/subscription-cleaner.service"
    echo "      sudo nano /etc/systemd/system/subscription-cleaner.service"
    echo ""
    echo "   3. 重要：根据你的安装目录修改以下配置:"
    echo "      - WorkingDirectory=${install_dir}"
    echo "      - User=$(whoami)"
    echo "      - Group=$(whoami)"
    echo ""
    echo "   4. 启动服务:"
    echo "      sudo systemctl daemon-reload"
    echo "      sudo systemctl start subscription-cleaner"
    echo "      sudo systemctl enable subscription-cleaner"
    echo ""
}

# 主函数
main() {
    local install_dir="${1:-$DEFAULT_INSTALL_DIR}"

    echo "=========================================="
    echo "Subscription Cleaner 安装脚本"
    echo "=========================================="
    echo ""

    # 检查依赖
    if ! command -v curl &> /dev/null; then
        log_error "需要安装 curl"
        exit 1
    fi

    log_info "安装目录: ${install_dir}"
    echo ""

    # 获取最新版本
    get_latest_release

    # 下载并解压
    download_release "${LATEST_VERSION}"

    # 安装文件
    install_files "${TEMP_SOURCE_DIR}" "${install_dir}"

    # 清理临时文件
    rm -rf "${TEMP_BASE_DIR}"

    # 安装依赖
    install_dependencies "${install_dir}"

    # 显示后续步骤
    show_next_steps "${install_dir}"
}

main "$@"
