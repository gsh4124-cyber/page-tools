import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Public, anonymous, aggregate-only game telemetry. Never accept user-entered names
// or personal identifiers. Database credentials stay exclusively on the server.
const ALLOWED_ORIGIN = "https://random-ppobgi.pages.dev";
const RPC_PATH = "/rest/v1/rpc/increment_random_picker_event";
const MAX_BODY_BYTES = 1024;
const allowed: Record<string, Set<string>> = {
  event_name: new Set(["game_start", "game_complete", "reroll", "exclude_reroll"]),
  method: new Set(["ladder", "wheel", "lot", "pinball", "race", "capsule", "slot", "bomb"]),
  input_mode: new Set(["number", "name", "na"]),
  participant_bucket: new Set(["1", "2-5", "6-10", "11-20", "21+", "na"]),
  result_mode: new Set(["winner", "rank", "custom", "bomb"]),
};
const fields = Object.keys(allowed);
function response(status: number, origin = "") {
  const headers = new Headers({
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  if (origin === ALLOWED_ORIGIN) {
    headers.set("access-control-allow-origin", ALLOWED_ORIGIN);
    headers.set("vary", "Origin");
  }
  return new Response(null, { status, headers });
}
function validate(value: unknown): value is Record<string,string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string,unknown>;
  const keys = Object.keys(payload);
  if (keys.length !== fields.length || keys.some(key => !fields.includes(key))) return false;
  if (!fields.every(key => typeof payload[key] === "string" && allowed[key].has(payload[key] as string))) return false;
  return payload.method === "bomb"
    ? payload.input_mode === "na" && payload.participant_bucket === "na" && payload.result_mode === "bomb"
    : payload.input_mode !== "na" && payload.participant_bucket !== "na" && payload.result_mode !== "bomb";
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (req.method === "OPTIONS") {
    if (origin !== ALLOWED_ORIGIN) return response(403);
    const res = response(204, origin);
    res.headers.set("access-control-allow-methods", "POST, OPTIONS");
    res.headers.set("access-control-allow-headers", "content-type");
    res.headers.set("access-control-max-age", "86400");
    return res;
  }
  if (req.method !== "POST") return response(405, origin);
  if (origin !== ALLOWED_ORIGIN) return response(403);
  if (/HeadlessChrome|Playwright/i.test(req.headers.get("user-agent") || "")) return response(204, origin);
  try {
    if (new URL(req.headers.get("referer") || "").searchParams.get("qa") === "1") return response(204, origin);
  } catch { /* Referrer can be omitted by browser policy. */ }
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return response(415, origin);
  if (Number(req.headers.get("content-length") || "0") > MAX_BODY_BYTES) return response(413, origin);

  let payload: unknown;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return response(413, origin);
    payload = JSON.parse(raw);
  } catch { return response(400, origin); }
  const tool = !!payload && typeof payload === "object" && !Array.isArray(payload) && Object.keys(payload).length === 1 && ["yut","dice"].includes((payload as Record<string,string>).tool);
  if (!tool && !validate(payload)) return response(400, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return response(503, origin);
  const p = payload as Record<string,string>;
  try {
    const rpc = await fetch(`${supabaseUrl}${tool ? "/rest/v1/rpc/increment_random_picker_tool_use" : RPC_PATH}`, {
      method: "POST",
      headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" },
      body: JSON.stringify(tool ? {p_tool: p.tool} : {
        p_event_name: p.event_name,
        p_method: p.method,
        p_input_mode: p.input_mode,
        p_participant_bucket: p.participant_bucket,
        p_result_mode: p.result_mode,
      }),
    });
    if (!rpc.ok) return response(503, origin);
    return response(204, origin);
  } catch { return response(503, origin); }
});

