/**
 * 石板 CLI — 配置和管理工具
 *
 *   slate           启动 MCP Server（默认）
 *   slate init      初始化项目 .slate/
 *   slate setup     自动检测平台并配置 MCP
 *   slate config    查看/编辑配置
 *   slate login     GitHub 登录
 *   slate whoami    查看登录状态
 */

import { Command } from "commander";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { deviceFlowLogin, patLogin, logout, whoami, loadAuth } from "./auth/index.js";

const program = new Command();
const VERSION = "0.2.0";

program
  .name("slate")
  .description("🪨 石板 — 全球人-AI 共创协议 CLI")
  .version(VERSION);

// ─── 默认：启动 MCP Server ──────────────────────────
program
  .command("mcp", { isDefault: true })
  .description("启动 MCP Server（供 Claude Code / Cursor / Copilot 接入）")
  .action(async () => {
    const { startMcpServer } = await import("./mcp.js");
    await startMcpServer();
  });

// ─── init：初始化项目 ────────────────────────────────
program
  .command("init")
  .description("在当前目录初始化 .slate/ 协议文件")
  .option("-t, --type <type>", "项目类型", "standalone")
  .option("-s, --summary <summary>", "项目描述")
  .action(async (opts) => {
    const cwd = process.cwd();
    const slateDir = join(cwd, ".slate");
    const auth = loadAuth();
    let user = auth?.user || "unknown";
    if (!auth?.user) {
      try {
        user = execSync("gh api user --jq .login", {
          encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000,
        }).trim();
      } catch { user = "unknown"; }
    }

    if (!existsSync(slateDir)) mkdirSync(slateDir, { recursive: true });

    const identity = {
      protocol: "slate/0.1",
      type: opts.type,
      owner: user,
      created: new Date().toISOString(),
    };
    writeFileSync(join(slateDir, "identity.json"), JSON.stringify(identity, null, 2) + "\n");

    // 根据类型创建对应文件
    if (opts.type === "intention" && opts.summary) {
      writeFileSync(join(slateDir, "intention.json"), JSON.stringify({
        igniter: user, proof_file: "", proof_hash: "",
        summary: opts.summary, status: "open", claimed_by: null, completion_pr: null,
      }, null, 2) + "\n");
    } else if (opts.type === "foundation" && opts.summary) {
      writeFileSync(join(slateDir, "foundation.json"), JSON.stringify({
        architect: user, name: opts.summary, description: opts.summary,
        version: "0.1.0", exports: [],
      }, null, 2) + "\n");
    }

    console.log(`✅ 已初始化 .slate/ (type: ${opts.type}, owner: ${user})`);
    console.log("   接下来: slate setup  配置 AI 工具接入");
  });

// ─── setup：自动配置 AI 工具 ──────────────────────────
program
  .command("setup")
  .description("自动检测 AI 工具并配置石板接入")
  .option("-p, --platform <platform>", "指定平台: claude-code | cursor | copilot")
  .action(async (opts) => {
    const cwd = process.cwd();
    const platforms = detectPlatforms();
    const target = opts.platform || platforms[0];

    if (!target) {
      console.log("❌ 未检测到支持的 AI 工具。手动指定：");
      console.log("   slate setup --platform claude-code");
      console.log("   slate setup --platform cursor");
      console.log("   slate setup --platform copilot");
      return;
    }

    switch (target) {
      case "claude-code": {
        // 检查 claude 是否可用
        try {
          execSync("claude mcp list", { stdio: "pipe", timeout: 5000 });
          execSync("claude mcp add slate -- npx @slate-protocol/slate mcp", {
            stdio: "inherit", timeout: 10000,
          });
        } catch {
          // Claude Code 未安装，创建 .mcp.json
          const mcpConfig = {
            mcpServers: {
              slate: { type: "stdio", command: "npx", args: ["@slate-protocol/slate", "mcp"] },
            },
          };
          writeFileSync(join(cwd, ".mcp.json"), JSON.stringify(mcpConfig, null, 2) + "\n");
          console.log("✅ 已创建 .mcp.json（Claude Code）");
          console.log("   下次启动 claude 时批准 slate 工具即可");
        }
        break;
      }
      case "cursor": {
        const cursorDir = join(cwd, ".cursor");
        if (!existsSync(cursorDir)) mkdirSync(cursorDir, { recursive: true });
        const mcpConfig = {
          mcpServers: {
            slate: { type: "stdio", command: "npx", args: ["@slate-protocol/slate", "mcp"] },
          },
        };
        writeFileSync(join(cursorDir, "mcp.json"), JSON.stringify(mcpConfig, null, 2) + "\n");
        console.log("✅ 已创建 .cursor/mcp.json（Cursor）");
        console.log("   重启 Cursor 后生效");
        break;
      }
      case "copilot": {
        console.log("Copilot MCP 配置需要手动添加到 VS Code settings.json:");
        console.log(`
{
  "github.copilot.mcp.servers": {
    "slate": {
      "command": "npx",
      "args": ["@slate-protocol/slate", "mcp"]
    }
  }
}`);
        console.log("   复制以上内容到 .vscode/settings.json");
        break;
      }
    }
  });

// ─── config：查看配置 ─────────────────────────────────
program
  .command("config")
  .description("查看当前配置状态")
  .action(() => {
    const cwd = process.cwd();
    const auth = loadAuth();

    console.log("🪨 石板配置");
    console.log("");

    // 登录状态
    if (auth) {
      console.log(`👤 GitHub: ${auth.user} (${auth.method})`);
      console.log(`   登录时间: ${auth.loginAt}`);
    } else {
      console.log("👤 GitHub: 未登录 (slate login)");
    }

    // 项目协议状态
    const slateDir = join(cwd, ".slate");
    if (existsSync(slateDir)) {
      console.log(`📋 .slate/: 已初始化`);
      for (const f of ["identity.json", "intention.json", "foundation.json", "dependencies.json"]) {
        if (existsSync(join(slateDir, f))) console.log(`   ✅ ${f}`);
        else console.log(`   ⬚ ${f}`);
      }
    } else {
      console.log("📋 .slate/: 未初始化 (slate init)");
    }

    // AI 工具配置
    if (existsSync(join(cwd, ".mcp.json"))) console.log("🔌 Claude Code: 已配置 (.mcp.json)");
    if (existsSync(join(cwd, ".cursor", "mcp.json"))) console.log("🔌 Cursor: 已配置 (.cursor/mcp.json)");

    // 检测到的平台
    const platforms = detectPlatforms();
    if (platforms.length > 0) console.log(`🖥️  检测到: ${platforms.join(", ")}`);
    else console.log("🖥️  未检测到 AI 工具 (slate setup)");
  });

// ─── login / logout / whoami ─────────────────────────
program
  .command("login")
  .description("GitHub 登录")
  .option("-t, --token <token>", "使用 Personal Access Token")
  .action(async (opts) => {
    if (opts.token) {
      await patLogin(opts.token);
    } else {
      try {
        await deviceFlowLogin();
      } catch (e) {
        console.log(`❌ ${e instanceof Error ? e.message : String(e)}`);
        console.log("\n备选: slate login --token <your-github-token>");
      }
    }
  });

program.command("logout").description("退出登录").action(() => logout());
program.command("whoami").description("查看登录用户").action(() => whoami());

// ─── 安装命令（给用户用）─────────────────────────────
program
  .command("install")
  .description("全局安装到 PATH")
  .action(() => {
    const binDir = join(process.env.HOME || "~", ".local", "bin");
    if (!existsSync(binDir)) mkdirSync(binDir, { recursive: true });
    const target = join(binDir, "slate");
    writeFileSync(target, `#!/usr/bin/env bash
SLATE_DIR="\${SLATE_INSTALL_DIR:-\$HOME/.slate}"
cd "\$SLATE_DIR" && exec node dist/index.js "\$@"
`);
    execSync(`chmod +x "${target}"`);
    console.log(`✅ 已安装到 ${target}`);
    console.log("   确保 ~/.local/bin 在你的 PATH 中");
  });

// ─── 辅助函数 ─────────────────────────────────────────
function detectPlatforms(): string[] {
  const platforms: string[] = [];

  // 检测 Claude Code
  try {
    execSync("claude --version", { stdio: "pipe", timeout: 5000 });
    platforms.push("claude-code");
  } catch { /* not installed */ }

  // 检测 Cursor（通过 VS Code 配置目录）
  const home = process.env.HOME || "~";
  if (existsSync(join(home, ".cursor")) ||
      existsSync(join(home, ".config", "Cursor"))) {
    platforms.push("cursor");
  }

  // 检测 VS Code / Copilot
  try {
    execSync("code --version", { stdio: "pipe", timeout: 5000 });
    platforms.push("copilot");
  } catch { /* not installed */ }

  return platforms;
}

program.parse();
