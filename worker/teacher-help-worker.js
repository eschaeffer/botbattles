export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    let origin = request.headers.get("Origin") || "";
    let referer = request.headers.get("Referer") || "";
    let allowed = (env.ALLOWED_HOSTS || "").split(",").map((s) => s.trim()).filter(Boolean);
    let originHost = "";
    try {
      originHost = origin ? new URL(origin).hostname : "";
    } catch (err) {
      originHost = "";
    }
    let refererHost = "";
    try {
      refererHost = referer ? new URL(referer).hostname : "";
    } catch (err) {
      refererHost = "";
    }

    if (allowed.length) {
      if (!allowed.includes(originHost) && !allowed.includes(refererHost)) {
        return new Response(JSON.stringify({ error: "Domain not allowed." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (env.RATE_LIMITER) {
      const id = env.RATE_LIMITER.idFromName(ip);
      const stub = env.RATE_LIMITER.get(id);
      const limitResp = await stub.fetch("https://rate.limit/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip,
          limit: Number(env.RATE_LIMIT_PER_MINUTE || "20"),
        }),
      });
      if (!limitResp.ok) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "Bad JSON." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const passphrase = (payload.passphrase || "").toString();
    const message = (payload.message || "").toString();

    if (!env.TEACHER_PASSPHRASE || passphrase !== env.TEACHER_PASSPHRASE) {
      return new Response(JSON.stringify({ error: "Incorrect passphrase." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!message || message.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long or empty." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt =
      "You are the Teacher Help Chatbot for BotBattles. Provide high-level guidance, troubleshooting, and teaching tips. " +
      "Do not write full bot solutions. Encourage learning and experimentation.";

    const body = {
      model: env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 500,
    };

    const apiUrl = (env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "") + "/v1/chat/completions";

    const apiResp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!apiResp.ok) {
      const text = await apiResp.text();
      return new Response(JSON.stringify({ error: "Upstream error: " + text }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await apiResp.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }
    let payload = {};
    try {
      payload = await request.json();
    } catch (err) {
      return new Response("Bad request", { status: 400 });
    }
    const ip = payload.ip || "unknown";
    const limit = Number(payload.limit || "20");
    const windowKey = Math.floor(Date.now() / 60000);
    const key = `${ip}:${windowKey}`;
    const count = (await this.state.storage.get(key)) || 0;
    if (count >= limit) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
    await this.state.storage.put(key, count + 1, { expirationTtl: 120 });
    return new Response("ok", { status: 200 });
  }
}
