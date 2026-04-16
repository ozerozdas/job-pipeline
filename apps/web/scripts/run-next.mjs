import { spawn } from "node:child_process";

const command = process.argv[2] ?? "dev";
const port = process.env.WEB_PORT ?? "3000";
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const child = spawn(pnpmCommand, ["exec", "next", command, "--port", port], {
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
