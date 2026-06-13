/**
 * PostToolUse Hook — 自动飞轮捕获
 *
 * AI 每完成一个工具调用后执行。自动检测可发布的地基，
 * 自动记录依赖关系。AI 不需要主动调 slate_publish——
 * 写完代码的那一刻，飞轮已经在转了。
 *
 * 检测：
 * 1. Write/Edit 创建了新组件 → 自动写 .slate/foundation.json
 * 2. Bash 中 npm install → 检测新依赖，更新 dependencies.json
 * 3. Bash 中 git push → 提示添加 slate-foundation topic
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";

function main(): void {
  const toolName = process.env.CLAUDE_TOOL_NAME || "";
  const toolInput = process.env.CLAUDE_TOOL_INPUT || "{}";
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  let input: Record<string, unknown> = {};
  try { input = JSON.parse(toolInput); } catch {}

  // ─── 信号1: 新文件 → 自动发布地基 ────────────────
  if (toolName === "Write" || toolName === "Edit") {
    const filePath = (input.file_path || input.filePath || "") as string;
    if (!filePath) return;

    // 判断是否是可复用组件
    const isComponent =
      filePath.includes("/components/") ||
      filePath.includes("/lib/") ||
      filePath.includes("/utils/") ||
      filePath.match(/\.(tsx?|jsx?)$/) ||
      filePath.includes("/src/");

    if (!isComponent) return;

    try {
      const content = readFileSync(filePath, "utf-8");
      // 检查是否导出了内容
      const hasExports = /export (const|function|class|default|interface|type)/.test(content);
      if (!hasExports) return;

      // 自动创建地基
      const slateDir = join(cwd, ".slate");
      if (!existsSync(slateDir)) mkdirSync(slateDir, { recursive: true });

      const name = basename(filePath, filePath.includes(".") ? filePath.split(".").slice(-1)[0] : "");
      const dir = dirname(filePath);
      const exports = content.match(/export (?:const|function|class) (\w+)/g)
        ?.map(m => m.replace(/export (?:const|function|class) /, "")) || [];

      // 只在新地基不存在时创建
      const foundationPath = join(slateDir, "foundation.json");
      if (!existsSync(foundationPath)) {
        const foundation = {
          architect: "auto",
          name: name,
          description: `Auto-captured from ${filePath}`,
          version: "0.1.0",
          exports,
        };
        writeFileSync(foundationPath, JSON.stringify(foundation, null, 2) + "\n");

        // 确保 identity.json 存在
        if (!existsSync(join(slateDir, "identity.json"))) {
          writeFileSync(join(slateDir, "identity.json"), JSON.stringify({
            protocol: "slate/0.1", type: "foundation",
            owner: "auto", created: new Date().toISOString(),
          }, null, 2) + "\n");
        }
      }
    } catch { /* best effort */ }
  }

  // ─── 信号2: 安装依赖 → 检测地基 ──────────────────
  if (toolName === "Bash" || toolName === "exec") {
    const cmd = (input.command || "") as string;
    if (cmd.includes("npm install") || cmd.includes("yarn add") || cmd.includes("bun add") || cmd.includes("pnpm add")) {
      // 提取包名，检查是否是石板地基
      const pkgMatch = cmd.match(/(?:install|add)\s+(?:-[-]?\w+\s+)*(@?[\w@.\-/]+)/);
      if (pkgMatch) {
        const pkg = pkgMatch[1].replace(/@[\d.]+$/, "");
        const slateDir = join(cwd, ".slate");
        const depPath = join(slateDir, "dependencies.json");
        if (existsSync(depPath)) {
          try {
            const deps = JSON.parse(readFileSync(depPath, "utf-8"));
            const exists = deps.dependencies?.some((d: any) => d.foundation_repo === `npm:${pkg}`);
            if (!exists) {
              if (!deps.dependencies) deps.dependencies = [];
              deps.dependencies.push({
                foundation_repo: `npm:${pkg}`,
                architect: "npm",
                ref: "latest",
                note: `自动捕获于 ${new Date().toISOString().slice(0, 10)}`,
              });
              writeFileSync(depPath, JSON.stringify(deps, null, 2) + "\n");
            }
          } catch {}
        }
      }
    }
  }

  // ─── 信号3: 搜索缓存 ─────────────────────────────
  if (toolName === "slate_search") {
    const cacheDir = join(cwd, ".slate", "cache");
    if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
    try {
      const output = process.env.CLAUDE_TOOL_OUTPUT || "";
      const match = output.match(/找到 (\d+) 个结果/);
      writeFileSync(join(cacheDir, "last_search.json"), JSON.stringify({
        query: (input.query as string) || "",
        count: match ? parseInt(match[1]) : 0,
        time: Date.now(),
      }));
    } catch {}
  }
}

main();
