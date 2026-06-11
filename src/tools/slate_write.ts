/**
 * slate_write — 校验并写入 .slate/ 协议文件
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { validateProtocolData, writeProtocolFile, type ProtocolFile } from "../protocol/index.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function registerSlateWrite(server: McpServer): void {
  server.tool(
    "slate_write",
    `Validate and write to a .slate/ protocol file.

The content is validated against the Slate protocol schema before writing.
Use this tool when:
- Initializing a project with slate init
- Updating intention status (open → claimed → completed)
- Adding a dependency to dependencies.json
- Publishing or updating a foundation definition

⚠️ The file will be validated before writing. If validation fails, the errors are returned so you can fix them.`,
    {
      file: z.enum(["identity.json", "intention.json", "foundation.json", "dependencies.json"]).describe("The .slate/ file to write to"),
      content: z.record(z.unknown()).describe("The JSON content to write. Will be validated against the protocol schema. Pass the full file content, not partial updates."),
    },
    async ({ file, content }) => {
      const cwd = process.cwd();
      const slateDir = resolve(cwd, ".slate");

      // 确保 .slate/ 目录存在
      if (!existsSync(slateDir)) {
        return {
          content: [{ type: "text", text: `❌ 当前项目没有 .slate/ 目录。\n请先创建目录: \`mkdir -p .slate\`\n或使用 \`slate_publish\` 自动创建。` }],
          isError: true,
        };
      }

      const protocolFile = file.replace(".json", "") as ProtocolFile;

      // 先校验
      const validation = validateProtocolData(protocolFile, content);
      if (!validation.valid) {
        return {
          content: [{
            type: "text",
            text: `❌ **校验失败** — ${file}\n\n以下字段不合法：\n${validation.errors.map((e) => `  - ${e}`).join("\n")}\n\n请修正后重试。`,
          }],
          isError: true,
        };
      }

      // 校验通过，写入
      const result = writeProtocolFile(cwd, protocolFile, content);

      if (!result.success) {
        return {
          content: [{ type: "text", text: `❌ 写入失败:\n${result.errors.map((e) => `  - ${e}`).join("\n")}` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: `✅ **已写入** \`.slate/${file}\`\n\n\`\`\`json\n${JSON.stringify(content, null, 2)}\n\`\`\`\n\n文件路径: ${result.path}`,
        }],
      };
    }
  );
}
