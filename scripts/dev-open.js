const { spawn, execFile } = require("child_process");
const http = require("http");
const path = require("path");
const { removeDevBuildArtifacts, shouldCleanForDevStart } = require("./clean-next");

const port = process.env.PORT || "3000";
const host = "127.0.0.1";
const url = `http://localhost:${port}`;
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

function openInBrowser(targetUrl) {
  if (process.platform === "darwin") {
    execFile("open", [targetUrl]);
    return;
  }

  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", targetUrl]);
    return;
  }

  execFile("xdg-open", [targetUrl], (error) => {
    if (error) {
      console.log(`Could not open a browser automatically. Open ${targetUrl} manually.`);
    }
  });
}

function waitForServer(targetUrl, onReady) {
  let opened = false;
  let attempts = 0;
  const maxAttempts = 60;

  const tryRequest = () => {
    attempts += 1;

    const req = http.get(targetUrl, (res) => {
      res.resume();
      if (!opened) {
        opened = true;
        onReady();
      }
    });

    req.on("error", () => {
      if (attempts < maxAttempts) {
        setTimeout(tryRequest, 500);
      } else {
        console.log(`Server did not become ready in time. Open ${targetUrl} manually once it starts.`);
      }
    });

    req.setTimeout(1000, () => {
      req.destroy();
    });
  };

  tryRequest();
}

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

waitForServer(`http://${host}:${port}`, () => {
  console.log(`Opening ${url} in your default browser...`);
  openInBrowser(url);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
