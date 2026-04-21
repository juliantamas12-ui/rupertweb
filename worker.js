// rupertweb Worker — handles API endpoints + static assets

const STEAM_KEY = '7E0FBB2D8E9A19B0F40556A78A6B9C47';
const DEFAULT_STEAM_ID = '76561199040427763'; // Julian's Steam ID
const RESEND_KEY = 're_dNyaesf8_GH99GVk3N5u45x6RuA1LCSR8';
const OWNER_EMAIL = 'julian.tamas12@gmail.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });

    try {
      if (p === '/api/fleet-signup' && request.method === 'POST')     return handleFleetSignup(request);
      if (p === '/api/steam/profile')                                 return steamProfile(url);
      if (p === '/api/steam/games')                                   return steamGames(url);
      if (p === '/api/steam/recent')                                  return steamRecent(url);
      if (p.startsWith('/api/steam/achievements/'))                   return steamAchievements(url, p);
      if (p.startsWith('/api/steam/game-stats/'))                     return steamGameStats(p);
      if (p.startsWith('/api/steam/news/'))                           return steamNews(p);
      if (p === '/api/recommend')                                     return recommend(url);
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }

    return env.ASSETS.fetch(request);
  }
};

// ════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders() }
  });
}

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'QuestLog/1.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}`);
  return r.json();
}

// ════════════════════════════════════════════════════════
// STEAM ENDPOINTS
// ════════════════════════════════════════════════════════

async function steamProfile(url) {
  const sid = url.searchParams.get('sid') || DEFAULT_STEAM_ID;
  const data = await fetchJSON(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${sid}`);
  const player = data?.response?.players?.[0];
  if (!player) return jsonResponse({ error: 'Profile not found' }, 404);

  // Also fetch level
  let level = null;
  try {
    const lvl = await fetchJSON(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${STEAM_KEY}&steamid=${sid}`);
    level = lvl?.response?.player_level;
  } catch {}

  return jsonResponse({
    steamid: player.steamid,
    name: player.personaname,
    avatar: player.avatarfull,
    realName: player.realname || null,
    country: player.loccountrycode || null,
    level,
    profileUrl: player.profileurl,
    lastLogoff: player.lastlogoff,
    timeCreated: player.timecreated,
  });
}

async function steamGames(url) {
  const sid = url.searchParams.get('sid') || DEFAULT_STEAM_ID;
  const data = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  const games = (data?.response?.games || []).map(g => ({
    appid: g.appid,
    name: g.name,
    hours: Math.round((g.playtime_forever || 0) / 60 * 10) / 10,
    hoursTwoWeeks: Math.round((g.playtime_2weeks || 0) / 60 * 10) / 10,
    lastPlayed: g.rtime_last_played,
    img: g.img_icon_url ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg` : null,
  }));

  // Sort by hours desc
  games.sort((a, b) => b.hours - a.hours);

  return jsonResponse({
    count: data?.response?.game_count || games.length,
    totalHours: Math.round(games.reduce((s, g) => s + g.hours, 0)),
    games
  });
}

async function steamRecent(url) {
  const sid = url.searchParams.get('sid') || DEFAULT_STEAM_ID;
  const data = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_KEY}&steamid=${sid}`
  );
  const games = (data?.response?.games || []).map(g => ({
    appid: g.appid,
    name: g.name,
    hoursTwoWeeks: Math.round((g.playtime_2weeks || 0) / 60 * 10) / 10,
    totalHours: Math.round((g.playtime_forever || 0) / 60 * 10) / 10,
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
  }));
  return jsonResponse({ games });
}

async function steamAchievements(url, path) {
  const appid = path.split('/').pop();
  const sid = url.searchParams.get('sid') || DEFAULT_STEAM_ID;

  try {
    const [player, schema, global] = await Promise.all([
      fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?appid=${appid}&key=${STEAM_KEY}&steamid=${sid}&l=english`),
      fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_KEY}&appid=${appid}&l=english`),
      fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appid}`).catch(() => ({ achievementpercentages: { achievements: [] } })),
    ]);

    const playerAch = player?.playerstats?.achievements || [];
    const schemaAch = schema?.game?.availableGameStats?.achievements || [];
    const globalAch = global?.achievementpercentages?.achievements || [];
    const globalMap = Object.fromEntries(globalAch.map(a => [a.name, a.percent]));

    const achievements = schemaAch.map(sa => {
      const p = playerAch.find(pa => pa.apiname === sa.name);
      return {
        id: sa.name,
        name: sa.displayName,
        desc: sa.description || '',
        icon: sa.icon,
        iconGray: sa.icongray,
        hidden: sa.hidden === 1,
        unlocked: p?.achieved === 1,
        unlockTime: p?.unlocktime || 0,
        globalPct: globalMap[sa.name] || 0,
      };
    });

    const unlocked = achievements.filter(a => a.unlocked).length;
    return jsonResponse({
      appid,
      game: schema?.game?.gameName || 'Unknown',
      unlocked,
      total: achievements.length,
      completionPct: achievements.length ? Math.round(unlocked / achievements.length * 100) : 0,
      achievements
    });
  } catch (e) {
    return jsonResponse({ error: 'Achievements unavailable for this game', detail: e.message }, 404);
  }
}

async function steamGameStats(path) {
  const appid = path.split('/').pop();
  try {
    const data = await fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`);
    return jsonResponse({ appid, currentPlayers: data?.response?.player_count || 0 });
  } catch (e) {
    return jsonResponse({ appid, currentPlayers: null }, 200);
  }
}

async function steamNews(path) {
  const appid = path.split('/').pop();
  try {
    const data = await fetchJSON(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=5&maxlength=280&format=json`
    );
    const items = (data?.appnews?.newsitems || []).map(n => ({
      title: n.title,
      url: n.url,
      author: n.author,
      contents: n.contents,
      date: n.date,
      feed: n.feedlabel,
    }));
    return jsonResponse({ appid, items });
  } catch (e) {
    return jsonResponse({ appid, items: [] }, 200);
  }
}

// Mega-simple recommendation: genre-similar games you own but haven't played much
async function recommend(url) {
  const sid = url.searchParams.get('sid') || DEFAULT_STEAM_ID;
  const games = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  const list = games?.response?.games || [];

  // Top played
  const topPlayed = [...list].sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0)).slice(0, 5);
  // Barely touched
  const barely = list.filter(g => (g.playtime_forever || 0) > 0 && (g.playtime_forever || 0) < 120);
  // Never played (could be hidden gems)
  const unplayed = list.filter(g => !g.playtime_forever);

  const recs = [];

  // Because you loved X (pick top played, suggest random unplayed)
  if (topPlayed[0] && unplayed.length) {
    const u = unplayed[Math.floor(Math.random() * unplayed.length)];
    recs.push({
      reason: `Because you loved ${topPlayed[0].name}`,
      game: u.name,
      appid: u.appid,
      img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${u.appid}/header.jpg`,
      sub: `You own this but haven't tried it yet`,
    });
  }

  // From backlog
  if (barely.length) {
    const b = barely[Math.floor(Math.random() * barely.length)];
    recs.push({
      reason: 'From your backlog',
      game: b.name,
      appid: b.appid,
      img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${b.appid}/header.jpg`,
      sub: `You played ${Math.round(b.playtime_forever/60*10)/10}h — worth giving it another shot`,
    });
  }

  // Short session
  const shortGames = list.filter(g => ['Rocket League','Counter-Strike 2','Tetris','Slay the Spire','Hades','Dead Cells','Spelunky'].some(name => g.name?.includes(name)));
  if (shortGames.length) {
    const s = shortGames[0];
    recs.push({
      reason: 'Short session tonight',
      game: s.name,
      appid: s.appid,
      img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${s.appid}/header.jpg`,
      sub: 'Pick up & play, under 30 min per run',
    });
  }

  // Most played - suggest coming back
  if (topPlayed[0]) {
    const t = topPlayed[0];
    recs.push({
      reason: 'Your most played game',
      game: t.name,
      appid: t.appid,
      img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${t.appid}/header.jpg`,
      sub: `${Math.round(t.playtime_forever/60)}h lifetime — check for a new update`,
    });
  }

  return jsonResponse({ recommendations: recs.slice(0, 4) });
}

// ════════════════════════════════════════════════════════
// FLEETWATCH SIGNUP (existing)
// ════════════════════════════════════════════════════════

async function handleFleetSignup(request) {
  const data = await request.json();
  const vessels = (data.vessels || []).join(', ') || 'none selected';
  const plan    = (data.plan || 'free').toUpperCase();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:20px">
      <h2 style="color:#0d1e3d;border-bottom:2px solid #c8a020;padding-bottom:8px">New FleetWatch Signup</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;font-weight:bold;color:#666">Name</td><td style="padding:8px">${data.name || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#666">Email</td><td style="padding:8px">${data.email || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#666">Plan</td><td style="padding:8px"><strong style="color:#c8a020">${plan}</strong></td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#666">Vessels</td><td style="padding:8px">${vessels}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#666">Time</td><td style="padding:8px">${new Date().toUTCString()}</td></tr>
      </table>
    </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: OWNER_EMAIL,
      subject: `New FleetWatch signup: ${data.name} (${plan})`,
      html
    })
  });

  return jsonResponse({ ok: true });
}
