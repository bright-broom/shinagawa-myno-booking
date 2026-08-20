import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const buildRoot = resolve(root, ".next");
const outputDirectory = resolve(root, "artifacts");

const excluded = new Set(["cache", "diagnostics", "trace", "turbopack"]);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (directory === buildRoot && excluded.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

if (!statSync(buildRoot).isDirectory()) throw new Error(".next/ is required before release evidence is created");

const files = walk(buildRoot).sort().map((path) => ({
  path: relative(buildRoot, path),
  sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
  size: statSync(path).size,
}));
const treeDigest = createHash("sha256")
  .update(files.map((file) => `${file.sha256}  ${file.path}\n`).join(""))
  .digest("hex");

const sourceRevision = process.env.GITHUB_SHA
  ?? execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const packageManager = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).packageManager;
const manifest = {
  schema_version: 1,
  platform: "vercel-nextjs",
  source_revision: sourceRevision,
  generated_at: new Date().toISOString(),
  runtime: { node: process.version, package_manager: packageManager },
  build: { file_count: files.length, sha256: treeDigest, files },
};

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(resolve(outputDirectory, "release-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Release evidence written for ${files.length} build files (${treeDigest}).`);
