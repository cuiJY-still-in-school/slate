/**
 * PostToolUse Hook — 信号捕获
 *
 * 在 AI 每次调用工具后执行。检测协议相关事件，自动记录信号。
 *
 * 监听：
 * 1. exec 中的 git submodule add / npm install → 检测新依赖，提示更新 dependencies.json
 * 2. write 中的新文件创建 → 检测是否是可发布的地基
 * 3. slate_write 中的状态变更 → 记录意图流转
 *
 * 配置方式（.claude/settings.local.json）:
 * {
 *   "hooks": {
 *     "PostToolUse": [{
 *       "matcher": "*",
 *       "hooks": [{
 *         "type": "command",
 *         "command": "node /path/to/slate/dist/hooks/capture.js"
 *       }]
 *     }]
 *   }
 * }
 *
 * Claude Code 通过环境变量传递工具调用信息：
 *   CLAUDE_TOOL_NAME — 被调用的工具名
 *   CLAUDE_TOOL_INPUT — 工具输入 JSON
 *   CLAUDE_TOOL_OUTPUT — 工具输出
 *   CLAUDE_PROJECT_DIR — 项目目录
 */

import { readAllProtocolFiles } from "../protocol/index.js";

function main(): void {
  const toolName = process.env.CLAUDE_TOOL_NAME || "";
  const toolInput = process.env.CLAUDE_TOOL_INPUT || "";
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  const signals: string[] = [];

  // 信号1: 检测包管理器安装（可能有新依赖）
  if (toolName === "Bash" || toolName === "exec") {
    const input = toolInput.toLowerCase();
    if (input.includes("npm install") || input.includes("yarn add") || input.includes("pnpm add") || input.includes("bun add")) {
      // 检查是否可能是地基依赖
      const files = readAllProtocolFiles(projectDir);
      if (files.identity || files.intention) {
        signals.push("tip: 检测到安装新依赖。如果来自石板地基，请用 slate_write 更新 dependencies.json");
      }
    }

    if (input.includes("git submodule add") || input.includes("git clone")) {
      signals.push("tip: 检测到引入外部仓库。如果是石板地基，请记录到 dependencies.json。");
    }
  }

  // 信号2: 检测文件写入（可能是新组件）
  if (toolName === "Write" || toolName === "write" || toolName === "Edit") {
    try {
      const parsed = JSON.parse(toolInput);
      const filePath = parsed.file_path || parsed.filePath || "";
      // 检测是否是独立组件文件
      if (
        filePath.includes("/components/") ||
        filePath.includes("/lib/") ||
        filePath.includes("/utils/") ||
        filePath.includes(".tsx") ||
        filePath.includes(".ts")
      ) {
        const files = readAllProtocolFiles(projectDir);
        if (files.identity && files.identity.type === "intention") {
          signals.push("tip: 创建了新组件。如果它是可复用的，考虑用 slate_publish 发布为地基。");
        }
      }
    } catch {
      // 无法解析输入，跳过
    }
  }

  // 信号3: 检测协议状态变更
  if (toolName === "slate_write") {
    try {
      const parsed = JSON.parse(toolInput);
      if (parsed.file === "intention.json") {
        const content = parsed.content || {};
        if (content.status) {
          signals.push(`intention 状态流转: → ${content.status}`);
        }
      }
      if (parsed.file === "dependencies.json") {
        const content = parsed.content || {};
        const deps = content.dependencies || [];
        if (deps.length > 0) {
          signals.push(`依赖记录已更新: ${deps.length} 个地基`);
        }
      }
    } catch {
      // skip
    }
  }

  // 输出信号（通过 stderr，避免干扰工具输出）
  if (signals.length > 0) {
    process.stderr.write(`[石板] ${signals.join(" | ")}\n`);
  }
}

main();
