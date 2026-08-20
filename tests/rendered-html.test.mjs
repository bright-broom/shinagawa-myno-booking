import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function request(path = "/", method = "GET") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://booking.example.test${path}`, {
      method,
      headers: { accept: "text/html", "x-forwarded-host": "booking.example.test" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const render = (path = "/") => request(path);

test("server-renders the complete Japanese booking experience", async () => {
  const response = await render();
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

test("adds baseline browser security headers", async () => {
  const response = await render();
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /script-src-attr 'none'/);
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
});

test("rejects write methods and oversized URLs before routing", async () => {
  const postResponse = await request("/", "POST");
  assert.equal(postResponse.status, 405);
  assert.equal(postResponse.headers.get("allow"), "GET, HEAD");
  assert.equal(postResponse.headers.get("x-content-type-options"), "nosniff");

  const oversizedResponse = await request(`/?value=${"a".repeat(8_300)}`);
  assert.equal(oversizedResponse.status, 414);
});

test("does not proxy external or recursive image sources", async () => {
  const externalResponse = await request("/_vinext/image?url=https%3A%2F%2Fexample.test%2Fimage.png");
  assert.equal(externalResponse.status, 400);

  const recursiveResponse = await request("/_vinext/image?url=%2F_vinext%2Fimage%3Furl%3D%2Fimage.png");
  assert.equal(recursiveResponse.status, 400);
});

test("keeps the prototype boundary, metadata and API contract explicit", async () => {
  const [page, layout, packageJson, openApi] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/api/openapi.yaml", import.meta.url), "utf8"),
  ]);

  assert.match(page, /role="dialog"/);
  assert.match(page, /aria-modal="true"/);
  assert.match(page, /外部システムへの送信や予約枠の消費は行っていません/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|drizzle/);
  assert.match(openApi, /\/availability:/);
  assert.match(openApi, /\/reservations\/\{public_id\}:/);

  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../db/schema.ts", import.meta.url)));
});
