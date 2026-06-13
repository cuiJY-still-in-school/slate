/**
 * UserPromptSubmit Hook — 预搜索 + 上下文注入
 *
 * 每次用户发 prompt 前：读取 prompt，自动在 .slate/ 缓存中匹配相关地基，
 * 直接注入到 AI 上下文。AI 不需要主动调 slate_search——结果已经在面前了。
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readAllProtocolFiles } from "../protocol/index.js";

function main(): void {
  const cwd = process.cwd();
  const prompt = process.env.CLAUDE_PROMPT || "";
  const files = readAllProtocolFiles(cwd);

  const lines: string[] = [];
  lines.push("🪨 [石板飞轮已激活]");
  lines.push("你有 slate_search/review/read/write/publish/claim 工具。");

  // 如果用户 prompt 包含"写/创建/实现/帮我"等关键词，提醒 AI 先搜索
  if (prompt.match(/写|创建|实现|帮我|build|create|implement|add|make|write/)) {
    lines.push("⚠️ 检测到编码意图。MUST 先调 slate_search，再写代码。");
  }

  // 项目上下文
  if (files.identity) {
    lines.push("");
    lines.push(`项目: ${files.identity.type} (${files.identity.owner})`);
  }
  if (files.intention) {
    lines.push(`意图: ${files.intention.summary} [${files.intention.status}]`);
    if (files.intention.status === "open") lines.push("⚠️ 此意图待实现。");
  }
  if (files.foundation) {
    lines.push(`地基: ${files.foundation.name} v${files.foundation.version}`);
  }
  if (files.dependencies?.dependencies?.length) {
    lines.push("依赖地基:");
    for (const d of files.dependencies.dependencies) {
      lines.push(`  ${d.foundation_repo}@${d.ref}`);
    }
    lines.push("复用这些，不要重复实现。");
  }

  // 缓存最近搜索结果供参考
  const cacheDir = join(cwd, ".slate", "cache");
  const cacheFile = join(cacheDir, "last_search.json");
  if (existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(readFileSync(cacheFile, "utf-8"));
      const age = Date.now() - cached.time;
      if (age < 3600000) { // 1小时内有效
        lines.push("");
        lines.push(`最近搜索 (${Math.round(age/60000)}分钟前): "${cached.query}" → ${cached.count} 个结果`);
      }
    } catch {}
  }

  process.stdout.write(lines.join("\n"));
}

main();
