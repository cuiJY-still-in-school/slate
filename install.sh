#!/usr/bin/env bash
set -e

# 🪨 石板 (Slate) 一键安装
# curl -fsSL https://raw.githubusercontent.com/cuiJY-still-in-school/slate/main/install.sh | bash

REPO="https://github.com/cuiJY-still-in-school/slate.git"
INSTALL_DIR="${SLATE_INSTALL_DIR:-$HOME/.slate}"
BIN="${SLATE_BIN:-$HOME/.local/bin/slate}"
BRANCH="main"

echo "🪨 石板 (Slate) — 安装中..."

# ─── 依赖检查 ───────────────────────────────────────
for cmd in git node npm; do
  if ! command -v $cmd &>/dev/null; then
    echo "❌ 缺少 $cmd，请先安装"
    exit 1
  fi
done

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js >= 20 需要，当前 $(node -v)"
  exit 1
fi

# ─── Clone / 更新 ───────────────────────────────────
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "📦 更新石板..."
  cd "$INSTALL_DIR"
  git fetch origin "$BRANCH" 2>/dev/null
  if git remote get-url origin 2>/dev/null | grep -q "slate"; then
    git checkout "$BRANCH" 2>/dev/null
    git pull origin "$BRANCH" 2>/dev/null
  else
    echo "⚠️  $INSTALL_DIR 不是石板仓库，重新克隆..."
    cd ~
    rm -rf "$INSTALL_DIR"
    git clone --depth 1 --branch "$BRANCH" "$REPO" "$INSTALL_DIR"
  fi
  cd "$INSTALL_DIR"
else
  echo "📦 克隆石板..."
  rm -rf "$INSTALL_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# ─── 安装依赖 ───────────────────────────────────────
echo "📦 安装依赖..."
npm install
npm run build

# ─── 链接到 PATH ───────────────────────────────────
mkdir -p "$(dirname "$BIN")"
cat > "$BIN" << 'SCRIPT'
#!/usr/bin/env bash
exec node "$HOME/.slate/dist/index.js" "$@"
SCRIPT
chmod +x "$BIN"

# ─── 配置 PATH ─────────────────────────────────────
RC=""
case "$SHELL" in
  */zsh)  RC="$HOME/.zshrc" ;;
  */bash) RC="$HOME/.bashrc" ;;
  */fish) RC="$HOME/.config/fish/config.fish" ;;
  *)      RC="$HOME/.profile" ;;
esac

BIN_DIR="$(dirname "$BIN")"
if ! echo "$PATH" | grep -q "$BIN_DIR"; then
  echo "" >> "$RC"
  echo "# 🪨 石板 (Slate)" >> "$RC"
  echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$RC"
  echo "✅ PATH 已写入 $RC"
fi

# ─── 验证 ───────────────────────────────────────────
echo ""
if "$BIN" --version 2>/dev/null || "$BIN" --help 2>/dev/null | head -1; then
  echo "┌──────────────────────────────────────────┐"
  echo "│ 🪨 石板 安装完成！                      │"
  echo "│                                          │"
  echo "│ 启动:    slate                           │"
  echo "│ 初始化:  slate init                      │"
  echo "│ 配置:    slate setup                     │"
  echo "│ 帮助:    slate --help                    │"
  echo "│                                          │"
  echo "│ source $RC   # 立即生效                  │"
  echo "└──────────────────────────────────────────┘"
else
  echo "⚠️  安装可能有问题，请检查: $BIN"
fi
