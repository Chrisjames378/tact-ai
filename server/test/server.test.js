import test from "node:test";
import assert from "node:assert/strict";

test("gateway source includes health, authenticated chat and approval-only action routes", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(source, /\/health/);
  assert.match(source, /\/v1\/chat/);
  assert.match(source, /\/v1\/actions\/prepare/);
  assert.match(source, /awaiting_user_approval/);
  assert.match(source, /timingSafeEqual/);
});
