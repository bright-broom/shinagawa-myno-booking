import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import test, { after, before } from "node:test";
import next from "next";

let server;
let origin;

before(async () => {
  const app = next({ dev: false, dir: new URL("..", import.meta.url).pathname });
  await app.prepare();
  const handler = app.getRequestHandler();
  server = createServer((request, response) => handler(request, response));
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  origin = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("serves the complete Japanese booking experience", async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="ja">/i);
  assert.match(html, /<title>品川カード予約 \| 時間から探せる交付予約<\/title>/i);
  assert.match(html, /空いている時間から/);
  assert.match(html, /全5会場を横断検索/);
  assert.match(html, /実際の予約・個人情報送信は行いません/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("adds baseline browser security headers without exposing the framework", async () => {
  const response = await fetch(origin);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
});

test("keeps unimplemented write and external image surfaces closed", async () => {
  const post = await fetch(origin, { method: "POST" });
  assert.ok([404, 405].includes(post.status));

  const image = await fetch(`${origin}/_next/image?url=https%3A%2F%2Fexample.test%2Fimage.png&w=640&q=75`);
  assert.equal(image.status, 400);
});

test("keeps the prototype boundary, static rendering and API contract explicit", async () => {
  const [page, layout, packageJson, openApi, prerender] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/api/openapi.yaml", import.meta.url), "utf8"),
    readFile(new URL("../.next/prerender-manifest.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /role="dialog"/);
  assert.match(page, /aria-modal="true"/);
  assert.match(page, /外部システムへの送信や予約枠の消費は行っていません/);
  assert.match(layout, /openGraph/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|drizzle|vinext|wrangler/);
  assert.match(openApi, /\/availability:/);
  assert.match(openApi, /\/reservations\/\{public_id\}:/);
  assert.ok(Object.hasOwn(JSON.parse(prerender).routes, "/"));

  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../.openai/hosting.json", import.meta.url)));
  await assert.rejects(access(new URL("../worker/index.ts", import.meta.url)));
});
