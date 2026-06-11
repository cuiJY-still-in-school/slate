# 🪨 石板 (Slate)

**开放、零信任、以 Git 为唯一真相源的人-AI 共创协议。**

[![npm version](https://img.shields.io/npm/v/@slate-protocol/slate)](https://www.npmjs.com/package/@slate-protocol/slate)
[![GitHub stars](https://img.shields.io/github/stars/cuiJY-still-in-school/slate)](https://github.com/cuiJY-still-in-school/slate)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 是什么

石板不提供内容，只提供一种**协作的语法**：让人类的创意（意图）被 AI 高效地实现，让可复用技术组件（地基）被全球 AI 公平地发现和重用。

**用户无感，AI 自动运转。** 你照常用 Claude Code 写代码，石板在后台静默协作。

---

## 快速开始

### 1. 安装

```bash
# 接入 Claude Code（推荐）
claude mcp add slate -- npx @slate-protocol/slate

# 或项目级（提交 .mcp.json，团队共用）
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "slate": {
      "type": "stdio",
      "command": "npx",
      "args": ["@slate-protocol/slate"]
    }
  }
}
EOF
```

### 2. 照常写代码

```
claude> 帮我写一个 Stripe 支付集成

AI 自动调用 slate_search("Stripe支付集成", "Next.js")
  → 在 GitHub 全球仓库中搜索 .slate/ 协议文件
  → 发现 sf/next-stripe-kit (地基, ⭐342)
  → 自动引入依赖

你只看到 AI 高效完成了任务。
```

---

## 5 个 AI 工具

| 工具 | 功能 | 触发时机 |
|------|------|----------|
| `slate_search` | 全球搜索意图/地基 | **每次写新功能前自动调用** |
| `slate_read` | 读取 .slate/ 协议文件 | 需要了解项目上下文时 |
| `slate_write` | 校验并写入协议文件 | 更新状态/添加依赖 |
| `slate_claim` | 认领开放意图 | 发现想构建的意图 |
| `slate_publish` | 发布意图/地基 | 创建了可复用组件 |

---

## 协议文件

每个石板项目的 `.slate/` 目录：

```
.slate/
├── identity.json        # 项目身份
├── intention.json       # 意图声明（点火者）
├── foundation.json      # 地基声明（架构师）
└── dependencies.json    # 依赖记录（构建者）
```

详见 [协议规范](spec/protocol-v0.1.md)。

---

## 飞轮

```
你用 AI 写代码 → AI 自动调 slate_search 找地基 → 发现、复用、贡献
                                                    ↓
下一个开发者 → AI 搜到你的地基 → 全球协作自动发生
```

**GitHub 就是基础设施。** 零服务器、零数据库、零用户注册。
你的 GitHub 账号就是石板账号，你的仓库就是石板节点。

---

## 兼容性

| AI 工具 | 支持方式 |
|---------|----------|
| **Claude Code** | MCP Server + Hook 双激活（完整功能） |
| **Cursor** | MCP Server，AI 主动调用 |
| **OpenCode** | MCP Server 原生支持 |
| **其他 MCP 兼容工具** | 标准 MCP 协议，全部可用 |

---

## 角色

| 角色 | 做什么 | 文件 |
|------|--------|------|
| 🔥 **点火者** | 提出创意，提交人类凭证（视频/语音/草图） | `intention.json` |
| 🏗️ **构建者** | 用 AI 工具实现意图 | `dependencies.json` |
| 🧱 **架构师** | 创建可复用技术组件（地基） | `foundation.json` |

---

## 示例

```bash
# 发布意图
$ mkdir my-idea && cd my-idea && git init
# 在 Claude Code 中说:
claude> 用 slate_publish 发布一个意图：一个根据天空颜色推荐俳句的 Web App

# 全球搜索
claude> 用 slate_search 搜索 "俳句" 相关的意图和地基
# → 返回全球所有匹配的石板项目

# 认领并构建
claude> 用 slate_claim 认领 alice/haiku-app 意图，然后实现它
```

---

## 参与贡献

- **协议讨论**：提交 Issue
- **工具开发**：Fork + PR
- **早期试验**：创建你的意图或地基，打上 `slate-intention` 或 `slate-foundation` topic

---

## 许可证

MIT — 石板协议是开放基础设施，不属于任何人。

---

*石板的目标不是成为又一个平台，而是成为人类创意与 AI 执行力之间的最小化协议层。*
