export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/fleet-signup' && request.method === 'POST') {
      return handleFleetSignup(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};

async function handleFleetSignup(request, env) {
  try {
    const data = await request.json();
    const BOT = '8704904635:AAGMqY0HfyFbIVxzQEtSwftcS_yoLzZBzFs';
    const CHAT = '974944048';
    const msg = `*New FleetWatch signup*\nName: ${data.name}\nEmail: ${data.email}\nPlan: ${data.plan}\nTelegram: ${data.telegram||'—'}\nVessels: ${(data.vessels||[]).join(', ')}`;
    await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: CHAT, text: msg, parse_mode: 'Markdown'})
    });
    return new Response(JSON.stringify({ok:true}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}), {status:500, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}
