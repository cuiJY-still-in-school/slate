/**
 * slate_review — 深度质量分析
 *
 * 读取 GitHub Issues（真实程序员评价）、commit 活跃度、
 * license、开源健康度，提炼适用场景和已知坑。
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getRepoActivity, enrichQuality, analyzeSuitability, type SearchResult } from "../github/index.js";

function formatReview(r: SearchResult, activity: Awaited<ReturnType<typeof getRepoActivity>>): string {
  const score = r.qualityScore || 50;
  const stars = r.stars ? `⭐${r.stars}` : "";
  const lines = [
    `# 📋 ${r.repo}`,
    ``,
    r.description ? `> ${r.description}` : "",
    ``,
    `## 质量评分: ${"⭐".repeat(Math.round(score / 20))} ${score}/100 ${stars}`,
    ``,
  ];

  if (r.license) lines.push(`📜 ${r.license}`);
  if (r.lastCommitAt) lines.push(`🕐 最近推送: ${r.lastCommitAt.slice(0, 10)}`);
  lines.push("");

  if (r.suitableFor?.length) {
    lines.push("## ✅ 适合做什么");
    for (const s of r.suitableFor) lines.push(`- ${s}`);
    lines.push("");
  }
  if (r.painPoints?.length) {
    lines.push("## ⚠️ 注意事项");
    for (const p of r.painPoints) lines.push(`- ${p}`);
    lines.push("");
  }

  if (activity) {
    const icon = activity.healthLabel === "healthy" ? "🟢" : activity.healthLabel === "moderate" ? "🟡" : activity.healthLabel === "neglected" ? "🔴" : "⚪";
    lines.push("## 社区健康度");
    lines.push(`- Open Issues: ${activity.openIssues} | 已关闭: ${activity.closedIssues} | PRs: ${activity.openPRs}`);
    lines.push(`- 状态: ${icon} ${activity.healthLabel}`);
    lines.push("");

    if (activity.recentIssueTitles.length > 0) {
      lines.push("## 最近 Issues");
      for (const t of activity.recentIssueTitles.slice(0, 5)) lines.push(`- "${t}"`);
      lines.push("");
      lines.push("> Issues 是最真实的代码评价——每个 issue 都是开发者踩过的坑。");
      lines.push("");
    }
  }

  if (score >= 80) lines.push("✅ **推荐使用** — 高质量，活跃维护，社区健康。");
  else if (score >= 50) lines.push("⚠️ **可用但注意** — 检查最近的 issues 是否有阻塞性 bug。");
  else if (score >= 30) lines.push("🔴 **谨慎** — 不太活跃或 issue 堆积。考虑替代方案。");
  else lines.push("❌ **不建议** — 质量信号弱。");

  return lines.filter(l => l !== undefined).join("\n");
}

export function registerSlateReview(server: McpServer): void {
  server.tool(
    "slate_review",
    `Deep quality assessment of a GitHub repository.

WHAT IT ANALYZES:
- GitHub Issues: open/closed ratio, recent issue titles (real programmer feedback)
- Activity: last commit date, release frequency
- Community: PR health, maintainer responsiveness
- Quality: license, documentation signals
- Suitability: what the project is good for (extracted from topics, issues, README)
- Pain points: known problems (extracted from issue complaints)

WHEN TO USE: After slate_search returns results. Call this on the top result(s)
to decide whether a foundation is high-quality enough to depend on.

The output includes a clear recommendation: ✅ use / ⚠️ caution / 🔴 avoid.`,
    {
      repo: z.string().describe("Repository to review, e.g. 'pmndrs/zustand' or 'colinhacks/zod'"),
      source: z.enum(["github"]).optional().default("github"),
    },
    async ({ repo }) => {
      const result: SearchResult = {
        repo, owner: repo.split("/")[0], name: repo.split("/")[1] || repo,
        description: "", stars: 0, type: "foundation", source: "github",
        url: `https://github.com/${repo}`, updatedAt: "",
      };
      const enriched = await enrichQuality(result);
      await analyzeSuitability(enriched);
      const activity = await getRepoActivity(repo);
      return { content: [{ type: "text", text: formatReview(enriched, activity) }] };
    }
  );
}
