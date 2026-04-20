export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === '/api/fleet-signup' && request.method === 'POST') {
      return handleFleetSignup(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handleFleetSignup(request, env) {
  try {
    const data = await request.json();
    const BOT  = '8704904635:AAGMqY0HfyFbIVxzQEtSwftcS_yoLzZBzFs';
    const CHAT = '974944048';

    const vessels = (data.vessels || []).join(', ') || 'none selected';
    const plan    = (data.plan || 'free').toUpperCase();
    const msg = [
      `*NEW FleetWatch signup*`,
      `Name: ${data.name || '—'}`,
      `Email: ${data.email || '—'}`,
      `Plan: *${plan}*`,
      `Telegram: ${data.telegram || '—'}`,
      `Vessels: ${vessels}`,
      `Time: ${new Date().toUTCString()}`
    ].join('\n');

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: msg, parse_mode: 'Markdown' })
    });

    const tgData = await tgRes.json();
    console.log('Telegram result:', JSON.stringify(tgData));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (e) {
    console.error('Signup error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}
