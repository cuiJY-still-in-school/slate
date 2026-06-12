# 🪨 石板 (Slate) v0.2

**开放、零信任、以 Git 为唯一真相源的人-AI 共创协议。**

一个 MCP Server，6 个 AI 工具。接入后，AI 自动拥有协议感知——全球搜索、质量评估、复用、发布。用户完全无感。

---

## 安装（三端）

### Claude Code
```bash
claude mcp add slate -- npx @slate-protocol/slate mcp
```

### Cursor
Copy `platforms/cursor.mcp.json` → `.cursor/mcp.json` in your project root.

### GitHub Copilot
```json
// .vscode/settings.json
{
  "github.copilot.mcp.servers": {
    "slate": { "command": "npx", "args": ["@slate-protocol/slate", "mcp"] }
  }
}
```

---

## 工具

| 工具 | 功能 | 搜索源 |
|------|------|--------|
| `slate_search` | 全球搜索 | GitHub 全库 + npm 全包 + `.slate/` 加权 |
| `slate_review` | 质量分析 | Issues 作为评价 + 适合做什么 + 坑 |
| `slate_read` | 读取协议 | 本地/远程 `.slate/` 文件 |
| `slate_write` | 写入协议 | Zod schema 校验 |
| `slate_claim` | 认领意图 | fork → 更新状态 → PR |
| `slate_publish` | 发布 | 创建 `.slate/` + GitHub topic |

### 专有逻辑

`slate_search` + `slate_review` 自动分析：
- 🏆 **质量评分**：stars + 下载 + issue 健康度 + 类型支持 + 依赖数量 + license
- ✅ **适合做什么**：从 topics、issues、README 中提炼真实使用场景
- ⚠️ **注意事项**：从 issue 标题中提取已知坑

---

## 飞轮

```
你写代码 → AI 自动搜 GitHub/npm → 发现地基 → 复用
                                          ↓
                                 创建了可复用组件
                                          ↓
                                 AI 自动发布
                                          ↓
              下一个 AI 搜到 → 评分匹配 → 复用 → 信号回流
```

**GitHub 就是基础设施。** 零服务器。零数据库。零用户注册。

---

## 协议文件

```
.slate/
├── identity.json        # 项目身份
├── intention.json       # 意图（proof_file = 人类凭证）
├── foundation.json      # 地基（exports + keywords）
└── dependencies.json    # 依赖记录
```

详见 [协议规范 v0.2](spec/protocol-v0.1.md)。

---

## 参与石板网络

```bash
# 给项目打标签
gh api repos/{owner}/{repo}/topics -X PUT --input - <<<'{"names":["slate-foundation"]}'
```

打上 topic 后，全球 AI 的 `slate_search` 就能发现你的代码。

---

## 开发

```bash
git clone https://github.com/cuiJY-still-in-school/slate.git
cd slate
npm install
npm run build          # 编译 TypeScript
node dist/index.js mcp # 启动 MCP Server
```

---

[MIT](LICENSE) · [协议规范](spec/protocol-v0.1.md)
