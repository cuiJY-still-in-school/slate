/**
 * slate_write — 校验并写入协议文件
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { validateProtocolData, writeProtocolFile, type ProtocolFile } from "../protocol/index.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function registerSlateWrite(server: McpServer): void {
  server.tool(
    "slate_write",
    `Validate and write a .slate/ protocol file.

WHEN TO USE:
- After claiming an intention: update status to "claimed"
- After completing a build: update status to "completed"
- Adding a dependency: update dependencies.json with the foundation you used
- Initializing a project: write identity.json

The content is validated against the Slate protocol schema before writing.
If validation fails, you'll get specific error messages telling you what to fix.`,
    {
      file: z.enum(["identity.json", "intention.json", "foundation.json", "dependencies.json"]).describe("Which file to write"),
      content: z.record(z.unknown()).describe("Full JSON content to write — will be validated first"),
    },
    async ({ file, content }) => {
      const cwd = process.cwd();
      const slateDir = resolve(cwd, ".slate");
      if (!existsSync(slateDir)) {
        return { content: [{ type: "text", text: "当前项目没有 .slate/ 目录。运行 slate setup 初始化。" }], isError: true };
      }

      const protoFile = file.replace(".json", "") as ProtocolFile;
      const validation = validateProtocolData(protoFile, content);
      if (!validation.valid) {
        return { content: [{ type: "text", text: `❌ 校验失败 — ${file}\n\n${validation.errors.map(e => `  - ${e}`).join("\n")}\n\n请修正以上字段后重试。` }], isError: true };
      }

      const result = writeProtocolFile(cwd, protoFile, content);
      if (!result.success) {
        return { content: [{ type: "text", text: `写入失败: ${result.errors.join(", ")}` }], isError: true };
      }

      return { content: [{ type: "text", text: `✅ 已写入 .slate/${file}` }] };
    }
  );
}
