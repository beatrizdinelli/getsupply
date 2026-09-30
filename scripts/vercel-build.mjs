import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".vercel/output");
const fn = path.join(output, "functions/api.func");

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

rmSync(output, { recursive: true, force: true });

run("pnpm", ["--filter", "@workspace/getsupply-app", "run", "build"], {
  PORT: "3000",
  BASE_PATH: "/",
  VITE_STRIPE_CONNECT_DISABLED: "true",
});

mkdirSync(fn, { recursive: true });
run("node", ["artifacts/api-server/build-vercel.mjs", fn]);

cpSync(
  path.join(root, "artifacts/getsupply-app/dist/public"),
  path.join(output, "static"),
  { recursive: true },
);

writeFileSync(
  path.join(fn, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
    },
    null,
    2,
  ),
);

writeFileSync(
  path.join(output, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: "^/fornecedores\\.html$",
          status: 308,
          headers: { Location: "/fornecedores" },
        },
        { handle: "filesystem" },
        { src: "^/api(?:/.*)?$", dest: "/api" },
        { src: "^/fornecedores$", dest: "/fornecedores.html" },
        { src: "^/.*$", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);

console.log("Build Output API gerado em .vercel/output");
