# 石板协议规范 v0.2

## 概述

石板（Slate）是一个开放、零信任、以 Git 为唯一真相源的人-AI 共创协议。

**核心洞见**：GitHub 上的每一个仓库、npm 上的每一个包，都是潜在的"地基"。
石板协议用 `.slate/` 目录提供结构化元数据，让 AI 能更精确地发现、复用和协作。

### 协议层

- **`.slate/` 目录** — 项目根目录下的 JSON 文件，声明式协作语法
- **MCP Server** — 5 个 AI 工具，嵌入 Claude Code / Cursor / Copilot
- **GitHub 即基础设施** — 零服务器、零数据库、零用户注册

---

## 角色

| 角色 | 做什么 | 协议文件 |
|------|--------|----------|
| 🔥 **点火者** (Igniter) | 提出创意，提交人类独有的凭证（视频/语音/草图） | `intention.json` |
| 🏗️ **构建者** (Builder) | 用 AI 工具实现意图 | `dependencies.json` |
| 🧱 **架构师** (Architect) | 创建可复用技术组件（地基） | `foundation.json` |

---

## `.slate/` 文件格式

### identity.json — 项目身份

```json
{
  "protocol": "slate/0.1",
  "type": "intention | foundation | standalone",
  "owner": "github-username",
  "created": "2026-06-12T00:00:00Z"
}
```

### intention.json — 意图声明（点火者项目）

```json
{
  "igniter": "github-username",
  "proof_file": "ignition/proof.mp4",
  "proof_hash": "sha256...",
  "summary": "例如：一个根据天空颜色推荐俳句的App",
  "status": "open | claimed | completed",
  "claimed_by": null,
  "completion_pr": null
}
```

**`proof_file` 是区分人类需求和 AI 垃圾的核心**——一段视频、一段语音、一张手绘草图。AI 无法伪造这些（或成本足够高）。

### foundation.json — 地基声明（架构师项目）

```json
{
  "architect": "github-username",
  "name": "地基名称",
  "description": "一句话描述功能",
  "version": "0.1.0",
  "exports": ["导出1", "导出2"]
}
```

### dependencies.json — 依赖记录（构建者项目）

```json
{
  "dependencies": [
    {
      "foundation_repo": "github.com/hana/sadtone",
      "architect": "hana",
      "ref": "v1.2.3",
      "note": "用于悲伤情绪音频分析"
    }
  ]
}
```

---

## AI 工具

石板通过 MCP Server 提供 6 个工具，嵌入 AI 编程助手：

| 工具 | 功能 | 搜索来源 |
|------|------|----------|
| `slate_search` | 全球搜索地基/意图 | GitHub Repo + GitHub Code + npm |
| `slate_review` | 深度质量分析 | GitHub Issues + npm 下载 + 代码活跃度 |
| `slate_read` | 读取协议文件 | 本地/远程 `.slate/` |
| `slate_write` | 校验并写入协议文件 | Zod schema 校验 |
| `slate_claim` | 认领意图 | fork + 更新状态 + PR |
| `slate_publish` | 发布意图/地基 | 创建 `.slate/` 目录 |

### 专有逻辑：质量评分

`slate_search` 和 `slate_review` 内置多层质量评估：

| 信号源 | 来源 | 用途 |
|--------|------|------|
| GitHub Stars | GitHub API | 社区认可度 |
| npm 月下载 | npm API | 真实使用量 |
| Open/Closed Issues 比 | GitHub Issues | 项目健康度 |
| 最近 commit 时间 | GitHub API | 维护活跃度 |
| TypeScript 类型 | package.json | 开发体验 |
| 依赖数量 | package.json | 轻量程度 |
| License | GitHub/npm | 合规性 |
| Issue 标题内容 | GitHub Issues | 真实使用场景+痛点（专有逻辑） |

### 专有逻辑：适合做什么

从项目的 GitHub Topics、Issue 标题、描述文档、npm keywords 中提炼：
- ✅ **适合做什么** — 5 个以内的具体使用场景
- ⚠️ **注意事项** — 从 issue 抱怨中提取的已知坑

---

## 发现机制

石板网络通过三个渠道发现资源：

| 渠道 | 方式 | 覆盖范围 |
|------|------|----------|
| GitHub Repo Search | 搜索 name/description/readme/topics | 所有公开 GitHub 仓库 |
| GitHub Code Search | 搜索 `.slate/` 文件内容 | 已参与石板的项目 |
| npm Registry | 搜索 package name/description/keywords | 所有 npm 包 |

有 `.slate/` 协议文件的项目获得 +1000 stars 加权，但**不要求必须有**。

---

## 飞轮

```
AI 写代码 → 自动搜 GitHub/npm → 发现地基 → 复用
                                      ↓
                              创建了可复用组件
                                      ↓
                              AI 自动发布地基
                                      ↓
                  下一个 AI 搜到 → 评分 + 场景匹配 → 复用
```

**每个 AI 的每一次 slate_search 和 slate_publish，都在为全球网络贡献信号。**

---

## 接入方式

### Claude Code
```bash
claude mcp add slate -- npx @slate-protocol/slate mcp
```

### Cursor
```json
// .cursor/mcp.json
{ "mcpServers": { "slate": { "command": "npx", "args": ["@slate-protocol/slate", "mcp"] } } }
```

### GitHub Copilot
```json
// .vscode/settings.json
{ "github.copilot.mcp.servers": { "slate": { "command": "npx", "args": ["@slate-protocol/slate", "mcp"] } } }
```

---

## GitHub 仓库参与

创建 `.slate/` 目录并添加 GitHub topic：
```bash
gh api repos/{owner}/{repo}/topics -X PUT --input - <<<'{"names":["slate-foundation"]}'
# 或
gh api repos/{owner}/{repo}/topics -X PUT --input - <<<'{"names":["slate-intention"]}'
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1 | 2026-06-10 | 协议定义、CLI 工具 MVP |
| v0.2 | 2026-06-12 | MCP Server、三渠道搜索、质量评分、issue 评价、18 个种子地基 |

---

## 本阶段明确延后

- 经济层（分账、AI 裁判、自动收益分发）
- 中心化服务
- 用户注册系统

*石板的目标不是成为又一个平台，而是成为人类创意与 AI 执行力之间的最小化协议层。*
