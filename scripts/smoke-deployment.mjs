import assert from "node:assert/strict";

const target = new URL(process.argv[2] ?? "https://shinagawa-myno-booking.vercel.app");
assert.equal(target.protocol, "https:", "Smoke target must use HTTPS");
assert.ok(
  target.hostname === "shinagawa-myno-booking.vercel.app"
    || target.hostname.endsWith("-koenigwolfs-projects.vercel.app"),
  `Unexpected smoke target: ${target.hostname}`,
);

const response = await fetch(target, {
  redirect: "follow",
  signal: AbortSignal.timeout(20_000),
  headers: { "user-agent": "bright-bloom-production-monitor/1.0" },
});
assert.equal(response.status, 200, `Expected HTTP 200, received ${response.status}`);
assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
assert.equal(response.headers.get("x-content-type-options"), "nosniff");
assert.equal(response.headers.get("x-frame-options"), "DENY");
assert.equal(response.headers.get("x-powered-by"), null);

const html = await response.text();
assert.match(html, /<html lang="ja">/i);
assert.match(html, /品川カード予約/);
assert.match(html, /実際の予約・個人情報送信は行いません/);
assert.doesNotMatch(html, /Application error|Internal Server Error|DEPLOYMENT_NOT_FOUND/i);

console.log(`Smoke passed: ${target.href} (${response.status}, ${html.length} bytes)`);
