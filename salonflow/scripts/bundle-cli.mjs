/**
 * Bundle the operator CLI scripts into plain JavaScript.
 *
 * The production image carries only Next.js's standalone output — no `src/`,
 * no TypeScript, no `tsx`. That is the point of standalone output, but it
 * means `npx tsx prisma/seed/bootstrap.ts` cannot run there, and bootstrap is
 * how the first administrator account gets created. Shipping the whole source
 * tree and a TypeScript runtime just to run two scripts is the wrong trade.
 *
 * So each script is bundled here into a single self-contained `.mjs` file that
 * `node` can run directly.
 *
 *   npm run build:cli   →   dist/cli/bootstrap.mjs, dist/cli/check-mail.mjs
 *
 * `@prisma/client` stays external because it is not ordinary JavaScript: the
 * generated client loads a native query engine binary by path. Bundling it
 * would break that resolution. It is present in the runtime image.
 */

import { build } from "esbuild";

const entries = [
  { in: "prisma/seed/bootstrap.ts", out: "bootstrap" },
  { in: "scripts/check-mail.ts", out: "check-mail" },
];

await build({
  entryPoints: entries.map((entry) => ({ in: entry.in, out: entry.out })),
  outdir: "dist/cli",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  external: ["@prisma/client"],
  // Without this, esbuild rewrites `import.meta.url` and CommonJS
  // dependencies pulled into an ESM bundle lose `require`.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
  logLevel: "info",
});
