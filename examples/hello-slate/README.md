# Hello Slate — 石板示范意图

这是一个石板协议的示范意图仓库。

## 意图

**一个根据天空颜色推荐俳句的 Web App**

## 石板协议文件

```
.slate/
├── identity.json    # 项目身份
└── intention.json   # 意图声明
```

## 如何使用

1. 用石板 AI 工具打开本项目：`slate` 或 Claude Code + 石板 MCP Server
2. AI 会自动读取 `.slate/` 上下文
3. AI 调用 `slate_search` 搜索相关地基
4. AI 实现意图并更新状态

## 协议参与

在 GitHub 上搜索所有石板意图：
```bash
gh search code "path:.slate/intention.json" --match "俳句"
```

或者直接用 AI 工具，说：
> 帮我在石板网络中搜索与俳句相关的意图和地基
