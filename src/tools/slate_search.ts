/**
 * slate_search — 搜索全球意图和地基
 *
 * 核心工具。在所有公开 GitHub 仓库中搜索石板协议文件。
 * 用 GitHub Code Search + Repo Search 双渠道，
 * 按 stars 自然排序返回。
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchGlobal, type SearchResult } from "../github/index.js";

function formatResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return `未找到匹配的石板意图或地基。
提示：
- 尝试用更通用的关键词搜索
- 在 GitHub 仓库中创建 .slate/ 文件并添加 topic:slate-intention 或 topic:slate-foundation
- 当前全球石板网络还很年轻，你的发布就是第一批！`;
  }

  const lines: string[] = [
    `找到 ${results.length} 个结果（按 GitHub Stars 排序）：\n`,
  ];

  for (const r of results) {
    const typeIcon = r.type === "intention" ? "💡意图" : "🧱地基";
    lines.push(`### ${typeIcon} [${r.repo}](${r.url}) ⭐ ${r.stars}`);
    if (r.description) lines.push(`> ${r.description}`);
    lines.push(`- 类型: ${r.type}`);
    lines.push(`- 更新: ${r.updatedAt}`);
    lines.push("");
  }

  lines.push("——");
  lines.push("使用 `slate_read` 查看具体协议内容。");
  lines.push("使用 `slate_claim` 认领开放意图。");

  return lines.join("\n");
}

export function registerSlateSearch(server: McpServer): void {
  server.tool(
    "slate_search",
    `Search GitHub for Slate protocol intentions and foundations across ALL public repositories worldwide.

MUST BE USED when starting a new feature, when the user describes something to build, or before writing new code for a specific functionality. This tool finds existing reusable components (foundations) and open tasks (intentions) from the global Slate network.

The search scans:
1. All GitHub repositories with .slate/ protocol files
2. Repositories tagged with topic:slate-intention or topic:slate-foundation
Results are ranked by GitHub stars (quality signal from real usage).

Use PROACTIVELY — search BEFORE coding. Keywords: build, create, add, implement, feature, component, function, page, library, module.`,
    {
      query: z.string().describe("What you're looking for. Describe the functionality in natural language, e.g. 'Stripe payment integration' or 'login form component'"),
      tech_stack: z.string().optional().describe("Relevant tech stack to narrow results, e.g. 'React, TypeScript, Tailwind'"),
      type: z.enum(["intention", "foundation", "both"]).optional().default("both").describe("Filter by Slate protocol type"),
    },
    async ({ query, tech_stack, type }) => {
      const searchQuery = tech_stack ? `${query} ${tech_stack}` : query;
      const results = await searchGlobal(searchQuery, type);
      return {
        content: [{ type: "text", text: formatResults(results) }],
      };
    }
  );
}
