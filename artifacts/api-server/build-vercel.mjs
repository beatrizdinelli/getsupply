import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const outdir = process.argv[2];
if (!outdir) throw new Error("Uso: node build-vercel.mjs <diretório de saída>");

await esbuild({
  entryPoints: [path.resolve(artifactDir, "src/vercel.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: path.resolve(outdir, "index.mjs"),
  logLevel: "info",
  external: ["*.node", "pg-native"],
  alias: {
    "stripe-replit-sync": path.resolve(
      artifactDir,
      "vercel/stripe-replit-sync-stub.mjs",
    ),
  },
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
  },
});
