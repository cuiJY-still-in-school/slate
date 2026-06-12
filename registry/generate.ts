// 批量生成 .slate/foundation.json 给顶级开源项目
// 石板网络冷启动——第一批人工策划的种子地基

import { writeFileSync, mkdirSync } from "fs";

interface Foundation {
  repo: string;          // "owner/name"
  name: string;
  description: string;
  version: string;
  exports: string[];
  keywords: string[];    // AI 搜索匹配用
  suitableFor: string[];  // 适合做什么
  ecosystem: string;      // npm / github
  url: string;
}

const foundations: Foundation[] = [
  // ─── 状态管理 ───────────────────────
  {
    repo: "pmndrs/zustand",
    name: "Zustand",
    description: "🐻 极简 React 状态管理。无 boilerplate，基于 hook，支持中间件和持久化。React 生态中最轻量的状态方案。",
    version: "5.x",
    exports: ["create", "useStore", "createStore"],
    keywords: ["react", "state-management", "zustand", "hook", "store", "状态管理"],
    suitableFor: ["React 项目", "全局状态", "跨组件共享", "替代 Redux", "轻量级状态"],
    ecosystem: "npm",
    url: "https://github.com/pmndrs/zustand",
  },
  {
    repo: "pmndrs/jotai",
    name: "Jotai",
    description: "👻 原子化 React 状态管理。像 useState 一样简单，自动依赖追踪，按需渲染。比 Zustand 更细粒度。",
    version: "2.x",
    exports: ["atom", "useAtom", "useAtomValue", "useSetAtom"],
    keywords: ["react", "state", "jotai", "atom", "atomic", "状态管理", "recoil-alternative"],
    suitableFor: ["React 项目", "细粒度状态", "原子化设计", "按需渲染", "替代 Recoil"],
    ecosystem: "npm",
    url: "https://github.com/pmndrs/jotai",
  },
  {
    repo: "reduxjs/redux-toolkit",
    name: "Redux Toolkit",
    description: "官方推荐的 Redux 开发工具集。包含 configureStore、createSlice、RTK Query，大幅简化 Redux 开发。",
    version: "2.x",
    exports: ["configureStore", "createSlice", "createAsyncThunk", "createApi"],
    keywords: ["react", "redux", "state-management", "rtk", "toolkit", "状态管理", "enterprise"],
    suitableFor: ["企业级应用", "复杂状态逻辑", "团队协作", "RTK Query 数据获取", "大型项目"],
    ecosystem: "npm",
    url: "https://github.com/reduxjs/redux-toolkit",
  },

  // ─── 校验 ───────────────────────────
  {
    repo: "colinhacks/zod",
    name: "Zod",
    description: "TypeScript-first schema 校验库。静态类型推导 + 运行时校验，零依赖。生态最完善的 TS 校验方案。",
    version: "3.x",
    exports: ["z", "ZodSchema", "ZodObject", "ZodString", "ZodNumber"],
    keywords: ["typescript", "validation", "zod", "schema", "校验", "type-safe", "runtime"],
    suitableFor: ["TypeScript 项目", "API 校验", "表单校验", "环境变量验证", "类型推导", "JSON Schema 转换"],
    ecosystem: "npm",
    url: "https://github.com/colinhacks/zod",
  },
  {
    repo: "jquense/yup",
    name: "Yup",
    description: "死简单（dead simple）的对象 schema 校验。链式 API，内置丰富的校验方法，React 生态常用。",
    version: "1.x",
    exports: ["object", "string", "number", "boolean", "array", "date", "mixed", "reach", "ref"],
    keywords: ["javascript", "validation", "yup", "schema", "form", "校验", "formik"],
    suitableFor: ["React 表单", "Formik 集成", "API 校验", "链式 API 场景"],
    ecosystem: "npm",
    url: "https://github.com/jquense/yup",
  },
  {
    repo: "fabian-hiller/valibot",
    name: "Valibot",
    description: "模块化、可 tree-shake 的 schema 校验库。打包体积比 Zod 小 98%，API 相似。追求极致 bundle size 的首选。",
    version: "1.x",
    exports: ["string", "number", "object", "array", "parse", "safeParse"],
    keywords: ["typescript", "validation", "valibot", "schema", "bundle-size", "tree-shakeable", "校验"],
    suitableFor: ["追求小 bundle", "边缘计算", "Serverless", "Zod 替代", "tree-shaking"],
    ecosystem: "npm",
    url: "https://github.com/fabian-hiller/valibot",
  },

  // ─── HTTP 客户端 ─────────────────────
  {
    repo: "sindresorhus/ky",
    name: "Ky",
    description: "基于 Fetch API 的轻量 HTTP 客户端。零依赖，支持重试、超时、hook。比 axios 更现代。",
    version: "1.x",
    exports: ["ky", "HTTPError", "TimeoutError"],
    keywords: ["http", "client", "fetch", "ky", "lightweight", "retry", "HTTP客户端"],
    suitableFor: ["现代浏览器/Node", "Fetch API 场景", "轻量替代 axios", "REST API 调用", "需要重试"],
    ecosystem: "npm",
    url: "https://github.com/sindresorhus/ky",
  },
  {
    repo: "nodejs/undici",
    name: "Undici",
    description: "Node.js 官方 HTTP 客户端。速度最快的 Node HTTP 实现，HTTP/1.1 + HTTP/2。Node 核心团队维护。",
    version: "7.x",
    exports: ["request", "fetch", "Dispatcher", "Pool", "Client"],
    keywords: ["nodejs", "http", "client", "undici", "performance", "fetch", "HTTP客户端"],
    suitableFor: ["Node.js 项目", "高并发 HTTP", "HTTP/2", "性能优先", "替代 node-fetch"],
    ecosystem: "npm",
    url: "https://github.com/nodejs/undici",
  },

  // ─── 数据库 ORM ──────────────────────
  {
    repo: "drizzle-team/drizzle-orm",
    name: "Drizzle ORM",
    description: "TypeScript ORM。SQL-like 查询，零抽象开销，类型安全，支持 PostgreSQL/MySQL/SQLite。",
    version: "0.x",
    exports: ["pgTable", "mysqlTable", "sqliteTable", "eq", "and", "or", "desc", "asc"],
    keywords: ["typescript", "orm", "database", "sql", "drizzle", "postgresql", "mysql", "sqlite", "ORM"],
    suitableFor: ["TypeScript 项目", "SQL 灵活性", "高性能 ORM", "Prisma 替代", "Serverless"],
    ecosystem: "npm",
    url: "https://github.com/drizzle-team/drizzle-orm",
  },
  {
    repo: "kysely-org/kysely",
    name: "Kysely",
    description: "端到端类型安全的 SQL 查询构建器。写 SQL，得 TypeScript 类型。比 Prisma 更灵活，比 Drizzle 更接近 SQL。",
    version: "0.x",
    exports: ["sql", "SelectQueryBuilder", "InsertQueryBuilder", "UpdateQueryBuilder"],
    keywords: ["typescript", "sql", "query-builder", "kysely", "type-safe", "ORM"],
    suitableFor: ["SQL 专家", "复杂查询", "类型安全 SQL", "Prisma/Drizzle 替代", "PostgreSQL"],
    ecosystem: "npm",
    url: "https://github.com/kysely-org/kysely",
  },

  // ─── 样式框架 ────────────────────────
  {
    repo: "tailwindlabs/tailwindcss",
    name: "Tailwind CSS",
    description: "实用优先（utility-first）CSS 框架。直接在 HTML 里写样式，JIT 引擎按需生成。现代 Web 开发标准。",
    version: "4.x",
    exports: ["@tailwindcss/vite", "tailwindcss", "@tailwindcss/postcss"],
    keywords: ["css", "tailwind", "utility-first", "styling", "framework", "样式", "CSS框架"],
    suitableFor: ["现代 Web 项目", "快速原型", "设计系统", "响应式布局", "React/Vue/Svelte"],
    ecosystem: "npm",
    url: "https://github.com/tailwindlabs/tailwindcss",
  },
  {
    repo: "vanilla-extract-css/vanilla-extract",
    name: "Vanilla Extract",
    description: "零运行时 CSS-in-TypeScript。在 TS 中写类型安全的样式，构建时编译为静态 CSS 文件。",
    version: "1.x",
    exports: ["style", "styleVariants", "globalStyle", "createTheme", "sprinkles"],
    keywords: ["css", "typescript", "zero-runtime", "css-in-js", "styling", "vanilla-extract", "样式"],
    suitableFor: ["TypeScript 项目", "零运行时开销", "设计系统", "主题系统", "类型安全 CSS"],
    ecosystem: "npm",
    url: "https://github.com/vanilla-extract-css/vanilla-extract",
  },

  // ─── 测试 ────────────────────────────
  {
    repo: "vitest-dev/vitest",
    name: "Vitest",
    description: "Vite 原生测试框架。兼容 Jest API，速度极快，原生 ESM + TypeScript 支持。",
    version: "3.x",
    exports: ["describe", "it", "expect", "vi", "beforeEach", "afterEach", "test"],
    keywords: ["testing", "vitest", "vite", "jest", "unit-test", "测试", "e2e"],
    suitableFor: ["Vite 项目", "单元测试", "TypeScript 测试", "Jest 替代", "快速测试"],
    ecosystem: "npm",
    url: "https://github.com/vitest-dev/vitest",
  },
  {
    repo: "microsoft/playwright",
    name: "Playwright",
    description: "微软出品的端到端测试框架。跨浏览器（Chromium/Firefox/WebKit），自动等待，trace viewer。",
    version: "1.x",
    exports: ["test", "expect", "chromium", "firefox", "webkit", "devices"],
    keywords: ["testing", "e2e", "playwright", "browser", "automation", "测试", "端到端"],
    suitableFor: ["端到端测试", "跨浏览器测试", "CI/CD 集成", "截图对比", "网络拦截"],
    ecosystem: "npm",
    url: "https://github.com/microsoft/playwright",
  },

  // ─── 认证 ────────────────────────────
  {
    repo: "nextauthjs/next-auth",
    name: "NextAuth.js",
    description: "Next.js 认证库。支持 OAuth、Credentials、Magic Link 等 80+ provider。内置 session 管理。",
    version: "5.x",
    exports: ["auth", "signIn", "signOut", "handlers", "Auth.js"],
    keywords: ["auth", "nextjs", "oauth", "authentication", "next-auth", "认证", "session"],
    suitableFor: ["Next.js 项目", "OAuth 登录", "多 provider", "session 管理", "SSR 认证"],
    ecosystem: "npm",
    url: "https://github.com/nextauthjs/next-auth",
  },

  // ─── CLI 工具 ─────────────────────────
  {
    repo: "tj/commander.js",
    name: "Commander.js",
    description: "Node.js 命令行工具框架。声明式定义命令和参数，自动生成 help，支持子命令。事实标准。",
    version: "13.x",
    exports: ["program", "Command", "Option", "Argument"],
    keywords: ["cli", "command", "commander", "nodejs", "CLI工具", "命令行"],
    suitableFor: ["Node.js CLI", "命令行工具", "子命令", "参数解析", "自动化脚本"],
    ecosystem: "npm",
    url: "https://github.com/tj/commander.js",
  },
  {
    repo: "chalk/chalk",
    name: "Chalk",
    description: "终端字符串样式库。链式 API，自动检测颜色支持，比 ANSI escape code 更优雅。",
    version: "5.x",
    exports: ["chalk"],
    keywords: ["terminal", "color", "chalk", "cli", "style", "终端", "颜色"],
    suitableFor: ["CLI 工具", "终端输出美化", "日志着色", "错误高亮"],
    ecosystem: "npm",
    url: "https://github.com/chalk/chalk",
  },

  // ─── 模板/AI ──────────────────────────
  {
    repo: "langchain-ai/langchainjs",
    name: "LangChain.js",
    description: "LLM 应用框架。支持模型切换、chain/pipeline、向量数据库、Agent、工具调用。AI 应用首选。",
    version: "0.x",
    exports: ["ChatOpenAI", "ChatAnthropic", "PromptTemplate", "AgentExecutor", "RetrievalQAChain"],
    keywords: ["ai", "llm", "langchain", "agent", "chatgpt", "claude", "AI", "大模型"],
    suitableFor: ["LLM 应用", "AI Agent", "RAG 检索", "多模型", "工具调用", "聊天机器人"],
    ecosystem: "npm",
    url: "https://github.com/langchain-ai/langchainjs",
  },
];

// ─── 写入文件 ────────────────────────────────────────
for (const f of foundations) {
  const dir = `registry/${f.repo.replace("/", "-")}`;
  mkdirSync(dir, { recursive: true });

  const identity = {
    protocol: "slate/0.1",
    type: "foundation",
    owner: "slate-registry",
    created: "2026-06-12T00:00:00Z",
  };

  const foundation = {
    architect: "slate-registry",
    name: f.name,
    description: f.description,
    version: f.version,
    exports: f.exports,
    keywords: f.keywords,
  };

  const slateDir = `${dir}/.slate`;
  mkdirSync(slateDir, { recursive: true });
  writeFileSync(`${slateDir}/identity.json`, JSON.stringify(identity, null, 2) + "\n");
  writeFileSync(`${slateDir}/foundation.json`, JSON.stringify(foundation, null, 2) + "\n");

  // README
  const readme = `# ${f.name}

${f.description}

## 🪨 石板地基

**来源**: [${f.repo}](${f.url})  
**生态**: ${f.ecosystem}  
**版本**: ${f.version}

## ✅ 适合做什么

${f.suitableFor.map(s => `- ${s}`).join("\n")}

## 🔑 关键词

${f.keywords.filter(k => !/[\\u4e00-\\u9fff]/.test(k)).join(" · ")}

---

*这是石板网络的人工策展地基。原始仓库: ${f.url}*
`;
  writeFileSync(`${dir}/README.md`, readme);
}

console.log(`✅ 已生成 ${foundations.length} 个地基`);
