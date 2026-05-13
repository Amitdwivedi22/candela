const fs = require("fs");
const path = require("path");

function distDir() {
  if (process.env.NEXT_DIST_DIR) {
    return process.env.NEXT_DIST_DIR;
  }

  return process.env.NODE_ENV === "development" ? ".next-dev" : ".next";
}

function devDistDirs() {
  return [".next-dev", ".next"];
}

function nextPath(...parts) {
  return path.join(process.cwd(), distDir(), ...parts);
}

function hasFile(targetPath) {
  return fs.existsSync(targetPath);
}

function shouldCleanForDevStart() {
  const nextDir = nextPath();

  if (!hasFile(nextDir)) {
    return false;
  }

  const expectedDevArtifacts = [
    nextPath("static", "chunks", "main-app.js"),
    nextPath("static", "chunks", "app-pages-internals.js"),
    nextPath("static", "css", "app", "layout.css"),
  ];

  if (expectedDevArtifacts.some(hasFile)) {
    return false;
  }

  const staticChunksDir = nextPath("static", "chunks");
  if (!hasFile(staticChunksDir)) {
    return false;
  }

  try {
    const chunkNames = fs.readdirSync(staticChunksDir);
    return chunkNames.some((name) => /^main-app-[^.]+\./.test(name) || /^main-[^.]+\./.test(name));
  } catch {
    return true;
  }
}

function removeNextBuildArtifacts() {
  const nextDir = nextPath();

  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log(`Cleared ${distDir()} build cache.`);
  } catch (error) {
    console.error(`Failed to clear ${distDir()} build cache.`, error);
    process.exit(1);
  }
}

function removeDevBuildArtifacts() {
  for (const currentDistDir of devDistDirs()) {
    const targetDir = path.join(process.cwd(), currentDistDir);

    try {
      fs.rmSync(targetDir, { recursive: true, force: true });
      console.log(`Cleared ${currentDistDir} build cache.`);
    } catch (error) {
      console.error(`Failed to clear ${currentDistDir} build cache.`, error);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  removeNextBuildArtifacts();
}

module.exports = { removeNextBuildArtifacts, removeDevBuildArtifacts, shouldCleanForDevStart };
