const ALLOWED = Object.freeze({
  event_name: new Set(['game_start', 'game_complete', 'reroll', 'exclude_reroll']),
  method: new Set(['ladder', 'wheel', 'lot', 'pinball', 'race', 'capsule', 'slot', 'bomb']),
  input_mode: new Set(['number', 'name', 'na']),
  participant_bucket: new Set(['1', '2-5', '6-10', '11-20', '21+', 'na']),
  result_mode: new Set(['winner', 'rank', 'custom', 'bomb']),
});

const FIELDS = Object.freeze(Object.keys(ALLOWED));
const MAX_BODY_BYTES = 1024;
const AUTOMATION_UA = /HeadlessChrome|Playwright/i;

function response(status) {
  return new Response(null, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isAutomatedQa(request) {
  const userAgent = request.headers.get('user-agent') || '';
  if (AUTOMATION_UA.test(userAgent)) return true;

  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).searchParams.get('qa') === '1';
  } catch {
    return false;
  }
}

function isValidPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const keys = Object.keys(payload);
  if (keys.length !== FIELDS.length || keys.some((key) => !FIELDS.includes(key))) return false;
  return FIELDS.every((key) => typeof payload[key] === 'string' && ALLOWED[key].has(payload[key]));
}

function isConsistentPayload(payload) {
  if (payload.method === 'bomb') {
    return payload.input_mode === 'na' && payload.participant_bucket === 'na' && payload.result_mode === 'bomb';
  }
  return payload.input_mode !== 'na' && payload.participant_bucket !== 'na' && payload.result_mode !== 'bomb';
}

async function handlePost(context) {
  const { request, env } = context;
  if (!isSameOrigin(request)) return response(403);
  if (isAutomatedQa(request)) return response(204);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response(415);

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) return response(413);

  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return response(413);
    body = JSON.parse(raw);
  } catch {
    return response(400);
  }

  if (!isValidPayload(body) || !isConsistentPayload(body)) return response(400);
  if (!env.ANALYTICS_DB) return response(503);

  const eventDate = new Date().toISOString().slice(0, 10);
  try {
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO event_counts (
        event_date, event_name, method, input_mode,
        participant_bucket, result_mode, count
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT (
        event_date, event_name, method, input_mode,
        participant_bucket, result_mode
      ) DO UPDATE SET count = count + 1
    `).bind(
      eventDate,
      body.event_name,
      body.method,
      body.input_mode,
      body.participant_bucket,
      body.result_mode,
    ).run();
  } catch {
    return response(503);
  }

  return response(204);
}

export function onRequest(context) {
  if (context.request.method !== 'POST') return response(405);
  return handlePost(context);
}
