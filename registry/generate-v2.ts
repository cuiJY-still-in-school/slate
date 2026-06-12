import { writeFileSync, mkdirSync } from "fs";

const foundations = [
  // ─── 运行时 / 框架 ────────────────────
  { repo: "oven-sh/bun", name: "Bun", desc: "超快 JS 运行时。内置打包器、测试器、包管理器。替代 Node.js + npm。", ver: "1.x", exports: ["Bun", "Bun.file", "Bun.write", "Bun.serve"], keywords: ["runtime", "bun", "javascript", "bundler", "test-runner", "运行时"], suit: ["替代 Node.js", "全栈开发", "脚本工具", "测试运行", "打包"] },
  { repo: "nestjs/nest", name: "NestJS", desc: "渐进式 Node.js 框架。TypeScript-first，模块化架构，内置 DI、 guards、interceptors。", ver: "11.x", exports: ["Module", "Controller", "Injectable", "Guard", "Interceptor"], keywords: ["nestjs", "nodejs", "framework", "typescript", "backend", "框架"], suit: ["企业后端", "微服务", "GraphQL API", "REST API", "WebSocket"] },
  { repo: "fastify/fastify", name: "Fastify", desc: "极速 Node.js web 框架。schema 驱动的序列化，插件生态，低开销。", ver: "5.x", exports: ["fastify", "FastifyInstance", "FastifyRequest", "FastifyReply"], keywords: ["fastify", "nodejs", "web", "framework", "http", "高性能"], suit: ["高性能 API", "微服务", "JSON Schema 校验", "插件架构"] },

  // ─── 数据库工具 ────────────────────────
  { repo: "prisma/prisma", name: "Prisma", desc: "下一代 ORM。schema-first，自动生成类型，迁移管理，支持 PostgreSQL/MySQL/SQLite/MongoDB。", ver: "6.x", exports: ["PrismaClient", "Prisma"], keywords: ["prisma", "orm", "database", "typescript", "migration", "ORM"], suit: ["全栈项目", "类型安全数据库", "自动迁移", "多数据库支持"] },

  // ─── 前端框架 ──────────────────────────
  { repo: "solidjs/solid", name: "SolidJS", desc: "响应式 UI 库。无虚拟 DOM，编译时优化，JSX 语法，极细粒度更新。", ver: "1.x", exports: ["createSignal", "createEffect", "createMemo", "For", "Show"], keywords: ["solidjs", "reactive", "ui", "framework", "jsx", "前端"], suit: ["高性能 UI", "响应式应用", "React 替代", "编译时优化"] },
  { repo: "sveltejs/svelte", name: "Svelte", desc: "编译时消失的框架。写组件，编译为纯 JS，无运行时。", ver: "5.x", exports: ["mount", "tick", "getContext", "setContext"], keywords: ["svelte", "compiler", "ui", "framework", "前端"], suit: ["交互式 UI", "动画", "编译时框架", "无运行时开销"] },

  // ─── 工具库 ────────────────────────────
  { repo: "date-fns/date-fns", name: "date-fns", desc: "现代日期工具库。函数式 API，tree-shakeable，无副作用，200+ 函数。", ver: "4.x", exports: ["format", "addDays", "differenceInDays", "isBefore", "parseISO"], keywords: ["date", "time", "utility", "tree-shakeable", "日期"], suit: ["日期格式化", "时区处理", "日期计算", "国际化"] },
  { repo: "immerjs/immer", name: "Immer", desc: "不可变数据更新。用 mutable 语法写 immutable 逻辑，自动生成新状态。", ver: "10.x", exports: ["produce", "immerable", "enablePatches"], keywords: ["immutable", "state", "immer", "不可变"], suit: ["React 状态更新", "Redux reducer", "不可变数据结构"] },
  { repo: "ai/nanoid", name: "NanoID", desc: "极小的唯一 ID 生成器。URL-safe，比 UUID 更短更快。", ver: "5.x", exports: ["nanoid"], keywords: ["id", "uuid", "nanoid", "unique", "轻量"], suit: ["生成唯一 ID", "URL slug", "React key", "数据库主键"] },

  // ─── 安全 / 加密 ────────────────────────
  { repo: "panva/jose", name: "jose", desc: "JOSE 标准实现。JWT/JWS/JWE/JWK，零依赖，Web Crypto API。", ver: "5.x", exports: ["SignJWT", "jwtVerify", "generateKeyPair", "importJWK"], keywords: ["jwt", "jose", "crypto", "oauth", "security", "加密"], suit: ["JWT 签发校验", "OAuth 2.0", "OpenID Connect", "加密密钥管理"] },
  { repo: "nicoverbruggen/phpass", name: "bcryptjs", desc: "纯 JS bcrypt 实现。零依赖，兼容 PHP/OpenBSD。", ver: "2.x", exports: ["hash", "compare", "genSalt"], keywords: ["bcrypt", "password", "hash", "security", "加密"], suit: ["密码哈希", "用户认证", "不需要原生编译"] },

  // ─── 开发工具 ──────────────────────────
  { repo: "eslint/eslint", name: "ESLint", desc: "可插拔 JS/TS linter。AST 级别分析，自定义规则，自动修复。", ver: "9.x", exports: ["Linter", "RuleTester"], keywords: ["lint", "eslint", "typescript", "quality", "代码质量"], suit: ["代码规范", "自动修复", "团队协作", "AST 分析"] },
  { repo: "biomejs/biome", name: "Biome", desc: "统一开发工具链。lint + format，Rust 编写，极速，替代 ESLint + Prettier。", ver: "1.x", exports: ["biome"], keywords: ["lint", "format", "biome", "rust", "performance", "格式化"], suit: ["替代 ESLint+Prettier", "大型项目", "极速 lint", "统一格式"] },
];

for (const f of foundations) {
  const dir = `registry/${f.repo.replace("/", "-")}`;
  mkdirSync(dir, { recursive: true });
  const slateDir = `${dir}/.slate`;
  mkdirSync(slateDir, { recursive: true });

  writeFileSync(`${slateDir}/identity.json`, JSON.stringify({
    protocol: "slate/0.1", type: "foundation",
    owner: "slate-registry", created: "2026-06-12T00:00:00Z",
  }, null, 2) + "\n");

  writeFileSync(`${slateDir}/foundation.json`, JSON.stringify({
    architect: "slate-registry", name: f.name, description: f.desc,
    version: f.ver, exports: f.exports, keywords: f.keywords,
  }, null, 2) + "\n");

  writeFileSync(`${dir}/README.md`, `# ${f.name}\n\n${f.desc}\n\n## ✅ 适合\n${f.suit.map(s => `- ${s}`).join("\n")}\n\n## 来源\n[${f.repo}](https://github.com/${f.repo})\n`);
}

console.log(`✅ ${foundations.length} foundations`);
