/**
 * slate_publish — 发布意图或地基
 *
 * 创建 .slate/ 目录并写入协议文件。
 * 可选：添加 GitHub topics 以便全球搜索发现。
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGitHubUsername } from "../github/index.js";
import { writeProtocolFile, type ProtocolFile } from "../protocol/index.js";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export function registerSlatePublish(server: McpServer): void {
  server.tool(
    "slate_publish",
    `Publish a new Slate intention or foundation to the global network.

Creates the .slate/ directory with proper protocol files (identity.json + intention.json or foundation.json).
After publishing, GitHub topics are added automatically so the project becomes discoverable
by slate_search worldwide.

Use this tool when:
- You want to declare a new intention (something you want built)
- You've created a reusable component/foundation and want others to discover it
- Initializing a project for Slate protocol participation`,
    {
      type: z.enum(["intention", "foundation"]).describe("What to publish: an intention (something to build) or a foundation (reusable component)"),
      summary: z.string().describe("Short description. For intentions: what should be built. For foundations: what the component does."),
      proof_file: z.string().optional().describe("For intentions: path to proof file (video, sketch, voice note). e.g. 'ignition/proof.mp4'"),
      proof_hash: z.string().optional().describe("For intentions: SHA-256 hash of the proof file"),
      version: z.string().optional().default("0.1.0").describe("For foundations: semantic version"),
      exports: z.array(z.string()).optional().default([]).describe("For foundations: list of exported modules/APIs"),
    },
    async ({ type, summary, proof_file, proof_hash, version, exports: exp }) => {
      try {
        const cwd = process.cwd();
        const username = (await getGitHubUsername()) || "unknown";
        const slateDir = resolve(cwd, ".slate");

        // 确保 .slate/ 目录存在
        if (!existsSync(slateDir)) {
          mkdirSync(slateDir, { recursive: true });
        }

        // 写入 identity.json
        const identity = {
          protocol: "slate/0.1" as const,
          type,
          owner: username,
          created: new Date().toISOString(),
        };
        const idResult = writeProtocolFile(cwd, "identity.json", identity);
        if (!idResult.success) {
          return {
            content: [{ type: "text", text: `❌ identity.json 写入失败: ${idResult.errors.join(", ")}` }],
            isError: true,
          };
        }

        // 写入 intention.json 或 foundation.json
        if (type === "intention") {
          const intention = {
            igniter: username,
            proof_file: proof_file || "",
            proof_hash: proof_hash || "",
            summary,
            status: "open" as const,
            claimed_by: null,
            completion_pr: null,
          };
          const result = writeProtocolFile(cwd, "intention.json", intention);
          if (!result.success) {
            return {
              content: [{ type: "text", text: `❌ intention.json 写入失败: ${result.errors.join(", ")}` }],
              isError: true,
            };
          }
        } else {
          const foundation = {
            architect: username,
            name: summary.split("：")[0] || summary,
            description: summary,
            version: version || "0.1.0",
            exports: exp || [],
          };
          const result = writeProtocolFile(cwd, "foundation.json", foundation);
          if (!result.success) {
            return {
              content: [{ type: "text", text: `❌ foundation.json 写入失败: ${result.errors.join(", ")}` }],
              isError: true,
            };
          }
        }

        // 提示添加 GitHub topics
        const topicLabel = type === "intention" ? "slate-intention" : "slate-foundation";
        const files = type === "intention"
          ? ".slate/identity.json + .slate/intention.json"
          : ".slate/identity.json + .slate/foundation.json";

        return {
          content: [{
            type: "text",
            text: `✅ **已发布 ${type === "intention" ? "意图" : "地基"}！**

已创建: ${files}
类型: ${type}
${type === "intention" ? `点火者: ${username}\n意图: ${summary}` : `架构师: ${username}\n地基: ${summary}\n版本: ${version}`}

💡 **让全球 AI 发现你的${type === "intention" ? "意图" : "地基"}**：
运行以下命令添加 GitHub topic：
\`\`\`bash
gh api repos/$(git config --get remote.origin.url | sed 's/.*github.com[:/]//' | sed 's/.git$//')/topics -f names[]="${topicLabel}" -f names[]="${summary.split(" ").slice(0, 3).join("-").toLowerCase()}"
\`\`\`

提交并推送到 GitHub 后，全球的 AI 就能通过 \`slate_search\` 发现它。`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `❌ 发布失败: ${e instanceof Error ? e.message : String(e)}` }],
          isError: true,
        };
      }
    }
  );
}
