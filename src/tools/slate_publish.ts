/**
 * slate_publish — 发布意图或地基
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeProtocolFile } from "../protocol/index.js";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";

function ghUser(): string {
  try { return execSync("gh api user --jq .login", { encoding: "utf-8", stdio: ["pipe","pipe","pipe"], timeout: 5000 }).trim(); }
  catch { return "unknown"; }
}

export function registerSlatePublish(server: McpServer): void {
  server.tool(
    "slate_publish",
    `Publish a new intention or foundation to the global Slate network.

WHAT THIS DOES:
1. Creates .slate/ directory with identity.json + intention.json or foundation.json
2. The project becomes discoverable by slate_search worldwide (via GitHub Code Search)

WHEN TO USE:
- You created a reusable component → publish as foundation
- You have an idea you want someone to build → publish as intention (open)

After publishing, commit and push the .slate/ files to GitHub.
Optionally add the slate-foundation or slate-intention topic for extra discoverability.`,
    {
      type: z.enum(["intention", "foundation"]).describe("What to publish"),
      summary: z.string().describe("Short description. Foundation: what it does. Intention: what to build."),
      version: z.string().optional().default("0.1.0").describe("For foundations: semantic version"),
      exports: z.array(z.string()).optional().default([]).describe("For foundations: exported modules/APIs"),
    },
    async ({ type, summary, version, exports: exp }) => {
      const cwd = process.cwd();
      const slateDir = resolve(cwd, ".slate");
      if (!existsSync(slateDir)) mkdirSync(slateDir, { recursive: true });
      const user = ghUser();

      const identity = { protocol: "slate/0.1", type, owner: user, created: new Date().toISOString() };
      writeProtocolFile(cwd, "identity.json", identity);

      if (type === "intention") {
        writeProtocolFile(cwd, "intention.json", {
          igniter: user, proof_file: "", proof_hash: "", summary, status: "open", claimed_by: null, completion_pr: null,
        });
      } else {
        writeProtocolFile(cwd, "foundation.json", {
          architect: user, name: summary.split("：")[0] || summary, description: summary, version: version || "0.1.0", exports: exp || [],
        });
      }

      const topic = type === "intention" ? "slate-intention" : "slate-foundation";
      return { content: [{ type: "text", text: [
        `✅ 已发布 ${type === "intention" ? "意图" : "地基"}！`,
        ``,
        `文件: .slate/identity.json + .slate/${type}.json`,
        `所有者: ${user}`,
        ``,
        `下一步:`,
        `  git add .slate/ && git commit -m "slate: publish ${type}" && git push`,
        ``,
        `可选: 添加 GitHub topic 增加可发现性`,
        `  gh api repos/{owner}/{repo}/topics -X PUT --input - <<<'{"names":["${topic}"]}'`,
      ].join("\n") }] };
    }
  );
}
