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
      if (p === '/api/recommend-buy')                                 return recommendBuy(url);
      if (p.startsWith('/api/game-details/'))                         return gameDetails(p);
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

// Games to BUY — uses tag-based similar games + Steam featured
async function recommendBuy(url) {
  const sid = url.searchParams.get('sid') || DEFAULT_STEAM_ID;
  const games = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  const owned = new Set((games?.response?.games || []).map(g => g.appid));
  const topPlayed = [...(games?.response?.games || [])]
    .filter(g => (g.playtime_forever || 0) > 300)
    .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
    .slice(0, 5);

  // Manual similarity map for popular genres — fast + reliable without scraping
  const SIMILARITY = {
    // Sea of Thieves (adventure, pirate, multiplayer)
    1172620: [
      { appid: 2220280, name: 'Skull and Bones', reason: 'Naval combat in a massive open world' },
      { appid: 582010, name: 'Monster Hunter: World', reason: 'Co-op adventure grind' },
      { appid: 2344520, name: 'Diablo IV', reason: 'Same loot chase feeling' },
    ],
    // CS2
    730: [
      { appid: 1172470, name: 'Apex Legends', reason: 'FPS you\'d pick up fast' },
      { appid: 252490, name: 'Rust', reason: 'Tense tactical gunplay' },
      { appid: 1938090, name: 'Call of Duty: MW III', reason: 'If you want something heavier' },
    ],
    // RDR2
    1174180: [
      { appid: 1091500, name: 'Cyberpunk 2077', reason: 'Same RPG depth, modern setting' },
      { appid: 1245620, name: 'Elden Ring', reason: 'Massive open world, huge hours' },
      { appid: 1086940, name: "Baldur's Gate 3", reason: 'Story-driven epic' },
    ],
    // Elden Ring
    1245620: [
      { appid: 814380, name: 'Sekiro', reason: 'FromSoftware, tighter combat' },
      { appid: 1627720, name: 'Lies of P', reason: 'Souls-like, bloodborne vibes' },
      { appid: 1623730, name: 'Palworld', reason: 'Massive open-world survival' },
    ],
    // Rocket League
    252950: [
      { appid: 1517290, name: 'Battlefield 2042', reason: 'Another competitive team game' },
      { appid: 892970, name: 'Valheim', reason: 'Chill co-op change of pace' },
    ],
    // Rust
    252490: [
      { appid: 1604030, name: 'SCUM', reason: 'Hardcore survival' },
      { appid: 306130, name: 'Elder Scrolls Online', reason: 'MMO grind energy' },
    ],
    // Cyberpunk
    1091500: [
      { appid: 2651280, name: 'Alan Wake 2', reason: 'Narrative with atmosphere' },
      { appid: 1238810, name: 'Battlefield V', reason: 'If you want shooter action' },
    ],
    // The Witcher 3
    292030: [
      { appid: 1086940, name: "Baldur's Gate 3", reason: 'Deep RPG, best in years' },
      { appid: 2344520, name: 'Diablo IV', reason: 'Dark fantasy with loot' },
      { appid: 2322010, name: 'Kingdom Come: Deliverance II', reason: 'Same medieval realism' },
    ],
  };

  // Trending / consensus must-plays (2025-2026)
  const TRENDING = [
    { appid: 2344520, name: 'Diablo IV', reason: 'Season 6 is the best yet', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2344520/header.jpg' },
    { appid: 1086940, name: "Baldur's Gate 3", reason: 'Game of the Year 2023, still peak', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg' },
    { appid: 2322010, name: 'Kingdom Come: Deliverance II', reason: 'Medieval RPG, realistic and huge', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/header.jpg' },
    { appid: 2767030, name: 'Marvel Rivals', reason: 'Most played hero shooter right now', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2767030/header.jpg' },
    { appid: 2073850, name: 'The Finals', reason: 'Free-to-play FPS, physics-driven destruction', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2073850/header.jpg' },
    { appid: 2651280, name: 'Alan Wake 2', reason: 'Best-looking game of the past year', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2651280/header.jpg' },
    { appid: 1623730, name: 'Palworld', reason: 'Survival + Pokemon, became a phenomenon', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1623730/header.jpg' },
    { appid: 1145360, name: 'Hades', reason: "Roguelike masterpiece, you don't own it", img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg' },
  ];

  const recs = [];

  // Based on your top 3 played games
  for (const g of topPlayed.slice(0, 3)) {
    const similar = SIMILARITY[g.appid];
    if (similar) {
      for (const s of similar) {
        if (!owned.has(s.appid) && !recs.find(r => r.appid === s.appid)) {
          recs.push({
            reason: `Because you loved ${g.name} (${Math.round(g.playtime_forever/60)}h)`,
            game: s.name,
            appid: s.appid,
            img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${s.appid}/header.jpg`,
            sub: s.reason,
            buy: true,
          });
          if (recs.length >= 6) break;
        }
      }
    }
    if (recs.length >= 6) break;
  }

  // Trending you don't own
  for (const t of TRENDING) {
    if (!owned.has(t.appid) && !recs.find(r => r.appid === t.appid)) {
      recs.push({
        reason: 'Trending right now',
        game: t.name,
        appid: t.appid,
        img: t.img,
        sub: t.reason,
        buy: true,
      });
      if (recs.length >= 10) break;
    }
  }

  // Enrich with price info from Steam store API
  for (const r of recs) {
    try {
      const data = await fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${r.appid}&cc=gb&l=en`);
      const info = data?.[r.appid]?.data;
      if (info?.is_free) r.price = 'Free';
      else if (info?.price_overview) {
        const p = info.price_overview;
        if (p.discount_percent > 0) {
          r.price = `${p.final_formatted} (-${p.discount_percent}%)`;
          r.discounted = true;
        } else {
          r.price = p.final_formatted;
        }
      }
    } catch {}
  }

  return jsonResponse({ recommendations: recs });
}

async function gameDetails(path) {
  const appid = path.split('/').pop();
  try {
    const data = await fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=gb&l=en`);
    const info = data?.[appid]?.data;
    if (!info) return jsonResponse({ error: 'Not found' }, 404);
    return jsonResponse({
      appid,
      name: info.name,
      price: info.is_free ? 'Free' : (info.price_overview?.final_formatted || '—'),
      discount: info.price_overview?.discount_percent || 0,
      description: info.short_description,
      genres: (info.genres || []).map(g => g.description),
      metacritic: info.metacritic?.score || null,
      releaseDate: info.release_date?.date,
      header: info.header_image,
    });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
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
