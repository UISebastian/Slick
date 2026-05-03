import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (process.env.CI === "true") {
  console.log("Skipping Git hook installation in CI.");
  process.exit(0);
}

if (!existsSync(".git")) {
  console.log("Skipping Git hook installation outside a Git checkout.");
  process.exit(0);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  stdio: "inherit"
});

process.exit(result.status ?? 1);
