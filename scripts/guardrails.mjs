import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function listWorkflowFiles() {
  return readdirSync(join(root, ".github/workflows"))
    .filter((name) => /\.ya?ml$/i.test(name))
    .map((name) => `.github/workflows/${name}`);
}

function listRepositoryFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  );
  return output.split("\0").filter(Boolean);
}

const workflowFiles = listWorkflowFiles();
assert.ok(workflowFiles.length > 0, "At least one workflow is required");

for (const workflowPath of workflowFiles) {
  const source = read(workflowPath);
  const actionReferences = [...source.matchAll(/^\s*(?:-\s*)?uses:\s*["']?([^@\s"']+)@([^\s"'#]+)/gm)];

  for (const [, action, revision] of actionReferences) {
    if (action.startsWith("./")) continue;
    if (!/^[0-9a-f]{40}$/.test(revision)) {
      fail(`${workflowPath}: ${action} must use a full 40-character commit SHA`);
    }
  }

  const forbidden = [
    [/pull_request_target\s*:/, "pull_request_target is forbidden"],
    [/runs-on:\s*(?:\[[^\]]*self-hosted|self-hosted)/, "self-hosted runners are forbidden"],
    [/permissions:\s*write-all/, "write-all token permissions are forbidden"],
    [/persist-credentials:\s*true/, "checkout credentials must not persist"],
    [/curl\b[^\n|]*\|\s*(?:ba)?sh\b/, "piping remote content to a shell is forbidden"],
  ];
  for (const [pattern, message] of forbidden) {
    if (pattern.test(source)) fail(`${workflowPath}: ${message}`);
  }
}

const secretPatterns = [
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{20,})\b/g],
  ["OpenAI key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ["Sites source token", /\bart_v\d+_[A-Za-z0-9_]{20,}\b/g],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];

for (const file of listRepositoryFiles()) {
  const absolute = join(root, file);
  if (!statSync(absolute).isFile() || statSync(absolute).size > 2_000_000) continue;
  const buffer = readFileSync(absolute);
  if (buffer.includes(0)) continue;
  const source = buffer.toString("utf8");
  for (const [name, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(source)) fail(`${file}: possible ${name} detected`);
  }
}

const hosting = JSON.parse(read(".openai/hosting.json"));
const hostingKeys = Object.keys(hosting).sort();
if (hostingKeys.some((key) => !["d1", "project_id", "r2"].includes(key))) {
  fail(".openai/hosting.json may contain only project_id, d1 and r2");
}
if (typeof hosting.project_id !== "string" || !hosting.project_id.startsWith("appgprj_")) {
  fail(".openai/hosting.json must contain the existing opaque project_id");
}

const npmConfig = read(".npmrc");
for (const setting of ["ignore-scripts=true", "engine-strict=true", "save-exact=true"]) {
  if (!npmConfig.includes(setting)) fail(`.npmrc must include ${setting}`);
}

if (read(".node-version").trim() !== "22.23.2") fail("Node must be pinned to 22.23.2");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.packageManager !== "npm@10.9.8") fail("npm must be pinned to 10.9.8");
for (const [name, version] of Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
  if (!/^(?:\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?|(?:git\+)?https:\/\/[^#]+#[0-9a-f]{40})$/.test(version)) {
    fail(`package ${name} must use an exact version or immutable commit`);
  }
}
for (const script of ["guardrails", "typecheck", "audit", "signatures", "sbom", "release:evidence", "check"]) {
  if (!packageJson.scripts?.[script]) fail(`package.json is missing the ${script} script`);
}
for (const lifecycle of ["preinstall", "install", "postinstall", "prepare"]) {
  if (packageJson.scripts?.[lifecycle]) fail(`package lifecycle script ${lifecycle} requires explicit review`);
}

const worker = read("worker/index.ts");
for (const required of [
  "Content-Security-Policy",
  "Cross-Origin-Resource-Policy",
  "Permissions-Policy",
  "Referrer-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "X-Robots-Tag",
]) {
  if (!worker.includes(required)) fail(`worker/index.ts is missing ${required}`);
}
if (!worker.includes('allowedMethods = new Set(["GET", "HEAD"])')) {
  fail("worker/index.ts must deny non-read HTTP methods");
}

const runtimeSurface = ["app", "worker", "vite.config.ts", "next.config.ts"]
  .flatMap((entry) => {
    const absolute = join(root, entry);
    if (!statSync(absolute).isDirectory()) return [entry];
    const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
      const child = join(directory, item.name);
      return item.isDirectory() ? walk(child) : [relative(root, child)];
    });
    return walk(absolute);
  });
for (const file of runtimeSurface) {
  if (/shinagawa-myno\.openreaf\.jp|ziwave|cesami/i.test(read(file))) {
    fail(`${file}: runtime code must not connect to or impersonate the incumbent system`);
  }
}

if (failures.length) {
  console.error(`Guardrails failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Guardrails passed: ${workflowFiles.length} workflows and ${listRepositoryFiles().length} repository files checked.`);
