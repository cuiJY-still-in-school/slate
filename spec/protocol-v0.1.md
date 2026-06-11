# 石板协议规范 v0.1

## 概述

石板（Slate）是一个开放、零信任、以 Git 为唯一真相源的人-AI 共创协议。

- **协议层**：`.slate/` 目录下的 JSON 文件
- **工具层**：MCP Server，嵌入 AI 编程工具
- **索引层**：GitHub 本身（Code Search + Topics + Stars）

## 角色

| 角色 | 职责 | 产物 |
|------|------|------|
| 点火者 (Igniter) | 提出创意，提交人类凭证 | intention.json |
| 构建者 (Builder) | 用 AI 工具实现意图 | 代码 + dependencies.json |
| 架构师 (Architect) | 创建可复用地基 | foundation.json |

## `.slate/` 文件格式

### identity.json

```json
{
  "protocol": "slate/0.1",
  "type": "intention | foundation | standalone",
  "owner": "github-username",
  "created": "ISO-8601"
}
```

### intention.json

```json
{
  "igniter": "github-username",
  "proof_file": "ignition/proof.mp4",
  "proof_hash": "sha256...",
  "summary": "一句话描述",
  "status": "open | claimed | completed",
  "claimed_by": null,
  "completion_pr": null
}
```

### foundation.json

```json
{
  "architect": "github-username",
  "name": "地基名称",
  "description": "功能描述",
  "version": "0.1.0",
  "exports": ["导出的模块/API"]
}
```

### dependencies.json

```json
{
  "dependencies": [
    {
      "foundation_repo": "github.com/user/repo",
      "architect": "username",
      "ref": "v1.2.3",
      "note": "用途说明"
    }
  ]
}
```

## 全球发现

1. 仓库添加 GitHub topic：`slate-intention` 或 `slate-foundation`
2. GitHub Code Search 自动索引 `.slate/` 目录
3. 全球 AI 通过 `slate_search` 工具发现

## 协作流程

```
点火者创建意图 → 构建者搜索到意图 → 认领(claim) → 实现 → 完成(completed)
                                                        ↓
                                                  依赖架构师的地基
```

## 本阶段明确不包含

- 经济层（分账、AI 裁判、自动收益分发）
- 中心化服务器
- 用户注册系统
