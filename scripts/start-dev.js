const { spawn } = require("child_process");
const path = require("path");
const { removeDevBuildArtifacts, shouldCleanForDevStart } = require("./clean-next");
const { freePort } = require("./reset-dev-port");
const port = process.env.PORT || "3000";
const host = process.env.HOST || "localhost";
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.NEXT_DIST_DIR = process.env.NEXT_DIST_DIR || ".next-dev";
const devEnv = { ...process.env };
const shouldCleanNext = process.env.CLEAN_NEXT === "true";

function nextCommand() {
  if (process.platform === "win32") {
    return path.join(process.cwd(), "node_modules", ".bin", "next.cmd");
  }
  return path.join(process.cwd(), "node_modules", ".bin", "next");
}

async function main() {
  await freePort();
  if (shouldCleanNext) {
    removeDevBuildArtifacts();
  } else if (shouldCleanForDevStart()) {
    console.log("Detected stale or production-style Next artifacts. Resetting dev caches before startup.");
    removeDevBuildArtifacts();
  } else {
    console.log("Keeping existing .next-dev build artifacts for a stable dev chunk graph.");
    console.log("Set CLEAN_NEXT=true if you want a full cache reset before startup.");
  }

  const child = spawn(nextCommand(), ["dev", "-H", host, "-p", port], {
    stdio: "inherit",
    env: devEnv,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error("Failed to start the Next.js dev server.", error);
  process.exit(1);
});
