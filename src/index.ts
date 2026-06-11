/**
 * 石板 (Slate) v0.1 — MCP Server 入口
 *
 * 启动方式: npx @slate-protocol/slate
 * Claude Code: claude mcp add slate -- npx @slate-protocol/slate
 *
 * 使用 stdio transport，AI 宿主进程通过标准输入/输出与石板通信。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getGitHubToken } from "./github/index.js";
import { registerSlateSearch } from "./tools/slate_search.js";
import { registerSlateRead } from "./tools/slate_read.js";
import { registerSlateWrite } from "./tools/slate_write.js";
import { registerSlateClaim } from "./tools/slate_claim.js";
import { registerSlatePublish } from "./tools/slate_publish.js";

const SERVER_NAME = "slate";
const SERVER_VERSION = "0.1.0";

async function main(): Promise<void> {
  // 校验 GitHub 凭据
  const token = await getGitHubToken();
  const authStatus = token ? "✅ GitHub 已认证" : "⚠️ GitHub 未认证（运行 gh auth login）";

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // 注册所有石板工具
  registerSlateSearch(server);
  registerSlateRead(server);
  registerSlateWrite(server);
  registerSlateClaim(server);
  registerSlatePublish(server);

  // stdio 传输：AI 宿主通过 stdin/stdout 与石板通信
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // 日志通过 stderr 输出（stdio transport 中 stdout 是 JSON-RPC 通道）
  console.error(`🪨 石板 v${SERVER_VERSION} 已启动 — ${authStatus}`);
}

main().catch((err) => {
  console.error("石板启动失败:", err);
  process.exit(1);
});
