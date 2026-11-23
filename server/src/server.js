import http from "node:http";
import { timingSafeEqual, randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 8080);
const APP_TOKEN = process.env.APP_TOKEN || "";
const MODEL_PROVIDER = process.env.MODEL_PROVIDER || "groq";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MAX_BODY = 64 * 1024;

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
function authorized(req) {
  if (!APP_TOKEN) return false;
  const supplied = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(supplied), b = Buffer.from(APP_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function readBody(req) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (Buffer.byteLength(data) > MAX_BODY) throw Object.assign(new Error("Request too large"), { status: 413 });
  }
  try { return JSON.parse(data || "{}"); }
  catch { throw Object.assign(new Error("Invalid JSON"), { status: 400 }); }
}
async function chatWithProvider(messages) {
  if (MODEL_PROVIDER === "gemini") {
    if (!GEMINI_API_KEY) throw Object.assign(new Error("Gemini is not configured"), { status: 503 });
    const contents = messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents })
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error?.message || "AI provider error"), { status: 502 });
    return data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "The model returned no text.";
  }
  if (!GROQ_API_KEY) throw Object.assign(new Error("Groq is not configured"), { status: 503 });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${GROQ_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, temperature: 0.3, max_tokens: 1200 })
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error?.message || "AI provider error"), { status: 502 });
  return data.choices?.[0]?.message?.content || "The model returned no text.";
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { ok: true, service: "tact-ai-guardian-gateway", provider: MODEL_PROVIDER, aiConfigured: MODEL_PROVIDER === "gemini" ? Boolean(GEMINI_API_KEY) : Boolean(GROQ_API_KEY) });
  }
  if (!authorized(req)) return json(res, 401, { error: "Unauthorized. Configure APP_TOKEN and send a Bearer token." });
  if (req.method === "POST" && url.pathname === "/v1/chat") {
    try {
      const body = await readBody(req);
      if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20) {
        return json(res, 400, { error: "messages must contain between 1 and 20 entries" });
      }
      const messages = body.messages.map(m => {
        if (!["user", "assistant"].includes(m.role) || typeof m.content !== "string" || !m.content.trim() || m.content.length > 8000) {
          throw Object.assign(new Error("Each message needs a valid role and 1–8000 characters of content"), { status: 400 });
        }
        return { role: m.role, content: m.content };
      });
      const reply = await chatWithProvider(messages);
      return json(res, 200, { requestId: randomUUID(), reply });
    } catch (error) {
      return json(res, error.status || 500, { error: error.message || "Internal error" });
    }
  }
  if (req.method === "POST" && url.pathname === "/v1/actions/prepare") {
    try {
      const body = await readBody(req);
      const allowed = ["send_email", "send_message", "place_call", "deploy", "database_migration", "delete_data", "change_device_setting"];
      if (!allowed.includes(body.action) || typeof body.summary !== "string" || !body.summary.trim()) {
        return json(res, 400, { error: "Provide a supported action and a non-empty summary" });
      }
      return json(res, 202, {
        approvalRequired: true,
        status: "awaiting_user_approval",
        approvalId: randomUUID(),
        action: body.action,
        summary: body.summary.slice(0, 1000),
        note: "This gateway only prepares approval requests. It does not execute external actions."
      });
    } catch (error) {
      return json(res, error.status || 500, { error: error.message || "Internal error" });
    }
  }
  return json(res, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`TACT AI Guardian gateway listening on ${PORT}`);
});
