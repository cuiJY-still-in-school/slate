/**
 * 石板 CLI — 3 条命令
 *   slate        启动 MCP Server
 *   slate setup  一条龙配置
 *   slate login  GitHub 登录
 */

import { Command } from "commander";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { loadAuth, deviceFlowLogin, saveAuth } from "./auth/index.js";

const program = new Command();

program.name("slate").description("🪨 石板 — 全球 AI 协作协议").version("0.2.0");

// ─── 默认：MCP Server ──────────────────────────────
program
  .command("mcp")
  .description("启动 MCP Server")
  .action(async () => {
    const { startMcpServer } = await import("./mcp.js");
    await startMcpServer();
  });

// ─── setup ─────────────────────────────────────────
program
  .command("setup")
  .description("一条龙配置：GitHub 登录 → 初始化 → 关联 AI 工具")
  .option("-p, --platform <p>", "claude-code | cursor | copilot | openclaw")
  .action(async (opts) => {
    const cwd = process.cwd();
    console.log("🪨 石板 setup");
    console.log("");

    // 1. GitHub
    console.log("→ GitHub 登录…");
    let auth = loadAuth();
    if (auth) {
      console.log(`  ✅ 已登录: ${auth.user}`);
    } else {
      try {
        const token = execSync("gh auth token", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000 }).trim();
        const user = execSync("gh api user --jq .login", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000 }).trim();
        saveAuth({ token, user, loginAt: new Date().toISOString(), method: "gh_cli" });
        auth = { token, user, loginAt: new Date().toISOString(), method: "gh_cli" };
        console.log(`  ✅ gh CLI: ${user}`);
      } catch {
        console.log("  未检测到 gh CLI，启动设备流登录…");
        auth = await deviceFlowLogin();
        if (!auth) return;
      }
    }

    // 2. 初始化 .slate/
    console.log("→ 初始化 .slate/…");
    const slateDir = join(cwd, ".slate");
    if (!existsSync(slateDir)) {
      mkdirSync(slateDir, { recursive: true });
      writeFileSync(join(slateDir, "identity.json"), JSON.stringify({
        protocol: "slate/0.1", type: "standalone", owner: auth.user,
        created: new Date().toISOString(),
      }, null, 2) + "\n");
      writeFileSync(join(slateDir, "dependencies.json"), JSON.stringify({ dependencies: [] }, null, 2) + "\n");
      console.log("  ✅ .slate/identity.json");
      console.log("  ✅ .slate/dependencies.json");
    } else {
      console.log("  ✅ 已存在");
    }

    // 3. 配置所有检测到的平台
    const token = auth.token;
    const env = token ? { GH_TOKEN: token } : {};
    const nodePath = process.execPath;
    const installDir = process.env.SLATE_DIR || join(process.env.HOME || "~", ".slate");
    const mcp = { mcpServers: { slate: { type: "stdio", command: nodePath, args: [join(installDir, "dist/index.js"), "mcp"], ...(token ? { env } : {}) } } };

    const targets = opts.platform ? [opts.platform] : detectAllPlatforms();
    if (targets.length === 0) {
      console.log("  ⚠️  未检测到 AI 工具。指定: slate setup -p claude-code|cursor|copilot|openclaw");
      return;
    }

    console.log(`→ 配置 ${targets.length} 个平台…`);
    const configured: string[] = [];

    for (const p of targets) {
      switch (p) {
        case "claude-code": {
          // 全局 + 项目
          writeFileSync(join(home, ".mcp.json"), JSON.stringify(mcp, null, 2) + "\n");
          writeFileSync(join(cwd, ".mcp.json"), JSON.stringify(mcp, null, 2) + "\n");
          configured.push("Claude Code (~/.mcp.json)");
          break;
        }
        case "cursor": {
          const cd = join(home, ".cursor");
          if (!existsSync(cd)) mkdirSync(cd);
          writeFileSync(join(cd, "mcp.json"), JSON.stringify(mcp, null, 2) + "\n");
          // AI 指令
          writeFileSync(join(home, ".cursorrules"), "🪨 石板协议已激活。有 slate_search/review/read/write/claim/publish。写代码前 MUST 先调 slate_search。\n");
          configured.push("Cursor (~/.cursor/mcp.json + ~/.cursorrules)");
          break;
        }
        case "openclaw": {
          const od = join(home, ".config", "openclaw");
          if (!existsSync(od)) mkdirSync(od, { recursive: true });
          writeFileSync(join(od, "mcp.json"), JSON.stringify(mcp, null, 2) + "\n");
          writeFileSync(join(od, "instructions.md"), "# 石板协议\n写新代码前 MUST 先调 slate_search。\n");
          configured.push("OpenClaw (~/.config/openclaw/)");
          break;
        }
        case "copilot": {
          const ghDir = join(home, ".github");
          if (!existsSync(ghDir)) mkdirSync(ghDir);
          writeFileSync(join(ghDir, "copilot-instructions.md"), "🪨 石板协议已激活。有 slate_search/review/read/write/claim/publish。写代码前 MUST 先调 slate_search。\n");
          configured.push("Copilot (~/.github/copilot-instructions.md)");
          break;
        }
      }
    }

    console.log("");
    configured.forEach(c => console.log(`  ✅ ${c}`));
    console.log("");
    console.log(`🪨 完成！${auth.user} — ${configured.length} 个平台已配置`);
    console.log("下次启动 AI 工具时，石板工具自动加载。");
  });

// ─── status ────────────────────────────────────────
program
  .command("status")
  .description("查看配置状态")
  .action(() => {
    const cwd = process.cwd();
    const auth = loadAuth();

    console.log("");
    console.log(auth ? `👤 ${auth.user}  ✅` : "👤 未登录  ❌");
    console.log("");

    const sd = join(cwd, ".slate");
    console.log(existsSync(sd) ? "📋 .slate/  ✅" : "📋 .slate/  ❌ (slate setup)");
    if (existsSync(sd)) {
      for (const f of ["identity.json", "intention.json", "foundation.json", "dependencies.json"]) {
        console.log(`   ${existsSync(join(sd, f)) ? "✅" : "⬚"} ${f}`);
      }
    }
    console.log("");

    const platforms = [
      [join(cwd, ".mcp.json"), "Claude Code"],
      [join(cwd, ".cursor", "mcp.json"), "Cursor"],
      [join(cwd, "openclaw.mcp.json"), "OpenClaw"],
    ] as const;
    let found = false;
    for (const [path, name] of platforms) {
      if (existsSync(path)) { console.log(`🔌 ${name}  ✅`); found = true; }
    }
    if (!found) console.log("🔌 未关联 AI 工具  ❌ (slate setup)");
    console.log("");
  });

// ─── login ─────────────────────────────────────────
program
  .command("login")
  .description("GitHub 设备流登录")
  .action(async () => {
    try {
      await deviceFlowLogin();
    } catch (e) {
      console.log(`❌ ${e instanceof Error ? e.message : String(e)}`);
      console.log("备选: gh auth login && slate setup");
    }
  });

// ─── detect ────────────────────────────────────────
const home = process.env.HOME || "~";

async function detectPlatform(): Promise<string | null> {
  try { execSync("claude --version", { stdio: "pipe", timeout: 3000 }); return "claude-code"; } catch {}
  try { execSync("openclaw --version", { stdio: "pipe", timeout: 3000 }); return "openclaw"; } catch {}
  if (existsSync(join(home, ".cursor")) || existsSync(join(home, ".config", "Cursor"))) return "cursor";
  if (existsSync(join(home, ".config", "openclaw"))) return "openclaw";
  try { execSync("code --version", { stdio: "pipe", timeout: 3000 }); return "copilot"; } catch {}
  return null;
}

function detectAllPlatforms(): string[] {
  const platforms: string[] = [];
  try { execSync("claude --version", { stdio: "pipe", timeout: 3000 }); platforms.push("claude-code"); } catch {}
  try { execSync("openclaw --version", { stdio: "pipe", timeout: 3000 }); platforms.push("openclaw"); } catch {}
  if (existsSync(join(home, ".cursor")) || existsSync(join(home, ".config", "Cursor"))) platforms.push("cursor");
  if (existsSync(join(home, ".config", "openclaw")) && !platforms.includes("openclaw")) platforms.push("openclaw");
  try { execSync("code --version", { stdio: "pipe", timeout: 3000 }); platforms.push("copilot"); } catch {}
  if (platforms.length === 0) platforms.push("claude-code"); // 至少默认
  return platforms;
}

program.parse();
