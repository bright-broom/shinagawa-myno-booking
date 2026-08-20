import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "artifacts");
mkdirSync(outputDirectory, { recursive: true });

const result = spawnSync(
  "npm",
  ["sbom", "--sbom-format=cyclonedx", "--sbom-type=application"],
  { cwd: root, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

JSON.parse(result.stdout);
writeFileSync(resolve(outputDirectory, "sbom.cdx.json"), result.stdout);
console.log("CycloneDX SBOM written to artifacts/sbom.cdx.json");
