/**
 * .slate/ 协议文件 Zod Schema
 *
 * 4 种文件：
 * - identity.json   → 项目身份
 * - intention.json  → 意图声明（点火者）
 * - foundation.json → 地基声明（架构师）
 * - dependencies.json → 依赖记录
 */

import { z } from "zod";

// ─── identity.json ──────────────────────────────────

export const IdentitySchema = z.object({
  protocol: z.literal("slate/0.1"),
  type: z.enum(["intention", "foundation", "standalone"]),
  owner: z.string().min(1, "owner 不能为空"),
  created: z.string().datetime({ message: "created 必须是 ISO-8601 时间戳" }),
});

export type Identity = z.infer<typeof IdentitySchema>;

// ─── intention.json ─────────────────────────────────

export const IntentionSchema = z.object({
  igniter: z.string().min(1, "igniter 不能为空"),
  proof_file: z.string(),
  proof_hash: z.string(),
  summary: z.string().min(1, "summary 不能为空"),
  status: z.enum(["open", "claimed", "completed"]),
  claimed_by: z.string().nullable(),
  completion_pr: z.string().nullable(),
});

export type Intention = z.infer<typeof IntentionSchema>;

// ─── foundation.json ────────────────────────────────

export const FoundationSchema = z.object({
  architect: z.string().min(1, "architect 不能为空"),
  name: z.string().min(1, "name 不能为空"),
  description: z.string(),
  version: z.string(),
  exports: z.array(z.string()),
});

export type Foundation = z.infer<typeof FoundationSchema>;

// ─── dependencies.json ──────────────────────────────

export const DependencyEntrySchema = z.object({
  foundation_repo: z.string(),
  architect: z.string(),
  ref: z.string(),
  note: z.string(),
});

export const DependenciesSchema = z.object({
  dependencies: z.array(DependencyEntrySchema),
});

export type DependencyEntry = z.infer<typeof DependencyEntrySchema>;
export type Dependencies = z.infer<typeof DependenciesSchema>;

// ─── 文件名 → Schema 映射 ────────────────────────────

export const FileSchemas = {
  "identity.json": IdentitySchema,
  "intention.json": IntentionSchema,
  "foundation.json": FoundationSchema,
  "dependencies.json": DependenciesSchema,
} as const;

export type ProtocolFile = keyof typeof FileSchemas;
