/**
 * slate_read — 读取 .slate/ 协议文件
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readProtocolFile, readAllProtocolFiles } from "../protocol/index.js";
import { readProtocolFile as githubReadFile } from "../github/index.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function registerSlateRead(server: McpServer): void {
  server.tool(
    "slate_read",
    `Read .slate/ protocol files from the current project or any public GitHub repository.

Use this tool when:
- You need to understand a project's protocol context (identity, intention, dependencies)
- You found a foundation/intention via slate_search and want to see its full protocol details
- You need to check what foundations the current project depends on before writing code

Returns the parsed JSON content of the requested protocol file.`,
    {
      repo: z.string().optional().describe("Repository to read from, e.g. 'owner/repo'. Omit to read from the current project."),
      file: z.enum(["identity", "intention", "foundation", "dependencies"]).describe("Which .slate/ file to read"),
    },
    async ({ repo, file }) => {
      try {
        if (repo) {
          // 读远程仓库
          const content = await githubReadFile(repo, file);
          if (!content) {
            return {
              content: [{ type: "text", text: `❌ 在 ${repo} 中未找到 .slate/${file}.json。\n该仓库可能尚未初始化石板协议。` }],
            };
          }
          return {
            content: [{ type: "text", text: `## .slate/${file}.json — ${repo}\n\n\`\`\`json\n${content}\n\`\`\`` }],
          };
        }

        // 读当前项目
        const cwd = process.cwd();
        const slateDir = resolve(cwd, ".slate");
        if (!existsSync(slateDir)) {
          return {
            content: [{ type: "text", text: `❌ 当前项目尚未初始化 .slate/ 目录。\n运行 \`mkdir -p .slate\` 并创建协议文件，或使用 \`slate_publish\` 自动创建。` }],
          };
        }

        const allFiles = readAllProtocolFiles(cwd);
        const data = allFiles[file as keyof typeof allFiles];

        if (!data) {
          return {
            content: [{ type: "text", text: `⚠️ .slate/${file}.json 不存在或格式无效。` }],
          };
        }

        return {
          content: [{ type: "text", text: `## .slate/${file}.json — 当前项目\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`` }],
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `❌ 读取失败: ${e instanceof Error ? e.message : String(e)}` }],
          isError: true,
        };
      }
    }
  );
}
