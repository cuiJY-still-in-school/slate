/**
 * slate_read — 读取协议文件
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readAllProtocolFiles } from "../protocol/index.js";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

export function registerSlateRead(server: McpServer): void {
  server.tool(
    "slate_read",
    `Read .slate/ protocol files from the current project or a remote GitHub repository.

WHEN TO USE:
- Starting work in a project: understand its identity, intention, and dependencies
- After slate_search: inspect a remote repo's .slate/ files to see its full protocol details
- Before publishing: check what foundations the project already depends on

Returns the parsed JSON content of the requested file.`,
    {
      repo: z.string().optional().describe("Repo 'owner/name' to read from. Omit to read current project."),
      file: z.enum(["identity", "intention", "foundation", "dependencies"]).describe("Which .slate/ file to read"),
    },
    async ({ repo, file }) => {
      if (repo) {
        try {
          const res = await fetch(`https://raw.githubusercontent.com/${repo}/refs/heads/main/.slate/${file}.json`);
          if (!res.ok) return { content: [{ type: "text", text: `${repo} 没有 .slate/${file}.json。该项目可能未初始化石板协议。` }] };
          return { content: [{ type: "text", text: `## .slate/${file}.json — ${repo}\n\n\`\`\`json\n${await res.text()}\n\`\`\`` }] };
        } catch (e) { return { content: [{ type: "text", text: `读取失败: ${e instanceof Error ? e.message : String(e)}` }], isError: true }; }
      }

      const cwd = process.cwd();
      const slateDir = resolve(cwd, ".slate");
      if (!existsSync(slateDir)) return { content: [{ type: "text", text: "当前项目没有 .slate/ 目录。运行 slate setup 初始化。" }] };

      const allFiles = readAllProtocolFiles(cwd);
      const data = allFiles[file as keyof typeof allFiles];
      if (!data) return { content: [{ type: "text", text: `.slate/${file}.json 不存在或格式无效` }] };
      return { content: [{ type: "text", text: `## .slate/${file}.json\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`` }] };
    }
  );
}
