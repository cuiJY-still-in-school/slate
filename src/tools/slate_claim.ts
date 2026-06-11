/**
 * slate_claim — 认领意图
 *
 * Fork 意图仓库 → 更新 intention.json 状态 → 创建 PR
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { forkRepo, getGitHubUsername, readProtocolFile as githubReadFile } from "../github/index.js";
import { execSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export function registerSlateClaim(server: McpServer): void {
  server.tool(
    "slate_claim",
    `Claim an open intention from the global Slate network.

This will:
1. Fork the intention repository to your GitHub account
2. Clone the fork locally
3. Update intention.json: status → "claimed", claimed_by → your GitHub username
4. Commit and push the change
5. Create a PR to the original repository

Use this when you find an open intention (via slate_search) that you want to build.
After completing the implementation, use slate_write to update status to "completed".`,
    {
      repo: z.string().describe("Full repository name to claim, e.g. 'owner/repo'. Must be an intention-type Slate project with status: 'open'."),
    },
    async ({ repo }) => {
      try {
        // 1. 获取当前用户
        const username = await getGitHubUsername();
        if (!username) {
          return {
            content: [{ type: "text", text: "❌ 无法获取 GitHub 用户名。请确保已运行 `gh auth login`。" }],
            isError: true,
          };
        }

        // 2. 读取意图确认状态
        const intentionRaw = await githubReadFile(repo, "intention");
        if (!intentionRaw) {
          return {
            content: [{ type: "text", text: `❌ ${repo} 没有 .slate/intention.json，无法认领。` }],
            isError: true,
          };
        }

        const intention = JSON.parse(intentionRaw);
        if (intention.status !== "open") {
          return {
            content: [{ type: "text", text: `❌ 意图状态为 "${intention.status}"，无法认领。只有 open 状态的意图可以认领。` }],
            isError: true,
          };
        }

        // 3. Fork 仓库
        const fork = await forkRepo(repo);
        if (!fork) {
          return {
            content: [{ type: "text", text: `❌ Fork ${repo} 失败。请检查仓库是否存在且你有访问权限。` }],
            isError: true,
          };
        }

        // 4. Clone fork
        const tmpDir = join(tmpdir(), `slate-claim-${Date.now()}`);
        const cloneUrl = `https://github.com/${fork.owner}/${repo.split("/")[1]}.git`;
        execSync(`git clone "${cloneUrl}" "${tmpDir}"`, {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 30000,
        });

        // 5. 更新 intention.json
        intention.status = "claimed";
        intention.claimed_by = username;
        const slateDir = join(tmpDir, ".slate");
        if (!existsSync(slateDir)) mkdirSync(slateDir, { recursive: true });
        writeFileSync(
          join(slateDir, "intention.json"),
          JSON.stringify(intention, null, 2) + "\n",
          "utf-8"
        );

        // 6. Commit + Push
        execSync(`cd "${tmpDir}" && git add .slate/intention.json && git commit -m "slate: claim intention — ${intention.summary}" && git push`, {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 30000,
        });

        // 7. 创建 PR
        const prUrl = execSync(
          `cd "${tmpDir}" && gh pr create --repo "${repo}" --title "slate: claim — ${intention.summary}" --body "🤖 由石板协议自动生成\\n\\n认领人: @${username}\\n意图: ${intention.summary}\\n\\n开始构建此意图。"`,
          { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 30000 }
        ).trim();

        return {
          content: [{
            type: "text",
            text: `✅ **已认领意图** \`${repo}\`\n\n- 认领人: @${username}\n- 意图: ${intention.summary}\n- Fork: ${cloneUrl}\n- PR: ${prUrl}\n\n下一步：clone 你的 fork，开始实现。完成后用 \`slate_write\` 更新状态为 "completed"。`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `❌ 认领失败: ${e instanceof Error ? e.message : String(e)}` }],
          isError: true,
        };
      }
    }
  );
}
