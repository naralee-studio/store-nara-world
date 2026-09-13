import { spawn } from "node:child_process";
const build = spawn("npm", ["run", "build"], { stdio: "inherit" });
build.on("exit", (code) => {
  if (code) process.exit(code);
  const children = [
    spawn("npm", ["run", "assets:watch"], { stdio: "inherit" }),
    spawn(
      "npm",
      [
        "exec",
        "--",
        "shopify",
        "theme",
        "dev",
        "--environment",
        "development",
        "--live-reload",
        "full-page",
        ...process.argv.slice(2),
      ],
      { stdio: "inherit" },
    ),
  ];
  let stopped = false;
  const stop = (code) => {
    if (stopped) return;
    stopped = true;
    children.forEach((child) => child.kill("SIGTERM"));
    process.exitCode = code;
  };
  process.on("SIGINT", () => stop(0));
  process.on("SIGTERM", () => stop(0));
  children.forEach((child) => child.on("exit", (code) => stop(code ?? 0)));
});
