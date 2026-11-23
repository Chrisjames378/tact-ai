import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";

async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test("gateway exposes health and protects actions behind bearer authentication", async (t) => {
  const port = await freePort();
  const token = "test-token-with-enough-entropy";
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port), APP_TOKEN: token, MODEL_PROVIDER: "groq", GROQ_API_KEY: "" },
    stdio: "ignore"
  });
  t.after(() => child.kill("SIGTERM"));

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "gateway should start");

  const health = await fetch(`${base}/health`).then(r => r.json());
  assert.equal(health.ok, true);
  assert.equal(health.aiConfigured, false);

  const denied = await fetch(`${base}/v1/actions/prepare`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "send_email", summary: "Test" })
  });
  assert.equal(denied.status, 401);

  const prepared = await fetch(`${base}/v1/actions/prepare`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ action: "send_email", summary: "Prepare a draft only" })
  });
  assert.equal(prepared.status, 202);
  const approval = await prepared.json();
  assert.equal(approval.approvalRequired, true);
  assert.equal(approval.status, "awaiting_user_approval");
});
