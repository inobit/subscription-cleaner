#!/bin/bash
set -e

# 配置
REPO="inobit/subscription-cleaner"
INSTALL_DIR="/opt/subscription-cleaner"
SERVICE_NAME="subscription-cleaner"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 root 权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 sudo 运行此脚本"
        exit 1
    fi
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
    local temp_dir=$(mktemp -d)
    local archive="${temp_dir}/subscription-cleaner.tar.gz"

    log_info "下载 release: ${url}"
    if ! curl -L -o "${archive}" "${url}"; then
        log_error "下载失败"
        rm -rf "${temp_dir}"
        exit 1
    fi

    log_info "解压到临时目录..."
    tar -xzf "${archive}" -C "${temp_dir}"

    echo "${temp_dir}"
}

# 安装文件
install_files() {
    local source_dir=$1

    log_info "创建安装目录: ${INSTALL_DIR}"
    mkdir -p "${INSTALL_DIR}"

    log_info "复制文件..."
    cp -r "${source_dir}"/* "${INSTALL_DIR}/"

    # 重命名 example 文件
    log_info "处理配置文件..."

    # .env.example -> .env
    if [ -f "${INSTALL_DIR}/.env.example" ]; then
        mv "${INSTALL_DIR}/.env.example" "${INSTALL_DIR}/.env"
        log_info "已创建 .env 文件（请修改配置）"
    fi

    # resources/sources.yaml.example -> resources/sources.yaml
    if [ -f "${INSTALL_DIR}/resources/sources.yaml.example" ]; then
        mv "${INSTALL_DIR}/resources/sources.yaml.example" "${INSTALL_DIR}/resources/sources.yaml"
        log_info "已创建 resources/sources.yaml 文件（请修改配置）"
    fi

    # tools/subscription-cleaner.service.example -> tools/subscription-cleaner.service
    if [ -f "${INSTALL_DIR}/tools/subscription-cleaner.service.example" ]; then
        mv "${INSTALL_DIR}/tools/subscription-cleaner.service.example" "${INSTALL_DIR}/tools/subscription-cleaner.service"
        log_info "已创建 tools/subscription-cleaner.service 文件（请检查配置）"
    fi

    # 创建日志目录
    mkdir -p "${INSTALL_DIR}/logs"

    # 设置权限
    log_info "设置权限..."
    chown -R www-data:www-data "${INSTALL_DIR}"
    chmod 750 "${INSTALL_DIR}"
    chmod 640 "${INSTALL_DIR}/.env"
}

# 安装 systemd 服务
install_service() {
    log_info "安装 systemd 服务..."
    # 使用软链接，方便后续修改
    ln -sf "${INSTALL_DIR}/tools/subscription-cleaner.service" "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload
    log_info "服务已安装到 systemd（软链接）"
}

# 显示后续步骤
show_next_steps() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}部署完成！${NC}"
    echo "=========================================="
    echo ""
    log_warn "请先修改以下配置文件后再启动服务："
    echo ""
    echo "1. 编辑环境变量文件:"
    echo "   nano ${INSTALL_DIR}/.env"
    echo ""
    echo "   必须修改:"
    echo "   - JWT_SECRET: 设置为强密码"
    echo "   - PORT: 根据需要修改（默认3000）"
    echo ""
    echo "2. 编辑订阅源配置:"
    echo "   nano ${INSTALL_DIR}/resources/sources.yaml"
    echo ""
    echo "   必须修改:"
    echo "   - 添加你的实际订阅源 URL"
    echo "   - 设置正确的 protocol 类型"
    echo ""
    echo "3. 检查服务配置（可选）:"
    echo "   nano ${INSTALL_DIR}/tools/subscription-cleaner.service"
    echo ""
    echo "   如需修改用户或路径，编辑后执行:"
    echo "   sudo systemctl daemon-reload"
    echo "   sudo systemctl restart ${SERVICE_NAME}"
    echo ""
    echo "配置完成后，使用以下命令启动服务："
    echo ""
    echo "  # 启动服务"
    echo "  sudo systemctl start ${SERVICE_NAME}"
    echo ""
    echo "  # 查看状态"
    echo "  sudo systemctl status ${SERVICE_NAME}"
    echo ""
    echo "  # 查看日志"
    echo "  sudo journalctl -u ${SERVICE_NAME} -f"
    echo ""
    echo "  # 设置开机自启"
    echo "  sudo systemctl enable ${SERVICE_NAME}"
    echo ""
}

# 主函数
main() {
    echo "=========================================="
    echo "Subscription Cleaner 部署脚本"
    echo "=========================================="
    echo ""

    check_root

    log_info "仓库: ${REPO}"
    log_info "安装目录: ${INSTALL_DIR}"
    echo ""

    # 获取最新版本
    get_latest_release

    # 下载并解压
    TEMP_DIR=$(download_release "${LATEST_VERSION}")

    # 安装文件
    install_files "${TEMP_DIR}"

    # 清理临时文件
    rm -rf "${TEMP_DIR}"

    # 安装服务
    install_service

    # 显示后续步骤
    show_next_steps
}

main "$@"
