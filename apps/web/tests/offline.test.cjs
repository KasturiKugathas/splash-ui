const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const { NextRequest } = require("next/server");
const { unstable_doesMiddlewareMatch } = require("next/experimental/testing/server");
const ts = require("typescript");

function importTypeScript(path) {
  const source = readFileSync(path, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  new Function("require", "exports", outputText)(require, exports);
  return exports;
}

test("repository browser and editor routes stay public while /app stays protected", () => {
  const { config, middleware } = importTypeScript("middleware.ts");
  for (const url of ["/repositories", "/editor?repo=splash-demo%2Finventory-service&path=config%2Fworker.yaml"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), false);
  }
  assert.equal(unstable_doesMiddlewareMatch({ config, url: "/app/editor" }), true);
  const response = middleware(new NextRequest("http://localhost:3000/app/editor"));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "http://localhost:3000/login");
});

test("editor uses the same API to load offline trees and save edited drafts", async (t) => {
  const { getConfigTree } = importTypeScript("src/lib/config-tree.ts");
  const { createChangeRequest } = importTypeScript("src/lib/change-requests.ts");
  const repository = "splash-demo/inventory-service";
  const path = "config/worker.yaml";
  const config = { repository, path, offline: true, tree: { kind: "string", value: "inventory" } };
  const fetch = t.mock.method(globalThis, "fetch", (url, options) => {
    const request = new URL(url);
    if (request.pathname === "/config-tree") {
      assert.equal(request.searchParams.get("repo"), repository);
      assert.equal(request.searchParams.get("path"), path);
      return Response.json(config);
    }
    assert.equal(request.pathname, "/change-requests");
    assert.equal(options.method, "POST");
    return Response.json({ state: "draft", ...JSON.parse(options.body) });
  });

  const loaded = await getConfigTree(repository, path);
  assert.equal(loaded.offline, true);
  const edited = { ...loaded.tree, value: "inventory-edited" };
  const draft = await createChangeRequest(repository, path, edited);
  assert.deepEqual(draft, { state: "draft", repository, path, tree: edited });
  assert.equal(fetch.mock.callCount(), 2);
});
