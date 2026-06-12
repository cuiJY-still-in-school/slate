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
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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

// ─── import：导入地基依赖 ────────────────────────────
program
  .command("import <repo>")
  .description("导入地基到当前项目（更新 dependencies.json）")
  .option("-r, --ref <ref>", "版本引用", "latest")
  .option("-n, --note <note>", "用途备注", "")
  .action(async (repo, opts) => {
    const cwd = process.cwd();
    const slateDir = join(cwd, ".slate");
    if (!existsSync(slateDir)) mkdirSync(slateDir, { recursive: true });

    // 读取或创建 dependencies.json
    const depPath = join(slateDir, "dependencies.json");
    let deps: { dependencies: Array<Record<string, unknown>> };
    if (existsSync(depPath)) {
      deps = JSON.parse(readFileSync(depPath, "utf-8"));
    } else {
      deps = { dependencies: [] };
    }

    // 检查是否已存在
    const exists = deps.dependencies.some((d: any) => d.foundation_repo === repo);
    if (exists) {
      console.log(`⚠️  ${repo} 已在依赖列表中`);
      return;
    }

    // 读取地基元数据
    let architect = repo.split("/")[0];
    let note = opts.note;
    try {
      const metaPath = join(cwd, "registry", repo.replace("/", "-"), ".slate", "foundation.json");
      if (existsSync(metaPath)) {
        const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
        architect = meta.architect || architect;
        if (!note) note = meta.description?.slice(0, 60) || "";
      }
    } catch { /* use defaults */ }

    deps.dependencies.push({
      foundation_repo: repo,
      architect,
      ref: opts.ref,
      note: note || `导入于 ${new Date().toISOString().slice(0, 10)}`,
    });

    writeFileSync(depPath, JSON.stringify(deps, null, 2) + "\n");
    console.log(`✅ 已导入 ${repo} (${architect})`);
    console.log(`   .slate/dependencies.json 已更新`);
    console.log(`   查看: slate config`);
  });

// ─── registry：浏览策展地基 ──────────────────────────
program
  .command("registry")
  .description("浏览 31 个策展地基")
  .option("-c, --category <cat>", "按类别筛选")
  .action((opts) => {
    const srcDir = dirname(fileURLToPath(import.meta.url));
    const regDir = join(srcDir, "..", "registry");
    if (!existsSync(regDir)) {
      console.log("registry/ 目录不存在（从源码运行时可用）");
      return;
    }

    const categories: Record<string, string[]> = {};
    for (const entry of readdirSync(regDir)) {
      if (entry === "generate.ts" || entry === "generate-v2.ts") continue;
      const foundationPath = join(regDir, entry, ".slate", "foundation.json");
      if (!existsSync(foundationPath)) continue;
      try {
        const f = JSON.parse(readFileSync(foundationPath, "utf-8"));
        // 从 keywords 推断类别
        const kws: string[] = f.keywords || [];
        let cat = "其他";
        if (kws.some((k: string) => ["react","state","store","状态管理"].includes(k))) cat = "状态管理";
        else if (kws.some((k: string) => ["validation","schema","校验"].includes(k))) cat = "校验";
        else if (kws.some((k: string) => ["http","fetch","HTTP"].includes(k))) cat = "HTTP";
        else if (kws.some((k: string) => ["orm","database","sql","ORM"].includes(k))) cat = "ORM";
        else if (kws.some((k: string) => ["css","styling","tailwind","样式"].includes(k))) cat = "样式";
        else if (kws.some((k: string) => ["testing","test","测试"].includes(k))) cat = "测试";
        else if (kws.some((k: string) => ["auth","认证"].includes(k))) cat = "认证";
        else if (kws.some((k: string) => ["cli","命令行","CLI"].includes(k))) cat = "CLI";
        else if (kws.some((k: string) => ["runtime","framework","框架","运行时"].includes(k))) cat = "运行时";
        else if (kws.some((k: string) => ["security","crypto","加密","安全"].includes(k))) cat = "安全";
        else if (kws.some((k: string) => ["lint","format","代码质量"].includes(k))) cat = "工具";
        else if (kws.some((k: string) => ["ai","llm","AI"].includes(k))) cat = "AI";

        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(`${f.name} (${entry.replace(/-/g, "/").replace("//", "/")})`);
      } catch { /* skip */ }
    }

    for (const [cat, items] of Object.entries(categories).sort()) {
      if (opts.category && cat !== opts.category) continue;
      console.log(`\n📂 ${cat}`);
      for (const item of items) console.log(`   ${item}`);
    }
    console.log(`\n导入: slate import <owner/repo>`);
  });

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
