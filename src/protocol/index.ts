/**
 * 协议层读写函数
 *
 * 读：读取 .slate/ 目录下的 JSON 文件，自动 Zod 校验
 * 写：先校验后写入
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { FileSchemas, type ProtocolFile } from "./schemas.js";

// Re-export for tool consumers
export type { ProtocolFile };
import type { z } from "zod";

// ─── 读取 ───────────────────────────────────────────

type SchemaTypeByName = {
  "identity.json": z.infer<typeof FileSchemas["identity.json"]>;
  "intention.json": z.infer<typeof FileSchemas["intention.json"]>;
  "foundation.json": z.infer<typeof FileSchemas["foundation.json"]>;
  "dependencies.json": z.infer<typeof FileSchemas["dependencies.json"]>;
};

/**
 * 读取并校验 .slate/ 下的协议文件
 *
 * @param dir - 项目根目录（包含 .slate/ 的目录）
 * @param file - 文件名
 * @returns 校验后的数据，文件不存在或校验失败返回 null
 */
export function readProtocolFile<T extends ProtocolFile>(
  dir: string,
  file: T
): SchemaTypeByName[T] | null {
  const slateDir = join(dir, ".slate");
  const filePath = join(slateDir, file);
  const schema = FileSchemas[file];

  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return schema.parse(parsed) as SchemaTypeByName[T];
  } catch {
    return null;
  }
}

/**
 * 读取 .slate/ 下的所有协议文件
 */
export function readAllProtocolFiles(dir: string): {
  identity: SchemaTypeByName["identity.json"] | null;
  intention: SchemaTypeByName["intention.json"] | null;
  foundation: SchemaTypeByName["foundation.json"] | null;
  dependencies: SchemaTypeByName["dependencies.json"] | null;
} {
  return {
    identity: readProtocolFile(dir, "identity.json"),
    intention: readProtocolFile(dir, "intention.json"),
    foundation: readProtocolFile(dir, "foundation.json"),
    dependencies: readProtocolFile(dir, "dependencies.json"),
  };
}

// ─── 校验 ───────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: unknown;
}

/**
 * 校验协议数据（不写入）
 *
 * @param file - 文件名
 * @param content - 要校验的 JSON 内容
 */
export function validateProtocolData(file: ProtocolFile, content: unknown): ValidationResult {
  const schema = FileSchemas[file];
  const result = schema.safeParse(content);
  if (result.success) {
    return { valid: true, errors: [], data: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    ),
  };
}

// ─── 写入 ───────────────────────────────────────────

/**
 * 校验并写入 .slate/ 协议文件
 *
 * @param dir - 项目根目录
 * @param file - 文件名
 * @param content - 要写入的内容
 * @returns 写入成功返回 { file, path }，校验失败返回错误信息
 */
export function writeProtocolFile(
  dir: string,
  file: ProtocolFile,
  content: unknown
): { success: true; file: string; path: string } | { success: false; errors: string[] } {
  const schema = FileSchemas[file];
  const result = schema.safeParse(content);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".") || "root"}: ${i.message}`
      ),
    };
  }

  const slateDir = join(dir, ".slate");
  if (!existsSync(slateDir)) {
    mkdirSync(slateDir, { recursive: true });
  }

  const filePath = join(slateDir, file);
  writeFileSync(filePath, JSON.stringify(result.data, null, 2) + "\n", "utf-8");

  return { success: true, file, path: filePath };
}

// ─── 上下文生成 ──────────────────────────────────────

/**
 * 生成石板上下文注入文本
 *
 * 用于 UserPromptSubmit Hook 或 CLAUDE.md，
 * 让 AI 自动了解当前项目的协议状态。
 */
export function generateContext(dir: string): string {
  const files = readAllProtocolFiles(dir);

  const lines: string[] = [];
  lines.push("🪨 **石板协议上下文**");

  if (files.identity) {
    lines.push(`- 项目类型: ${files.identity.type}`);
    lines.push(`- 所有者: ${files.identity.owner}`);
  }

  if (files.intention) {
    const i = files.intention;
    lines.push(`- 意图: ${i.summary}`);
    lines.push(`  - 点火者: ${i.igniter}`);
    lines.push(`  - 状态: ${i.status}${i.claimed_by ? ` (认领人: ${i.claimed_by})` : ""}`);
    if (i.proof_file) {
      lines.push(`  - 参考凭证: ${i.proof_file}`);
    }
  }

  if (files.foundation) {
    const f = files.foundation;
    lines.push(`- 地基: ${f.name} v${f.version}`);
    lines.push(`  - 架构师: ${f.architect}`);
    lines.push(`  - 导出: ${f.exports.join(", ")}`);
  }

  if (files.dependencies && files.dependencies.dependencies.length > 0) {
    lines.push("- 依赖地基:");
    for (const d of files.dependencies.dependencies) {
      lines.push(`  - ${d.foundation_repo}@${d.ref}: ${d.note}`);
    }
    lines.push("  ⚠️ 在实现时优先复用以上依赖的地基。");
  }

  if (!files.identity && !files.intention && !files.foundation) {
    lines.push("（当前项目尚未初始化石板协议。运行 `slate init` 开始。）");
  }

  return lines.join("\n");
}
