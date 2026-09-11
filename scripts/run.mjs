import { spawn } from "node:child_process";

const mode = process.argv[2];
const commands = {
  dev: [
    ["npx", ["next", "dev"]],
    ["node", ["--watch", "--env-file-if-exists=.env", "api/index.ts"]],
  ],
  start: [
    ["npx", ["next", "start"]],
    ["node", ["--env-file-if-exists=.env", "api/index.ts"]],
  ],
};

const selected = commands[mode];
if (!selected) {
  console.error("Usage: node scripts/run.mjs <dev|start>");
  process.exit(1);
}

const children = selected.map(([command, args]) => spawn(command, args, { stdio: "inherit", env: process.env }));

function shutdown(code) {
  for (const child of children) child.kill();
  process.exit(code);
}

for (const child of children) {
  child.on("exit", (code) => shutdown(code ?? 0));
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
