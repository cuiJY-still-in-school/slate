/**
 * UserPromptSubmit Hook — 上下文注入
 *
 * 在 Claude Code 每次处理用户 prompt 之前执行。
 * 读取当前项目的 .slate/ 协议文件，生成一段注入文本。
 *
 * 配置方式（.claude/settings.local.json 或项目 .claude/settings.json）:
 * {
 *   "hooks": {
 *     "UserPromptSubmit": [{
 *       "matcher": "*",
 *       "hooks": [{
 *         "type": "command",
 *         "command": "node /path/to/slate/dist/hooks/resolve.js"
 *       }]
 *     }]
 *   }
 * }
 */

import { readAllProtocolFiles } from "../protocol/index.js";

function main(): void {
  const cwd = process.cwd();
  const files = readAllProtocolFiles(cwd);

  const lines: string[] = [];

  // 只有存在协议文件时才注入（避免污染无关项目）
  if (!files.identity && !files.intention && !files.foundation) {
    return; // 无协议文件，不注入任何内容
  }

  lines.push("[石板协议上下文]");

  if (files.identity) {
    lines.push(`项目类型: ${files.identity.type}`);
    lines.push(`所有者: ${files.identity.owner}`);
  }

  if (files.intention) {
    const i = files.intention;
    lines.push(`意图: ${i.summary}`);
    lines.push(`点火者: ${i.igniter}`);
    lines.push(`状态: ${i.status}${i.claimed_by ? ` (认领人: ${i.claimed_by})` : ""}`);
    if (i.proof_file) {
      lines.push(`参考凭证: ${i.proof_file}`);
    }
  }

  if (files.foundation) {
    const f = files.foundation;
    lines.push(`地基: ${f.name} v${f.version}`);
    lines.push(`架构师: ${f.architect}`);
    lines.push(`导出: ${f.exports.join(", ")}`);
  }

  if (files.dependencies && files.dependencies.dependencies.length > 0) {
    lines.push("依赖地基:");
    for (const d of files.dependencies.dependencies) {
      lines.push(`  ${d.foundation_repo}@${d.ref} — ${d.note}`);
    }
    lines.push("在实现时优先复用以上依赖的地基。");
  }

  if (files.intention && files.intention.status === "open") {
    lines.push("注意: 这是一个 open 的意图。你被期望实现它。完成后更新状态为 completed。");
  }

  // Claude Code Hook 输出到 stdout，被注入到系统提示词
  process.stdout.write(lines.join("\n"));
}

main();
