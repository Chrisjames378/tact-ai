import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "tact-approval-test-"));
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port), APP_TOKEN: token, MODEL_PROVIDER: "groq", GROQ_API_KEY: "", DATA_DIR: dataDir },
    stdio: "ignore"
  });
  t.after(async () => { child.kill("SIGTERM"); await rm(dataDir, { recursive: true, force: true }); });

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

  const queue = await fetch(`${base}/v1/approvals`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json());
  assert.equal(queue.approvals.length, 1);
  assert.equal(queue.approvals[0].id, approval.approvalId);

  const decision = await fetch(`${base}/v1/approvals/${approval.approvalId}/decision`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ decision: "approved" })
  });
  assert.equal(decision.status, 200);
  const decisionBody = await decision.json();
  assert.equal(decisionBody.approval.status, "approved");
  assert.equal(decisionBody.executed, false);

  const finalQueue = await fetch(`${base}/v1/approvals`, {
    headers: { authorization: `Bearer ${token}` }
  }).then(r => r.json());
  assert.equal(finalQueue.approvals[0].status, "approved");
});
