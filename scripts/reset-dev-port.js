const { execFile } = require("child_process");

const port = process.env.PORT || "3000";
const WAIT_INTERVAL_MS = 250;
const WAIT_TIMEOUT_MS = 5000;

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function findPids() {
  if (process.platform === "win32") {
    try {
      const { stdout } = await run("netstat", ["-ano"]);
      const lines = stdout.split(/\r?\n/);
      const pids = new Set();

      for (const line of lines) {
        if (
          line.includes(`:${port}`) &&
          line.toUpperCase().includes("LISTENING")
        ) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid) pids.add(pid);
        }
      }

      return [...pids];
    } catch {
      return [];
    }
  }

  const commands = [
    ["lsof", ["-ti", `tcp:${port}`]],
    ["fuser", [`${port}/tcp`]],
  ];

  for (const [command, args] of commands) {
    try {
      const { stdout } = await run(command, args);
      const pids = stdout
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean);

      if (pids.length > 0) {
        return [...new Set(pids)];
      }
    } catch {
      continue;
    }
  }

  return [];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function killPid(pid, force = false) {
  if (process.platform === "win32") {
    await run("taskkill", ["/PID", pid, "/F"]);
    return;
  }

  await run("kill", [force ? "-9" : "-15", pid]);
}

async function waitForPortToFree(timeoutMs = WAIT_TIMEOUT_MS) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const pids = await findPids();

    if (pids.length === 0) {
      return true;
    }

    await sleep(WAIT_INTERVAL_MS);
  }

  return false;
}

async function freePort() {
  const pids = await findPids();

  if (pids.length === 0) {
    console.log(`Port ${port} is already free.`);
    return false;
  }

  console.log(`Freeing port ${port}...`);

  for (const pid of pids) {
    try {
      await killPid(pid);
      console.log(`Stopped process ${pid}`);
    } catch {
      console.log(`Could not stop process ${pid}. You may need to close it manually.`);
    }
  }

  if (await waitForPortToFree()) {
    return true;
  }

  console.log(`Port ${port} is still busy. Retrying with a force kill...`);

  const stubbornPids = await findPids();

  for (const pid of stubbornPids) {
    try {
      await killPid(pid, true);
      console.log(`Force-stopped process ${pid}`);
    } catch {
      console.log(`Could not force-stop process ${pid}. You may need to close it manually.`);
    }
  }

  if (await waitForPortToFree()) {
    return true;
  }

  throw new Error(`Port ${port} is still in use after attempting to stop existing processes.`);
}

if (require.main === module) {
  freePort().catch(() => {
    console.log(`Could not inspect port ${port}. Close any existing dev server manually and try again.`);
    process.exit(1);
  });
}

module.exports = { freePort };
