import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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
  const output = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  });
  return output.split("\0").filter(Boolean);
}

const workflowFiles = listWorkflowFiles();
assert.ok(workflowFiles.length > 0, "At least one workflow is required");

for (const workflowPath of workflowFiles) {
  const source = read(workflowPath);
  const actionReferences = [...source.matchAll(/^\s*(?:-\s*)?uses:\s*["']?([^@\s"']+)@([^\s"'#]+)/gm)];
  for (const [, action, revision] of actionReferences) {
    if (!action.startsWith("./") && !/^[0-9a-f]{40}$/.test(revision)) {
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
  if (!existsSync(absolute) || !statSync(absolute).isFile() || statSync(absolute).size > 2_000_000) continue;
  const buffer = readFileSync(absolute);
  if (buffer.includes(0)) continue;
  const source = buffer.toString("utf8");
  for (const [name, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(source)) fail(`${file}: possible ${name} detected`);
  }
}

for (const obsolete of [".openai/hosting.json", "vite.config.ts", "worker"]) {
  if (existsSync(join(root, obsolete))) fail(`${obsolete} is obsolete after the Vercel migration`);
}

const vercel = JSON.parse(read("vercel.json"));
const allowedVercelKeys = ["$schema", "buildCommand", "fluid", "framework", "installCommand", "regions"];
if (Object.keys(vercel).some((key) => !allowedVercelKeys.includes(key))) fail("vercel.json contains an unreviewed setting");
if (vercel.$schema !== "https://openapi.vercel.sh/vercel.json") fail("vercel.json must use the official schema");
if (vercel.framework !== "nextjs") fail("Vercel framework must be nextjs");
if (vercel.buildCommand !== "npm run build") fail("Vercel must use the reviewed build command");
if (vercel.installCommand !== "npm ci --ignore-scripts") fail("Vercel install must be deterministic and disable lifecycle scripts");
if (vercel.fluid !== true) fail("Vercel Fluid compute must remain enabled for future functions");
if (JSON.stringify(vercel.regions) !== JSON.stringify(["hnd1"])) fail("Vercel functions must remain in Tokyo (hnd1)");

const npmConfig = read(".npmrc");
for (const setting of ["ignore-scripts=true", "engine-strict=true", "save-exact=true"]) {
  if (!npmConfig.includes(setting)) fail(`.npmrc must include ${setting}`);
}
if (read(".node-version").trim() !== "24.19.0") fail("Node must be pinned to 24.19.0");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.packageManager !== "npm@11.17.0") fail("npm must be pinned to 11.17.0");
if (packageJson.engines?.node !== "24.x") fail("Vercel Node engine must be 24.x");
if (packageJson.dependencies?.next !== "16.3.1") fail("Next.js must remain on the reviewed 16.3.1 release");
for (const [name, version] of Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
  if (!/^(?:\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?|(?:git\+)?https:\/\/[^#]+#[0-9a-f]{40})$/.test(version)) {
    fail(`package ${name} must use an exact version or immutable commit`);
  }
}
for (const script of ["guardrails", "typecheck", "audit", "signatures", "sbom", "release:evidence", "smoke", "check"]) {
  if (!packageJson.scripts?.[script]) fail(`package.json is missing the ${script} script`);
}
for (const lifecycle of ["preinstall", "install", "postinstall", "prepare"]) {
  if (packageJson.scripts?.[lifecycle]) fail(`package lifecycle script ${lifecycle} requires explicit review`);
}
for (const obsolete of ["@cloudflare/vite-plugin", "@openai/sites-vite-plugin", "@vitejs/plugin-react", "@vitejs/plugin-rsc", "react-server-dom-webpack", "vinext", "vite", "wrangler"]) {
  if (packageJson.dependencies?.[obsolete] || packageJson.devDependencies?.[obsolete]) {
    fail(`obsolete infrastructure package ${obsolete} must be removed`);
  }
}

const nextConfig = read("next.config.ts");
for (const required of [
  "Content-Security-Policy",
  "Cross-Origin-Resource-Policy",
  "Permissions-Policy",
  "Referrer-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "X-Robots-Tag",
  "poweredByHeader: false",
  "remotePatterns: []",
]) {
  if (!nextConfig.includes(required)) fail(`next.config.ts is missing ${required}`);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    const child = join(directory, item.name);
    return item.isDirectory() ? walk(child) : [relative(root, child)];
  });
}

const runtimeSurface = ["app", "next.config.ts", "vercel.json"].flatMap((entry) => {
  const absolute = join(root, entry);
  return statSync(absolute).isDirectory() ? walk(absolute) : [entry];
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
