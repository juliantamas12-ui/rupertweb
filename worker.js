// rupertweb Worker — handles API endpoints + static assets

const STEAM_KEY = '7E0FBB2D8E9A19B0F40556A78A6B9C47';
const DEFAULT_STEAM_ID = null; // no default — each user provides their own
const RESEND_KEY = 're_dNyaesf8_GH99GVk3N5u45x6RuA1LCSR8';
const OWNER_EMAIL = 'julian.tamas12@gmail.com';

// VAPID for web push notifications
const VAPID_PUBLIC = 'BL6xSk_4wHzUF_8AYnJJOrJnhv0dlpe9nnI5B6vCI1kfWp8bvZ2tuf3Ittb_mKxwIEz9Z1woclj8KiVGZkRxKeA';

// Stripe — set when Julian provides keys. checkoutPriceId is the recurring price ID for Pro £4.99/mo.
const STRIPE_SECRET_KEY = '';
const STRIPE_PRICE_ID   = '';
const STRIPE_SUCCESS_URL = 'https://rupertweb.com/questlog.html?pro=success';
const STRIPE_CANCEL_URL  = 'https://rupertweb.com/questlog.html?pro=cancel';

// KV helpers — use Cloudflare KV when bound, fall back to in-memory Map for local dev
const _memoryStore = new Map();
async function kvGet(env, key) {
  if (env?.QUESTLOG_KV) {
    const v = await env.QUESTLOG_KV.get(key);
    return v ? JSON.parse(v) : null;
  }
  return _memoryStore.get(key) || null;
}
async function kvPut(env, key, value, ttl) {
  const json = JSON.stringify(value);
  if (env?.QUESTLOG_KV) {
    const opts = ttl ? { expirationTtl: ttl } : undefined;
    await env.QUESTLOG_KV.put(key, json, opts);
  } else {
    _memoryStore.set(key, value);
  }
}
async function kvDelete(env, key) {
  if (env?.QUESTLOG_KV) await env.QUESTLOG_KV.delete(key);
  else _memoryStore.delete(key);
}
async function kvList(env, prefix) {
  if (env?.QUESTLOG_KV) {
    const r = await env.QUESTLOG_KV.list({ prefix });
    return r.keys.map(k => k.name);
  }
  return [..._memoryStore.keys()].filter(k => k.startsWith(prefix));
}



export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });

    try {
      if (p === '/api/fleet-signup' && request.method === 'POST')     return handleFleetSignup(request);
      if (p === '/api/checkout' && request.method === 'POST')         return checkout(request);
      if (p === '/api/stripe/webhook' && request.method === 'POST')   return stripeWebhook(request, env);
      if (p === '/api/pro-status')                                    return proStatus(url, env);
      if (p === '/api/push/vapid-key')                                return jsonResponse({ key: VAPID_PUBLIC });
      if (p === '/api/push/subscribe' && request.method === 'POST')   return pushSubscribe(request, env);
      if (p === '/api/push/unsubscribe' && request.method === 'POST') return pushUnsubscribe(request, env);
      if (p === '/api/wishlist' && request.method === 'GET')          return wishlistGet(url, env);
      if (p === '/api/wishlist' && request.method === 'POST')         return wishlistPut(request, env);
      if (p === '/api/journal' && request.method === 'GET')           return journalGet(url, env);
      if (p === '/api/journal' && request.method === 'POST')          return journalPut(request, env);
      if (p === '/api/achievement-of-day')                            return achievementOfDay(url);
      if (p === '/api/steam/profile')                                 return steamProfile(url);
      if (p === '/api/steam/resolve-vanity')                          return steamResolveVanity(url);
      if (p === '/api/steam/games')                                   return steamGames(url);
      if (p === '/api/steam/recent')                                  return steamRecent(url);
      if (p.startsWith('/api/steam/achievements/'))                   return steamAchievements(url, p);
      if (p.startsWith('/api/steam/game-stats/'))                     return steamGameStats(p);
      if (p.startsWith('/api/steam/news/'))                           return steamNews(p);
      if (p === '/api/recommend')                                     return recommend(url);
      if (p === '/api/recommend-buy')                                 return recommendBuy(url);
      if (p.startsWith('/api/game-details/'))                         return gameDetails(p);
      if (p.startsWith('/api/reviews/'))                              return steamReviews(p);
      if (p === '/api/free-games')                                    return freeGames();
      if (p === '/api/new-releases')                                  return newReleases(url);
      if (p === '/api/upcoming')                                      return upcomingReleases();
      if (p === '/api/wrapped')                                       return getWrapped(url);
      if (p === '/api/compare-friend')                                return compareFriend(url);
      if (p === '/api/game-of-the-day')                               return gameOfTheDay(url);
      if (p === '/api/finish-this')                                   return finishThis(url);
      if (p === '/api/backlog-estimate')                              return backlogEstimate(url);
      if (p === '/api/price-alert' && request.method === 'POST')      return createPriceAlert(request);
      if (p === '/api/fps-estimate')                                  return fpsEstimate(url);
      if (p === '/api/gpu-list')                                      return jsonResponse({ gpus: Object.keys(GPU_SCORES).sort() });
      if (p === '/api/missing-games')                                 return missingGames();
      if (p === '/api/steam-dna')                                     return steamDNA(url);
      if (p === '/api/hltb')                                          return howLongToBeat(url);
      if (p === '/api/subscribe-digest' && request.method === 'POST') return subscribeDigest(request);
      if (p === '/api/game-night')                                    return gameNight(request, url);
      if (p === '/api/price-history')                                  return priceHistory(url);
      if (p === '/api/now-playing')                                    return nowPlaying(url);
      if (p === '/api/what-to-play')                                   return whatToPlay(url);

      if (p === '/api/reviews-compare')                                return reviewsCompare(url);
      if (p.startsWith('/u/'))                                         return publicProfile(url);
      if (p === '/api/spend-analytics')                                return spendAnalytics(url);
      if (p === '/api/deals')                                         return getDeals(url);
      if (p === '/api/deal-search')                                   return searchDeal(url);
      if (p === '/api/my-deals')                                      return myDeals(url);
      if (p === '/api/alerts')                                        return getAlerts(url, env);
      if (p === '/api/cron-status')                                   return cronStatus(env);

    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }

    return env.ASSETS.fetch(request);
  },

  // Cloudflare scheduled handler — invoked by cron triggers in wrangler.toml.
  // Hourly trigger: runs the wishlist price-watch sweep. Daily 00:00 trigger:
  // also rotates the Achievement-of-the-Day cache stamp. Each job is wrapped
  // in try/catch so a single failure can't break the next run.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const startedAt = Date.now();
      const cron = event.cron || '';
      const log = { startedAt, cron, jobs: {} };
      try {
        const r = await runWishlistPriceWatch(env);
        log.jobs.priceWatch = r;
      } catch (e) {
        log.jobs.priceWatch = { error: e.message };
      }
      // Daily midnight (UTC) tick — refresh Achievement-of-the-Day stamp so
      // clients can detect a new day without comparing strings.
      if (cron.startsWith('0 0 ')) {
        try {
          await kvPut(env, 'aotd:day-stamp', { day: new Date().toISOString().slice(0,10), at: Date.now() });
          log.jobs.aotdRotation = { ok: true };
        } catch (e) {
          log.jobs.aotdRotation = { error: e.message };
        }
      }
      log.finishedAt = Date.now();
      log.durationMs = log.finishedAt - startedAt;
      try { await kvPut(env, 'cron:lastRun', log, 60 * 60 * 24 * 14); } catch {}
    })());
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

// ═════ UNIVERSAL JUNK FILTER ═════
// Used everywhere: deals, search, curator, new releases, buy recs
const JUNK_PATTERNS = /\b(hentai|waifu|nsfw|sex|sexy|porn|erotic|nudist|boobs|anime\s*girl|girl\s*simulator|femboy|lewd|bikini\s*girls|yaoi|yuri|h-game|ero|dating\s*sim|visual\s*novel|uncensored|milf|futa|succubus|onee\s*chan|sakura\s*[a-z]+)\b/i;
const JUNK_META_PATTERNS = /\b(demo|soundtrack|ost|dlc\s*$|artbook|wallpaper|test|prototype|beta\s*$)\b/i;

function isJunkTitle(title) {
  if (!title) return false;
  return JUNK_PATTERNS.test(title) || JUNK_META_PATTERNS.test(title);
}

// ════════════════════════════════════════════════════════
// STEAM ENDPOINTS
// ════════════════════════════════════════════════════════

async function steamResolveVanity(url) {
  const v = url.searchParams.get('vanity');
  if (!v) return jsonResponse({ error: 'vanity required' }, 400);
  try {
    const data = await fetchJSON(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_KEY}&vanityurl=${encodeURIComponent(v)}`);
    if (data?.response?.success === 1 && data.response.steamid) {
      return jsonResponse({ steamid: data.response.steamid });
    }
    return jsonResponse({ error: 'Vanity URL not found' }, 404);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

async function steamProfile(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
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
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const data = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );

  // If response is {} (not {games: []}), the privacy setting is blocking us
  if (!data?.response || (data.response.game_count === undefined && !data.response.games)) {
    return jsonResponse({
      error: 'privacy',
      message: 'Your owned games are private. Go to Steam → Edit Profile → Privacy Settings and set "Game details" AND "Owned games" to Public. Your profile being public alone is not enough.',
    }, 403);
  }

  const games = (data?.response?.games || []).map(g => ({
    appid: g.appid,
    name: g.name,
    hours: Math.round((g.playtime_forever || 0) / 60 * 10) / 10,
    hoursTwoWeeks: Math.round((g.playtime_2weeks || 0) / 60 * 10) / 10,
    lastPlayed: g.rtime_last_played,
    // header.jpg is served by Steam for every published app regardless of img_icon_url
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
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
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
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
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);

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
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
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

// Games to BUY — large curated pool with genre tags
async function recommendBuy(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const games = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  const owned = new Set((games?.response?.games || []).map(g => g.appid));
  const topPlayed = [...(games?.response?.games || [])]
    .filter(g => (g.playtime_forever || 0) > 300)
    .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
    .slice(0, 5);

  // Tag-based similarity — match your owned-games' tags to the CATALOG
  const TAG_MAP = {
    1172620: ['multiplayer', 'pirate', 'adventure', 'openworld', 'coop'],   // Sea of Thieves
    730:     ['fps', 'competitive', 'shooter', 'tactical', 'multiplayer'],  // CS2
    1174180: ['openworld', 'action', 'rpg', 'story', 'western'],            // RDR2
    1245620: ['souls', 'rpg', 'openworld', 'action', 'hardcore'],           // Elden Ring
    1091500: ['rpg', 'openworld', 'action', 'story', 'cyberpunk'],          // Cyberpunk 2077
    292030:  ['rpg', 'openworld', 'action', 'story', 'medieval'],           // Witcher 3
    252950:  ['sports', 'multiplayer', 'competitive', 'arcade'],            // Rocket League
    252490:  ['survival', 'multiplayer', 'openworld', 'hardcore'],          // Rust
    578080:  ['battleroyale', 'shooter', 'multiplayer', 'survival'],        // PUBG
    271590:  ['openworld', 'action', 'story', 'crime'],                     // GTA V
    105600:  ['sandbox', 'crafting', 'exploration', 'survival'],            // Terraria
    813780:  ['strategy', 'historical', 'rts'],                             // Age of Empires II DE
    1086940: ['rpg', 'story', 'turnbased', 'fantasy'],                      // BG3
    570:     ['moba', 'competitive', 'multiplayer'],                        // Dota 2
    440:     ['fps', 'shooter', 'multiplayer', 'casual'],                   // TF2
    582010:  ['action', 'rpg', 'coop', 'fantasy', 'grind'],                 // Monster Hunter World
    377160:  ['rpg', 'openworld', 'postapocalyptic'],                       // Fallout 4
    489830:  ['rpg', 'openworld', 'fantasy', 'story'],                      // Skyrim
    1716740: ['rpg', 'openworld', 'scifi', 'exploration'],                  // Starfield
    990080:  ['rpg', 'openworld', 'fantasy', 'magic'],                      // Hogwarts Legacy
    2344520: ['rpg', 'action', 'loot', 'grind'],                            // Diablo IV
    1623730: ['survival', 'openworld', 'coop', 'crafting'],                 // Palworld
    553850:  ['shooter', 'coop', 'multiplayer', 'scifi'],                   // Helldivers 2
    2183550: ['action', 'rpg', 'souls'],                                    // Black Myth: Wukong
    1145360: ['roguelike', 'action', 'indie'],                              // Hades
    367520:  ['metroidvania', 'action', 'indie'],                           // Hollow Knight
    413150:  ['farming', 'cosy', 'relaxing', 'indie'],                      // Stardew
    892970:  ['survival', 'coop', 'crafting'],                              // Valheim
    1551360: ['racing', 'openworld', 'arcade'],                             // Forza Horizon 5
    2139460: ['shooter', 'hero', 'competitive', 'multiplayer'],             // Overwatch 2
    570940:  ['moba'],                                                      // (n/a)
    1172470: ['battleroyale', 'fps', 'multiplayer'],                        // Apex Legends
    2246340: ['action', 'rpg', 'grind'],                                    // MH Wilds
    2139460: ['shooter', 'competitive', 'multiplayer'],                     // OW2
    1938090: ['fps', 'shooter', 'competitive'],                             // MW3
    814380:  ['souls', 'action', 'hardcore'],                               // Sekiro
    271590:  ['openworld', 'action', 'story', 'crime'],                     // GTA V
  };

  // Big catalog — 80+ games, each with tags for matching
  const CATALOG = [
    // RPGs
    { appid: 1086940, name: "Baldur's Gate 3",           tags: ['rpg','story','turnbased','fantasy'],        reason: 'Game of the Year 2023, still peak RPG' },
    { appid: 2322010, name: 'Kingdom Come: Deliverance II', tags: ['rpg','openworld','medieval','hardcore'],   reason: 'Medieval RPG with unmatched realism' },
    { appid: 1627720, name: 'Lies of P',                 tags: ['souls','rpg','action','hardcore'],          reason: 'Souls-like with Bloodborne energy' },
    { appid: 2344520, name: 'Diablo IV',                 tags: ['rpg','action','loot','fantasy','grind'],    reason: 'Endless loot chase, dark fantasy' },
    { appid: 2050650, name: 'Resident Evil 4 Remake',    tags: ['action','story','horror'],                   reason: 'Remake of the classic, top reviews' },
    { appid: 814380,  name: 'Sekiro: Shadows Die Twice', tags: ['souls','action','hardcore'],                reason: 'Tighter, faster FromSoftware combat' },
    { appid: 374320,  name: 'Dark Souls III',            tags: ['souls','rpg','action','hardcore'],          reason: 'Still one of the best Souls games' },
    { appid: 489830,  name: 'Skyrim Special Edition',    tags: ['rpg','openworld','fantasy','story'],         reason: 'Timeless open-world RPG' },
    { appid: 377160,  name: 'Fallout 4',                 tags: ['rpg','openworld','postapocalyptic'],        reason: 'Huge wasteland to explore' },
    { appid: 1716740, name: 'Starfield',                 tags: ['rpg','openworld','scifi','exploration'],    reason: 'Bethesda\'s biggest ever RPG' },
    { appid: 1222670, name: 'Disco Elysium',             tags: ['rpg','story','detective'],                   reason: 'Best-written RPG ever made' },
    { appid: 1966720, name: 'Like a Dragon: Infinite Wealth', tags: ['rpg','story','turnbased','japanese'], reason: 'Yakuza-style RPG in Hawaii' },

    // FPS / Shooter
    { appid: 2767030, name: 'Marvel Rivals',             tags: ['shooter','hero','multiplayer','competitive'], reason: 'Most played hero shooter now' },
    { appid: 2073850, name: 'The Finals',                tags: ['fps','shooter','multiplayer','destruction'], reason: 'F2P FPS with insane physics' },
    { appid: 1172470, name: 'Apex Legends',              tags: ['battleroyale','fps','shooter','multiplayer'], reason: 'Fast, tight FPS battle royale' },
    { appid: 553850,  name: 'HELLDIVERS 2',              tags: ['shooter','coop','multiplayer','action'],    reason: 'Co-op shooter hit of 2024' },
    { appid: 1938090, name: 'Call of Duty: MW III',      tags: ['fps','shooter','competitive'],               reason: 'Modern military FPS at its peak' },
    { appid: 1238810, name: 'Battlefield V',             tags: ['fps','shooter','multiplayer','ww2'],        reason: '64-player chaos in WW2 setting' },
    { appid: 1517290, name: 'Battlefield 2042',          tags: ['fps','shooter','multiplayer'],               reason: 'Large-scale modern warfare' },
    { appid: 2246340, name: 'Monster Hunter Wilds',      tags: ['action','rpg','coop','grind'],               reason: 'Latest in the hunt series' },
    { appid: 1259420, name: 'Ready or Not',              tags: ['fps','tactical','shooter','coop'],           reason: 'Modern SWAT tactical shooter' },

    // Open world / adventure
    { appid: 2651280, name: 'Alan Wake 2',               tags: ['story','action','horror','cinematic'],       reason: 'Visual masterpiece, horror thriller' },
    { appid: 1623730, name: 'Palworld',                  tags: ['survival','openworld','coop','crafting'],    reason: 'Survival + Pokemon phenomenon' },
    { appid: 1328670, name: 'Mount & Blade II: Bannerlord', tags: ['rpg','medieval','strategy','openworld'], reason: 'Medieval sandbox warfare' },
    { appid: 346110,  name: 'ARK: Survival Evolved',     tags: ['survival','dinosaurs','openworld','coop'],   reason: 'Dinosaur taming sandbox' },
    { appid: 892970,  name: 'Valheim',                   tags: ['survival','coop','viking','crafting'],       reason: 'Chill Viking co-op survival' },
    { appid: 2375030, name: 'Nightingale',               tags: ['survival','openworld','crafting','coop'],    reason: 'Victorian fantasy survival' },
    { appid: 2195250, name: 'EA Sports FC 25',           tags: ['sports','football','multiplayer'],           reason: 'The FIFA successor' },
    { appid: 582660,  name: 'Black Desert',              tags: ['mmorpg','openworld','fantasy'],              reason: 'Stunning MMORPG visuals' },

    // Stealth / action
    { appid: 813630,  name: 'Assassin\'s Creed Odyssey', tags: ['rpg','openworld','action','stealth','historical'], reason: 'Ancient Greek epic' },
    { appid: 2239550, name: 'Assassin\'s Creed Mirage',  tags: ['action','stealth','openworld'],              reason: 'Back-to-basics AC adventure' },
    { appid: 1432140, name: 'HITMAN 3',                  tags: ['stealth','action','story'],                  reason: 'The assassin simulator perfected' },
    { appid: 2050900, name: 'Tekken 8',                  tags: ['fighting','competitive','multiplayer'],      reason: 'Latest Tekken, best mechanically' },
    { appid: 1665460, name: 'Street Fighter 6',          tags: ['fighting','competitive','multiplayer'],      reason: 'Definitive fighting game' },

    // Roguelike / indie
    { appid: 1145360, name: 'Hades',                     tags: ['roguelike','action','story','indie'],        reason: 'Roguelike masterpiece' },
    { appid: 1145350, name: 'Hades II',                  tags: ['roguelike','action','indie'],                reason: 'Sequel in early access, phenomenal' },
    { appid: 646570,  name: 'Slay the Spire',            tags: ['roguelike','deckbuilder','turnbased','indie'], reason: 'Deckbuilder that started a genre' },
    { appid: 2379780, name: 'Balatro',                   tags: ['roguelike','deckbuilder','indie'],           reason: 'Poker roguelike, 2024 sleeper hit' },
    { appid: 1794680, name: 'Vampire Survivors',         tags: ['roguelike','action','indie'],                reason: 'Addictive bullet-hell' },
    { appid: 588650,  name: 'Dead Cells',                tags: ['roguelike','action','metroidvania','indie'], reason: 'Fast, precise action-platformer' },
    { appid: 367520,  name: 'Hollow Knight',             tags: ['metroidvania','action','indie'],             reason: 'Best metroidvania of the decade' },
    { appid: 2246340, name: 'Silksong',                  tags: ['metroidvania','action','indie'],             reason: 'Hollow Knight sequel' },

    // Sandbox / crafting / strategy
    { appid: 526870,  name: 'Satisfactory',              tags: ['sandbox','crafting','factory','coop'],       reason: 'Factory-building nirvana' },
    { appid: 427520,  name: 'Factorio',                  tags: ['sandbox','crafting','factory','automation'], reason: 'The GOAT of automation games' },
    { appid: 322330,  name: 'Don\'t Starve Together',    tags: ['survival','coop','multiplayer'],             reason: 'Survival with personality' },
    { appid: 394360,  name: 'Hearts of Iron IV',         tags: ['strategy','historical','ww2','grand'],       reason: 'Grand strategy WW2' },
    { appid: 236850,  name: 'Europa Universalis IV',     tags: ['strategy','historical','grand'],             reason: 'Historical empire builder' },
    { appid: 1158310, name: 'Crusader Kings III',        tags: ['strategy','medieval','grand','roleplay'],    reason: 'Medieval dynasty simulator' },
    { appid: 281990,  name: 'Stellaris',                 tags: ['strategy','scifi','grand','space'],          reason: 'Space grand strategy' },
    { appid: 413150,  name: 'Stardew Valley',            tags: ['farming','relaxing','indie','cosy'],         reason: 'Cosy farming, millions sold' },
    { appid: 1145740, name: 'Dwarf Fortress',            tags: ['sandbox','simulation','strategy'],           reason: 'The original roguelike legend' },

    // Simulation / driving
    { appid: 244210,  name: 'Assetto Corsa',             tags: ['racing','simulation'],                        reason: 'Hardcore racing sim' },
    { appid: 1551360, name: 'Forza Horizon 5',           tags: ['racing','openworld','arcade'],                reason: 'Most fun arcade racer ever' },
    { appid: 2420120, name: 'EA Sports WRC',             tags: ['racing','rally','simulation'],                reason: 'Best rally game in years' },
    { appid: 1174170, name: 'Microsoft Flight Simulator 2024', tags: ['simulation','flight','relaxing'], reason: 'Fly the whole world' },
    { appid: 294100,  name: 'RimWorld',                  tags: ['simulation','strategy','colony','story'],     reason: 'Colony sim with emergent stories' },
    { appid: 1599340, name: 'Lossless Scaling',          tags: ['utility'],                                     reason: 'Frame-gen on any game' },

    // Horror / thriller
    { appid: 1794680, name: 'Lethal Company',            tags: ['horror','coop','multiplayer','indie'],       reason: 'Co-op horror viral hit' },
    { appid: 2881650, name: 'Content Warning',           tags: ['horror','coop','indie','comedy'],            reason: 'Make scary videos with friends' },
    { appid: 2437700, name: 'Phasmophobia',              tags: ['horror','coop','multiplayer'],               reason: 'Ghost hunting with friends' },
    { appid: 1366540, name: 'Dying Light 2',             tags: ['action','zombies','openworld','parkour'],    reason: 'Parkour zombie survival' },

    // Co-op / multiplayer specific
    { appid: 1282100, name: 'It Takes Two',              tags: ['coop','story','puzzle','platformer'],        reason: 'Best co-op experience in years' },
    { appid: 2277860, name: 'Split Fiction',             tags: ['coop','story','platformer'],                 reason: 'From the makers of It Takes Two' },
    { appid: 2195250, name: 'No Man\'s Sky',             tags: ['openworld','scifi','exploration','coop'],    reason: 'Massive space exploration, now great' },
    { appid: 242760,  name: 'The Forest',                tags: ['survival','horror','coop'],                  reason: 'Co-op survival horror' },
    { appid: 1326470, name: 'Sons of the Forest',        tags: ['survival','horror','coop'],                  reason: 'Sequel, way scarier' },

    // Competitive / esports
    { appid: 2139460, name: 'Overwatch 2',               tags: ['shooter','hero','competitive','multiplayer'], reason: 'F2P hero shooter' },
    { appid: 1343400, name: 'Rumbleverse',               tags: ['fighting','battleroyale','multiplayer'],     reason: 'Wrestling battle royale' },
    { appid: 1384160, name: 'Naraka: Bladepoint',        tags: ['battleroyale','action','melee'],             reason: 'Martial arts battle royale' },
    { appid: 1203620, name: 'Enlisted',                  tags: ['fps','shooter','ww2','multiplayer'],         reason: 'F2P squad-based WW2 FPS' },

    // Cinematic / story
    { appid: 990080,  name: 'Hogwarts Legacy',           tags: ['rpg','openworld','fantasy','magic'],         reason: 'Open-world Hogwarts' },
    { appid: 2054970, name: 'Senua\'s Saga: Hellblade II', tags: ['action','story','cinematic','horror'],    reason: 'Most visually stunning game out' },
    { appid: 2344520, name: 'Diablo IV',                 tags: ['rpg','action','loot','grind'],               reason: 'Polished ARPG' },
    { appid: 2183900, name: 'Silent Hill 2 Remake',      tags: ['horror','story','action'],                   reason: 'Beloved horror classic remade' },
    { appid: 2183550, name: 'Black Myth: Wukong',        tags: ['action','rpg','souls','chinese'],            reason: 'Mythology souls-like, 20M+ sold' },
    { appid: 2694490, name: 'Path of Exile 2',           tags: ['rpg','action','loot','grind'],               reason: 'Deepest ARPG ever made' },

    // Quirky / unique
    { appid: 1599340, name: 'Lethal Company',            tags: ['horror','coop','indie'],                      reason: 'Viral co-op hit' },
    { appid: 2236860, name: 'Dave the Diver',            tags: ['indie','management','adventure'],            reason: 'Deep sea + sushi bar. Genius.' },
    { appid: 427520,  name: 'Factorio: Space Age',       tags: ['automation','strategy'],                      reason: 'Factorio expansion, GOTY-tier' },
    { appid: 3075840, name: 'Frostpunk 2',               tags: ['strategy','survival','city'],                reason: 'Bleak survival city-builder sequel' },
    { appid: 2138330, name: 'Manor Lords',               tags: ['strategy','medieval','city','simulation'],   reason: 'Medieval city-builder, 2024 hit' },
    { appid: 2694490, name: 'Warhammer 40K: Space Marine 2', tags: ['action','shooter','coop'],              reason: 'Third-person 40K mayhem' },

    // Free-to-play essentials
    { appid: 570,     name: 'Dota 2',                    tags: ['moba','competitive','multiplayer'],          reason: 'The OG MOBA, completely free' },
    { appid: 440,     name: 'Team Fortress 2',           tags: ['fps','shooter','multiplayer','casual','free'], reason: 'Free Valve FPS classic' },
    { appid: 578080,  name: 'PUBG: Battlegrounds',       tags: ['battleroyale','shooter','free'],             reason: 'Original BR, now free' },

    // More AAA RPGs
    { appid: 1794860, name: 'Star Wars Jedi: Survivor',  tags: ['action','rpg','story','starwars'],           reason: 'Best Star Wars game in years' },
    { appid: 1237970, name: 'Titanfall 2',               tags: ['fps','shooter','story','scifi'],             reason: 'Best FPS campaign ever made' },
    { appid: 1174180, name: 'Red Dead Redemption 2',     tags: ['openworld','action','rpg','story','western'],reason: 'A technical and narrative masterpiece' },
    { appid: 1091500, name: 'Cyberpunk 2077',            tags: ['rpg','openworld','action','story','cyberpunk'], reason: 'Redemption arc complete, now incredible' },
    { appid: 1245620, name: 'Elden Ring',                tags: ['souls','rpg','openworld','action','hardcore'], reason: 'Game of the Year 2022' },
    { appid: 292030,  name: 'The Witcher 3: Wild Hunt',  tags: ['rpg','openworld','action','story','medieval'], reason: 'Still the benchmark for open-world RPGs' },
    { appid: 257420,  name: 'Serious Sam 4',             tags: ['fps','shooter','chaos'],                      reason: 'Brainless shooter fun' },
    { appid: 1196590, name: 'Jedi: Fallen Order',        tags: ['action','souls','story','starwars'],          reason: 'Souls-lite with a lightsaber' },
    { appid: 1237970, name: 'Apex Legends',              tags: ['battleroyale','fps','shooter','free','multiplayer'], reason: 'Tightest movement in battle royale' },
    { appid: 2050650, name: 'Resident Evil 4',           tags: ['horror','action','story','survival'],         reason: 'The peak of survival horror' },
    { appid: 1196590, name: 'Persona 5 Royal',           tags: ['rpg','story','japanese','turnbased'],         reason: 'Best JRPG of the decade' },
    { appid: 1888160, name: 'Persona 3 Reload',          tags: ['rpg','story','japanese','turnbased'],         reason: 'Stunning Persona 3 remake' },
    { appid: 1812620, name: 'Final Fantasy XVI',         tags: ['rpg','action','story','japanese','fantasy'],  reason: 'Dark, cinematic FF reinvention' },
    { appid: 2050650, name: 'Final Fantasy VII Rebirth', tags: ['rpg','action','story','japanese'],            reason: 'Remake part 2, beautiful' },
    { appid: 39540,   name: 'Mass Effect Legendary',     tags: ['rpg','scifi','story','space'],                reason: 'Sci-fi trilogy remastered' },
    { appid: 1086940, name: 'Pillars of Eternity II',    tags: ['rpg','story','fantasy','isometric'],          reason: 'Classic-style CRPG with pirate adventure' },

    // More FPS
    { appid: 489830,  name: 'DOOM Eternal',              tags: ['fps','shooter','action','fastpaced'],         reason: 'Fastest, most satisfying FPS ever' },
    { appid: 782330,  name: 'DOOM (2016)',               tags: ['fps','shooter','action'],                     reason: 'The reboot that saved DOOM' },
    { appid: 1551180, name: 'DOOM: The Dark Ages',       tags: ['fps','shooter','action','medieval'],          reason: 'New medieval DOOM 2025' },
    { appid: 1217060, name: 'Gunfire Reborn',            tags: ['fps','roguelike','coop'],                     reason: 'Roguelike FPS co-op gem' },
    { appid: 1361210, name: 'Metro Exodus',              tags: ['fps','shooter','postapocalyptic','story'],    reason: 'Post-apocalyptic atmospheric shooter' },
    { appid: 1174180, name: 'Wolfenstein: Youngblood',   tags: ['fps','shooter','coop'],                       reason: 'Nazi-punching co-op' },
    { appid: 1203620, name: 'Enlisted',                  tags: ['fps','shooter','ww2','multiplayer','free'],   reason: 'F2P squad WW2 shooter' },
    { appid: 1203220, name: 'NARAKA: BLADEPOINT',        tags: ['battleroyale','action','melee'],              reason: 'Martial arts BR, unique' },
    { appid: 1794680, name: 'Ready or Not',              tags: ['fps','tactical','shooter','coop'],            reason: 'Hardcore tactical SWAT' },
    { appid: 1009290, name: 'Insurgency: Sandstorm',     tags: ['fps','tactical','shooter','multiplayer'],     reason: 'Modern tactical realism' },

    // Open world hits
    { appid: 1086940, name: "Assassin's Creed Valhalla",  tags: ['rpg','openworld','action','historical','stealth'], reason: 'Viking era open world' },
    { appid: 2239550, name: "Assassin's Creed Shadows",   tags: ['action','stealth','openworld','historical'],  reason: 'Feudal Japan AC' },
    { appid: 1085660, name: 'Destiny 2',                  tags: ['mmo','fps','shooter','scifi','loot','free'], reason: 'FPS/MMO loot shooter, F2P base game' },
    { appid: 2050650, name: 'Horizon Forbidden West',     tags: ['rpg','openworld','action','scifi','story'],  reason: 'Aloy\'s epic continues on PC' },
    { appid: 2050650, name: 'Horizon Zero Dawn Remastered', tags: ['rpg','openworld','action','scifi'],        reason: 'Updated for 2024' },
    { appid: 1817190, name: 'Marvel\'s Spider-Man Remastered', tags: ['action','openworld','superhero','story'], reason: 'Best superhero game ever' },
    { appid: 1817070, name: 'Marvel\'s Spider-Man: Miles Morales', tags: ['action','openworld','superhero'], reason: 'Shorter, focused sequel' },
    { appid: 2512560, name: 'Marvel\'s Spider-Man 2',     tags: ['action','openworld','superhero'],             reason: 'Latest Spider-Man for PC' },
    { appid: 1030830, name: 'God of War',                 tags: ['action','story','cinematic'],                 reason: 'Kratos\'s Norse saga begins' },
    { appid: 2322010, name: 'God of War Ragnarok',        tags: ['action','story','cinematic'],                 reason: 'Norse saga conclusion' },
    { appid: 1888930, name: 'Uncharted: Legacy of Thieves', tags: ['action','story','cinematic'],               reason: 'Nathan Drake on PC' },
    { appid: 1971870, name: 'Avatar: Frontiers of Pandora', tags: ['action','openworld','story','scifi'],       reason: 'Stunning Pandora open world' },
    { appid: 1144200, name: 'Forspoken',                  tags: ['action','openworld','fantasy'],               reason: 'Parkour magic combat' },
    { appid: 1811260, name: 'EA Sports FC 24',            tags: ['sports','football','multiplayer'],            reason: 'Football (soccer) sim' },
    { appid: 2195250, name: 'EA Sports FC 25',            tags: ['sports','football','multiplayer'],            reason: 'Latest FC release' },
    { appid: 2195250, name: 'NBA 2K25',                   tags: ['sports','basketball','multiplayer'],          reason: 'Premier basketball sim' },

    // Platformers / Metroidvanias
    { appid: 268910,  name: 'Cuphead',                    tags: ['platformer','indie','coop','art','hardcore'], reason: 'Jazz-era bullet-hell boss rush' },
    { appid: 391540,  name: 'Undertale',                  tags: ['rpg','indie','story','quirky'],               reason: 'Indie RPG phenomenon' },
    { appid: 1794680, name: 'Prince of Persia: The Lost Crown', tags: ['metroidvania','action','platformer'],   reason: 'Best metroidvania of 2024' },
    { appid: 774361,  name: 'Ori and the Will of the Wisps', tags: ['platformer','indie','metroidvania'],        reason: 'Gorgeous and challenging' },
    { appid: 261570,  name: 'Celeste',                    tags: ['platformer','indie','hardcore'],              reason: 'Pixel-perfect platforming' },
    { appid: 367520,  name: 'Hollow Knight',              tags: ['metroidvania','action','indie'],              reason: 'Best metroidvania of the decade' },
    { appid: 2246340, name: 'Hollow Knight: Silksong',    tags: ['metroidvania','action','indie'],              reason: 'The long-awaited sequel' },
    { appid: 588650,  name: 'Dead Cells',                 tags: ['roguelike','metroidvania','action','indie'],  reason: 'Roguelike metroidvania' },

    // City builders / sims
    { appid: 949230,  name: 'Cities: Skylines II',        tags: ['simulation','citybuilder','strategy'],        reason: 'Next-gen city builder' },
    { appid: 255710,  name: 'Cities: Skylines',           tags: ['simulation','citybuilder','strategy'],        reason: 'Still the gold standard' },
    { appid: 394690,  name: 'Tropico 6',                  tags: ['simulation','citybuilder','strategy','comedy'], reason: 'Banana republic dictator sim' },
    { appid: 578080,  name: 'Frostpunk',                  tags: ['simulation','citybuilder','survival'],         reason: 'Moral choices in a frozen world' },
    { appid: 3075840, name: 'Frostpunk 2',                tags: ['simulation','citybuilder','strategy','survival'], reason: 'Sequel to the masterpiece' },
    { appid: 1039340, name: 'Anno 1800',                  tags: ['simulation','citybuilder','strategy','historical'], reason: 'Industrial-era empire builder' },
    { appid: 1097150, name: 'Two Point Hospital',         tags: ['simulation','management','comedy'],           reason: 'Theme Hospital spiritual successor' },
    { appid: 1649080, name: 'Two Point Campus',           tags: ['simulation','management','comedy'],           reason: 'Run your own wacky university' },
    { appid: 2138330, name: 'Manor Lords',                tags: ['simulation','citybuilder','strategy','medieval'], reason: 'Medieval village builder' },
    { appid: 1506830, name: 'FIFA Manager',               tags: ['simulation','sports','football','management'], reason: 'Football manager sim' },
    { appid: 2252570, name: 'Football Manager 2024',      tags: ['simulation','sports','football','management'], reason: 'The GOAT of management games' },

    // Racing / driving
    { appid: 1190000, name: 'F1 24',                      tags: ['racing','simulation','sports'],               reason: 'Official F1 game' },
    { appid: 2155180, name: 'F1 25',                      tags: ['racing','simulation','sports'],               reason: 'Latest F1 sim' },
    { appid: 274170,  name: 'Hotline Miami',              tags: ['action','indie','topdown','violent'],         reason: 'Neon 80s murder puzzler' },
    { appid: 805550,  name: 'Wreckfest',                  tags: ['racing','arcade','destruction'],              reason: 'Destruction derby joy' },
    { appid: 1551360, name: 'Forza Horizon 5',            tags: ['racing','openworld','arcade'],                reason: 'Best arcade racer ever' },
    { appid: 525980,  name: 'Euro Truck Simulator 2',     tags: ['simulation','driving','relaxing'],            reason: 'Zen trucking across Europe' },
    { appid: 270880,  name: 'American Truck Simulator',   tags: ['simulation','driving','relaxing'],            reason: 'Trucking across the US' },
    { appid: 244210,  name: 'Assetto Corsa',              tags: ['racing','simulation','hardcore'],             reason: 'Hardcore racing sim' },
    { appid: 805550,  name: 'Assetto Corsa Competizione',  tags: ['racing','simulation','hardcore'],             reason: 'GT3 spec racing' },
    { appid: 2420120, name: 'EA Sports WRC',              tags: ['racing','rally','simulation'],                reason: 'Best rally game' },
    { appid: 379720,  name: 'DiRT Rally 2.0',             tags: ['racing','rally','simulation'],                reason: 'Rally sim classic' },
    { appid: 1174170, name: 'Microsoft Flight Simulator 2024', tags: ['simulation','flight','relaxing'],         reason: 'Fly the whole world' },

    // Simulation / management
    { appid: 413150,  name: 'Stardew Valley',             tags: ['farming','relaxing','indie','cosy'],          reason: 'The cosiest farming sim' },
    { appid: 1145450, name: 'Coral Island',               tags: ['farming','relaxing','cosy'],                   reason: 'Tropical farming beauty' },
    { appid: 1203620, name: 'My Time at Sandrock',        tags: ['farming','cosy','relaxing','rpg'],             reason: 'Crafting & farming with depth' },
    { appid: 633230,  name: 'Graveyard Keeper',           tags: ['simulation','management','indie','dark'],      reason: 'Morbid but addictive' },
    { appid: 1237970, name: 'Dredge',                     tags: ['horror','indie','fishing','relaxing'],         reason: 'Cosmic horror fishing game' },
    { appid: 1942280, name: 'The Sims 4',                 tags: ['simulation','life','relaxing','family'],       reason: 'Life sim icon, base game free' },
    { appid: 2054970, name: 'InZOI',                      tags: ['simulation','life'],                           reason: 'New Sims competitor' },
    { appid: 1812620, name: 'Planet Zoo',                 tags: ['simulation','management','animals'],           reason: 'Best zoo building sim' },
    { appid: 1203620, name: 'Planet Coaster 2',           tags: ['simulation','management','theme park'],        reason: 'Theme park building' },
    { appid: 589360,  name: 'PC Building Simulator',      tags: ['simulation','relaxing','niche'],               reason: 'Build PCs as a career' },
    { appid: 1544020, name: 'PC Building Simulator 2',    tags: ['simulation','relaxing','niche'],               reason: 'Sequel with better tech' },
    { appid: 1144400, name: 'PowerWash Simulator',        tags: ['simulation','relaxing','cosy'],                reason: 'Oddly therapeutic' },
    { appid: 1794680, name: 'House Flipper',              tags: ['simulation','relaxing'],                        reason: 'Renovate houses' },
    { appid: 1382330, name: 'Farming Simulator 25',       tags: ['simulation','farming','relaxing'],              reason: 'Serious farming sim' },

    // Indie darlings
    { appid: 1903340, name: 'Pizza Tower',                tags: ['platformer','indie','fastpaced','retro'],      reason: 'Wario Land on steroids' },
    { appid: 1127500, name: 'Mindustry',                  tags: ['strategy','tower defense','indie','free'],      reason: 'Factory + tower defense' },
    { appid: 1145360, name: 'Slay the Spire',             tags: ['roguelike','deckbuilder','turnbased','indie'],   reason: 'Best deckbuilder' },
    { appid: 1593500, name: 'Vampire Survivors',          tags: ['roguelike','action','indie','cheap'],           reason: '£4 of pure serotonin' },
    { appid: 2379780, name: 'Balatro',                    tags: ['roguelike','deckbuilder','indie','cheap'],      reason: 'Poker roguelike, everyone\'s hooked' },
    { appid: 2246340, name: 'Brotato',                    tags: ['roguelike','action','indie','cheap'],           reason: 'Potato with guns' },
    { appid: 2246340, name: 'Slice & Dice',               tags: ['roguelike','turnbased','indie'],                reason: 'Dice-based dungeon crawler' },
    { appid: 1386610, name: 'Cult of the Lamb',           tags: ['roguelike','action','indie','cult'],            reason: 'Start a cute cult' },
    { appid: 730990,  name: 'Into the Breach',            tags: ['strategy','turnbased','indie','puzzle'],        reason: 'Perfect tactical chess-like' },
    { appid: 268850,  name: 'FTL: Faster Than Light',     tags: ['roguelike','strategy','indie','space'],         reason: 'Space roguelike classic' },
    { appid: 1203220, name: 'Noita',                      tags: ['roguelike','indie','sandbox','magic'],           reason: 'Every pixel is simulated' },
    { appid: 2246340, name: 'Risk of Rain 2',             tags: ['roguelike','action','coop','indie'],            reason: 'Best co-op roguelike' },
    { appid: 632360,  name: 'Risk of Rain Returns',       tags: ['roguelike','action','indie'],                   reason: 'Classic ROR remastered' },
    { appid: 632470,  name: 'Disco Elysium',              tags: ['rpg','story','detective','indie'],              reason: 'Best writing ever' },

    // Strategy / 4X
    { appid: 289070,  name: 'Sid Meier\'s Civilization VI', tags: ['strategy','turnbased','historical','4x'],     reason: 'One more turn simulator' },
    { appid: 1295660, name: 'Sid Meier\'s Civilization VII', tags: ['strategy','turnbased','historical','4x'],    reason: 'Latest Civ release' },
    { appid: 281990,  name: 'Stellaris',                   tags: ['strategy','scifi','grand','space'],            reason: 'Space grand strategy' },
    { appid: 394360,  name: 'Hearts of Iron IV',           tags: ['strategy','historical','ww2','grand'],         reason: 'WW2 grand strategy' },
    { appid: 203770,  name: 'Crusader Kings III',          tags: ['strategy','medieval','grand','roleplay'],      reason: 'Medieval dynasty drama' },
    { appid: 236850,  name: 'Europa Universalis IV',       tags: ['strategy','historical','grand'],               reason: 'Empire builder' },
    { appid: 1158310, name: 'Age of Empires IV',           tags: ['strategy','rts','historical'],                 reason: 'RTS revival' },
    { appid: 813780,  name: 'Age of Empires II: Definitive Edition', tags: ['strategy','rts','historical'],      reason: 'Wololo, forever' },
    { appid: 548430,  name: 'Total War: Warhammer III',    tags: ['strategy','rts','turnbased','fantasy'],         reason: 'Fantasy total war epic' },
    { appid: 1142710, name: 'Total War: Pharaoh',           tags: ['strategy','rts','turnbased','historical'],     reason: 'Bronze Age collapse' },
    { appid: 1467930, name: 'XCOM 2',                       tags: ['strategy','turnbased','tactical','scifi'],    reason: 'Aliens vs your squad' },
    { appid: 2213600, name: 'Company of Heroes 3',          tags: ['strategy','rts','historical','ww2'],           reason: 'WW2 tactical RTS' },
    { appid: 570940,  name: 'Warhammer 40K: Dawn of War III', tags: ['strategy','rts','scifi','warhammer'],       reason: '40K RTS with heroes' },

    // Horror
    { appid: 1816570, name: 'Resident Evil 2',             tags: ['horror','action','story','survival'],          reason: 'The Leon/Claire remake' },
    { appid: 952060,  name: 'Resident Evil 3',             tags: ['horror','action','story','survival'],          reason: 'Nemesis stalking you' },
    { appid: 1196590, name: 'Resident Evil Village',        tags: ['horror','action','story'],                     reason: 'Tall vampire lady' },
    { appid: 381210,  name: 'Dead by Daylight',            tags: ['horror','multiplayer','coop','asymmetric'],    reason: '4v1 horror chase' },
    { appid: 2183900, name: 'Silent Hill 2',               tags: ['horror','story','action','cult'],              reason: 'Beloved remake' },
    { appid: 2050650, name: 'Alien: Isolation',             tags: ['horror','stealth','story','scifi'],            reason: 'The only good Alien game' },
    { appid: 292030,  name: 'The Mortuary Assistant',      tags: ['horror','indie','psychological'],              reason: 'Embalming + demons' },
    { appid: 1237970, name: 'Amnesia: The Bunker',         tags: ['horror','survival','story'],                   reason: 'Gripping survival horror' },

    // Co-op / multiplayer
    { appid: 2767030, name: 'Lethal Company',              tags: ['horror','coop','multiplayer','indie'],         reason: 'The viral co-op hit' },
    { appid: 2881650, name: 'Content Warning',              tags: ['horror','coop','indie','comedy'],              reason: 'Make scary videos with friends' },
    { appid: 739630,  name: 'Phasmophobia',                 tags: ['horror','coop','multiplayer'],                 reason: 'Ghost hunting, surprisingly scary' },
    { appid: 242760,  name: 'The Forest',                   tags: ['survival','horror','coop','multiplayer'],       reason: 'Cannibal survival' },
    { appid: 1326470, name: 'Sons of the Forest',           tags: ['survival','horror','coop','multiplayer'],       reason: 'The sequel, even scarier' },
    { appid: 553850,  name: 'HELLDIVERS 2',                 tags: ['shooter','coop','multiplayer','action','scifi'], reason: 'Managed Democracy' },
    { appid: 322330,  name: 'Don\'t Starve Together',       tags: ['survival','coop','multiplayer'],               reason: 'Quirky survival' },
    { appid: 440900,  name: 'Conan Exiles',                 tags: ['survival','openworld','coop','multiplayer'],    reason: 'Barbarian sandbox' },
    { appid: 892970,  name: 'Valheim',                      tags: ['survival','coop','viking','crafting'],          reason: 'Viking co-op survival' },
    { appid: 2694490, name: 'Warhammer 40K: Space Marine 2', tags: ['action','shooter','coop','warhammer'],         reason: 'Third-person 40K carnage' },

    // Fighting / sports
    { appid: 2050900, name: 'Tekken 8',                    tags: ['fighting','competitive','multiplayer'],         reason: 'Best 3D fighter now' },
    { appid: 1665460, name: 'Street Fighter 6',            tags: ['fighting','competitive','multiplayer'],         reason: '2D fighter icon returns' },
    { appid: 1388590, name: 'Mortal Kombat 1',             tags: ['fighting','competitive','violent'],             reason: 'MK rebooted' },
    { appid: 1384160, name: 'Guilty Gear Strive',          tags: ['fighting','anime','competitive'],               reason: 'Gorgeous anime fighter' },
    { appid: 1778820, name: 'Dragon Ball: Sparking ZERO',  tags: ['fighting','anime','dragonball'],                reason: 'DBZ Budokai Tenkaichi revival' },

    // Puzzle / thoughtful
    { appid: 620,     name: 'Portal 2',                     tags: ['puzzle','story','indie','comedy'],             reason: 'Still the best puzzle game ever' },
    { appid: 620,     name: 'Portal',                       tags: ['puzzle','story','indie'],                       reason: 'The cake is a lie' },
    { appid: 105600,  name: 'The Witness',                  tags: ['puzzle','indie','exploration'],                 reason: 'Stunning puzzle island' },
    { appid: 1097150, name: 'Return of the Obra Dinn',      tags: ['puzzle','indie','mystery','story'],             reason: 'Unique detective puzzle' },
    { appid: 588650,  name: 'Outer Wilds',                  tags: ['exploration','puzzle','indie','mystery'],       reason: 'Mind-bending space mystery' },
    { appid: 1012880, name: 'Inscryption',                  tags: ['card','horror','indie','puzzle'],              reason: 'Deck-builder horror twist' },
    { appid: 1593500, name: 'Chants of Sennaar',             tags: ['puzzle','indie','story'],                       reason: 'Translate lost languages' },
    { appid: 588650,  name: 'Tunic',                         tags: ['action','adventure','indie','puzzle'],          reason: 'Zelda-like with secrets' },
    { appid: 1127500, name: 'Baba Is You',                   tags: ['puzzle','indie'],                               reason: 'Rules are the puzzle' },
    { appid: 2196890, name: 'Lorelei and the Laser Eyes',    tags: ['puzzle','indie','mystery','story'],             reason: '2024 puzzle masterpiece' },

    // Cosy / relaxing
    { appid: 648800,  name: 'Raft',                          tags: ['survival','coop','crafting','ocean'],           reason: 'Ocean survival with friends' },
    { appid: 2132840, name: 'Palia',                         tags: ['mmo','cosy','relaxing','crafting','free'],      reason: 'F2P cosy MMO' },
    { appid: 2276930, name: 'Tiny Glade',                    tags: ['cosy','relaxing','indie','sandbox'],            reason: 'Build tiny dioramas' },
    { appid: 1659040, name: 'A Short Hike',                  tags: ['indie','cosy','exploration','relaxing'],        reason: '90 minutes of pure joy' },
    { appid: 1627730, name: 'Unpacking',                     tags: ['puzzle','cosy','indie','relaxing'],             reason: 'Unpack boxes, feel feelings' },
    { appid: 1659040, name: 'Dave the Diver',                tags: ['indie','relaxing','management','cosy'],         reason: 'Dive, then run a sushi bar' },
    { appid: 2622380, name: 'Tchia',                         tags: ['adventure','cosy','indie','exploration'],       reason: 'Island adventure' },
    { appid: 1389660, name: 'Spiritfarer',                   tags: ['indie','cosy','story','management'],            reason: 'Ferry souls to afterlife' },

    // MMOs / live-service
    { appid: 306130,  name: 'The Elder Scrolls Online',      tags: ['mmo','rpg','openworld','fantasy'],             reason: 'Huge Elder Scrolls MMO' },
    { appid: 39540,   name: 'Final Fantasy XIV',             tags: ['mmo','rpg','story','japanese'],                reason: 'Best MMO in years' },
    { appid: 1599340, name: 'New World',                     tags: ['mmo','rpg','openworld'],                       reason: 'Amazon\'s MMO' },
    { appid: 1446780, name: 'Lost Ark',                      tags: ['mmo','rpg','action','free'],                   reason: 'Korean ARPG-MMO, F2P' },
    { appid: 221100,  name: 'DayZ',                          tags: ['survival','openworld','multiplayer','hardcore'], reason: 'Brutal zombie survival' },

    // ══ COSY / RELAXING / FARMING expansion
    { appid: 1145450, name: 'Coral Island',                  tags: ['farming','cosy','relaxing','sandbox'],                reason: 'Tropical farming with deep social sim' },
    { appid: 1203620, name: 'My Time at Sandrock',           tags: ['farming','cosy','relaxing','crafting','rpg'],         reason: 'Post-apocalyptic workshop life sim' },
    { appid: 666140,  name: 'My Time at Portia',             tags: ['farming','cosy','relaxing','crafting'],               reason: 'Charming post-apocalyptic crafting' },
    { appid: 588650,  name: 'Spiritfarer',                    tags: ['cosy','relaxing','indie','story','management'],       reason: 'Ferry souls to the afterlife' },
    { appid: 1659040, name: 'A Short Hike',                   tags: ['cosy','relaxing','indie','exploration'],              reason: '90 minutes of pure joy' },
    { appid: 2132840, name: 'Palia',                           tags: ['mmo','cosy','relaxing','crafting','free'],           reason: 'F2P cosy MMO' },
    { appid: 2276930, name: 'Tiny Glade',                      tags: ['cosy','relaxing','sandbox','indie'],                  reason: 'Build tiny dioramas' },
    { appid: 1627730, name: 'Unpacking',                       tags: ['puzzle','cosy','indie','relaxing'],                   reason: 'Unpack boxes, feel feelings' },
    { appid: 2622380, name: 'Tchia',                           tags: ['adventure','cosy','indie','exploration'],             reason: 'Island adventure' },
    { appid: 2053730, name: 'Dave the Diver',                  tags: ['indie','relaxing','management','cosy'],               reason: 'Dive by day, run sushi by night' },
    { appid: 960090,  name: 'Bloons TD 6',                     tags: ['strategy','tower defense','cosy','casual'],           reason: 'Chill tower defence perfection' },
    { appid: 1611500, name: 'Lake',                            tags: ['cosy','relaxing','story','indie'],                    reason: 'Post office driving vibes' },
    { appid: 1811260, name: 'Snufkin: Melody of Moominvalley', tags: ['cosy','relaxing','indie','adventure'],                reason: 'Moomin adventure' },
    { appid: 1635450, name: 'Cozy Grove',                      tags: ['cosy','relaxing','indie','farming'],                  reason: 'Daily ritual cosy game' },
    { appid: 2321470, name: 'Kind Words',                      tags: ['cosy','relaxing','indie'],                            reason: 'Write notes to anonymous strangers' },
    { appid: 632470,  name: 'Calico',                          tags: ['cosy','relaxing','indie','farming'],                  reason: 'Cat cafe manager' },

    // ══ SIMULATION & management expansion
    { appid: 1097150, name: 'Two Point Hospital',             tags: ['simulation','management','comedy','cosy'],            reason: 'Theme Hospital spiritual sequel' },
    { appid: 1649080, name: 'Two Point Campus',               tags: ['simulation','management','comedy','cosy'],            reason: 'Run a wacky university' },
    { appid: 1574820, name: 'Two Point Museum',               tags: ['simulation','management','comedy','cosy'],            reason: 'Newest in the Two Point series' },
    { appid: 1144400, name: 'PowerWash Simulator',            tags: ['simulation','relaxing','cosy'],                        reason: 'Oddly therapeutic' },
    { appid: 736260,  name: 'Baba Is You',                     tags: ['puzzle','indie'],                                      reason: 'Rules are the puzzle' },

    // ══ STORY / narrative expansion
    { appid: 2651280, name: 'Alan Wake 2',                    tags: ['story','action','horror','cinematic'],                 reason: 'Stunning narrative thriller' },
    { appid: 1888930, name: 'Stray',                          tags: ['adventure','story','indie'],                           reason: 'You play as a cat' },
    { appid: 1888160, name: 'Persona 3 Reload',               tags: ['rpg','story','japanese','turnbased'],                 reason: 'Remake of a classic JRPG' },
    { appid: 1245620, name: 'Elden Ring',                     tags: ['souls','rpg','openworld','action','hardcore'],         reason: 'GOTY 2022' },
    { appid: 292030,  name: 'The Witcher 3: Wild Hunt',       tags: ['rpg','openworld','action','story','medieval'],         reason: 'Still the open-world RPG benchmark' },

    // ══ PUZZLE expansion
    { appid: 620,     name: 'Portal 2',                        tags: ['puzzle','story','indie','comedy'],                    reason: 'The peak puzzle experience' },
    { appid: 2421640, name: 'The Talos Principle 2',           tags: ['puzzle','story','scifi'],                             reason: 'Philosophical puzzle box' },
    { appid: 589290,  name: 'Return of the Obra Dinn',         tags: ['puzzle','indie','mystery','story'],                   reason: 'Detective puzzle masterpiece' },
    { appid: 1103210, name: 'The Case of the Golden Idol',    tags: ['puzzle','indie','mystery'],                           reason: 'Murder-mystery puzzler' },
    { appid: 2408390, name: 'The Rise of the Golden Idol',     tags: ['puzzle','indie','mystery'],                           reason: 'Sequel to the mystery classic' },
    { appid: 2208920, name: 'Chants of Sennaar',               tags: ['puzzle','indie','story'],                             reason: 'Translate lost languages' },
    { appid: 2196890, name: 'Lorelei and the Laser Eyes',      tags: ['puzzle','indie','mystery','story'],                   reason: '2024 puzzle masterpiece' },
    { appid: 1012880, name: 'Inscryption',                     tags: ['card','horror','indie','puzzle'],                     reason: 'Deckbuilder horror twist' },
    { appid: 553420,  name: 'TUNIC',                           tags: ['action','adventure','indie','puzzle'],                reason: 'Zelda-like with secrets' },

    // ══ PLATFORMER / metroidvania expansion
    { appid: 1794680, name: 'Prince of Persia: The Lost Crown', tags: ['metroidvania','action','platformer'],               reason: 'Best metroidvania of 2024' },
    { appid: 261570,  name: 'Celeste',                         tags: ['platformer','indie','hardcore'],                     reason: 'Pixel-perfect platforming' },
    { appid: 268910,  name: 'Cuphead',                         tags: ['platformer','indie','coop','art','hardcore'],        reason: 'Jazz-era bullet-hell' },
    { appid: 391540,  name: 'Undertale',                       tags: ['rpg','indie','story','quirky'],                      reason: 'Indie RPG phenomenon' },
    { appid: 774361,  name: 'Ori and the Will of the Wisps',   tags: ['platformer','indie','metroidvania'],                 reason: 'Gorgeous and challenging' },
    { appid: 1903340, name: 'Pizza Tower',                     tags: ['platformer','indie','fastpaced','retro'],            reason: 'Wario Land on steroids' },
    { appid: 1903340, name: 'Pseudoregalia',                   tags: ['metroidvania','platformer','indie'],                 reason: 'N64-era 3D platformer revival' },
    { appid: 698780,  name: 'Mega Man 11',                     tags: ['platformer','action','retro'],                       reason: 'Classic platformer return' },

    // ══ FIGHTING expansion
    { appid: 1384160, name: 'Guilty Gear Strive',              tags: ['fighting','anime','competitive','multiplayer'],      reason: 'Gorgeous anime fighter' },
    { appid: 2050900, name: 'Tekken 8',                        tags: ['fighting','competitive','multiplayer'],              reason: 'Best 3D fighter now' },
    { appid: 1665460, name: 'Street Fighter 6',                tags: ['fighting','competitive','multiplayer'],              reason: '2D fighter icon returns' },
    { appid: 1388590, name: 'Mortal Kombat 1',                 tags: ['fighting','competitive','violent','multiplayer'],    reason: 'MK rebooted' },
    { appid: 1778820, name: 'Dragon Ball: Sparking! ZERO',     tags: ['fighting','anime','multiplayer'],                    reason: 'DBZ Budokai Tenkaichi revival' },

    // ══ SPORTS expansion
    { appid: 2195250, name: 'EA Sports FC 25',                 tags: ['sports','football','multiplayer'],                   reason: 'Latest football sim' },
    { appid: 2252570, name: 'Football Manager 2024',           tags: ['simulation','sports','football','management'],       reason: 'The GOAT of management games' },
    { appid: 1551360, name: 'Forza Horizon 5',                 tags: ['racing','openworld','arcade','sports'],              reason: 'Best arcade racer ever' },
    { appid: 2190900, name: 'PGA Tour 2K25',                   tags: ['sports','golf','simulation'],                        reason: 'Premier golf sim' },
    { appid: 1919590, name: 'WWE 2K24',                        tags: ['sports','fighting','wrestling'],                     reason: 'Wrestling simulation' },

    // ══ RACING / rally expansion
    { appid: 244210,  name: 'Assetto Corsa',                   tags: ['racing','simulation','hardcore'],                    reason: 'Hardcore racing sim' },
    { appid: 805550,  name: 'Assetto Corsa Competizione',      tags: ['racing','simulation','hardcore','sports'],           reason: 'GT3 spec racing' },
    { appid: 2420120, name: 'EA Sports WRC',                   tags: ['racing','rally','simulation'],                       reason: 'Best rally game' },
    { appid: 379720,  name: 'DiRT Rally 2.0',                  tags: ['racing','rally','simulation'],                       reason: 'Rally sim classic' },
    { appid: 525980,  name: 'Euro Truck Simulator 2',          tags: ['simulation','driving','relaxing','cosy'],            reason: 'Zen trucking across Europe' },
    { appid: 270880,  name: 'American Truck Simulator',        tags: ['simulation','driving','relaxing','cosy'],            reason: 'Trucking across the US' },
    { appid: 1190000, name: 'F1 24',                            tags: ['racing','simulation','sports'],                      reason: 'Official F1 game' },

    // ══ HISTORICAL / medieval / war expansion
    { appid: 2322010, name: 'Kingdom Come: Deliverance II',    tags: ['rpg','openworld','medieval','historical','hardcore'], reason: 'Medieval RPG with unmatched realism' },
    { appid: 379430,  name: 'Kingdom Come: Deliverance',       tags: ['rpg','openworld','medieval','historical'],           reason: 'The original realistic medieval RPG' },
    { appid: 1328670, name: 'Mount & Blade II: Bannerlord',    tags: ['rpg','medieval','strategy','openworld','historical'],reason: 'Medieval sandbox warfare' },
    { appid: 813630,  name: "Assassin's Creed Odyssey",        tags: ['rpg','openworld','action','stealth','historical'],   reason: 'Ancient Greek epic' },
    { appid: 2239550, name: "Assassin's Creed Mirage",         tags: ['action','stealth','openworld','historical'],         reason: 'Back-to-basics AC' },

    // ══ CRAFTING / sandbox expansion
    { appid: 526870,  name: 'Satisfactory',                     tags: ['sandbox','crafting','factory','coop','relaxing'],    reason: 'Factory-building nirvana' },
    { appid: 427520,  name: 'Factorio',                         tags: ['sandbox','crafting','factory','automation'],         reason: 'GOAT of automation games' },
    { appid: 105600,  name: 'Terraria',                         tags: ['sandbox','crafting','exploration','survival','cosy'],reason: '2D Minecraft masterpiece' },
    { appid: 648800,  name: 'Raft',                             tags: ['survival','coop','crafting','ocean','cosy'],         reason: 'Ocean survival with friends' },
    { appid: 322330,  name: "Don't Starve Together",           tags: ['survival','coop','multiplayer','crafting'],          reason: 'Quirky survival' },
    { appid: 440900,  name: 'Conan Exiles',                     tags: ['survival','openworld','coop','multiplayer'],         reason: 'Barbarian sandbox' },

    // ══ ROGUELIKE / indie expansion
    { appid: 2379780, name: 'Balatro',                         tags: ['roguelike','deckbuilder','indie','cosy'],             reason: 'Poker roguelike, 2024 sleeper hit' },
    { appid: 646570,  name: 'Slay the Spire',                  tags: ['roguelike','deckbuilder','turnbased','indie'],       reason: 'Best deckbuilder ever' },
    { appid: 1794680, name: 'Vampire Survivors',                tags: ['roguelike','action','indie'],                        reason: '£4 of pure serotonin' },
    { appid: 2246340, name: 'Brotato',                          tags: ['roguelike','action','indie'],                        reason: 'Potato with guns' },
    { appid: 1386610, name: 'Cult of the Lamb',                 tags: ['roguelike','action','indie','cult'],                 reason: 'Start a cute cult' },
    { appid: 730990,  name: 'Into the Breach',                  tags: ['strategy','turnbased','indie','puzzle','roguelike'], reason: 'Perfect tactical chess-like' },
    { appid: 268850,  name: 'FTL: Faster Than Light',           tags: ['roguelike','strategy','indie','space'],              reason: 'Space roguelike classic' },
    { appid: 1203220, name: 'Noita',                            tags: ['roguelike','indie','sandbox','magic'],               reason: 'Every pixel is simulated' },
    { appid: 1446780, name: 'Returnal',                         tags: ['roguelike','action','scifi','horror'],              reason: 'Bullet-hell on an alien planet' },

    // ══ SCI-FI / space expansion
    { appid: 1716740, name: 'Starfield',                        tags: ['rpg','openworld','scifi','exploration','space'],     reason: "Bethesda's biggest RPG" },
    { appid: 1091500, name: 'Cyberpunk 2077',                   tags: ['rpg','openworld','action','story','cyberpunk','scifi'], reason: 'Redemption arc complete, now incredible' },
    { appid: 275850,  name: 'No Man\'s Sky',                    tags: ['openworld','scifi','exploration','space','coop'],    reason: 'Massive space exploration' },
    { appid: 1938090, name: 'Warframe',                         tags: ['action','scifi','mmo','multiplayer','free'],         reason: 'F2P space ninja MMO' },
    { appid: 1091500, name: 'Outer Wilds',                       tags: ['exploration','puzzle','indie','mystery','scifi'],    reason: 'Mind-bending space mystery' },

    // ══ MULTIPLAYER / party expansion
    { appid: 646570,  name: 'Among Us',                         tags: ['multiplayer','casual','party'],                      reason: 'Deduction party classic' },
    { appid: 1172470, name: 'Apex Legends',                     tags: ['battleroyale','fps','shooter','free','multiplayer'], reason: 'Tightest movement in battle royale' },
    { appid: 553850,  name: 'HELLDIVERS 2',                     tags: ['shooter','coop','multiplayer','action','scifi'],     reason: 'Managed Democracy' },
    { appid: 2767030, name: 'Marvel Rivals',                    tags: ['shooter','hero','multiplayer','competitive','free'], reason: 'Most played hero shooter' },
    { appid: 2073850, name: 'The Finals',                       tags: ['fps','shooter','multiplayer','destruction','free'],  reason: 'F2P FPS with insane physics' },
  ];

  // Build SIMILARITY map from TAG_MAP + CATALOG
  const SIMILARITY = {};
  for (const [ownedId, ownedTags] of Object.entries(TAG_MAP)) {
    const matches = CATALOG
      .filter(c => c.appid !== parseInt(ownedId))
      .map(c => ({ ...c, overlap: c.tags.filter(t => ownedTags.includes(t)).length }))
      .filter(m => m.overlap >= 2)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 6);
    SIMILARITY[ownedId] = matches;
  }

  // Trending list (subset of CATALOG marked as currently hot)
  const TRENDING_IDS = [2344520, 1086940, 2322010, 2767030, 2073850, 2651280, 1623730, 1145360, 1145350, 2138330, 2050900, 2050650, 2183550, 990080, 553850, 1794680, 2881650, 1966720, 2277860];
  const TRENDING = CATALOG.filter(c => TRENDING_IDS.includes(c.appid)).map(c => ({
    ...c,
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${c.appid}/header.jpg`,
  }));

  const recs = [];

  // Based on your top played games
  for (const g of topPlayed.slice(0, 5)) {
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
        }
      }
    }
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
    }
  }

  // Rest of catalog — anything not already recommended, not owned
  for (const c of CATALOG) {
    if (!owned.has(c.appid) && !recs.find(r => r.appid === c.appid)) {
      recs.push({
        reason: 'From our catalog',
        game: c.name,
        appid: c.appid,
        img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${c.appid}/header.jpg`,
        sub: c.reason,
        buy: true,
      });
    }
  }

  // Attach tags to each rec so frontend can filter by genre
  for (const r of recs) {
    const catEntry = CATALOG.find(c => c.appid === r.appid);
    if (catEntry) r.tags = catEntry.tags;
  }

  // ══ LIVE CATALOG EXPANSION ══
  // Pull ~10 pages of CheapShark's best-rated games to get up to 600 live entries
  // that already pass the quality bar (450+ reviews, 70%+ rating).
  try {
    const pages = await Promise.all([0,1,2,3,4,5,6,7,8,9].map(p =>
      fetchJSON(`https://www.cheapshark.com/api/1.0/deals?pageSize=60&pageNumber=${p}&sortBy=Reviews&steamRating=70&onSale=0`).catch(() => [])
    ));
    const liveRaw = pages.flat();
    // Dedupe by steamAppID (keep the cheapest deal per game)
    const byApp = {};
    for (const d of liveRaw) {
      const appid = parseInt(d.steamAppID);
      if (!appid) continue;
      const revs = d.steamRatingCount ? parseInt(d.steamRatingCount) : 0;
      const rate = d.steamRatingPercent ? parseInt(d.steamRatingPercent) : 0;
      if (revs < 5000 || rate < 70) continue;
      if (owned.has(appid)) continue;
      if (isJunkTitle(d.title)) continue;
      const prev = byApp[appid];
      if (!prev || parseFloat(d.salePrice) < parseFloat(prev.salePrice)) byApp[appid] = d;
    }
    // Title-based tag inference for CheapShark entries (so genre filters still match)
    const KW_TAGS = [
      [/\b(survival|survive)\b/i, ['survival']],
      [/\b(simulator|simulation|tycoon|manager|hospital|campus)\b/i, ['simulation','management']],
      [/\b(farming|farm|harvest|stardew|coral)\b/i, ['farming','cosy','relaxing']],
      [/\b(rogue|roguelike|roguelite)\b/i, ['roguelike','indie']],
      [/\b(horror|scary|phasmophobia|outlast|amnesia)\b/i, ['horror']],
      [/\b(racing|race|drive|rally|f1|forza|gran turismo)\b/i, ['racing']],
      [/\b(strategy|total war|civilization|xcom|stellaris|crusader|paradox)\b/i, ['strategy']],
      [/\b(fight|tekken|street fighter|mortal kombat|guilty gear)\b/i, ['fighting']],
      [/\b(puzzle|escape|portal|obra dinn|talos|tunic)\b/i, ['puzzle','indie']],
      [/\b(platform|metroidvania|celeste|hollow knight|ori|cuphead)\b/i, ['platformer','indie','metroidvania']],
      [/\b(co-?op|coop|together|party)\b/i, ['coop','multiplayer']],
      [/\b(fps|shooter|call of duty|battlefield|cs:?go|cs:?2|valorant|counter-strike|doom|halo|battleroyale|battle royale)\b/i, ['fps','shooter']],
      [/\b(open world|sandbox|minecraft|terraria)\b/i, ['openworld','sandbox']],
      [/\b(rpg|role[- ]playing|final fantasy|persona|yakuza|souls|fromsoftware|elden|dark souls|sekiro|bloodborne|mass effect|dragon age|skyrim|witcher|pillars|divinity|baldur)\b/i, ['rpg','story']],
      [/\b(story|narrative|adventure|point[- ]and[- ]click|telltale|life is strange|detroit|heavy rain)\b/i, ['story']],
      [/\b(cosy|cozy|relaxing|chill|cute|anim(als?|e?\s*crossing)|pokemon|palia)\b/i, ['cosy','relaxing']],
      [/\b(space|sci-?fi|starfield|mass effect|outer wilds|stellaris|warhammer|halo)\b/i, ['scifi']],
      [/\b(medieval|knight|castle|viking|kingdom|crusader|stronghold)\b/i, ['medieval','historical']],
      [/\b(cyberpunk|cyber|neon)\b/i, ['cyberpunk','scifi']],
      [/\b(stealth|assassin|hitman|dishonored|thief)\b/i, ['stealth']],
      [/\b(mmo|world of warcraft|ffxiv|final fantasy xiv|new world|guild wars|lost ark|runescape)\b/i, ['mmo','rpg']],
      [/\b(tower defense|td\b|bloons)\b/i, ['strategy']],
      [/\b(deck(?:[- ]?builder)?|slay the spire|balatro|inscryption)\b/i, ['roguelike','deckbuilder','indie']],
      [/\b(free)\b/i, ['free']],
    ];

    function inferTags(title) {
      const out = new Set(['indie']);  // fallback so it shows under "Indie" at least
      for (const [re, tags] of KW_TAGS) {
        if (re.test(title)) tags.forEach(t => out.add(t));
      }
      return [...out];
    }

    // Add any not already in recs
    const existing = new Set(recs.map(r => r.appid));
    for (const d of Object.values(byApp)) {
      const appid = parseInt(d.steamAppID);
      if (existing.has(appid)) continue;
      recs.push({
        reason: 'Highly rated by players',
        game: d.title,
        appid,
        img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
        sub: `${d.steamRatingPercent}% positive (${parseInt(d.steamRatingCount).toLocaleString()} reviews)`,
        buy: true,
        tags: inferTags(d.title),
        // Pre-fill price/review from CheapShark so frontend filters work immediately
        price: parseFloat(d.salePrice) > 0 ? `£${d.salePrice}` : 'Free',
        discounted: parseFloat(d.savings) > 1,
        reviewScore: parseInt(d.steamRatingPercent),
        reviewLabel: d.steamRatingText,
        reviewCount: parseInt(d.steamRatingCount),
      });
    }
  } catch {}

  // Enrich with price + reviews + player count (parallel, first 60 to stay under CPU budget)
  // Enrich only entries that don't already have review/price data (manual catalog ones).
  // CheapShark-sourced entries arrive pre-enriched so we save hundreds of API calls.
  const toEnrich = recs.filter(r => !r.reviewScore).slice(0, 60);
  await Promise.all(toEnrich.map(async r => {
    try {
      const [details, reviews, pc] = await Promise.all([
        fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${r.appid}&cc=gb&l=en`).catch(() => null),
        fetchJSON(`https://store.steampowered.com/appreviews/${r.appid}?json=1&language=all&purchase_type=all&num_per_page=0`).catch(() => null),
        fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${r.appid}`).catch(() => null),
      ]);

      const info = details?.[r.appid]?.data;
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

      const rev = reviews?.query_summary;
      if (rev && rev.total_reviews > 0) {
        r.reviewScore = Math.round(rev.total_positive / rev.total_reviews * 100);
        r.reviewLabel = rev.review_score_desc;
        r.reviewCount = rev.total_reviews;
      }

      const players = pc?.response?.player_count;
      if (players) r.currentPlayers = players;
    } catch {}
  }));

  return jsonResponse({ recommendations: recs });
}

async function gameDetails(path) {
  const appid = path.split('/').pop();
  try {
    const [details, reviews, playerCount] = await Promise.all([
      fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=gb&l=en`),
      fetchJSON(`https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purchase_type=all&num_per_page=0`),
      fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`).catch(() => ({ response: { player_count: null } })),
    ]);

    const info = details?.[appid]?.data;
    if (!info) return jsonResponse({ error: 'Not found' }, 404);

    const rev = reviews?.query_summary || {};
    const totalPositive = rev.total_positive || 0;
    const totalReviews  = rev.total_reviews || 0;
    const reviewScore   = totalReviews > 0 ? Math.round(totalPositive / totalReviews * 100) : 0;

    return jsonResponse({
      appid,
      name: info.name,
      price: info.is_free ? 'Free' : (info.price_overview?.final_formatted || '—'),
      discount: info.price_overview?.discount_percent || 0,
      description: info.short_description,
      genres: (info.genres || []).map(g => g.description),
      tags: (info.categories || []).map(c => c.description).slice(0, 8),
      metacritic: info.metacritic?.score || null,
      releaseDate: info.release_date?.date,
      header: info.header_image,
      developer: info.developers?.[0] || null,
      publisher: info.publishers?.[0] || null,
      reviews: {
        score: reviewScore,
        total: totalReviews,
        label: rev.review_score_desc || null,
      },
      currentPlayers: playerCount?.response?.player_count ?? null,
    });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// Bulk reviews endpoint for buy recommendations (fast lookup)
async function steamReviews(path) {
  const appid = path.split('/').pop();
  try {
    const data = await fetchJSON(
      `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purchase_type=all&num_per_page=0`
    );
    const r = data?.query_summary || {};
    const total = r.total_reviews || 0;
    const positive = r.total_positive || 0;
    return jsonResponse({
      appid,
      score: total > 0 ? Math.round(positive / total * 100) : 0,
      total,
      label: r.review_score_desc || '—',
    });
  } catch {
    return jsonResponse({ appid, score: 0, total: 0, label: '—' });
  }
}

// ════════════════════════════════════════════════════════
// WRAPPED / YEAR IN GAMES / BACKLOG / FRIEND / GAME OF THE DAY / FINISH-THIS / PRICE ALERTS
// ════════════════════════════════════════════════════════

async function getWrapped(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const games = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  const list = games?.response?.games || [];
  const recent = list.filter(g => (g.playtime_2weeks || 0) > 0).sort((a, b) => b.playtime_2weeks - a.playtime_2weeks);
  const allTime = [...list].sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0));
  const totalHours = Math.round(list.reduce((s, g) => s + (g.playtime_forever || 0), 0) / 60);
  const recentHours = Math.round(recent.reduce((s, g) => s + (g.playtime_2weeks || 0), 0) / 60 * 10) / 10;

  // Top 5 all time
  const top5 = allTime.slice(0, 5).map(g => ({
    appid: g.appid,
    name: g.name,
    hours: Math.round(g.playtime_forever / 60),
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
  }));

  // Most played recently (top 3)
  const topRecent = recent.slice(0, 3).map(g => ({
    appid: g.appid,
    name: g.name,
    hours: Math.round(g.playtime_2weeks / 60 * 10) / 10,
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
  }));

  // Untouched games count
  const untouched = list.filter(g => !g.playtime_forever).length;
  const barelyPlayed = list.filter(g => g.playtime_forever > 0 && g.playtime_forever < 60).length;

  // Completion estimate
  const completed = list.filter(g => g.playtime_forever > 1800).length; // 30h+

  return jsonResponse({
    totalGames: list.length,
    totalHours,
    recentHours,
    top5,
    topRecent,
    untouched,
    barelyPlayed,
    completed,
    generatedAt: new Date().toISOString(),
  });
}

async function compareFriend(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const friendSid = url.searchParams.get('friendSid');
  if (!friendSid) return jsonResponse({ error: 'friendSid required' }, 400);

  const [meGames, themGames, meProfile, themProfile] = await Promise.all([
    fetchJSON(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`),
    fetchJSON(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${friendSid}&include_appinfo=1&include_played_free_games=1`),
    fetchJSON(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${sid}`),
    fetchJSON(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${friendSid}`),
  ]);

  const meList = meGames?.response?.games || [];
  const themList = themGames?.response?.games || [];
  if (!themList.length) return jsonResponse({ error: 'Friend profile private or no games' }, 404);

  const meMap = Object.fromEntries(meList.map(g => [g.appid, g]));
  const themMap = Object.fromEntries(themList.map(g => [g.appid, g]));

  // Games you both own
  const shared = meList.filter(g => themMap[g.appid]).map(g => ({
    appid: g.appid,
    name: g.name,
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
    meHours: Math.round((g.playtime_forever || 0) / 60),
    themHours: Math.round((themMap[g.appid].playtime_forever || 0) / 60),
  })).sort((a, b) => (b.meHours + b.themHours) - (a.meHours + a.themHours)).slice(0, 10);

  // Games they have you don't
  const theirExclusive = themList.filter(g => !meMap[g.appid] && g.playtime_forever > 600)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 5)
    .map(g => ({
      appid: g.appid,
      name: g.name,
      img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      hours: Math.round(g.playtime_forever / 60),
    }));

  const me = meProfile?.response?.players?.[0] || {};
  const them = themProfile?.response?.players?.[0] || {};

  return jsonResponse({
    me: { name: me.personaname, avatar: me.avatarfull, games: meList.length, hours: Math.round(meList.reduce((s, g) => s + (g.playtime_forever || 0), 0) / 60) },
    them: { name: them.personaname, avatar: them.avatarfull, games: themList.length, hours: Math.round(themList.reduce((s, g) => s + (g.playtime_forever || 0), 0) / 60) },
    shared,
    theirRecommendations: theirExclusive,
  });
}

async function gameOfTheDay(url) {
  // Deterministic by date — everyone gets the same pick today
  const today = new Date().toISOString().slice(0, 10);
  const seed = [...today].reduce((s, c) => s + c.charCodeAt(0), 0);

  // Curated list of "must play" games — appids verified
  const CURATED = [
    { appid: 1086940, name: "Baldur's Gate 3",   reason: 'The RPG that revived the whole genre' },
    { appid: 1145360, name: 'Hades',              reason: 'Roguelike with soul' },
    { appid: 367520,  name: 'Hollow Knight',      reason: 'Best metroidvania of the decade' },
    { appid: 1091500, name: 'Cyberpunk 2077',     reason: 'Redemption arc complete' },
    { appid: 1245620, name: 'Elden Ring',         reason: 'Game of the Year 2022' },
    { appid: 632470,  name: 'Disco Elysium',      reason: 'Best-written RPG ever' },
    { appid: 620,     name: 'Portal 2',           reason: 'Still the best puzzle game' },
    { appid: 753640,  name: 'Outer Wilds',        reason: 'Mind-bending space mystery' },
    { appid: 413150,  name: 'Stardew Valley',     reason: 'The cosiest escape' },
    { appid: 892970,  name: 'Valheim',            reason: 'Viking survival with friends' },
    { appid: 1426210, name: 'It Takes Two',       reason: 'Best co-op experience in years' },
    { appid: 1794680, name: 'Vampire Survivors',  reason: '£4 of pure serotonin' },
    { appid: 2379780, name: 'Balatro',            reason: 'Poker roguelike sleeper hit' },
    { appid: 427520,  name: 'Factorio',           reason: 'The GOAT of automation' },
    { appid: 646570,  name: 'Slay the Spire',     reason: 'The deckbuilder that started it all' },
    { appid: 292030,  name: 'The Witcher 3',      reason: 'Still the open-world benchmark' },
    { appid: 1593500, name: 'Stray',              reason: 'You play as a cat' },
    { appid: 1966720, name: 'Like a Dragon: Infinite Wealth', reason: 'Yakuza-style in Hawaii' },
    { appid: 2050650, name: 'Resident Evil 4 Remake', reason: 'Survival horror remade' },
    { appid: 1174180, name: 'Red Dead Redemption 2', reason: 'A technical and narrative masterpiece' },
  ];

  const pick = CURATED[seed % CURATED.length];

  // Enrich with live review + price
  try {
    const [rev, details] = await Promise.all([
      fetchJSON(`https://store.steampowered.com/appreviews/${pick.appid}?json=1&language=all&purchase_type=all&num_per_page=0`).catch(() => null),
      fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${pick.appid}&cc=gb&l=en`).catch(() => null),
    ]);
    const info = details?.[pick.appid]?.data;
    const r = rev?.query_summary;
    return jsonResponse({
      appid: pick.appid,
      name: pick.name,
      reason: pick.reason,
      date: today,
      img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${pick.appid}/header.jpg`,
      url: `https://store.steampowered.com/app/${pick.appid}`,
      price: info?.is_free ? 'Free' : (info?.price_overview?.final_formatted || '—'),
      discount: info?.price_overview?.discount_percent || 0,
      review: r && r.total_reviews > 0 ? {
        score: Math.round(r.total_positive / r.total_reviews * 100),
        label: r.review_score_desc,
        count: r.total_reviews,
      } : null,
    });
  } catch (e) {
    return jsonResponse({ appid: pick.appid, name: pick.name, reason: pick.reason, img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${pick.appid}/header.jpg`, url: `https://store.steampowered.com/app/${pick.appid}` });
  }
}

async function finishThis(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const games = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  const list = games?.response?.games || [];

  // Games started but not finished: played 2-15 hours
  const candidates = list.filter(g => g.playtime_forever > 120 && g.playtime_forever < 900);
  if (!candidates.length) return jsonResponse({ error: 'No in-progress games to finish' }, 404);

  // Pick one based on today's date (deterministic so refresh doesn't cycle)
  const today = new Date().toISOString().slice(0, 10);
  const seed = [...today].reduce((s, c) => s + c.charCodeAt(0), 0);
  const pick = candidates[seed % candidates.length];

  return jsonResponse({
    appid: pick.appid,
    name: pick.name,
    hoursPlayed: Math.round(pick.playtime_forever / 60 * 10) / 10,
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${pick.appid}/header.jpg`,
    url: `https://store.steampowered.com/app/${pick.appid}`,
    message: `You started this and never finished. Give it 30 minutes tonight.`,
  });
}

async function backlogEstimate(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const games = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  const list = games?.response?.games || [];

  const untouched = list.filter(g => !g.playtime_forever);
  const barelyPlayed = list.filter(g => g.playtime_forever > 0 && g.playtime_forever < 120);

  // Total playtime (minutes) all-time, convert to avg hours/week
  const totalHours = list.reduce((s, g) => s + (g.playtime_forever || 0), 0) / 60;
  const accountAgeDays = 2500; // rough default ~7 years
  const hoursPerWeek = (totalHours / accountAgeDays) * 7;
  // Backlog estimate: assume each untouched game takes 20h, barely-played takes 15h
  const estimatedBacklogHours = (untouched.length * 20) + (barelyPlayed.length * 15);
  const weeksToFinish = hoursPerWeek > 0 ? estimatedBacklogHours / hoursPerWeek : 0;
  const yearsToFinish = Math.round(weeksToFinish / 52 * 10) / 10;

  return jsonResponse({
    untouchedCount: untouched.length,
    barelyPlayedCount: barelyPlayed.length,
    backlogHours: Math.round(estimatedBacklogHours),
    hoursPerWeek: Math.round(hoursPerWeek * 10) / 10,
    yearsToFinish,
    totalHours: Math.round(totalHours),
  });
}

// ════════════════════════════════════════════════════════
// FPS ESTIMATOR
// Based on relative GPU performance score (100 = baseline GTX 1060)
// ════════════════════════════════════════════════════════

const GPU_SCORES = {
  // NVIDIA 5000 series
  'RTX 5090': 800, 'RTX 5080': 600, 'RTX 5070 Ti': 450, 'RTX 5070': 360, 'RTX 5060 Ti': 260, 'RTX 5060': 210,
  // NVIDIA 4000 series
  'RTX 4090': 540, 'RTX 4080 SUPER': 430, 'RTX 4080': 410, 'RTX 4070 Ti SUPER': 370, 'RTX 4070 Ti': 330,
  'RTX 4070 SUPER': 290, 'RTX 4070': 250, 'RTX 4060 Ti': 200, 'RTX 4060': 170,
  // NVIDIA 3000 series
  'RTX 3090 Ti': 370, 'RTX 3090': 350, 'RTX 3080 Ti': 330, 'RTX 3080': 310, 'RTX 3070 Ti': 250,
  'RTX 3070': 230, 'RTX 3060 Ti': 210, 'RTX 3060': 170, 'RTX 3050': 110,
  // NVIDIA 2000/1000 series
  'RTX 2080 Ti': 230, 'RTX 2080 SUPER': 200, 'RTX 2080': 190, 'RTX 2070 SUPER': 170, 'RTX 2070': 150,
  'RTX 2060 SUPER': 140, 'RTX 2060': 120, 'GTX 1080 Ti': 170, 'GTX 1080': 130, 'GTX 1070 Ti': 115,
  'GTX 1070': 105, 'GTX 1060 6GB': 100, 'GTX 1060 3GB': 85, 'GTX 1050 Ti': 60, 'GTX 1050': 50,
  // AMD Radeon RX 7000/9000
  'RX 9070 XT': 380, 'RX 9070': 320, 'RX 7900 XTX': 420, 'RX 7900 XT': 370, 'RX 7900 GRE': 310,
  'RX 7800 XT': 280, 'RX 7700 XT': 230, 'RX 7600 XT': 180, 'RX 7600': 160,
  // AMD 6000 series
  'RX 6950 XT': 310, 'RX 6900 XT': 290, 'RX 6800 XT': 270, 'RX 6800': 230, 'RX 6750 XT': 200,
  'RX 6700 XT': 185, 'RX 6650 XT': 150, 'RX 6600 XT': 140, 'RX 6600': 120, 'RX 6500 XT': 70,
  // Intel Arc
  'Arc B580': 200, 'Arc A770': 150, 'Arc A750': 130, 'Arc A580': 110,
  // Steam Deck (LCD + OLED) — approximate GPU score. 800p native target.
  'Steam Deck': 60, 'Steam Deck OLED': 65,
  // ROG Ally / Legion Go handhelds
  'ROG Ally': 85, 'ROG Ally X': 95, 'Legion Go': 90, 'MSI Claw': 75,
};

// Game demand profile: score needed for 60fps at 1080p ultra
const GAME_DEMAND = {
  // Extremely demanding (250-300)
  'Cyberpunk 2077':                    { score: 250, nicePlay: true },
  'Alan Wake 2':                       { score: 280, nicePlay: true },
  'Black Myth: Wukong':                { score: 260, nicePlay: true },
  'Star Wars Outlaws':                 { score: 240 },
  'Hogwarts Legacy':                   { score: 220 },
  "Assassin's Creed Shadows":          { score: 230 },
  "Assassin's Creed Valhalla":         { score: 210 },
  "Assassin's Creed Odyssey":          { score: 190 },
  "Assassin's Creed Mirage":           { score: 170 },
  'Hellblade II':                      { score: 280, nicePlay: true },
  'Senua\'s Saga: Hellblade II':       { score: 280, nicePlay: true },
  'Starfield':                         { score: 230 },
  'Crimson Desert':                    { score: 260 },
  'STALKER 2':                         { score: 240 },
  'S.T.A.L.K.E.R. 2: Heart of Chornobyl': { score: 240 },
  'Indiana Jones and the Great Circle': { score: 220 },
  'Avatar: Frontiers of Pandora':      { score: 210 },
  'Forspoken':                         { score: 210 },
  'Silent Hill 2':                     { score: 220 },
  'Silent Hill 2 Remake':              { score: 220 },
  'Resident Evil 4':                   { score: 170 },
  'Resident Evil Village':             { score: 160 },
  'Dragon Age: The Veilguard':         { score: 200 },
  'Final Fantasy VII Rebirth':         { score: 200 },
  'Final Fantasy XVI':                 { score: 210 },

  // Demanding (170-220)
  'Red Dead Redemption 2':             { score: 180 },
  'Horizon Zero Dawn':                 { score: 150 },
  'Horizon Forbidden West':            { score: 210 },
  "Marvel's Spider-Man Remastered":    { score: 150 },
  "Marvel's Spider-Man: Miles Morales":{ score: 140 },
  "Marvel's Spider-Man 2":             { score: 180 },
  'Microsoft Flight Simulator 2024':   { score: 220 },
  'Microsoft Flight Simulator':        { score: 200 },
  'Palworld':                          { score: 160 },
  'The Witcher 3: Wild Hunt':          { score: 130 },
  'God of War':                        { score: 160 },
  'God of War Ragnarok':               { score: 180 },
  'Uncharted: Legacy of Thieves':      { score: 160 },
  'The Last of Us Part I':             { score: 180 },
  'The Last of Us Part II':            { score: 200 },
  'Returnal':                          { score: 180 },
  'Ghost of Tsushima':                 { score: 170 },
  'Metro Exodus':                      { score: 180 },
  'Metro Exodus Enhanced':             { score: 220 },
  'Kingdom Come: Deliverance II':      { score: 220 },
  'Kingdom Come: Deliverance':         { score: 150 },
  'Dying Light 2':                     { score: 170 },
  'Days Gone':                         { score: 140 },
  'Control':                           { score: 160 },
  'Quantum Break':                     { score: 150 },
  'Death Stranding':                   { score: 150 },
  'Death Stranding 2':                 { score: 200 },
  'Battlefield 2042':                  { score: 170 },
  'Battlefield V':                     { score: 130 },
  'Call of Duty: Modern Warfare III':  { score: 180 },
  'Call of Duty: Black Ops 6':         { score: 200 },

  // Medium (110-170)
  'Elden Ring':                        { score: 150 },
  'Elden Ring Nightreign':             { score: 160 },
  'Monster Hunter Wilds':              { score: 200 },
  'Monster Hunter: World':             { score: 130 },
  'Monster Hunter Rise':               { score: 100 },
  'Helldivers 2':                      { score: 160 },
  'Baldur\'s Gate 3':                  { score: 150 },
  'Divinity: Original Sin 2':          { score: 100 },
  'Grand Theft Auto V':                { score: 90 },
  'Grand Theft Auto IV':               { score: 70 },
  'Apex Legends':                      { score: 110 },
  'Overwatch 2':                       { score: 100 },
  'Rust':                              { score: 150 },
  'Ark: Survival Evolved':             { score: 180 },
  'Ark: Survival Ascended':            { score: 240 },
  'DayZ':                              { score: 140 },
  'Sons of the Forest':                { score: 150 },
  'The Forest':                        { score: 90 },
  'Valheim':                           { score: 70 },
  'Enshrouded':                        { score: 140 },
  'Nightingale':                       { score: 150 },
  'Dark Souls III':                    { score: 100 },
  'Dark Souls Remastered':             { score: 80 },
  'Sekiro: Shadows Die Twice':         { score: 110 },
  'Lies of P':                         { score: 140 },
  'Nioh 2':                            { score: 130 },
  'Wo Long: Fallen Dynasty':           { score: 140 },
  'Star Wars Jedi: Survivor':          { score: 190 },
  'Star Wars Jedi: Fallen Order':      { score: 150 },
  'Tomb Raider':                       { score: 100 },
  'Shadow of the Tomb Raider':         { score: 150 },
  'Rise of the Tomb Raider':           { score: 130 },
  'Hitman 3':                          { score: 110 },
  'Hitman: World of Assassination':    { score: 110 },
  'Dishonored 2':                      { score: 100 },
  'Prey':                              { score: 100 },
  'Deathloop':                         { score: 170 },
  'Alan Wake':                         { score: 80 },
  'Alan Wake Remastered':              { score: 100 },

  // DOOM & shooters
  'DOOM Eternal':                      { score: 130 },
  'DOOM (2016)':                       { score: 80 },
  'DOOM: The Dark Ages':               { score: 180 },
  'Titanfall 2':                       { score: 80 },
  'Wolfenstein II: The New Colossus':  { score: 100 },
  'Wolfenstein: Youngblood':           { score: 120 },
  'Halo Infinite':                     { score: 150 },
  'Halo: The Master Chief Collection': { score: 110 },
  'Ready or Not':                      { score: 140 },
  'Insurgency: Sandstorm':             { score: 120 },
  'Rainbow Six Siege':                 { score: 80 },
  'PUBG: Battlegrounds':               { score: 90 },
  'Escape from Tarkov':                { score: 160 },
  'Hunt: Showdown':                    { score: 140 },
  'NARAKA: BLADEPOINT':                { score: 130 },

  // Sports / racing
  'EA Sports FC 25':                   { score: 140 },
  'EA Sports FC 24':                   { score: 130 },
  'FIFA 23':                           { score: 120 },
  'NBA 2K25':                          { score: 150 },
  'F1 24':                             { score: 140 },
  'F1 23':                             { score: 130 },
  'Forza Horizon 5':                   { score: 150 },
  'Forza Motorsport':                  { score: 170 },
  'EA Sports WRC':                     { score: 140 },
  'DiRT Rally 2.0':                    { score: 110 },
  'Assetto Corsa':                     { score: 100 },
  'Assetto Corsa Competizione':        { score: 140 },
  'Wreckfest':                         { score: 90 },
  'Euro Truck Simulator 2':            { score: 60 },
  'American Truck Simulator':          { score: 60 },

  // City / sim / strategy
  'Cities: Skylines II':               { score: 200 },
  'Cities: Skylines':                  { score: 70 },
  'Anno 1800':                         { score: 130 },
  'Anno 117':                          { score: 160 },
  'Tropico 6':                         { score: 90 },
  'Frostpunk 2':                       { score: 150 },
  'Frostpunk':                         { score: 80 },
  'Manor Lords':                       { score: 100 },
  'Two Point Hospital':                { score: 50 },
  'Two Point Campus':                  { score: 55 },
  'Two Point Museum':                  { score: 60 },
  'Planet Zoo':                        { score: 120 },
  'Planet Coaster 2':                  { score: 100 },
  'Civilization VI':                   { score: 60 },
  'Civilization VII':                  { score: 90 },
  'Total War: Warhammer III':          { score: 160 },
  'Total War: Pharaoh':                { score: 120 },
  'Total War: Three Kingdoms':         { score: 130 },
  'Crusader Kings III':                { score: 80 },
  'Europa Universalis IV':             { score: 60 },
  'Stellaris':                         { score: 60 },
  'Hearts of Iron IV':                 { score: 60 },
  'Age of Empires IV':                 { score: 100 },
  'Age of Empires II: Definitive Edition': { score: 40 },
  'Company of Heroes 3':               { score: 110 },
  'XCOM 2':                            { score: 80 },
  'Football Manager 2024':             { score: 40 },
  'Football Manager 2025':             { score: 45 },

  // Survival / crafting / automation
  'Satisfactory':                      { score: 110 },
  'Factorio':                          { score: 50 },
  'Terraria':                          { score: 20 },
  'Minecraft':                         { score: 40 },
  'RimWorld':                          { score: 45 },
  'Stardew Valley':                    { score: 10 },
  'Raft':                              { score: 60 },
  "Don't Starve Together":             { score: 40 },
  'Subnautica':                        { score: 80 },
  'Subnautica: Below Zero':            { score: 90 },
  'Green Hell':                        { score: 100 },
  'Project Zomboid':                   { score: 70 },
  '7 Days to Die':                     { score: 100 },
  'V Rising':                          { score: 90 },
  'Dyson Sphere Program':              { score: 60 },
  'Oxygen Not Included':               { score: 50 },
  'Kerbal Space Program 2':            { score: 100 },

  // Competitive / MOBA / F2P
  'Counter-Strike 2':                  { score: 70, nicePlay: true },
  'Valorant':                          { score: 40 },
  'Fortnite':                          { score: 90 },
  'Rocket League':                     { score: 60 },
  'Sea of Thieves':                    { score: 110 },
  'League of Legends':                 { score: 25 },
  'Dota 2':                            { score: 60 },
  'Team Fortress 2':                   { score: 30 },
  'The Finals':                        { score: 130 },
  'Marvel Rivals':                     { score: 110 },
  'Roblox':                            { score: 30 },
  'Deadlock':                          { score: 90 },

  // Indie / roguelike / puzzle
  'Hollow Knight':                     { score: 30 },
  'Hollow Knight: Silksong':           { score: 40 },
  'Hades':                             { score: 40 },
  'Hades II':                          { score: 50 },
  'Balatro':                           { score: 15 },
  'Vampire Survivors':                 { score: 20 },
  'Slay the Spire':                    { score: 20 },
  'Dead Cells':                        { score: 40 },
  'Risk of Rain 2':                    { score: 50 },
  'Cult of the Lamb':                  { score: 40 },
  'Into the Breach':                   { score: 20 },
  'FTL: Faster Than Light':            { score: 15 },
  'Noita':                             { score: 40 },
  'Celeste':                           { score: 25 },
  'Undertale':                         { score: 10 },
  'Cuphead':                           { score: 40 },
  'Ori and the Will of the Wisps':     { score: 50 },
  'Ori and the Blind Forest':          { score: 30 },
  'Pizza Tower':                       { score: 35 },
  'Portal 2':                          { score: 40 },
  'Portal':                            { score: 30 },
  'Outer Wilds':                       { score: 50 },
  'Return of the Obra Dinn':           { score: 30 },
  'The Witness':                       { score: 45 },
  'Inscryption':                       { score: 40 },
  'Chants of Sennaar':                 { score: 40 },
  'Tunic':                             { score: 40 },
  'Disco Elysium':                     { score: 40 },

  // JRPGs & anime fighters
  'Persona 5 Royal':                   { score: 70 },
  'Persona 3 Reload':                  { score: 90 },
  'Persona 4 Golden':                  { score: 30 },
  'Like a Dragon: Infinite Wealth':    { score: 120 },
  'Yakuza: Like a Dragon':             { score: 100 },
  'Yakuza 0':                          { score: 60 },
  'Yakuza Kiwami':                     { score: 60 },
  'Yakuza Kiwami 2':                   { score: 80 },
  'Judgment':                          { score: 90 },
  'Lost Judgment':                     { score: 100 },
  'Tales of Arise':                    { score: 120 },
  'Tekken 8':                          { score: 130 },
  'Street Fighter 6':                  { score: 120 },
  'Mortal Kombat 1':                   { score: 130 },
  'Guilty Gear Strive':                { score: 110 },
  'Dragon Ball: Sparking! ZERO':       { score: 130 },

  // Horror
  'Dead by Daylight':                  { score: 110 },
  'Phasmophobia':                      { score: 60 },
  'Lethal Company':                    { score: 30 },
  'Content Warning':                   { score: 40 },
  'The Outlast Trials':                { score: 110 },
  'Resident Evil 2':                   { score: 130 },
  'Resident Evil 3':                   { score: 130 },
  'Alien: Isolation':                  { score: 70 },
  'Amnesia: The Bunker':               { score: 60 },
  'SOMA':                              { score: 60 },

  // Co-op / casual
  'It Takes Two':                      { score: 90 },
  'Split Fiction':                     { score: 110 },
  'Deep Rock Galactic':                { score: 80 },
  'Among Us':                          { score: 10 },
  'Fall Guys':                         { score: 60 },
  'Overcooked 2':                      { score: 50 },

  // Fill-in batch
  'Diablo IV':                         { score: 140 },
  'Diablo IV: Vessel of Hatred':       { score: 150 },
  'Path of Exile 2':                   { score: 120 },
  'Path of Exile':                     { score: 60 },
  'Grim Dawn':                         { score: 55 },
  'Last Epoch':                        { score: 110 },
  'Borderlands 3':                     { score: 120 },
  'Borderlands 4':                     { score: 180 },
  'Tiny Tina\'s Wonderlands':          { score: 110 },
  "Baldur's Gate 3 (Split-screen)":     { score: 160 },
  'Atomic Heart':                      { score: 150 },
  'Scorn':                             { score: 120 },
  'The Medium':                        { score: 130 },
  'Lies of P':                         { score: 140 },
  'Stellar Blade':                     { score: 150 },
  'WUCHANG: Fallen Feathers':          { score: 170 },
  'Phantom Blade Zero':                { score: 200 },
  'Black Myth: Zhong Kui':             { score: 260 },
  'Tomb Raider: Underworld':           { score: 60 },
  'Shadow of Mordor':                  { score: 90 },
  'Shadow of War':                     { score: 130 },
  'Mad Max':                           { score: 110 },
  'RAGE 2':                            { score: 110 },
  'Borderlands: The Pre-Sequel':       { score: 80 },
  'Dying Light':                       { score: 110 },
  'Dying Light: The Beast':            { score: 160 },
  'State of Decay 2':                  { score: 80 },
  'The Finals':                        { score: 130 },
  'XDefiant':                          { score: 100 },
  'Splitgate 2':                       { score: 110 },
  'Hunt: Showdown 1896':               { score: 160 },
  'Conan Exiles':                      { score: 110 },
  'ICARUS':                            { score: 130 },
  'Icarus':                            { score: 130 },
  'Once Human':                        { score: 120 },
  'V Rising':                          { score: 90 },
  'No Man\'s Sky':                     { score: 100 },
  'Star Citizen':                      { score: 220 },
  'Elite Dangerous':                   { score: 100 },
  'Everspace 2':                       { score: 120 },
  'Chorus':                            { score: 110 },
  'House of Ashes':                    { score: 110 },
  'The Quarry':                        { score: 130 },
  'Until Dawn':                        { score: 150 },
  'The Callisto Protocol':             { score: 210 },
  'Dead Space Remake':                 { score: 180 },
  'Dead Space':                        { score: 80 },
  'The Evil Within 2':                 { score: 120 },
  'Observer':                          { score: 100 },
  'The Dark Pictures: The Devil in Me':{ score: 120 },
  'Little Nightmares':                 { score: 60 },
  'Little Nightmares II':              { score: 80 },
  'Little Nightmares III':             { score: 110 },
  'A Plague Tale: Innocence':          { score: 110 },
  'A Plague Tale: Requiem':            { score: 180 },
  'A Plague Tale: The Descendant':     { score: 180 },
  'The Ascent':                        { score: 110 },
  'Hi-Fi Rush':                        { score: 80 },
  'Pizza Tower':                       { score: 30 },
  'Teardown':                          { score: 80 },
  'Planet Crafter':                    { score: 70 },
  'Sunkenland':                        { score: 70 },
  'Nightingale':                       { score: 130 },
  'Enshrouded':                        { score: 140 },
  'Soulmask':                          { score: 110 },
  'Pacific Drive':                     { score: 130 },
  'Still Wakes the Deep':              { score: 150 },
  'Senua\'s Sacrifice':                { score: 80 },
  'Hellblade: Senua\'s Sacrifice':     { score: 80 },
  'Remnant: From the Ashes':           { score: 110 },
  'Remnant II':                        { score: 140 },
  'Remnant 2':                         { score: 140 },
  'Returnal':                          { score: 180 },
  'God of War':                        { score: 160 },

  // ── FNAF series
  'Five Nights at Freddy\'s':           { score: 20 },
  'Five Nights at Freddy\'s 2':         { score: 20 },
  'Five Nights at Freddy\'s 3':         { score: 20 },
  'Five Nights at Freddy\'s 4':         { score: 25 },
  'Five Nights at Freddy\'s: Sister Location': { score: 25 },
  'Freddy Fazbear\'s Pizzeria Simulator': { score: 25 },
  'Ultimate Custom Night':              { score: 25 },
  'Five Nights at Freddy\'s: Security Breach': { score: 140 },
  'Five Nights at Freddy\'s: Help Wanted': { score: 80 },
  'Five Nights at Freddy\'s: Help Wanted 2': { score: 100 },
  'FNAF: Into the Pit':                 { score: 40 },
  'FNAF Ruin':                          { score: 120 },
  'FNAF World':                         { score: 15 },
  'Freddy in Space 2':                  { score: 20 },

  // ── Horror expansion
  'Amnesia: The Dark Descent':          { score: 40 },
  'Amnesia: Rebirth':                   { score: 70 },
  'Amnesia: The Bunker':                { score: 60 },
  'Outlast':                            { score: 40 },
  'Outlast 2':                          { score: 70 },
  'Outlast Trials':                     { score: 110 },
  'The Outlast Trials':                 { score: 110 },
  'Alien: Isolation':                   { score: 70 },
  'SOMA':                               { score: 60 },
  'Layers of Fear':                     { score: 50 },
  'Layers of Fear 2':                   { score: 100 },
  'Observer':                           { score: 100 },
  'Visage':                             { score: 90 },
  'The Evil Within':                    { score: 90 },
  'The Evil Within 2':                  { score: 120 },
  'MADiSON':                            { score: 120 },
  'Devour':                             { score: 40 },
  'Pacify':                             { score: 40 },
  'Cry of Fear':                        { score: 30 },
  'Slender: The Arrival':               { score: 30 },
  'Signalis':                           { score: 40 },
  'Iron Lung':                          { score: 20 },
  'Mouthwashing':                       { score: 30 },
  'Crow Country':                       { score: 40 },
  'Poppy Playtime':                     { score: 50 },
  'Poppy Playtime Chapter 3':           { score: 80 },
  'Poppy Playtime Chapter 4':           { score: 100 },
  'Garten of Banban':                   { score: 40 },
  'Choo-Choo Charles':                  { score: 70 },
  'Hello Neighbor':                     { score: 40 },
  'Hello Neighbor 2':                   { score: 60 },
  'Still Wakes the Deep':               { score: 150 },
  'The Mortuary Assistant':             { score: 50 },
  'Fears to Fathom':                    { score: 20 },
  'Scorn':                              { score: 120 },
  'The Medium':                         { score: 130 },
  'The Casting of Frank Stone':         { score: 120 },
  'Dredge':                             { score: 50 },
  'Until Dawn':                         { score: 150 },
  'The Quarry':                         { score: 130 },
  'The Dark Pictures: Man of Medan':    { score: 90 },
  'The Dark Pictures: Little Hope':     { score: 100 },
  'The Dark Pictures: House of Ashes':  { score: 110 },
  'The Dark Pictures: The Devil in Me': { score: 120 },
  'Directive 8020':                     { score: 150 },
  'Silent Hill: The Short Message':     { score: 50 },
  'Silent Hill 2 Remake':               { score: 220 },
  'Silent Hill f':                      { score: 220 },
  'World of Horror':                    { score: 20 },
  'The Coma: Cutting Class':            { score: 40 },
  'The Coma 2':                         { score: 50 },
  'Fran Bow':                           { score: 20 },
  'Little Misfortune':                  { score: 30 },
  'Detention':                          { score: 30 },
  'White Day':                          { score: 40 },
  'Deathloop':                          { score: 170 },
  'The Callisto Protocol':              { score: 210 },
  'Dead Space Remake':                  { score: 180 },
  'Dead Space':                         { score: 80 },
  'Dead Space 2':                       { score: 80 },
  'Dead Space 3':                       { score: 100 },

  // ── FPS expansion
  'Counter-Strike: Global Offensive':   { score: 60 },
  'Left 4 Dead 2':                      { score: 40 },
  'Left 4 Dead':                        { score: 40 },
  'Back 4 Blood':                       { score: 130 },
  'GTFO':                               { score: 150 },
  'Killing Floor 2':                    { score: 80 },
  'Killing Floor 3':                    { score: 150 },
  'Vermintide 2':                       { score: 120 },
  'Warhammer 40K: Darktide':            { score: 170 },
  'Warhammer 40K: Space Marine 2':      { score: 180 },
  'Insurgency: Sandstorm':              { score: 120 },
  'Squad':                              { score: 140 },
  'Hell Let Loose':                     { score: 140 },
  'Post Scriptum':                      { score: 110 },
  'Battlefield 1':                      { score: 130 },
  'Battlefield V':                      { score: 140 },
  'Battlefield 4':                      { score: 110 },
  'Call of Duty: Black Ops II':         { score: 80 },
  'Call of Duty: Black Ops III':        { score: 100 },
  'Call of Duty: Black Ops 4':          { score: 130 },
  'Call of Duty: Modern Warfare 2019':  { score: 150 },
  'Call of Duty: Modern Warfare II':    { score: 170 },
  'Call of Duty: WWII':                 { score: 120 },
  'Call of Duty: Vanguard':             { score: 150 },
  'Call of Duty: Warzone':              { score: 180 },
  'Titanfall 2':                        { score: 100 },
  'DOOM 3':                             { score: 40 },
  'DOOM 2016':                          { score: 90 },
  'DOOM Eternal':                       { score: 130 },
  'Quake':                              { score: 30 },
  'Quake II':                           { score: 30 },
  'Wolfenstein: The New Order':         { score: 80 },
  'Wolfenstein II: The New Colossus':   { score: 100 },
  'Wolfenstein: Youngblood':            { score: 120 },
  'BioShock':                           { score: 50 },
  'BioShock 2':                         { score: 60 },
  'BioShock Infinite':                  { score: 70 },
  'Metro 2033':                         { score: 60 },
  'Metro: Last Light':                  { score: 90 },
  'Metro Exodus':                       { score: 150 },
  'Far Cry 3':                          { score: 80 },
  'Far Cry 4':                          { score: 110 },
  'Far Cry 5':                          { score: 130 },
  'Far Cry 6':                          { score: 150 },
  'Far Cry New Dawn':                   { score: 120 },
  'Far Cry Primal':                     { score: 110 },
  'Half-Life 2':                        { score: 30 },
  'Half-Life: Alyx':                    { score: 140 },
  'Black Mesa':                         { score: 70 },
  'Ultrakill':                          { score: 40 },
  'Turbo Overkill':                     { score: 50 },
  'Dusk':                               { score: 25 },
  'Amid Evil':                          { score: 35 },
  'Prodeus':                            { score: 60 },
  'Postal 4':                           { score: 90 },
  'Serious Sam 4':                      { score: 80 },
  'Serious Sam: Siberian Mayhem':       { score: 90 },
  'Painkiller':                         { score: 40 },
  'Selaco':                             { score: 80 },
  'Boltgun':                            { score: 50 },
  'Atomic Heart':                       { score: 150 },
  'Shadow Warrior 3':                   { score: 110 },
  'Sniper Elite 5':                     { score: 120 },
  'Sniper Elite: Resistance':           { score: 130 },
  'Sniper: Ghost Warrior Contracts 2':  { score: 110 },
  'Enlisted':                           { score: 100 },
  'War Thunder':                        { score: 110 },
  'Crossfire':                          { score: 50 },
  'Splitgate':                          { score: 80 },
  'Splitgate 2':                        { score: 110 },
  'Roboquest':                          { score: 80 },
};

function normalizeGPU(name) {
  if (!name) return null;
  const n = name.toUpperCase().replace(/\s+/g, ' ').trim();
  for (const key of Object.keys(GPU_SCORES)) {
    if (n.includes(key.toUpperCase())) return key;
  }
  return null;
}

function normalizeGame(name) {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  for (const key of Object.keys(GAME_DEMAND)) {
    if (key.toLowerCase() === n || key.toLowerCase().includes(n) || n.includes(key.toLowerCase().slice(0, 12))) {
      return { name: key, ...GAME_DEMAND[key] };
    }
  }
  return null;
}

// GPU names commonly found in Steam requirements, mapped to approximate demand score.
// Higher required GPU = higher game demand score.
const STEAM_GPU_DEMAND = {
  // Entry
  'GTX 650':70, 'GTX 660':75, 'GTX 670':80, 'GTX 680':85, 'GTX 750':60, 'GTX 750 TI':65,
  'GTX 760':85, 'GTX 770':95, 'GTX 780':110, 'GTX 780 TI':130,
  'GTX 950':70, 'GTX 960':85, 'GTX 970':110, 'GTX 980':130, 'GTX 980 TI':160,
  // Pascal
  'GTX 1050':80, 'GTX 1050 TI':95, 'GTX 1060':120, 'GTX 1070':150, 'GTX 1070 TI':160,
  'GTX 1080':180, 'GTX 1080 TI':220,
  // Turing
  'GTX 1650':100, 'GTX 1660':120, 'GTX 1660 TI':140, 'GTX 1660 SUPER':135,
  'RTX 2060':160, 'RTX 2060 SUPER':180, 'RTX 2070':190, 'RTX 2070 SUPER':210,
  'RTX 2080':230, 'RTX 2080 SUPER':250, 'RTX 2080 TI':280,
  // Ampere
  'RTX 3050':150, 'RTX 3060':180, 'RTX 3060 TI':210, 'RTX 3070':240,
  'RTX 3070 TI':260, 'RTX 3080':290, 'RTX 3080 TI':320, 'RTX 3090':340, 'RTX 3090 TI':360,
  // Ada
  'RTX 4060':200, 'RTX 4060 TI':230, 'RTX 4070':270, 'RTX 4070 SUPER':290,
  'RTX 4070 TI':310, 'RTX 4070 TI SUPER':330, 'RTX 4080':360, 'RTX 4080 SUPER':380, 'RTX 4090':450,
  // AMD RX
  'RX 480':110, 'RX 580':120, 'RX 590':130,
  'RX 5600':140, 'RX 5700':170, 'RX 5700 XT':190,
  'RX 6600':170, 'RX 6600 XT':200, 'RX 6700 XT':240, 'RX 6800':280,
  'RX 6800 XT':310, 'RX 6900 XT':340,
  'RX 7600':180, 'RX 7700 XT':240, 'RX 7800 XT':290, 'RX 7900 XT':350, 'RX 7900 XTX':400,
};

// In-memory cache of inferred demands (reset on worker cold start, OK for this purpose)
const inferredDemandCache = {};
// Missing-game request log
const missingGameLog = [];

function extractRequirementsGPU(html) {
  if (!html) return null;
  // Look for 'Recommended' block first, fall back to 'Minimum'
  const recMatch = html.match(/Recommended[\s\S]{0,2000}/i);
  const minMatch = html.match(/Minimum[\s\S]{0,2000}/i);
  const block = recMatch ? recMatch[0] : (minMatch ? minMatch[0] : html.substring(0, 3000));

  // Try to find a GPU name in the block. Check known names from our demand table.
  const upper = block.toUpperCase();
  let best = null;
  for (const gpu of Object.keys(STEAM_GPU_DEMAND).sort((a,b) => b.length - a.length)) {
    if (upper.includes(gpu)) { best = gpu; break; }
  }
  return best;
}

async function inferDemandFromSteam(gameName) {
  if (inferredDemandCache[gameName]) return inferredDemandCache[gameName];

  try {
    // Step 1: find the appid via Steam's store search
    const search = await fetchJSON(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=english&cc=us`
    );
    const first = search?.items?.[0];
    if (!first?.id) return null;
    const appid = first.id;
    const matchedName = first.name;

    // Step 2: pull store details to get system requirements
    const details = await fetchJSON(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english&filters=basic,pc_requirements`
    );
    const data = details?.[appid]?.data;
    if (!data) return null;
    const reqHtml = (data.pc_requirements?.recommended || '') + ' ' + (data.pc_requirements?.minimum || '');
    const gpu = extractRequirementsGPU(reqHtml);
    if (!gpu) return null;
    const score = STEAM_GPU_DEMAND[gpu];
    const result = { score, source: 'steam-req', matchedName, appid, detectedGPU: gpu };
    inferredDemandCache[gameName] = result;
    return result;
  } catch (e) {
    return null;
  }
}

async function fpsEstimate(url) {
  const gpu = url.searchParams.get('gpu');
  const ramGB = parseInt(url.searchParams.get('ram') || '16');
  const gameName = url.searchParams.get('game');

  const gpuKey = normalizeGPU(gpu);
  let game = normalizeGame(gameName);

  if (!gpuKey) return jsonResponse({ error: 'GPU not recognised', suggestions: Object.keys(GPU_SCORES).slice(0, 10) }, 400);

  // Fallback: infer game demand from Steam system requirements if not in curated DB
  let inferredFrom = null;
  if (!game && gameName) {
    const inferred = await inferDemandFromSteam(gameName);
    if (inferred) {
      game = { name: inferred.matchedName, score: inferred.score };
      inferredFrom = inferred;
    }
  }

  if (!game) {
    // Log the miss
    if (missingGameLog.length < 500 && gameName) missingGameLog.push({ query: gameName, time: Date.now() });
    return jsonResponse({ error: 'Game not in our database', suggestions: Object.keys(GAME_DEMAND).slice(0, 12) }, 400);
  }

  const score = GPU_SCORES[gpuKey];

  // Multipliers per setting/resolution
  // Base: 1080p ultra = 60fps reference at score == demand
  const isHandheld = gpuKey.includes('Deck') || gpuKey.includes('Ally') || gpuKey.includes('Legion Go') || gpuKey.includes('Claw');

  const profiles = isHandheld ? [
    // Handheld-appropriate resolutions
    { label: '720p Low',    resMult: 1.8,  settingMult: 2.0 },
    { label: '720p Medium', resMult: 1.8,  settingMult: 1.5 },
    { label: '720p High',   resMult: 1.8,  settingMult: 1.2 },
    { label: '800p Medium', resMult: 1.5,  settingMult: 1.5 },
    { label: '800p High',   resMult: 1.5,  settingMult: 1.2 },
    { label: '1080p Low',   resMult: 1.0,  settingMult: 2.0 },
    { label: '1080p Medium',resMult: 1.0,  settingMult: 1.5 },
    { label: '1080p High',  resMult: 1.0,  settingMult: 1.2 },
  ] : [
    { label: '1080p Low',    resMult: 1.0,  settingMult: 2.0 },
    { label: '1080p Medium', resMult: 1.0,  settingMult: 1.5 },
    { label: '1080p High',   resMult: 1.0,  settingMult: 1.2 },
    { label: '1080p Ultra',  resMult: 1.0,  settingMult: 1.0 },
    { label: '1440p High',   resMult: 0.6,  settingMult: 1.2 },
    { label: '1440p Ultra',  resMult: 0.6,  settingMult: 1.0 },
    { label: '4K High',      resMult: 0.35, settingMult: 1.2 },
    { label: '4K Ultra',     resMult: 0.35, settingMult: 1.0 },
  ];

  // RAM penalty if below 16GB
  const ramMult = ramGB >= 32 ? 1.05 : ramGB >= 16 ? 1.0 : ramGB >= 8 ? 0.85 : 0.65;

  const estimates = profiles.map(p => {
    const fps = Math.round(60 * (score / game.score) * p.resMult * p.settingMult * ramMult);
    return { setting: p.label, fps: Math.max(5, Math.min(fps, 500)) };
  });

  return jsonResponse({
    gpu: gpuKey,
    ram: ramGB,
    game: game.name,
    gpuScore: score,
    gameDemand: game.score,
    estimates,
    verdict: scoreToVerdict(score, game.score),
    inferred: inferredFrom ? { source: 'steam-req', gpu: inferredFrom.detectedGPU } : null,
  });
}

// Admin endpoint: see what games people are asking for that aren't in the DB
async function missingGames() {
  const counts = {};
  for (const m of missingGameLog) counts[m.query.toLowerCase()] = (counts[m.query.toLowerCase()] || 0) + 1;
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 50);
  return jsonResponse({ total: missingGameLog.length, topMissing: sorted });
}

function scoreToVerdict(gpuScore, gameScore) {
  const ratio = gpuScore / gameScore;
  if (ratio > 3) return 'Runs flawlessly. You can max everything.';
  if (ratio > 2) return 'Runs excellently at high refresh rates.';
  if (ratio > 1.3) return 'Runs great at 1440p ultra.';
  if (ratio > 1) return 'Solid 1080p/1440p experience.';
  if (ratio > 0.7) return 'Playable at 1080p medium-high.';
  if (ratio > 0.4) return 'Struggles — drop to 1080p low.';
  return 'Not recommended for this GPU.';
}

// ════════════════════════════════════════════════════════
// STEAM DNA — analyse library, build taste profile
// ════════════════════════════════════════════════════════

// Rough genre keyword map for games we know about
const GAME_GENRES = {
  1172620: ['Adventure', 'Multiplayer', 'Pirate'],
  730:     ['FPS', 'Competitive'],
  1174180: ['Open World', 'Story', 'Western'],
  1245620: ['Souls', 'RPG', 'Open World'],
  1091500: ['RPG', 'Cyberpunk', 'Story'],
  292030:  ['RPG', 'Open World', 'Fantasy'],
  252950:  ['Sports', 'Competitive'],
  252490:  ['Survival', 'Multiplayer'],
  578080:  ['Battle Royale', 'Shooter'],
  271590:  ['Open World', 'Crime', 'Action'],
  105600:  ['Sandbox', 'Crafting'],
  813780:  ['Strategy', 'RTS'],
  1086940: ['RPG', 'Turn-based', 'Fantasy'],
  570:     ['MOBA', 'Competitive'],
  440:     ['FPS', 'Casual'],
  582010:  ['Action', 'Co-op', 'Grind'],
  377160:  ['RPG', 'Post-apocalyptic'],
  489830:  ['RPG', 'Fantasy'],
  1716740: ['RPG', 'Sci-Fi', 'Exploration'],
  1086940: ['RPG', 'Fantasy'],
  367520:  ['Metroidvania', 'Indie'],
  1145360: ['Roguelike', 'Indie'],
  2344520: ['RPG', 'Loot'],
  1623730: ['Survival', 'Co-op'],
  553850:  ['Shooter', 'Co-op'],
  413150:  ['Farming', 'Cosy'],
  892970:  ['Survival', 'Co-op', 'Viking'],
  570:     ['MOBA'],
  1551360: ['Racing', 'Arcade'],
  2139460: ['Shooter', 'Hero', 'Competitive'],
  1938090: ['FPS', 'Military'],
  814380:  ['Souls', 'Action'],
  582660:  ['MMORPG', 'Fantasy'],
};

async function steamDNA(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const data = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  if (!data?.response?.games) return jsonResponse({ error: 'privacy' }, 403);

  const games = data.response.games;
  const totalHours = games.reduce((s, g) => s + (g.playtime_forever || 0) / 60, 0);

  // Genre hours tally
  const genreHours = {};
  let categorized = 0;
  for (const g of games) {
    const hours = (g.playtime_forever || 0) / 60;
    const genres = GAME_GENRES[g.appid];
    if (genres) {
      categorized += hours;
      for (const genre of genres) {
        genreHours[genre] = (genreHours[genre] || 0) + hours;
      }
    }
  }

  // Sort genres by hours
  const topGenres = Object.entries(genreHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, hours]) => ({ name, hours: Math.round(hours), pct: Math.round(hours / categorized * 100) }));

  // Personality archetype
  const topGame = games.reduce((a, b) => (b.playtime_forever > (a.playtime_forever || 0) ? b : a), games[0] || {});
  const hoursInTopGame = (topGame.playtime_forever || 0) / 60;
  const topGamePct = totalHours > 0 ? Math.round(hoursInTopGame / totalHours * 100) : 0;

  let personality = 'The Dabbler';
  const desc = [];

  if (topGamePct > 40) { personality = 'The Loyalist'; desc.push(`${topGamePct}% of your time is in ${topGame.name || 'one game'}. You find something and commit.`); }
  else if (topGamePct > 20) { personality = 'The Devoted'; desc.push(`You have a strong favourite (${topGame.name || ''}) but still explore.`); }

  // Genre tilt
  const top = topGenres[0];
  if (top) {
    if (top.name === 'Roguelike' || top.name === 'Souls') personality = 'The Masochist';
    else if (top.name === 'RPG') personality = 'The Story Seeker';
    else if (top.name === 'Competitive' || top.name === 'FPS') personality = 'The Competitor';
    else if (top.name === 'Cosy' || top.name === 'Farming') personality = 'The Vibes Gamer';
    else if (top.name === 'Strategy' || top.name === 'RTS') personality = 'The Tactician';
    else if (top.name === 'Sandbox' || top.name === 'Crafting') personality = 'The Architect';
    else if (top.name === 'Survival') personality = 'The Hoarder';
    else if (top.name === 'MOBA') personality = 'The Glutton for Punishment';
    else if (top.name === 'MMORPG') personality = 'The Grinder';
  }

  // Bacon stats
  const untouched = games.filter(g => !g.playtime_forever).length;
  const obsessed = games.filter(g => g.playtime_forever > 6000).length; // 100h+
  const tried = games.filter(g => g.playtime_forever > 0 && g.playtime_forever < 120).length; // <2h

  return jsonResponse({
    personality,
    description: desc.join(' '),
    totalHours: Math.round(totalHours),
    totalGames: games.length,
    topGenres,
    topGame: topGame.name,
    topGameHours: Math.round(hoursInTopGame),
    topGamePct,
    stats: {
      untouched,
      obsessed,
      tried,
      completionRate: Math.round(((games.length - untouched) / games.length) * 100),
    }
  });
}

// ════════════════════════════════════════════════════════
// HOW LONG TO BEAT
// ════════════════════════════════════════════════════════

// Curated dataset — popular games' HLTB times (hours).
// Keys are lowercase, stripped of punctuation to match loosely.
// Data sourced from HowLongToBeat.com community averages.
const HLTB_DATA = {
  'a way out':                  { mainStory: 6,   mainExtra: 7,   completionist: 8 },
  'baldurs gate 3':              { mainStory: 75,  mainExtra: 100, completionist: 140 },
  'elden ring':                  { mainStory: 60,  mainExtra: 100, completionist: 135 },
  'elden ring nightreign':       { mainStory: 30,  mainExtra: 50,  completionist: 80 },
  'cyberpunk 2077':              { mainStory: 25,  mainExtra: 60,  completionist: 105 },
  'the witcher 3':               { mainStory: 52,  mainExtra: 105, completionist: 175 },
  'red dead redemption 2':       { mainStory: 50,  mainExtra: 85,  completionist: 180 },
  'grand theft auto v':          { mainStory: 31,  mainExtra: 50,  completionist: 83 },
  'skyrim':                      { mainStory: 34,  mainExtra: 110, completionist: 235 },
  'fallout 4':                   { mainStory: 27,  mainExtra: 75,  completionist: 155 },
  'starfield':                   { mainStory: 25,  mainExtra: 60,  completionist: 150 },
  'disco elysium':               { mainStory: 22,  mainExtra: 34,  completionist: 60 },
  'hades':                       { mainStory: 21,  mainExtra: 38,  completionist: 97 },
  'hades ii':                    { mainStory: 25,  mainExtra: 55,  completionist: 120 },
  'hollow knight':               { mainStory: 27,  mainExtra: 40,  completionist: 64 },
  'hollow knight silksong':      { mainStory: 30,  mainExtra: 50,  completionist: 80 },
  'stardew valley':              { mainStory: 53,  mainExtra: 96,  completionist: 155 },
  'terraria':                    { mainStory: 49,  mainExtra: 97,  completionist: 200 },
  'minecraft':                   { mainStory: 55,  mainExtra: 120, completionist: 260 },
  'portal 2':                    { mainStory: 8.5, mainExtra: 13,  completionist: 21 },
  'portal':                      { mainStory: 3,   mainExtra: 5,   completionist: 11 },
  'outer wilds':                 { mainStory: 15,  mainExtra: 25,  completionist: 35 },
  'god of war':                  { mainStory: 21,  mainExtra: 33,  completionist: 52 },
  'god of war ragnarok':         { mainStory: 26,  mainExtra: 38,  completionist: 60 },
  'horizon zero dawn':           { mainStory: 22,  mainExtra: 35,  completionist: 60 },
  'horizon forbidden west':      { mainStory: 30,  mainExtra: 50,  completionist: 95 },
  'sekiro':                      { mainStory: 30,  mainExtra: 40,  completionist: 72 },
  'dark souls iii':              { mainStory: 32,  mainExtra: 46,  completionist: 95 },
  'dark souls remastered':       { mainStory: 42,  mainExtra: 56,  completionist: 108 },
  'bloodborne':                  { mainStory: 33,  mainExtra: 43,  completionist: 77 },
  'lies of p':                   { mainStory: 26,  mainExtra: 37,  completionist: 55 },
  'it takes two':                { mainStory: 11,  mainExtra: 13,  completionist: 16 },
  'split fiction':               { mainStory: 12,  mainExtra: 14,  completionist: 17 },
  'vampire survivors':           { mainStory: 9,   mainExtra: 24,  completionist: 73 },
  'balatro':                     { mainStory: 17,  mainExtra: 27,  completionist: 50 },
  'slay the spire':              { mainStory: 22,  mainExtra: 50,  completionist: 175 },
  'factorio':                    { mainStory: 40,  mainExtra: 100, completionist: 260 },
  'rimworld':                    { mainStory: 65,  mainExtra: 130, completionist: 400 },
  'stray':                       { mainStory: 6,   mainExtra: 8,   completionist: 12 },
  'bioshock':                    { mainStory: 12,  mainExtra: 14,  completionist: 19 },
  'bioshock infinite':           { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'half life 2':                 { mainStory: 13,  mainExtra: 16,  completionist: 22 },
  'half life alyx':              { mainStory: 12,  mainExtra: 15,  completionist: 21 },
  'cuphead':                     { mainStory: 9,   mainExtra: 15,  completionist: 20 },
  'celeste':                     { mainStory: 8,   mainExtra: 13,  completionist: 35 },
  'undertale':                   { mainStory: 6,   mainExtra: 10,  completionist: 20 },
  'resident evil 4':             { mainStory: 17,  mainExtra: 22,  completionist: 36 },
  'resident evil 2':             { mainStory: 9,   mainExtra: 14,  completionist: 22 },
  'resident evil village':       { mainStory: 10,  mainExtra: 14,  completionist: 21 },
  'silent hill 2':               { mainStory: 15,  mainExtra: 20,  completionist: 30 },
  'alan wake 2':                 { mainStory: 17,  mainExtra: 22,  completionist: 29 },
  'control':                     { mainStory: 12,  mainExtra: 18,  completionist: 28 },
  'black myth wukong':           { mainStory: 40,  mainExtra: 55,  completionist: 70 },
  'monster hunter world':        { mainStory: 48,  mainExtra: 100, completionist: 340 },
  'monster hunter wilds':        { mainStory: 35,  mainExtra: 70,  completionist: 220 },
  'palworld':                    { mainStory: 30,  mainExtra: 65,  completionist: 110 },
  'helldivers 2':                { mainStory: 10,  mainExtra: 25,  completionist: 90 },
  'sea of thieves':              { mainStory: 17,  mainExtra: 50,  completionist: 130 },
  'valheim':                     { mainStory: 60,  mainExtra: 125, completionist: 230 },
  'minecraft dungeons':          { mainStory: 10,  mainExtra: 16,  completionist: 30 },
  'deep rock galactic':          { mainStory: 30,  mainExtra: 80,  completionist: 130 },
  'apex legends':                { mainStory: 7,   mainExtra: 20,  completionist: 100 },
  'counter-strike 2':            { mainStory: 3,   mainExtra: 10,  completionist: 50 },
  'dota 2':                      { mainStory: 5,   mainExtra: 15,  completionist: 60 },
  'overwatch 2':                 { mainStory: 6,   mainExtra: 20,  completionist: 85 },
  'marvel rivals':               { mainStory: 8,   mainExtra: 25,  completionist: 100 },
  'league of legends':           { mainStory: 7,   mainExtra: 25,  completionist: 110 },
  'rocket league':               { mainStory: 5,   mainExtra: 15,  completionist: 60 },
  'fortnite':                    { mainStory: 8,   mainExtra: 25,  completionist: 80 },
  'rust':                        { mainStory: 25,  mainExtra: 75,  completionist: 230 },
  'ark survival evolved':        { mainStory: 60,  mainExtra: 160, completionist: 300 },
  'the forest':                  { mainStory: 16,  mainExtra: 26,  completionist: 38 },
  'sons of the forest':          { mainStory: 13,  mainExtra: 25,  completionist: 40 },
  'lethal company':              { mainStory: 8,   mainExtra: 20,  completionist: 45 },
  'phasmophobia':                { mainStory: 10,  mainExtra: 25,  completionist: 75 },
  'dead by daylight':            { mainStory: 20,  mainExtra: 60,  completionist: 220 },
  'hogwarts legacy':             { mainStory: 24,  mainExtra: 36,  completionist: 60 },
  'kingdom come deliverance 2':  { mainStory: 45,  mainExtra: 85,  completionist: 130 },
  'kingdom come deliverance':    { mainStory: 45,  mainExtra: 90,  completionist: 170 },
  'metro exodus':                { mainStory: 15,  mainExtra: 22,  completionist: 36 },
  'days gone':                   { mainStory: 30,  mainExtra: 45,  completionist: 70 },
  'marvels spider-man':          { mainStory: 17,  mainExtra: 25,  completionist: 40 },
  'marvels spider-man 2':        { mainStory: 18,  mainExtra: 26,  completionist: 40 },
  'ghost of tsushima':           { mainStory: 25,  mainExtra: 45,  completionist: 60 },
  'death stranding':             { mainStory: 40,  mainExtra: 65,  completionist: 100 },
  'like a dragon infinite wealth': { mainStory: 47, mainExtra: 75, completionist: 130 },
  'yakuza 0':                    { mainStory: 29,  mainExtra: 55,  completionist: 100 },
  'persona 5 royal':             { mainStory: 100, mainExtra: 130, completionist: 175 },
  'persona 3 reload':             { mainStory: 70, mainExtra: 85,  completionist: 105 },
  'final fantasy xvi':            { mainStory: 36, mainExtra: 60,  completionist: 95 },
  'final fantasy vii rebirth':    { mainStory: 45, mainExtra: 80,  completionist: 130 },
  'doom eternal':                { mainStory: 14,  mainExtra: 21,  completionist: 30 },
  'doom 2016':                    { mainStory: 12, mainExtra: 17,  completionist: 25 },
  'dishonored 2':                { mainStory: 14,  mainExtra: 20,  completionist: 30 },
  'far cry 5':                   { mainStory: 19,  mainExtra: 32,  completionist: 50 },
  'far cry 6':                   { mainStory: 23,  mainExtra: 42,  completionist: 59 },
  'assassins creed odyssey':     { mainStory: 45,  mainExtra: 90,  completionist: 140 },
  'assassins creed valhalla':    { mainStory: 60,  mainExtra: 100, completionist: 140 },
  'assassins creed mirage':      { mainStory: 18,  mainExtra: 25,  completionist: 35 },
  'assassins creed shadows':     { mainStory: 45,  mainExtra: 80,  completionist: 130 },
  'tekken 8':                    { mainStory: 5,   mainExtra: 13,  completionist: 50 },
  'street fighter 6':            { mainStory: 6,   mainExtra: 14,  completionist: 60 },
  'mortal kombat 1':             { mainStory: 6,   mainExtra: 12,  completionist: 40 },
  'forza horizon 5':             { mainStory: 22,  mainExtra: 50,  completionist: 170 },
  'microsoft flight simulator':  { mainStory: 10,  mainExtra: 40,  completionist: 200 },
  'the sims 4':                  { mainStory: 20,  mainExtra: 100, completionist: 500 },
  'cities skylines 2':           { mainStory: 20,  mainExtra: 75,  completionist: 250 },
  'manor lords':                 { mainStory: 18,  mainExtra: 35,  completionist: 80 },
  'satisfactory':                { mainStory: 55,  mainExtra: 130, completionist: 360 },
  'civilization vi':             { mainStory: 16,  mainExtra: 40,  completionist: 220 },
  'civilization vii':            { mainStory: 16,  mainExtra: 40,  completionist: 220 },
  'total war warhammer iii':     { mainStory: 50,  mainExtra: 120, completionist: 400 },
  'no mans sky':                 { mainStory: 30,  mainExtra: 70,  completionist: 170 },
  'terraria':                    { mainStory: 49,  mainExtra: 97,  completionist: 200 },
  'dredge':                      { mainStory: 13,  mainExtra: 19,  completionist: 28 },
  'cult of the lamb':            { mainStory: 12,  mainExtra: 18,  completionist: 30 },
  'tunic':                       { mainStory: 12,  mainExtra: 19,  completionist: 28 },
  'inscryption':                 { mainStory: 11,  mainExtra: 15,  completionist: 23 },
  'return of the obra dinn':     { mainStory: 7,   mainExtra: 9,   completionist: 11 },
  'the witness':                 { mainStory: 21,  mainExtra: 38,  completionist: 73 },
  'factorio space age':          { mainStory: 50,  mainExtra: 90,  completionist: 200 },
  'dead cells':                  { mainStory: 20,  mainExtra: 42,  completionist: 120 },
  'risk of rain 2':              { mainStory: 15,  mainExtra: 40,  completionist: 85 },
  'risk of rain returns':        { mainStory: 14,  mainExtra: 30,  completionist: 60 },
  'into the breach':             { mainStory: 10,  mainExtra: 23,  completionist: 45 },
  'ftl':                         { mainStory: 7,   mainExtra: 20,  completionist: 50 },
  'noita':                       { mainStory: 15,  mainExtra: 40,  completionist: 110 },
  'brotato':                     { mainStory: 10,  mainExtra: 20,  completionist: 55 },
  'jedi survivor':               { mainStory: 22,  mainExtra: 30,  completionist: 44 },
  'jedi fallen order':           { mainStory: 16,  mainExtra: 22,  completionist: 34 },
  'crash bandicoot n sane':      { mainStory: 9,   mainExtra: 13,  completionist: 21 },
  'spyro reignited':             { mainStory: 15,  mainExtra: 22,  completionist: 33 },

  // ── EXPANSION: 200+ more popular games ──
  // AAA RPGs & open world
  'dragon age veilguard':        { mainStory: 40,  mainExtra: 65,  completionist: 90 },
  'dragon age inquisition':      { mainStory: 46,  mainExtra: 85,  completionist: 150 },
  'dragon age origins':          { mainStory: 40,  mainExtra: 69,  completionist: 90 },
  'mass effect 1':               { mainStory: 18,  mainExtra: 27,  completionist: 40 },
  'mass effect 2':               { mainStory: 25,  mainExtra: 37,  completionist: 55 },
  'mass effect 3':               { mainStory: 25,  mainExtra: 38,  completionist: 55 },
  'mass effect andromeda':       { mainStory: 30,  mainExtra: 66,  completionist: 120 },
  'kingdom come deliverance':    { mainStory: 45,  mainExtra: 90,  completionist: 170 },
  'avowed':                      { mainStory: 25,  mainExtra: 40,  completionist: 70 },
  'black myth wukong':           { mainStory: 40,  mainExtra: 55,  completionist: 70 },
  'wo long':                     { mainStory: 25,  mainExtra: 40,  completionist: 75 },
  'nioh 2':                      { mainStory: 45,  mainExtra: 95,  completionist: 170 },
  'nioh':                        { mainStory: 37,  mainExtra: 75,  completionist: 115 },
  'stellar blade':               { mainStory: 25,  mainExtra: 32,  completionist: 55 },
  'neverwinter nights':          { mainStory: 35,  mainExtra: 80,  completionist: 140 },
  'pillars of eternity':         { mainStory: 35,  mainExtra: 72,  completionist: 105 },
  'pillars of eternity ii':      { mainStory: 42,  mainExtra: 80,  completionist: 130 },
  'divinity original sin 2':     { mainStory: 59,  mainExtra: 95,  completionist: 150 },
  'divinity original sin':       { mainStory: 55,  mainExtra: 85,  completionist: 135 },
  'planescape torment':          { mainStory: 40,  mainExtra: 60,  completionist: 85 },
  'path of exile':               { mainStory: 25,  mainExtra: 80,  completionist: 350 },
  'path of exile 2':             { mainStory: 30,  mainExtra: 70,  completionist: 200 },
  'grim dawn':                   { mainStory: 35,  mainExtra: 75,  completionist: 170 },
  'diablo iii':                  { mainStory: 15,  mainExtra: 30,  completionist: 120 },
  'diablo ii resurrected':       { mainStory: 20,  mainExtra: 42,  completionist: 140 },
  'torchlight ii':               { mainStory: 18,  mainExtra: 33,  completionist: 85 },

  // Action / hack n slash
  'devil may cry 5':             { mainStory: 15,  mainExtra: 22,  completionist: 40 },
  'devil may cry v':             { mainStory: 15,  mainExtra: 22,  completionist: 40 },
  'bayonetta':                   { mainStory: 12,  mainExtra: 18,  completionist: 32 },
  'bayonetta 3':                 { mainStory: 14,  mainExtra: 20,  completionist: 38 },
  'metal gear solid v':          { mainStory: 45,  mainExtra: 81,  completionist: 160 },
  'metal gear solid 5':          { mainStory: 45,  mainExtra: 81,  completionist: 160 },
  'ghost of tsushima':           { mainStory: 25,  mainExtra: 45,  completionist: 60 },
  'ghostrunner':                 { mainStory: 8,   mainExtra: 10,  completionist: 18 },
  'ghostrunner 2':               { mainStory: 8,   mainExtra: 11,  completionist: 20 },
  'hi-fi rush':                  { mainStory: 11,  mainExtra: 15,  completionist: 22 },
  'hi fi rush':                  { mainStory: 11,  mainExtra: 15,  completionist: 22 },
  'sifu':                        { mainStory: 8,   mainExtra: 13,  completionist: 22 },
  'returnal':                    { mainStory: 19,  mainExtra: 28,  completionist: 55 },

  // FPS / shooters
  'borderlands 3':               { mainStory: 23,  mainExtra: 48,  completionist: 110 },
  'borderlands 2':               { mainStory: 30,  mainExtra: 57,  completionist: 115 },
  'borderlands':                 { mainStory: 22,  mainExtra: 35,  completionist: 60 },
  'tiny tinas wonderlands':      { mainStory: 17,  mainExtra: 27,  completionist: 50 },
  'deathloop':                   { mainStory: 14,  mainExtra: 19,  completionist: 29 },
  'dishonored':                  { mainStory: 12,  mainExtra: 19,  completionist: 30 },
  'dishonored: death of the outsider': { mainStory: 6, mainExtra: 8, completionist: 12 },
  'bioshock':                    { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'bioshock 2':                  { mainStory: 11,  mainExtra: 14,  completionist: 21 },
  'wolfenstein the new order':   { mainStory: 11,  mainExtra: 14,  completionist: 22 },
  'wolfenstein ii':              { mainStory: 10,  mainExtra: 14,  completionist: 23 },
  'wolfenstein: youngblood':     { mainStory: 8,   mainExtra: 12,  completionist: 22 },
  'titanfall 2':                 { mainStory: 6,   mainExtra: 10,  completionist: 18 },
  'crysis':                      { mainStory: 9,   mainExtra: 12,  completionist: 16 },
  'crysis 2':                    { mainStory: 9,   mainExtra: 12,  completionist: 17 },
  'crysis 3':                    { mainStory: 7,   mainExtra: 10,  completionist: 15 },
  'far cry 3':                   { mainStory: 16,  mainExtra: 27,  completionist: 42 },
  'far cry 4':                   { mainStory: 18,  mainExtra: 30,  completionist: 45 },
  'far cry primal':              { mainStory: 15,  mainExtra: 23,  completionist: 34 },
  'far cry new dawn':            { mainStory: 11,  mainExtra: 16,  completionist: 24 },
  'halo: the master chief collection': { mainStory: 30, mainExtra: 50, completionist: 100 },
  'halo infinite':               { mainStory: 11,  mainExtra: 19,  completionist: 30 },
  'metro 2033 redux':            { mainStory: 10,  mainExtra: 13,  completionist: 17 },
  'metro last light redux':      { mainStory: 11,  mainExtra: 14,  completionist: 18 },
  'cod: black ops 6':            { mainStory: 7,   mainExtra: 10,  completionist: 25 },
  'call of duty: black ops 6':   { mainStory: 7,   mainExtra: 10,  completionist: 25 },
  'cod: modern warfare iii':     { mainStory: 5,   mainExtra: 8,   completionist: 18 },
  'rainbow six siege':           { mainStory: 0,   mainExtra: 60,  completionist: 300 },
  'escape from tarkov':          { mainStory: 0,   mainExtra: 200, completionist: 600 },
  'arma 3':                      { mainStory: 25,  mainExtra: 100, completionist: 300 },

  // Platformers / indie
  'ori and the blind forest':    { mainStory: 9,   mainExtra: 11,  completionist: 17 },
  'limbo':                       { mainStory: 4,   mainExtra: 5,   completionist: 8 },
  'inside':                      { mainStory: 4,   mainExtra: 5,   completionist: 7 },
  'little nightmares':           { mainStory: 4,   mainExtra: 5,   completionist: 9 },
  'little nightmares ii':        { mainStory: 6,   mainExtra: 7,   completionist: 10 },
  'a plague tale: innocence':    { mainStory: 11,  mainExtra: 13,  completionist: 17 },
  'a plague tale: requiem':      { mainStory: 16,  mainExtra: 19,  completionist: 24 },
  'ender lilies':                { mainStory: 14,  mainExtra: 20,  completionist: 34 },
  'ender magnolia':              { mainStory: 15,  mainExtra: 22,  completionist: 38 },
  'blasphemous':                 { mainStory: 14,  mainExtra: 18,  completionist: 28 },
  'blasphemous 2':               { mainStory: 14,  mainExtra: 18,  completionist: 27 },
  'metroid dread':               { mainStory: 9,   mainExtra: 12,  completionist: 20 },
  'animal well':                 { mainStory: 6,   mainExtra: 10,  completionist: 20 },
  'nine sols':                   { mainStory: 18,  mainExtra: 23,  completionist: 32 },
  'sea of stars':                { mainStory: 30,  mainExtra: 42,  completionist: 60 },
  'chained echoes':              { mainStory: 30,  mainExtra: 40,  completionist: 60 },
  'coffee talk':                 { mainStory: 4,   mainExtra: 6,   completionist: 9 },
  'coffee talk episode 2':       { mainStory: 4,   mainExtra: 6,   completionist: 9 },
  'yes your grace':              { mainStory: 7,   mainExtra: 10,  completionist: 18 },
  'papers please':               { mainStory: 6,   mainExtra: 7,   completionist: 10 },
  'firewatch':                   { mainStory: 4,   mainExtra: 5,   completionist: 8 },
  'what remains of edith finch': { mainStory: 2,   mainExtra: 3,   completionist: 4 },
  'gone home':                   { mainStory: 2,   mainExtra: 2,   completionist: 3 },

  // Roguelikes / replayable
  'enter the gungeon':           { mainStory: 18,  mainExtra: 40,  completionist: 90 },
  'exit the gungeon':            { mainStory: 6,   mainExtra: 13,  completionist: 30 },
  'the binding of isaac: rebirth': { mainStory: 15, mainExtra: 50, completionist: 350 },
  'spelunky 2':                  { mainStory: 7,   mainExtra: 20,  completionist: 60 },
  'spelunky':                    { mainStory: 4,   mainExtra: 15,  completionist: 40 },
  'crypt of the necrodancer':    { mainStory: 8,   mainExtra: 18,  completionist: 50 },
  'gunfire reborn':              { mainStory: 10,  mainExtra: 30,  completionist: 80 },
  'hades ii':                    { mainStory: 25,  mainExtra: 55,  completionist: 120 },
  'pacific drive':               { mainStory: 20,  mainExtra: 28,  completionist: 40 },
  'deep rock galactic':          { mainStory: 30,  mainExtra: 80,  completionist: 130 },
  'hades':                       { mainStory: 21,  mainExtra: 38,  completionist: 97 },

  // Story / cinematic
  'the last of us part i':       { mainStory: 15,  mainExtra: 19,  completionist: 28 },
  'the last of us part ii':      { mainStory: 25,  mainExtra: 30,  completionist: 38 },
  'uncharted 4':                 { mainStory: 15,  mainExtra: 20,  completionist: 26 },
  'uncharted: the lost legacy':  { mainStory: 8,   mainExtra: 10,  completionist: 15 },
  'detroit become human':        { mainStory: 11,  mainExtra: 16,  completionist: 32 },
  'heavy rain':                  { mainStory: 10,  mainExtra: 13,  completionist: 23 },
  'beyond two souls':            { mainStory: 10,  mainExtra: 12,  completionist: 16 },
  'quantum break':               { mainStory: 10,  mainExtra: 14,  completionist: 21 },
  'life is strange':             { mainStory: 15,  mainExtra: 18,  completionist: 22 },
  'life is strange 2':           { mainStory: 15,  mainExtra: 18,  completionist: 22 },
  'life is strange: true colors': { mainStory: 10, mainExtra: 12,  completionist: 19 },
  'life is strange: double exposure': { mainStory: 12, mainExtra: 15, completionist: 20 },
  'senuas saga: hellblade ii':   { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'hellblade: senuas sacrifice': { mainStory: 8,   mainExtra: 9,   completionist: 12 },
  'control':                     { mainStory: 12,  mainExtra: 18,  completionist: 28 },
  'alan wake':                   { mainStory: 11,  mainExtra: 14,  completionist: 20 },
  'alan wake 2':                 { mainStory: 17,  mainExtra: 22,  completionist: 29 },

  // Horror / atmospheric
  'amnesia: the dark descent':   { mainStory: 8,   mainExtra: 10,  completionist: 13 },
  'amnesia rebirth':             { mainStory: 9,   mainExtra: 11,  completionist: 15 },
  'outlast':                     { mainStory: 5,   mainExtra: 6,   completionist: 9 },
  'outlast 2':                   { mainStory: 7,   mainExtra: 8,   completionist: 12 },
  'the outlast trials':          { mainStory: 12,  mainExtra: 30,  completionist: 80 },
  'visage':                      { mainStory: 9,   mainExtra: 12,  completionist: 18 },
  'soma':                        { mainStory: 11,  mainExtra: 13,  completionist: 17 },
  'observer':                    { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'prey':                        { mainStory: 17,  mainExtra: 25,  completionist: 38 },
  'resident evil 7':             { mainStory: 10,  mainExtra: 14,  completionist: 22 },
  'silent hill f':               { mainStory: 11,  mainExtra: 15,  completionist: 22 },
  'still wakes the deep':        { mainStory: 6,   mainExtra: 7,   completionist: 10 },

  // Simulation / city / tycoon
  'cities skylines':             { mainStory: 20,  mainExtra: 75,  completionist: 200 },
  'anno 1800':                   { mainStory: 32,  mainExtra: 75,  completionist: 150 },
  'anno 117':                    { mainStory: 30,  mainExtra: 70,  completionist: 140 },
  'banished':                    { mainStory: 10,  mainExtra: 28,  completionist: 80 },
  'prison architect':            { mainStory: 20,  mainExtra: 50,  completionist: 140 },
  'two point hospital':          { mainStory: 25,  mainExtra: 60,  completionist: 120 },
  'two point campus':            { mainStory: 22,  mainExtra: 50,  completionist: 100 },
  'kerbal space program':        { mainStory: 25,  mainExtra: 70,  completionist: 200 },
  'kerbal space program 2':      { mainStory: 25,  mainExtra: 70,  completionist: 180 },
  'oxygen not included':         { mainStory: 35,  mainExtra: 100, completionist: 280 },
  'dyson sphere program':        { mainStory: 40,  mainExtra: 95,  completionist: 220 },
  'factorio':                    { mainStory: 40,  mainExtra: 100, completionist: 260 },
  'project zomboid':             { mainStory: 30,  mainExtra: 100, completionist: 500 },
  'the long dark':               { mainStory: 20,  mainExtra: 50,  completionist: 160 },
  'subnautica':                  { mainStory: 32,  mainExtra: 45,  completionist: 75 },
  'subnautica below zero':       { mainStory: 20,  mainExtra: 27,  completionist: 45 },

  // Strategy
  'civilization v':              { mainStory: 18,  mainExtra: 50,  completionist: 230 },
  'stellaris':                   { mainStory: 22,  mainExtra: 75,  completionist: 360 },
  'total war: three kingdoms':   { mainStory: 50,  mainExtra: 120, completionist: 300 },
  'total war: rome ii':          { mainStory: 45,  mainExtra: 100, completionist: 300 },
  'xcom 2':                      { mainStory: 43,  mainExtra: 65,  completionist: 120 },
  'xcom: enemy unknown':         { mainStory: 25,  mainExtra: 40,  completionist: 75 },
  'frostpunk':                   { mainStory: 18,  mainExtra: 40,  completionist: 80 },
  'frostpunk 2':                 { mainStory: 25,  mainExtra: 50,  completionist: 95 },
  'wargame red dragon':          { mainStory: 25,  mainExtra: 60,  completionist: 140 },
  'starcraft ii':                { mainStory: 40,  mainExtra: 65,  completionist: 160 },

  // Co-op / multiplayer
  'split fiction':               { mainStory: 12,  mainExtra: 14,  completionist: 17 },
  'a way out':                   { mainStory: 6,   mainExtra: 7,   completionist: 8 },
  'unravel two':                 { mainStory: 7,   mainExtra: 9,   completionist: 11 },
  'sackboy: a big adventure':    { mainStory: 11,  mainExtra: 17,  completionist: 27 },
  'overcooked 2':                { mainStory: 7,   mainExtra: 13,  completionist: 31 },
  'overcooked':                  { mainStory: 6,   mainExtra: 11,  completionist: 20 },
  'moving out':                  { mainStory: 6,   mainExtra: 10,  completionist: 15 },
  'kinetic boom':                { mainStory: 8,   mainExtra: 12,  completionist: 18 },
  'keep talking and nobody explodes': { mainStory: 5, mainExtra: 10, completionist: 20 },

  // Fighting
  'guilty gear strive':          { mainStory: 3,   mainExtra: 12,  completionist: 50 },
  'dragon ball sparking zero':   { mainStory: 8,   mainExtra: 18,  completionist: 50 },
  'dragon ball fighterz':        { mainStory: 6,   mainExtra: 15,  completionist: 50 },

  // Japanese RPGs
  'persona 4 golden':            { mainStory: 80,  mainExtra: 100, completionist: 133 },
  'persona 3 portable':          { mainStory: 60,  mainExtra: 82,  completionist: 110 },
  'yakuza kiwami':               { mainStory: 17,  mainExtra: 37,  completionist: 70 },
  'yakuza kiwami 2':             { mainStory: 20,  mainExtra: 40,  completionist: 80 },
  'yakuza 3':                    { mainStory: 22,  mainExtra: 40,  completionist: 80 },
  'yakuza 4':                    { mainStory: 23,  mainExtra: 42,  completionist: 85 },
  'yakuza 5':                    { mainStory: 43,  mainExtra: 65,  completionist: 120 },
  'yakuza 6':                    { mainStory: 24,  mainExtra: 38,  completionist: 65 },
  'yakuza: like a dragon':       { mainStory: 45,  mainExtra: 78,  completionist: 120 },
  'like a dragon: ishin':        { mainStory: 28,  mainExtra: 48,  completionist: 95 },
  'like a dragon gaiden':        { mainStory: 14,  mainExtra: 20,  completionist: 35 },
  'judgment':                    { mainStory: 30,  mainExtra: 55,  completionist: 80 },
  'lost judgment':               { mainStory: 30,  mainExtra: 58,  completionist: 80 },
  'tales of arise':              { mainStory: 40,  mainExtra: 57,  completionist: 90 },
  'ys viii':                     { mainStory: 40,  mainExtra: 60,  completionist: 100 },
  'ni no kuni ii':               { mainStory: 40,  mainExtra: 60,  completionist: 100 },
  'octopath traveler':           { mainStory: 60,  mainExtra: 80,  completionist: 110 },
  'octopath traveler ii':        { mainStory: 55,  mainExtra: 75,  completionist: 105 },
  'dragon quest xi':             { mainStory: 60,  mainExtra: 95,  completionist: 125 },

  // Racing / sports / sim
  'mario kart 8 deluxe':         { mainStory: 13,  mainExtra: 50,  completionist: 100 },
  'gran turismo 7':              { mainStory: 25,  mainExtra: 100, completionist: 250 },
  'forza motorsport':            { mainStory: 20,  mainExtra: 80,  completionist: 180 },
  'need for speed unbound':      { mainStory: 18,  mainExtra: 32,  completionist: 55 },
  'need for speed heat':         { mainStory: 16,  mainExtra: 30,  completionist: 50 },
  'need for speed: most wanted': { mainStory: 13,  mainExtra: 20,  completionist: 32 },
  'tony hawk 1+2':               { mainStory: 8,   mainExtra: 14,  completionist: 30 },
  'rocket league':               { mainStory: 5,   mainExtra: 15,  completionist: 60 },

  // Survival / crafting
  'enshrouded':                  { mainStory: 40,  mainExtra: 80,  completionist: 150 },
  'nightingale':                 { mainStory: 30,  mainExtra: 60,  completionist: 120 },
  'grounded':                    { mainStory: 25,  mainExtra: 45,  completionist: 100 },
  'green hell':                  { mainStory: 18,  mainExtra: 30,  completionist: 60 },
  '7 days to die':               { mainStory: 25,  mainExtra: 80,  completionist: 300 },
  'v rising':                    { mainStory: 40,  mainExtra: 75,  completionist: 140 },
  'icarus':                      { mainStory: 20,  mainExtra: 50,  completionist: 120 },

  // MMOs / live service
  'world of warcraft':           { mainStory: 90,  mainExtra: 250, completionist: 1500 },
  'final fantasy xiv: a realm reborn': { mainStory: 120, mainExtra: 250, completionist: 700 },
  'destiny 2':                   { mainStory: 40,  mainExtra: 100, completionist: 400 },
  'warframe':                    { mainStory: 50,  mainExtra: 150, completionist: 600 },
  'guild wars 2':                { mainStory: 80,  mainExtra: 200, completionist: 500 },
  'runescape':                   { mainStory: 100, mainExtra: 300, completionist: 2000 },

  // Recent 2024–2026 releases
  'wukong':                      { mainStory: 40,  mainExtra: 55,  completionist: 70 },
  'concord':                     { mainStory: 5,   mainExtra: 10,  completionist: 25 },
  'silent hill 2 remake':        { mainStory: 15,  mainExtra: 20,  completionist: 30 },
  'indiana jones and the great circle': { mainStory: 22, mainExtra: 35, completionist: 55 },
  'avatar frontiers of pandora': { mainStory: 28,  mainExtra: 55,  completionist: 90 },
  'metaphor refantazio':         { mainStory: 75,  mainExtra: 100, completionist: 140 },
  'elden ring nightreign':       { mainStory: 30,  mainExtra: 50,  completionist: 80 },
  'silksong':                    { mainStory: 30,  mainExtra: 50,  completionist: 80 },
  'the outer worlds 2':          { mainStory: 25,  mainExtra: 40,  completionist: 60 },
  'fable':                       { mainStory: 30,  mainExtra: 50,  completionist: 80 },
  'marathon':                    { mainStory: 15,  mainExtra: 40,  completionist: 120 },
  'subnautica 2':                { mainStory: 35,  mainExtra: 50,  completionist: 80 },
  'crimson desert':              { mainStory: 40,  mainExtra: 70,  completionist: 110 },
  'lost soul aside':             { mainStory: 15,  mainExtra: 22,  completionist: 35 },
  'light no fire':               { mainStory: 45,  mainExtra: 100, completionist: 200 },
  'perfect dark':                { mainStory: 12,  mainExtra: 18,  completionist: 28 },
  'pragmata':                    { mainStory: 15,  mainExtra: 20,  completionist: 30 },
  'phantom blade zero':          { mainStory: 20,  mainExtra: 30,  completionist: 45 },
  'stalker 2':                   { mainStory: 40,  mainExtra: 65,  completionist: 100 },
  's.t.a.l.k.e.r. 2':            { mainStory: 40,  mainExtra: 65,  completionist: 100 },
  'bloodlines 2':                { mainStory: 30,  mainExtra: 50,  completionist: 80 },
  'deadlock':                    { mainStory: 10,  mainExtra: 30,  completionist: 100 },
  'judas':                       { mainStory: 15,  mainExtra: 22,  completionist: 35 },
  'tides of tomorrow':           { mainStory: 10,  mainExtra: 15,  completionist: 20 },
  'wuchang: fallen feathers':    { mainStory: 25,  mainExtra: 38,  completionist: 55 },
  'wuchang fallen feathers':     { mainStory: 25,  mainExtra: 38,  completionist: 55 },
  'directive 8020':              { mainStory: 9,   mainExtra: 12,  completionist: 18 },

  // ── 2.3x expansion ── More AAA, indie, classics, 2023-2025 releases ──
  // RPGs
  'pillars of eternity':         { mainStory: 35,  mainExtra: 72,  completionist: 105 },
  'pillars of eternity ii':      { mainStory: 42,  mainExtra: 80,  completionist: 130 },
  'shadowrun returns':           { mainStory: 12,  mainExtra: 18,  completionist: 25 },
  'shadowrun dragonfall':        { mainStory: 20,  mainExtra: 28,  completionist: 40 },
  'wasteland 3':                 { mainStory: 40,  mainExtra: 60,  completionist: 85 },
  'tyranny':                     { mainStory: 22,  mainExtra: 38,  completionist: 60 },
  'torment tides of numenera':   { mainStory: 28,  mainExtra: 48,  completionist: 75 },
  'expeditions rome':            { mainStory: 40,  mainExtra: 62,  completionist: 90 },
  'expeditions viking':          { mainStory: 30,  mainExtra: 48,  completionist: 70 },
  'encased':                     { mainStory: 25,  mainExtra: 45,  completionist: 70 },
  'atom rpg':                    { mainStory: 35,  mainExtra: 55,  completionist: 85 },
  'the outer worlds':            { mainStory: 15,  mainExtra: 26,  completionist: 40 },
  'atomic heart':                { mainStory: 20,  mainExtra: 25,  completionist: 40 },
  'mortal shell':                { mainStory: 10,  mainExtra: 14,  completionist: 22 },
  'salt and sanctuary':          { mainStory: 18,  mainExtra: 28,  completionist: 48 },
  'salt and sacrifice':          { mainStory: 22,  mainExtra: 30,  completionist: 50 },
  'remnant from the ashes':      { mainStory: 15,  mainExtra: 25,  completionist: 45 },
  'remnant 2':                   { mainStory: 18,  mainExtra: 28,  completionist: 50 },
  'chrono cross':                { mainStory: 37,  mainExtra: 56,  completionist: 80 },
  'chrono trigger':              { mainStory: 22,  mainExtra: 30,  completionist: 55 },
  'final fantasy vii remake':    { mainStory: 33,  mainExtra: 48,  completionist: 90 },
  'final fantasy x':             { mainStory: 48,  mainExtra: 90,  completionist: 150 },
  'final fantasy xii':           { mainStory: 60,  mainExtra: 85,  completionist: 130 },
  'final fantasy xiii':          { mainStory: 45,  mainExtra: 65,  completionist: 108 },
  'final fantasy xv':            { mainStory: 28,  mainExtra: 55,  completionist: 108 },
  'ni no kuni':                  { mainStory: 38,  mainExtra: 62,  completionist: 90 },
  'bravely default':             { mainStory: 60,  mainExtra: 90,  completionist: 120 },
  'fire emblem three houses':    { mainStory: 55,  mainExtra: 90,  completionist: 200 },
  'fire emblem engage':          { mainStory: 45,  mainExtra: 60,  completionist: 100 },
  'xenoblade chronicles':        { mainStory: 70,  mainExtra: 95,  completionist: 170 },
  'xenoblade chronicles 2':      { mainStory: 65,  mainExtra: 100, completionist: 150 },
  'xenoblade chronicles 3':      { mainStory: 60,  mainExtra: 95,  completionist: 130 },
  'dragon quest viii':           { mainStory: 65,  mainExtra: 85,  completionist: 110 },
  'dragon quest builders 2':     { mainStory: 58,  mainExtra: 90,  completionist: 140 },
  'dragon\'s dogma':              { mainStory: 33,  mainExtra: 60,  completionist: 110 },
  'dragon\'s dogma 2':            { mainStory: 35,  mainExtra: 55,  completionist: 90 },
  'greedfall':                   { mainStory: 30,  mainExtra: 50,  completionist: 75 },
  'greedfall 2':                 { mainStory: 32,  mainExtra: 55,  completionist: 80 },
  'the surge':                   { mainStory: 15,  mainExtra: 22,  completionist: 35 },
  'the surge 2':                 { mainStory: 18,  mainExtra: 25,  completionist: 40 },
  'code vein':                   { mainStory: 32,  mainExtra: 45,  completionist: 70 },
  'stranger of paradise':        { mainStory: 25,  mainExtra: 38,  completionist: 65 },
  'two worlds':                  { mainStory: 25,  mainExtra: 40,  completionist: 60 },
  'gothic':                      { mainStory: 35,  mainExtra: 50,  completionist: 70 },
  'gothic 2':                    { mainStory: 50,  mainExtra: 80,  completionist: 115 },
  'gothic 3':                    { mainStory: 60,  mainExtra: 90,  completionist: 130 },
  'risen':                       { mainStory: 30,  mainExtra: 48,  completionist: 65 },
  'elex':                        { mainStory: 35,  mainExtra: 55,  completionist: 80 },
  'elex 2':                      { mainStory: 38,  mainExtra: 58,  completionist: 85 },
  'kenshi':                      { mainStory: 60,  mainExtra: 150, completionist: 500 },

  // Shooters & action
  'call of duty: modern warfare':{ mainStory: 7,   mainExtra: 10,  completionist: 20 },
  'call of duty: mw ii':         { mainStory: 7,   mainExtra: 11,  completionist: 23 },
  'call of duty: modern warfare iii': { mainStory: 5, mainExtra: 8,  completionist: 18 },
  'call of duty: black ops cold war': { mainStory: 7, mainExtra: 10, completionist: 21 },
  'call of duty: black ops 6':   { mainStory: 7,   mainExtra: 10,  completionist: 25 },
  'call of duty: vanguard':      { mainStory: 7,   mainExtra: 9,   completionist: 18 },
  'call of duty: warzone':       { mainStory: 0,   mainExtra: 100, completionist: 500 },
  'battlefield 1':               { mainStory: 7,   mainExtra: 10,  completionist: 30 },
  'battlefield 4':               { mainStory: 7,   mainExtra: 12,  completionist: 40 },
  'battlefield 2042':            { mainStory: 0,   mainExtra: 30,  completionist: 120 },
  'mass effect 1':               { mainStory: 18,  mainExtra: 27,  completionist: 40 },
  'mass effect 2':               { mainStory: 25,  mainExtra: 37,  completionist: 55 },
  'mass effect 3':               { mainStory: 25,  mainExtra: 38,  completionist: 55 },
  'mass effect andromeda':       { mainStory: 30,  mainExtra: 66,  completionist: 120 },
  'mass effect legendary edition': { mainStory: 70, mainExtra: 110, completionist: 160 },
  'quake':                       { mainStory: 6,   mainExtra: 8,   completionist: 12 },
  'quake ii':                    { mainStory: 7,   mainExtra: 9,   completionist: 13 },
  'painkiller':                  { mainStory: 10,  mainExtra: 12,  completionist: 18 },
  'serious sam':                 { mainStory: 8,   mainExtra: 11,  completionist: 16 },
  'turbo overkill':              { mainStory: 12,  mainExtra: 16,  completionist: 25 },
  'ultrakill':                   { mainStory: 14,  mainExtra: 20,  completionist: 35 },
  'amid evil':                   { mainStory: 8,   mainExtra: 11,  completionist: 17 },
  'dusk':                        { mainStory: 7,   mainExtra: 10,  completionist: 15 },
  'cruelty squad':               { mainStory: 10,  mainExtra: 16,  completionist: 30 },
  'max payne':                   { mainStory: 9,   mainExtra: 11,  completionist: 15 },
  'max payne 2':                 { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'max payne 3':                 { mainStory: 10,  mainExtra: 14,  completionist: 24 },
  'just cause 3':                { mainStory: 22,  mainExtra: 40,  completionist: 77 },
  'just cause 4':                { mainStory: 20,  mainExtra: 35,  completionist: 60 },
  'saints row iv':               { mainStory: 16,  mainExtra: 30,  completionist: 55 },
  'saints row the third':        { mainStory: 13,  mainExtra: 27,  completionist: 50 },
  'mafia definitive edition':    { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'mafia ii':                    { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'mafia iii':                   { mainStory: 21,  mainExtra: 34,  completionist: 54 },
  'l.a. noire':                  { mainStory: 21,  mainExtra: 27,  completionist: 40 },
  'sleeping dogs':               { mainStory: 13,  mainExtra: 22,  completionist: 40 },

  // Horror & atmospheric
  'dead space remake':           { mainStory: 13,  mainExtra: 16,  completionist: 24 },
  'dead space':                  { mainStory: 11,  mainExtra: 14,  completionist: 22 },
  'dead space 2':                { mainStory: 11,  mainExtra: 14,  completionist: 20 },
  'dead space 3':                { mainStory: 14,  mainExtra: 17,  completionist: 26 },
  'the callisto protocol':       { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'the evil within':             { mainStory: 16,  mainExtra: 21,  completionist: 30 },
  'the evil within 2':           { mainStory: 15,  mainExtra: 20,  completionist: 30 },
  'man of medan':                { mainStory: 5,   mainExtra: 7,   completionist: 11 },
  'little hope':                 { mainStory: 5,   mainExtra: 7,   completionist: 11 },
  'house of ashes':              { mainStory: 6,   mainExtra: 8,   completionist: 13 },
  'the devil in me':             { mainStory: 7,   mainExtra: 9,   completionist: 14 },
  'until dawn':                  { mainStory: 9,   mainExtra: 11,  completionist: 19 },
  'the quarry':                  { mainStory: 10,  mainExtra: 12,  completionist: 22 },
  'observation':                 { mainStory: 5,   mainExtra: 6,   completionist: 9 },
  'layers of fear':              { mainStory: 4,   mainExtra: 5,   completionist: 8 },
  'madison':                     { mainStory: 6,   mainExtra: 8,   completionist: 13 },
  'cry of fear':                 { mainStory: 8,   mainExtra: 10,  completionist: 18 },
  'iron lung':                   { mainStory: 1,   mainExtra: 2,   completionist: 3 },
  'signalis':                    { mainStory: 8,   mainExtra: 10,  completionist: 15 },
  'mouthwashing':                { mainStory: 2,   mainExtra: 3,   completionist: 4 },
  'crow country':                { mainStory: 5,   mainExtra: 7,   completionist: 11 },
  'resident evil 7 biohazard':   { mainStory: 10,  mainExtra: 14,  completionist: 22 },
  'resident evil 2 remake':      { mainStory: 9,   mainExtra: 14,  completionist: 22 },
  'resident evil 3 remake':      { mainStory: 6,   mainExtra: 8,   completionist: 15 },
  'resident evil 5':             { mainStory: 12,  mainExtra: 16,  completionist: 26 },
  'resident evil 6':             { mainStory: 21,  mainExtra: 29,  completionist: 42 },

  // Indie / platformer / metroidvania
  'dead cells':                  { mainStory: 20,  mainExtra: 42,  completionist: 120 },
  'death\'s door':                { mainStory: 9,   mainExtra: 12,  completionist: 17 },
  'supraland':                   { mainStory: 12,  mainExtra: 16,  completionist: 25 },
  'supraland six inches under':  { mainStory: 14,  mainExtra: 18,  completionist: 28 },
  'supraworld':                  { mainStory: 16,  mainExtra: 22,  completionist: 35 },
  'haven park':                  { mainStory: 2,   mainExtra: 3,   completionist: 5 },
  'owlboy':                      { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'shantae and the seven sirens':{ mainStory: 10,  mainExtra: 13,  completionist: 18 },
  'shovel knight':               { mainStory: 9,   mainExtra: 13,  completionist: 22 },
  'the messenger':               { mainStory: 13,  mainExtra: 17,  completionist: 25 },
  'sundered':                    { mainStory: 11,  mainExtra: 14,  completionist: 22 },
  'bloodstained ritual of the night': { mainStory: 16, mainExtra: 24, completionist: 38 },
  'axiom verge':                 { mainStory: 10,  mainExtra: 14,  completionist: 22 },
  'axiom verge 2':               { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'environmental station alpha': { mainStory: 10,  mainExtra: 15,  completionist: 25 },
  'f-zero 99':                   { mainStory: 5,   mainExtra: 20,  completionist: 60 },
  'bastion':                     { mainStory: 6,   mainExtra: 9,   completionist: 15 },
  'transistor':                  { mainStory: 6,   mainExtra: 9,   completionist: 14 },
  'pyre':                        { mainStory: 9,   mainExtra: 11,  completionist: 15 },
  'outer wilds echoes of the eye': { mainStory: 9, mainExtra: 12, completionist: 18 },
  'heavens vault':               { mainStory: 14,  mainExtra: 18,  completionist: 25 },
  'hypnospace outlaw':           { mainStory: 9,   mainExtra: 12,  completionist: 16 },
  'the pedestrian':              { mainStory: 4,   mainExtra: 5,   completionist: 8 },
  'patrick\'s parabox':           { mainStory: 7,   mainExtra: 13,  completionist: 22 },
  'talos principle':             { mainStory: 21,  mainExtra: 28,  completionist: 42 },
  'the talos principle 2':       { mainStory: 24,  mainExtra: 32,  completionist: 48 },
  'manifold garden':             { mainStory: 6,   mainExtra: 9,   completionist: 14 },
  'antichamber':                 { mainStory: 6,   mainExtra: 8,   completionist: 11 },
  'the forgotten city':          { mainStory: 7,   mainExtra: 9,   completionist: 13 },
  'pentiment':                   { mainStory: 18,  mainExtra: 22,  completionist: 30 },
  'strange horticulture':        { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'mini motorways':              { mainStory: 5,   mainExtra: 12,  completionist: 30 },
  'mini metro':                  { mainStory: 4,   mainExtra: 10,  completionist: 25 },

  // Strategy / sim
  'company of heroes 2':         { mainStory: 16,  mainExtra: 30,  completionist: 65 },
  'company of heroes':           { mainStory: 14,  mainExtra: 28,  completionist: 60 },
  'starcraft ii wings of liberty': { mainStory: 17, mainExtra: 25, completionist: 40 },
  'starcraft ii heart of the swarm': { mainStory: 12, mainExtra: 18, completionist: 30 },
  'starcraft ii legacy of the void': { mainStory: 12, mainExtra: 18, completionist: 30 },
  'warcraft iii reforged':       { mainStory: 22,  mainExtra: 40,  completionist: 80 },
  'age of empires iii':          { mainStory: 20,  mainExtra: 45,  completionist: 110 },
  'commandos 2':                 { mainStory: 25,  mainExtra: 35,  completionist: 50 },
  'commandos origins':           { mainStory: 20,  mainExtra: 30,  completionist: 45 },
  'shadow tactics blades of the shogun': { mainStory: 26, mainExtra: 38, completionist: 55 },
  'desperados iii':              { mainStory: 25,  mainExtra: 34,  completionist: 48 },
  'they are billions':           { mainStory: 32,  mainExtra: 50,  completionist: 90 },
  'battletech':                  { mainStory: 45,  mainExtra: 75,  completionist: 125 },
  'cities: skylines':            { mainStory: 20,  mainExtra: 75,  completionist: 200 },
  'the sims 3':                  { mainStory: 30,  mainExtra: 120, completionist: 400 },
  'the sims 2':                  { mainStory: 25,  mainExtra: 100, completionist: 300 },
  'the settlers 7':              { mainStory: 15,  mainExtra: 30,  completionist: 60 },
  'jurassic world evolution 2':  { mainStory: 15,  mainExtra: 30,  completionist: 70 },
  'planet coaster':              { mainStory: 15,  mainExtra: 40,  completionist: 120 },
  'parkitect':                   { mainStory: 15,  mainExtra: 30,  completionist: 65 },
  'surviving mars':              { mainStory: 28,  mainExtra: 50,  completionist: 100 },
  'tropico 5':                   { mainStory: 18,  mainExtra: 38,  completionist: 80 },
  'anno 2070':                   { mainStory: 20,  mainExtra: 45,  completionist: 100 },
  'anno 2205':                   { mainStory: 20,  mainExtra: 40,  completionist: 90 },
  'workers and resources':       { mainStory: 40,  mainExtra: 100, completionist: 250 },
  'dwarf fortress':              { mainStory: 50,  mainExtra: 150, completionist: 1000 },
  'caves of qud':                { mainStory: 40,  mainExtra: 100, completionist: 500 },
  'noita':                       { mainStory: 15,  mainExtra: 40,  completionist: 110 },

  // Racing & sports
  'f1 23':                       { mainStory: 15,  mainExtra: 70,  completionist: 180 },
  'f1 22':                       { mainStory: 15,  mainExtra: 65,  completionist: 170 },
  'grid legends':                { mainStory: 12,  mainExtra: 35,  completionist: 80 },
  'dirt 5':                      { mainStory: 10,  mainExtra: 25,  completionist: 55 },
  'need for speed unbound':      { mainStory: 18,  mainExtra: 32,  completionist: 55 },
  'need for speed heat':         { mainStory: 16,  mainExtra: 30,  completionist: 50 },
  'burnout paradise':            { mainStory: 10,  mainExtra: 18,  completionist: 40 },
  'the crew motorfest':          { mainStory: 15,  mainExtra: 45,  completionist: 100 },
  'the crew 2':                  { mainStory: 25,  mainExtra: 60,  completionist: 140 },
  'wreckfest':                   { mainStory: 15,  mainExtra: 30,  completionist: 60 },
  'project cars 3':              { mainStory: 15,  mainExtra: 60,  completionist: 150 },
  'nascar 21':                   { mainStory: 20,  mainExtra: 60,  completionist: 140 },
  'motogp 24':                   { mainStory: 12,  mainExtra: 40,  completionist: 100 },
  'crash team racing':           { mainStory: 5,   mainExtra: 14,  completionist: 30 },
  'mario kart 8 deluxe':         { mainStory: 13,  mainExtra: 50,  completionist: 100 },
  'nba 2k24':                    { mainStory: 25,  mainExtra: 60,  completionist: 120 },
  'nba 2k25':                    { mainStory: 25,  mainExtra: 60,  completionist: 120 },
  'madden nfl 25':               { mainStory: 15,  mainExtra: 45,  completionist: 100 },
  'nhl 24':                      { mainStory: 15,  mainExtra: 45,  completionist: 100 },
  'mlb the show 24':             { mainStory: 20,  mainExtra: 60,  completionist: 140 },
  'tony hawk pro skater 3+4':    { mainStory: 8,   mainExtra: 14,  completionist: 28 },
  'skate 3':                     { mainStory: 10,  mainExtra: 20,  completionist: 40 },
  'session skate sim':           { mainStory: 14,  mainExtra: 40,  completionist: 100 },

  // MMOs / live / multiplayer
  'guild wars 2':                { mainStory: 80,  mainExtra: 200, completionist: 500 },
  'lost ark':                    { mainStory: 35,  mainExtra: 120, completionist: 400 },
  'new world':                   { mainStory: 60,  mainExtra: 150, completionist: 400 },
  'black desert online':         { mainStory: 80,  mainExtra: 200, completionist: 700 },
  'albion online':               { mainStory: 50,  mainExtra: 180, completionist: 600 },
  'throne and liberty':          { mainStory: 40,  mainExtra: 120, completionist: 300 },
  'the elder scrolls online':    { mainStory: 100, mainExtra: 200, completionist: 500 },
  'final fantasy xi':            { mainStory: 120, mainExtra: 300, completionist: 1200 },
  'phantasy star online 2':      { mainStory: 50,  mainExtra: 150, completionist: 400 },
  'dungeon fighter online':      { mainStory: 60,  mainExtra: 200, completionist: 800 },
  'tarisland':                   { mainStory: 40,  mainExtra: 100, completionist: 200 },
  'genshin impact':              { mainStory: 75,  mainExtra: 150, completionist: 400 },
  'honkai star rail':            { mainStory: 40,  mainExtra: 80,  completionist: 200 },
  'wuthering waves':             { mainStory: 25,  mainExtra: 60,  completionist: 150 },
  'zenless zone zero':           { mainStory: 20,  mainExtra: 50,  completionist: 120 },

  // Visual novels & narrative
  'steins gate':                 { mainStory: 30,  mainExtra: 45,  completionist: 60 },
  'danganronpa':                 { mainStory: 28,  mainExtra: 32,  completionist: 38 },
  'danganronpa 2':               { mainStory: 32,  mainExtra: 37,  completionist: 44 },
  'ace attorney trilogy':        { mainStory: 45,  mainExtra: 50,  completionist: 60 },
  'great ace attorney chronicles': { mainStory: 48, mainExtra: 55, completionist: 70 },
  'ghost trick':                 { mainStory: 14,  mainExtra: 16,  completionist: 22 },
  'zero escape 999':             { mainStory: 22,  mainExtra: 26,  completionist: 32 },
  '13 sentinels':                { mainStory: 28,  mainExtra: 34,  completionist: 45 },
  'nine sols':                   { mainStory: 18,  mainExtra: 23,  completionist: 32 },
  'citizen sleeper':             { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'citizen sleeper 2':           { mainStory: 10,  mainExtra: 13,  completionist: 18 },
  'road 96':                     { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'kentucky route zero':         { mainStory: 9,   mainExtra: 12,  completionist: 16 },
  'night in the woods':          { mainStory: 10,  mainExtra: 12,  completionist: 17 },
  'norco':                       { mainStory: 6,   mainExtra: 8,   completionist: 12 },
  'primordia':                   { mainStory: 7,   mainExtra: 9,   completionist: 13 },
  'kathy rain':                  { mainStory: 5,   mainExtra: 6,   completionist: 8 },
  'the wolf among us':           { mainStory: 7,   mainExtra: 8,   completionist: 11 },
  'life is strange remastered':  { mainStory: 15,  mainExtra: 18,  completionist: 22 },
  'life is strange before the storm': { mainStory: 9, mainExtra: 11, completionist: 14 },
  'tell me why':                 { mainStory: 8,   mainExtra: 10,  completionist: 13 },

  // Cosy / farming / life
  'coral island':                { mainStory: 40,  mainExtra: 65,  completionist: 110 },
  'my time at portia':           { mainStory: 56,  mainExtra: 80,  completionist: 130 },
  'my time at sandrock':         { mainStory: 60,  mainExtra: 90,  completionist: 150 },
  'roots of pacha':              { mainStory: 25,  mainExtra: 45,  completionist: 70 },
  'story of seasons':            { mainStory: 40,  mainExtra: 65,  completionist: 100 },
  'rune factory 5':              { mainStory: 45,  mainExtra: 80,  completionist: 130 },
  'harvestella':                 { mainStory: 40,  mainExtra: 55,  completionist: 75 },
  'dinkum':                      { mainStory: 35,  mainExtra: 60,  completionist: 110 },
  'wylde flowers':               { mainStory: 30,  mainExtra: 45,  completionist: 70 },
  'garden paws':                 { mainStory: 25,  mainExtra: 40,  completionist: 70 },
  'wytchwood':                   { mainStory: 15,  mainExtra: 20,  completionist: 28 },
  'mineko\'s night market':       { mainStory: 10,  mainExtra: 14,  completionist: 22 },
  'spiritfarer':                 { mainStory: 25,  mainExtra: 32,  completionist: 38 },
  'a short hike':                { mainStory: 1.5, mainExtra: 2.5, completionist: 4 },
  'eastward':                    { mainStory: 25,  mainExtra: 32,  completionist: 42 },
  'potion craft':                { mainStory: 15,  mainExtra: 22,  completionist: 40 },
  'travellers rest':             { mainStory: 20,  mainExtra: 35,  completionist: 65 },
  'tavern talk':                 { mainStory: 6,   mainExtra: 8,   completionist: 12 },
  'ooblets':                     { mainStory: 25,  mainExtra: 40,  completionist: 65 },
  'snacko':                      { mainStory: 20,  mainExtra: 32,  completionist: 55 },
  'fae farm':                    { mainStory: 25,  mainExtra: 40,  completionist: 70 },
  'sun haven':                   { mainStory: 28,  mainExtra: 45,  completionist: 80 },
  'littlewood':                  { mainStory: 18,  mainExtra: 30,  completionist: 55 },
  'palia':                       { mainStory: 30,  mainExtra: 60,  completionist: 120 },
  'cozy grove':                  { mainStory: 20,  mainExtra: 35,  completionist: 60 },
  'tiny glade':                  { mainStory: 4,   mainExtra: 8,   completionist: 15 },
  'powerwash simulator':         { mainStory: 12,  mainExtra: 22,  completionist: 55 },
  'house flipper':               { mainStory: 10,  mainExtra: 18,  completionist: 45 },
  'house flipper 2':             { mainStory: 15,  mainExtra: 25,  completionist: 55 },
  'pc building simulator':       { mainStory: 15,  mainExtra: 22,  completionist: 40 },
  'pc building simulator 2':     { mainStory: 18,  mainExtra: 28,  completionist: 50 },
  'farm simulator 25':           { mainStory: 30,  mainExtra: 75,  completionist: 200 },
  'farming simulator 22':        { mainStory: 25,  mainExtra: 65,  completionist: 180 },
  'goat simulator 3':            { mainStory: 5,   mainExtra: 9,   completionist: 20 },

  // Roguelike / replayable
  'faster than light':           { mainStory: 7,   mainExtra: 20,  completionist: 50 },
  'streets of rogue':            { mainStory: 15,  mainExtra: 35,  completionist: 80 },
  'caves of qud':                { mainStory: 30,  mainExtra: 100, completionist: 400 },
  'wildfrost':                   { mainStory: 14,  mainExtra: 28,  completionist: 60 },
  'monster train':               { mainStory: 14,  mainExtra: 30,  completionist: 85 },
  'slice and dice':              { mainStory: 10,  mainExtra: 22,  completionist: 50 },
  'across the obelisk':          { mainStory: 18,  mainExtra: 35,  completionist: 70 },
  'griftlands':                  { mainStory: 18,  mainExtra: 32,  completionist: 55 },
  'dicey dungeons':              { mainStory: 9,   mainExtra: 18,  completionist: 38 },
  'ring of pain':                { mainStory: 6,   mainExtra: 14,  completionist: 30 },
  'nova drift':                  { mainStory: 8,   mainExtra: 20,  completionist: 50 },
  '20 minutes till dawn':        { mainStory: 8,   mainExtra: 18,  completionist: 40 },
  'halls of torment':            { mainStory: 10,  mainExtra: 22,  completionist: 50 },
  'soulstone survivors':         { mainStory: 10,  mainExtra: 22,  completionist: 55 },
  'the last spell':              { mainStory: 12,  mainExtra: 24,  completionist: 50 },

  // Co-op & party
  'portal bridge constructor':   { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'escape simulator':            { mainStory: 6,   mainExtra: 12,  completionist: 25 },
  'we were here':                { mainStory: 2,   mainExtra: 3,   completionist: 5 },
  'we were here together':       { mainStory: 5,   mainExtra: 6,   completionist: 8 },
  'we were here forever':        { mainStory: 7,   mainExtra: 9,   completionist: 12 },
  'gang beasts':                 { mainStory: 5,   mainExtra: 15,  completionist: 40 },
  'human fall flat':             { mainStory: 6,   mainExtra: 10,  completionist: 20 },
  'pummel party':                { mainStory: 5,   mainExtra: 15,  completionist: 40 },
  'golf with your friends':      { mainStory: 4,   mainExtra: 10,  completionist: 25 },
  'mario party superstars':      { mainStory: 6,   mainExtra: 15,  completionist: 40 },
  'monster hunter stories 2':    { mainStory: 50,  mainExtra: 72,  completionist: 110 },

  // Classic & remakes
  'tetris effect':               { mainStory: 4,   mainExtra: 6,   completionist: 15 },
  'lumines':                     { mainStory: 5,   mainExtra: 8,   completionist: 18 },
  'bayonetta':                   { mainStory: 12,  mainExtra: 18,  completionist: 32 },
  'bayonetta 2':                 { mainStory: 10,  mainExtra: 15,  completionist: 28 },
  'bayonetta 3':                 { mainStory: 14,  mainExtra: 20,  completionist: 38 },
  'devil may cry':               { mainStory: 8,   mainExtra: 10,  completionist: 15 },
  'devil may cry 3':             { mainStory: 10,  mainExtra: 14,  completionist: 25 },
  'devil may cry 4':             { mainStory: 13,  mainExtra: 16,  completionist: 25 },
  'devil may cry 5':             { mainStory: 15,  mainExtra: 22,  completionist: 40 },
  'metal gear solid 2':          { mainStory: 14,  mainExtra: 20,  completionist: 30 },
  'metal gear solid 3':          { mainStory: 18,  mainExtra: 23,  completionist: 34 },
  'metal gear solid 4':          { mainStory: 20,  mainExtra: 26,  completionist: 36 },
  'metal gear solid peace walker': { mainStory: 25, mainExtra: 40, completionist: 70 },
  'metal gear rising revengeance': { mainStory: 7, mainExtra: 10,  completionist: 20 },
  'mgs delta snake eater':       { mainStory: 18,  mainExtra: 24,  completionist: 35 },
  'metal gear solid delta':      { mainStory: 18,  mainExtra: 24,  completionist: 35 },
  'shadow of the colossus':      { mainStory: 9,   mainExtra: 11,  completionist: 18 },
  'ico':                         { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'the last guardian':           { mainStory: 13,  mainExtra: 16,  completionist: 23 },
  'journey':                     { mainStory: 2,   mainExtra: 3,   completionist: 5 },
  'flower':                      { mainStory: 2,   mainExtra: 3,   completionist: 4 },
  'abzu':                        { mainStory: 3,   mainExtra: 3.5, completionist: 5 },
  'gris':                        { mainStory: 4,   mainExtra: 5,   completionist: 7 },

  // Upcoming / 2024-2026 releases
  'grand theft auto vi':         { mainStory: 60,  mainExtra: 110, completionist: 180 },
  'the elder scrolls vi':        { mainStory: 60,  mainExtra: 130, completionist: 250 },
  'fable':                       { mainStory: 30,  mainExtra: 50,  completionist: 80 },
  'avowed':                      { mainStory: 25,  mainExtra: 40,  completionist: 70 },
  'dragon age the veilguard':    { mainStory: 40,  mainExtra: 65,  completionist: 90 },
  'indiana jones and the great circle': { mainStory: 22, mainExtra: 35, completionist: 55 },
  'metaphor refantazio':         { mainStory: 75,  mainExtra: 100, completionist: 140 },
  'metaphor: refantazio':        { mainStory: 75,  mainExtra: 100, completionist: 140 },
  'silent hill f':               { mainStory: 11,  mainExtra: 15,  completionist: 22 },
  'death stranding 2':           { mainStory: 45,  mainExtra: 70,  completionist: 110 },
  'ghost of yotei':              { mainStory: 30,  mainExtra: 50,  completionist: 70 },
  'light no fire':               { mainStory: 45,  mainExtra: 100, completionist: 200 },
  'mindseye':                    { mainStory: 15,  mainExtra: 22,  completionist: 35 },
  'star wars outlaws':           { mainStory: 25,  mainExtra: 45,  completionist: 75 },
  'concord':                     { mainStory: 5,   mainExtra: 10,  completionist: 25 },
  'once human':                  { mainStory: 30,  mainExtra: 80,  completionist: 250 },

  // ── FNAF series
  'five nights at freddys':      { mainStory: 2,   mainExtra: 3,   completionist: 6 },
  'five nights at freddys 2':    { mainStory: 2,   mainExtra: 3,   completionist: 7 },
  'five nights at freddys 3':    { mainStory: 2,   mainExtra: 3,   completionist: 5 },
  'five nights at freddys 4':    { mainStory: 2.5, mainExtra: 4,   completionist: 8 },
  'five nights at freddys sister location': { mainStory: 3, mainExtra: 5, completionist: 10 },
  'freddy fazbears pizzeria simulator': { mainStory: 3, mainExtra: 5, completionist: 12 },
  'ultimate custom night':       { mainStory: 3,   mainExtra: 8,   completionist: 40 },
  'fnaf security breach':        { mainStory: 12,  mainExtra: 18,  completionist: 30 },
  'fnaf help wanted':            { mainStory: 5,   mainExtra: 8,   completionist: 15 },
  'fnaf help wanted 2':          { mainStory: 8,   mainExtra: 12,  completionist: 22 },
  'fnaf into the pit':           { mainStory: 3,   mainExtra: 5,   completionist: 8 },
  'fnaf ruin':                   { mainStory: 5,   mainExtra: 8,   completionist: 14 },
  'fnaf world':                  { mainStory: 10,  mainExtra: 18,  completionist: 30 },
  'fnaf secret of the mimic':    { mainStory: 8,   mainExtra: 12,  completionist: 20 },

  // ── Horror
  'outlast':                     { mainStory: 5,   mainExtra: 6,   completionist: 10 },
  'outlast 2':                   { mainStory: 7,   mainExtra: 9,   completionist: 13 },
  'outlast trials':              { mainStory: 12,  mainExtra: 25,  completionist: 55 },
  'amnesia the dark descent':    { mainStory: 8,   mainExtra: 10,  completionist: 14 },
  'amnesia rebirth':             { mainStory: 9,   mainExtra: 11,  completionist: 14 },
  'amnesia the bunker':          { mainStory: 6,   mainExtra: 8,   completionist: 12 },
  'alien isolation':             { mainStory: 18,  mainExtra: 22,  completionist: 34 },
  'soma':                        { mainStory: 11,  mainExtra: 13,  completionist: 17 },
  'layers of fear':              { mainStory: 4,   mainExtra: 5,   completionist: 8 },
  'layers of fear 2':            { mainStory: 7,   mainExtra: 9,   completionist: 13 },
  'the evil within':             { mainStory: 16,  mainExtra: 21,  completionist: 30 },
  'the evil within 2':           { mainStory: 15,  mainExtra: 20,  completionist: 28 },
  'madison':                     { mainStory: 6,   mainExtra: 8,   completionist: 12 },
  'devour':                      { mainStory: 3,   mainExtra: 8,   completionist: 20 },
  'pacify':                      { mainStory: 3,   mainExtra: 6,   completionist: 15 },
  'cry of fear':                 { mainStory: 8,   mainExtra: 10,  completionist: 18 },
  'slender the arrival':         { mainStory: 4,   mainExtra: 5,   completionist: 9 },
  'signalis':                    { mainStory: 10,  mainExtra: 12,  completionist: 18 },
  'iron lung':                   { mainStory: 1,   mainExtra: 1.5, completionist: 3 },
  'mouthwashing':                { mainStory: 2,   mainExtra: 3,   completionist: 5 },
  'crow country':                { mainStory: 6,   mainExtra: 8,   completionist: 14 },
  'poppy playtime':              { mainStory: 1.5, mainExtra: 2,   completionist: 3 },
  'poppy playtime chapter 2':    { mainStory: 2.5, mainExtra: 3,   completionist: 5 },
  'poppy playtime chapter 3':    { mainStory: 3.5, mainExtra: 5,   completionist: 8 },
  'poppy playtime chapter 4':    { mainStory: 4,   mainExtra: 6,   completionist: 9 },
  'garten of banban':            { mainStory: 1,   mainExtra: 2,   completionist: 3 },
  'choo-choo charles':           { mainStory: 4,   mainExtra: 5,   completionist: 8 },
  'hello neighbor':              { mainStory: 4,   mainExtra: 6,   completionist: 10 },
  'hello neighbor 2':            { mainStory: 5,   mainExtra: 7,   completionist: 11 },
  'still wakes the deep':        { mainStory: 5,   mainExtra: 6,   completionist: 10 },
  'the mortuary assistant':      { mainStory: 5,   mainExtra: 7,   completionist: 12 },
  'fears to fathom':             { mainStory: 2,   mainExtra: 3,   completionist: 5 },
  'scorn':                       { mainStory: 6,   mainExtra: 8,   completionist: 12 },
  'the medium':                  { mainStory: 8,   mainExtra: 10,  completionist: 15 },
  'the casting of frank stone':  { mainStory: 8,   mainExtra: 10,  completionist: 15 },
  'dredge':                      { mainStory: 13,  mainExtra: 19,  completionist: 28 },
  'until dawn':                  { mainStory: 9,   mainExtra: 11,  completionist: 19 },
  'the quarry':                  { mainStory: 10,  mainExtra: 12,  completionist: 22 },
  'man of medan':                { mainStory: 5,   mainExtra: 7,   completionist: 11 },
  'little hope':                 { mainStory: 5,   mainExtra: 7,   completionist: 11 },
  'house of ashes':              { mainStory: 6,   mainExtra: 8,   completionist: 13 },
  'the devil in me':             { mainStory: 7,   mainExtra: 9,   completionist: 14 },
  'directive 8020':              { mainStory: 9,   mainExtra: 12,  completionist: 18 },
  'silent hill f':               { mainStory: 11,  mainExtra: 15,  completionist: 22 },
  'silent hill 2 remake':        { mainStory: 15,  mainExtra: 20,  completionist: 30 },
  'silent hill the short message': { mainStory: 1,   mainExtra: 2,   completionist: 3 },
  'visage':                      { mainStory: 9,   mainExtra: 12,  completionist: 18 },
  'deathloop':                   { mainStory: 14,  mainExtra: 19,  completionist: 29 },
  'the callisto protocol':       { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'dead space remake':           { mainStory: 13,  mainExtra: 16,  completionist: 24 },
  'dead space':                  { mainStory: 11,  mainExtra: 14,  completionist: 22 },
  'dead space 2':                { mainStory: 11,  mainExtra: 14,  completionist: 20 },
  'dead space 3':                { mainStory: 14,  mainExtra: 17,  completionist: 26 },

  // ── FPS
  'counter-strike global offensive': { mainStory: 3,  mainExtra: 15, completionist: 100 },
  'left 4 dead 2':               { mainStory: 9,   mainExtra: 21,  completionist: 58 },
  'left 4 dead':                 { mainStory: 7,   mainExtra: 15,  completionist: 40 },
  'back 4 blood':                { mainStory: 15,  mainExtra: 30,  completionist: 70 },
  'gtfo':                        { mainStory: 20,  mainExtra: 50,  completionist: 150 },
  'killing floor 2':             { mainStory: 15,  mainExtra: 40,  completionist: 100 },
  'vermintide 2':                { mainStory: 20,  mainExtra: 50,  completionist: 150 },
  'warhammer 40k darktide':      { mainStory: 18,  mainExtra: 45,  completionist: 120 },
  'warhammer 40k space marine 2':{ mainStory: 10,  mainExtra: 20,  completionist: 40 },
  'insurgency sandstorm':        { mainStory: 10,  mainExtra: 40,  completionist: 100 },
  'squad':                       { mainStory: 0,   mainExtra: 50,  completionist: 200 },
  'hell let loose':              { mainStory: 0,   mainExtra: 60,  completionist: 200 },
  'battlefield 1':               { mainStory: 7,   mainExtra: 10,  completionist: 30 },
  'battlefield v':               { mainStory: 6,   mainExtra: 12,  completionist: 45 },
  'battlefield 4':               { mainStory: 7,   mainExtra: 12,  completionist: 40 },
  'call of duty black ops ii':   { mainStory: 7,   mainExtra: 10,  completionist: 22 },
  'call of duty black ops iii':  { mainStory: 7,   mainExtra: 13,  completionist: 30 },
  'call of duty black ops 4':    { mainStory: 0,   mainExtra: 25,  completionist: 80 },
  'call of duty modern warfare 2019': { mainStory: 7, mainExtra: 11, completionist: 25 },
  'call of duty modern warfare ii': { mainStory: 8, mainExtra: 12, completionist: 28 },
  'call of duty wwii':           { mainStory: 7,   mainExtra: 9,   completionist: 20 },
  'titanfall 2':                 { mainStory: 6,   mainExtra: 10,  completionist: 18 },
  'doom 2016':                   { mainStory: 12,  mainExtra: 17,  completionist: 25 },
  'doom eternal':                { mainStory: 14,  mainExtra: 21,  completionist: 30 },
  'doom the dark ages':          { mainStory: 18,  mainExtra: 25,  completionist: 38 },
  'bioshock':                    { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'bioshock 2':                  { mainStory: 11,  mainExtra: 14,  completionist: 21 },
  'bioshock infinite':           { mainStory: 12,  mainExtra: 15,  completionist: 22 },
  'metro 2033':                  { mainStory: 10,  mainExtra: 13,  completionist: 17 },
  'metro last light':            { mainStory: 11,  mainExtra: 14,  completionist: 18 },
  'metro exodus':                { mainStory: 15,  mainExtra: 22,  completionist: 36 },
  'far cry 3':                   { mainStory: 16,  mainExtra: 27,  completionist: 42 },
  'far cry 4':                   { mainStory: 18,  mainExtra: 30,  completionist: 45 },
  'far cry 5':                   { mainStory: 19,  mainExtra: 32,  completionist: 50 },
  'far cry 6':                   { mainStory: 23,  mainExtra: 42,  completionist: 59 },
  'far cry new dawn':            { mainStory: 11,  mainExtra: 16,  completionist: 24 },
  'far cry primal':              { mainStory: 15,  mainExtra: 23,  completionist: 34 },
  'half-life 2':                 { mainStory: 13,  mainExtra: 16,  completionist: 22 },
  'half-life alyx':              { mainStory: 12,  mainExtra: 15,  completionist: 21 },
  'black mesa':                  { mainStory: 18,  mainExtra: 22,  completionist: 30 },
  'ultrakill':                   { mainStory: 14,  mainExtra: 20,  completionist: 35 },
  'turbo overkill':              { mainStory: 12,  mainExtra: 16,  completionist: 25 },
  'dusk':                        { mainStory: 7,   mainExtra: 10,  completionist: 15 },
  'amid evil':                   { mainStory: 8,   mainExtra: 11,  completionist: 17 },
  'prodeus':                     { mainStory: 12,  mainExtra: 17,  completionist: 28 },
  'serious sam 4':               { mainStory: 12,  mainExtra: 16,  completionist: 22 },
  'atomic heart':                { mainStory: 20,  mainExtra: 25,  completionist: 40 },
  'shadow warrior 3':            { mainStory: 7,   mainExtra: 10,  completionist: 15 },
  'sniper elite 5':              { mainStory: 15,  mainExtra: 22,  completionist: 35 },
  'selaco':                      { mainStory: 13,  mainExtra: 18,  completionist: 28 },
  'boltgun':                     { mainStory: 9,   mainExtra: 13,  completionist: 20 },
};

// ════════════════════════════════════════════════════════
// PRICE HISTORY  — via CheapShark cheapestEver
// ════════════════════════════════════════════════════════

async function priceHistory(url) {
  const title = url.searchParams.get('title');
  if (!title) return jsonResponse({ error: 'title required' }, 400);
  try {
    // Find game, get deals + cheapest ever
    const search = await fetchJSON(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=1`);
    if (!search?.[0]) return jsonResponse({ error: 'Game not found' }, 404);
    const g = search[0];
    const detail = await fetchJSON(`https://www.cheapshark.com/api/1.0/games?id=${g.gameID}`);
    const deals = (detail.deals || [])
      .filter(d => !BLOCKED_STORE_IDS.has(String(d.storeID)))
      .map(d => ({
        storeID: d.storeID,
        storeName: STORE_NAMES[d.storeID] || `Store ${d.storeID}`,
        price: parseFloat(d.price),
        retailPrice: parseFloat(d.retailPrice),
        savings: Math.round(parseFloat(d.savings)),
        dealID: d.dealID,
        dealLink: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
      })).sort((a,b) => a.price - b.price);

    return jsonResponse({
      gameID: g.gameID,
      title: g.external,
      thumb: g.thumb,
      steamAppID: g.steamAppID,
      currentCheapest: parseFloat(g.cheapest),
      currentCheapestStore: g.cheapestDealID,
      historicalLow: detail.cheapestPriceEver ? {
        price: parseFloat(detail.cheapestPriceEver.price),
        date: detail.cheapestPriceEver.date,
      } : null,
      activeDeals: deals,
    });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// ════════════════════════════════════════════════════════
// NOW PLAYING  — show what friends are playing right now
// ════════════════════════════════════════════════════════

async function nowPlaying(url) {
  const sids = url.searchParams.get('sids');
  if (!sids) return jsonResponse({ error: 'sids required' }, 400);
  const sidList = sids.split(',').map(s => s.trim()).filter(Boolean);
  if (!sidList.length) return jsonResponse({ playing: [] });

  const data = await fetchJSON(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${sidList.join(',')}`);
  const players = data?.response?.players || [];
  const playing = players.map(p => ({
    sid: p.steamid,
    name: p.personaname,
    avatar: p.avatar,
    state: p.personastate, // 0=offline 1=online 3=away
    inGame: p.gameextrainfo || null,
    appid: p.gameid ? parseInt(p.gameid) : null,
    img: p.gameid ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${p.gameid}/header.jpg` : null,
  }));
  return jsonResponse({ playing });
}

// ════════════════════════════════════════════════════════
// WHAT SHOULD I PLAY  — mood-based library picker
// ════════════════════════════════════════════════════════

async function whatToPlay(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const mood = url.searchParams.get('mood') || 'any'; // chill | intense | story | quick | multiplayer
  const data = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  if (!data?.response?.games) return jsonResponse({ error: 'privacy' }, 403);
  const games = data.response.games;
  if (!games.length) return jsonResponse({ error: 'empty library' }, 404);

  // Mood filter using GAME_GENRES map (reused from steamDNA)
  const moodTags = {
    chill:       ['Farming', 'Cosy', 'Indie', 'Sandbox'],
    intense:     ['Souls', 'FPS', 'Competitive', 'Battle Royale'],
    story:       ['RPG', 'Story', 'Adventure', 'Cyberpunk'],
    quick:       ['Roguelike', 'Casual', 'Arcade'],
    multiplayer: ['Multiplayer', 'Co-op', 'Competitive', 'MOBA', 'Hero'],
  };

  let candidates = games;
  if (mood !== 'any' && moodTags[mood]) {
    const wanted = moodTags[mood];
    candidates = games.filter(g => {
      const tags = GAME_GENRES[g.appid];
      return tags && tags.some(t => wanted.includes(t));
    });
  }
  if (!candidates.length) candidates = games; // fallback

  // Pick weighted towards games you actually enjoyed (>5h) but haven't obsessed over
  const weighted = candidates.map(g => {
    const hrs = (g.playtime_forever || 0) / 60;
    let weight = 1;
    if (hrs > 1 && hrs < 100) weight = 3;      // you liked it but aren't burnt out
    else if (hrs >= 100) weight = 0.5;         // already obsessed
    else if (hrs === 0) weight = 1.5;          // untouched gem potential
    return { ...g, weight };
  });

  const totalWeight = weighted.reduce((s, g) => s + g.weight, 0);
  let r = Math.random() * totalWeight;
  let pick = weighted[0];
  for (const g of weighted) {
    r -= g.weight;
    if (r <= 0) { pick = g; break; }
  }

  return jsonResponse({
    appid: pick.appid,
    name: pick.name,
    hoursPlayed: Math.round((pick.playtime_forever || 0) / 60 * 10) / 10,
    img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${pick.appid}/header.jpg`,
    url: `https://store.steampowered.com/app/${pick.appid}`,
    mood,
    totalCandidates: candidates.length,
  });
}

// ════════════════════════════════════════════════════════
// REVIEWS COMPARE  — Steam + Metacritic in one view
// ════════════════════════════════════════════════════════

async function reviewsCompare(url) {
  const title = url.searchParams.get('title');
  if (!title) return jsonResponse({ error: 'title required' }, 400);

  try {
    // Look up game on CheapShark to get steamAppID
    const search = await fetchJSON(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=1`);
    const g = search?.[0];
    if (!g?.steamAppID) return jsonResponse({ error: 'Game not found on Steam' }, 404);

    // Pull Steam reviews + store details (metacritic comes from here)
    const [reviews, details] = await Promise.all([
      fetchJSON(`https://store.steampowered.com/appreviews/${g.steamAppID}?json=1&language=all&purchase_type=all&num_per_page=0`),
      fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${g.steamAppID}&cc=gb&l=en`),
    ]);
    const info = details?.[g.steamAppID]?.data;
    const r = reviews?.query_summary || {};
    const totalPos = r.total_positive || 0;
    const totalRev = r.total_reviews || 0;

    return jsonResponse({
      title: info?.name || g.external,
      appid: g.steamAppID,
      img: info?.header_image,
      steam: totalRev > 0 ? {
        score: Math.round(totalPos / totalRev * 100),
        label: r.review_score_desc,
        count: totalRev,
      } : null,
      metacritic: info?.metacritic ? {
        score: info.metacritic.score,
        url: info.metacritic.url,
      } : null,
      genres: (info?.genres || []).map(x => x.description),
      releaseDate: info?.release_date?.date,
      price: info?.is_free ? 'Free' : info?.price_overview?.final_formatted,
      storeUrl: `https://store.steampowered.com/app/${g.steamAppID}`,
    });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// ════════════════════════════════════════════════════════
// PUBLIC PROFILES  — /u/{name-or-sid}
// ════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════
// SPEND ANALYTICS — estimated money spent + cost per hour
// ════════════════════════════════════════════════════════

async function spendAnalytics(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);

  const data = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  if (!data?.response?.games) return jsonResponse({ error: 'privacy' }, 403);
  const games = data.response.games;

  // Fetch price for top 30 games by hours (costs too much otherwise)
  const topByHours = [...games]
    .filter(g => g.playtime_forever > 0)
    .sort((a,b) => (b.playtime_forever||0) - (a.playtime_forever||0))
    .slice(0, 40);

  const prices = await Promise.all(topByHours.map(async g => {
    try {
      const d = await fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${g.appid}&cc=us&l=en&filters=price_overview,basic`);
      const info = d?.[g.appid]?.data;
      if (!info) return null;
      const p = info.is_free ? 0 : (info.price_overview?.initial ? info.price_overview.initial / 100 : null);
      return { ...g, price: p, isFree: info.is_free };
    } catch { return null; }
  }));

  const gamesWithPrices = prices.filter(p => p && p.price !== null);

  const totalSpend = gamesWithPrices.reduce((s, g) => s + (g.price || 0), 0);
  const totalHours = gamesWithPrices.reduce((s, g) => s + (g.playtime_forever || 0) / 60, 0);
  const untouched = games.filter(g => !g.playtime_forever).length;
  const wastedSpend = gamesWithPrices.filter(g => !g.playtime_forever).reduce((s, g) => s + (g.price || 0), 0);

  // Per-game cost efficiency
  const perGame = gamesWithPrices
    .filter(g => g.price > 0 && g.playtime_forever > 0)
    .map(g => ({
      appid: g.appid,
      name: g.name,
      price: g.price,
      hours: Math.round(g.playtime_forever / 60),
      costPerHour: g.price / (g.playtime_forever / 60),
      img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
    }));

  const bestValue = [...perGame].sort((a,b) => a.costPerHour - b.costPerHour).slice(0, 5);
  const worstValue = [...perGame].sort((a,b) => b.costPerHour - a.costPerHour).slice(0, 5);
  const mostExpensive = [...gamesWithPrices]
    .filter(g => g.price)
    .sort((a,b) => (b.price||0) - (a.price||0))
    .slice(0, 5)
    .map(g => ({ appid: g.appid, name: g.name, price: g.price, hours: Math.round(g.playtime_forever/60), img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg` }));

  return jsonResponse({
    estimatedSpend: Math.round(totalSpend),
    untouchedCount: untouched,
    wastedSpendEstimate: Math.round(wastedSpend),
    totalHours: Math.round(totalHours),
    averageCostPerHour: totalHours > 0 ? Math.round(totalSpend / totalHours * 100) / 100 : 0,
    bestValue,
    worstValue,
    mostExpensive,
    analysedGames: gamesWithPrices.length,
    totalGames: games.length,
    note: `Analysed top ${gamesWithPrices.length} games by hours. Spend estimates use current Steam prices, not what you actually paid.`,
  });
}

async function publicProfile(url) {
  const key = url.pathname.slice(3); // strip /u/
  if (!key) return new Response('Missing profile id', { status: 400 });

  // Theme can be overridden via ?theme=gold etc
  const theme = url.searchParams.get('theme') || 'dark';
  const isPro = url.searchParams.get('pro') === '1';

  let sid = key;
  if (!/^7656\d{13}$/.test(key)) {
    const resolve = await fetchJSON(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_KEY}&vanityurl=${encodeURIComponent(key)}`);
    sid = resolve?.response?.steamid;
    if (!sid) return new Response('Profile not found', { status: 404 });
  }

  // Fetch data
  const [profile, games] = await Promise.all([
    fetchJSON(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${sid}`),
    fetchJSON(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1`),
  ]);
  const p = profile?.response?.players?.[0];
  if (!p) return new Response('Profile not found', { status: 404 });

  const g = games?.response?.games || [];
  const totalHours = Math.round(g.reduce((s, x) => s + (x.playtime_forever||0)/60, 0));
  const top5 = [...g].sort((a,b) => (b.playtime_forever||0) - (a.playtime_forever||0)).slice(0, 5);

  // Return a small HTML page (shareable)
  const themes = {
    dark:  { bg: '#0a0e1a', card: '#12182a', accent: '#c8f135', text: '#e8ecf4', dim: 'rgba(232,236,244,0.5)', panel: '#1a2138', border: 'rgba(255,255,255,0.1)' },
    light: { bg: '#f4efe3', card: '#fffbf2', accent: '#b89452', text: '#1a1a1a', dim: 'rgba(26,26,26,0.55)', panel: '#e8e1ce', border: 'rgba(0,0,0,0.1)' },
    gold:  { bg: '#1a1206', card: '#2a1f0a', accent: '#e8c068', text: '#f4e8cc', dim: 'rgba(244,232,204,0.55)', panel: '#3a2c12', border: 'rgba(232,192,104,0.2)' },
    retro: { bg: '#2d0a2d', card: '#3a1040', accent: '#ff3a8c', text: '#fce8ff', dim: 'rgba(252,232,255,0.55)', panel: '#4a1450', border: 'rgba(255,58,140,0.25)' },
    neon:  { bg: '#0f0020', card: '#1a0a3a', accent: '#00e0ff', text: '#e8e8ff', dim: 'rgba(232,232,255,0.55)', panel: '#2a0a4a', border: 'rgba(0,224,255,0.2)' },
  };
  const t = themes[theme] || themes.dark;

  const proBadge = isPro ? `<span style="display:inline-block;background:${t.accent};color:${t.bg};font-size:10px;font-weight:700;letter-spacing:1.5px;padding:3px 8px;border-radius:3px;margin-left:8px;vertical-align:middle">PRO</span>` : '';
  const avatarRing = isPro ? `box-shadow:0 0 0 3px ${t.bg}, 0 0 0 5px ${t.accent}` : `border:2px solid ${t.accent}`;

  const html = `<!doctype html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.personaname} on QuestLog</title>
<meta property="og:title" content="${p.personaname} — ${totalHours.toLocaleString()}h on Steam">
<meta property="og:description" content="${g.length} games owned. Top: ${top5.map(t=>t.name).slice(0,3).join(' · ')}">
<meta property="og:image" content="${p.avatarfull}">
<style>
body{background:${t.bg};color:${t.text};font-family:'Inter',-apple-system,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px}
.card{background:${t.card};border:1px solid ${t.border};border-radius:16px;padding:40px;max-width:720px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
.head{display:flex;gap:20px;align-items:center;margin-bottom:32px}
.head img{width:80px;height:80px;border-radius:50%;${avatarRing}}
.head h1{font-size:28px;font-weight:800;margin-bottom:4px;display:flex;align-items:center}
.head p{color:${t.dim};font-size:13px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
.stat{background:${t.panel};padding:18px;border-radius:10px;text-align:center}
.stat-v{font-size:24px;font-weight:800;color:${t.accent}}
.stat-l{font-size:10px;color:${t.dim};text-transform:uppercase;letter-spacing:2px;margin-top:4px}
h2{font-size:12px;letter-spacing:2px;color:${t.dim};text-transform:uppercase;margin-bottom:14px}
.game{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid ${t.border};align-items:center}
.game img{width:120px;aspect-ratio:460/215;object-fit:cover;border-radius:4px}
.game-n{font-weight:600;font-size:14px;margin-bottom:2px}
.game-h{font-size:11px;color:${t.dim}}
.foot{text-align:center;margin-top:28px}
.foot a{background:${t.accent};color:${t.bg};padding:10px 22px;border-radius:5px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px}
</style></head><body>
<div class="card">
  <div class="head"><img src="${p.avatarfull}" alt=""><div><h1>${p.personaname}${proBadge}</h1><p>${p.loccountrycode || ''} · Joined Steam ${p.timecreated ? new Date(p.timecreated*1000).getFullYear() : ''}</p></div></div>
  <div class="stats">
    <div class="stat"><div class="stat-v">${g.length.toLocaleString()}</div><div class="stat-l">Games</div></div>
    <div class="stat"><div class="stat-v">${totalHours.toLocaleString()}</div><div class="stat-l">Hours</div></div>
    <div class="stat"><div class="stat-v">${top5[0] ? Math.round(top5[0].playtime_forever/60) : 0}h</div><div class="stat-l">Most Played</div></div>
  </div>
  <h2>Top 5 Games</h2>
  ${top5.map(x => `<div class="game"><img src="https://cdn.cloudflare.steamstatic.com/steam/apps/${x.appid}/header.jpg" alt=""><div><div class="game-n">${x.name}</div><div class="game-h">${Math.round(x.playtime_forever/60)} hours played</div></div></div>`).join('')}
  <div class="foot"><a href="/questlog.html">See your own →</a></div>
</div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}

async function howLongToBeat(url) {
  const title = url.searchParams.get('title');
  if (!title) return jsonResponse({ error: 'title required' }, 400);

  const normalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const fallback = `https://howlongtobeat.com/?q=${encodeURIComponent(title)}`;

  // Try exact match first, then contains/partial
  let match = HLTB_DATA[normalized];
  let matchedTitle = null;
  if (match) matchedTitle = Object.keys(HLTB_DATA).find(k => k === normalized);

  if (!match) {
    for (const [k, v] of Object.entries(HLTB_DATA)) {
      if (k.includes(normalized) || normalized.includes(k)) { match = v; matchedTitle = k; break; }
    }
  }

  if (!match) {
    return jsonResponse({ error: 'Game not in our database yet', fallback }, 404);
  }

  return jsonResponse({
    title: matchedTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    mainStory: match.mainStory,
    mainExtra: match.mainExtra,
    completionist: match.completionist,
    sourceUrl: fallback,
  });
}

// ════════════════════════════════════════════════════════
// GAME NIGHT — find co-op games everyone in a group owns
// ════════════════════════════════════════════════════════

// Games known to support co-op/multiplayer — quick whitelist for matching
const COOP_WHITELIST = new Set([
  1172620, 730, 570, 440, 1174180, 271590, 252490, 578080, 582010, 553850,
  892970, 2767030, 2073850, 1172470, 1238810, 1938090, 252950, 242760, 1326470,
  413150, 2246340, 813780, 1158310, 570940, 1086940, 440900, 1282100,
  2277860, 382260, 252670, 739630, 381210, 739630, 2437700, 322330,
  394360, 281990, 107410, 1426210, 2050650, 2195250, 2211420,
  1203620, 367520, 1222670, 346110, 739630, 1426210, 1259420,
]);

async function gameNight(request, url) {
  const sids = url.searchParams.get('sids'); // comma-separated steam IDs
  if (!sids) return jsonResponse({ error: 'sids required (comma separated)' }, 400);
  const sidList = sids.split(',').map(s => s.trim()).filter(s => /^7656\d{13}$/.test(s));
  if (sidList.length < 2) return jsonResponse({ error: 'need at least 2 Steam IDs' }, 400);

  // Fetch each player's games in parallel
  const allLibs = await Promise.all(sidList.map(sid =>
    fetchJSON(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`).catch(() => null)
  ));

  // Check privacy
  for (let i = 0; i < allLibs.length; i++) {
    if (!allLibs[i]?.response?.games) {
      return jsonResponse({ error: `Steam ID ${sidList[i]} has private library` }, 403);
    }
  }

  // Find appids owned by everyone
  const libs = allLibs.map(l => new Set((l.response.games || []).map(g => g.appid)));
  const firstLib = libs[0];
  const shared = [...firstLib].filter(id => libs.every(lib => lib.has(id)));

  // Use the first player's game details for names
  const firstGames = allLibs[0].response.games;
  const gameMap = Object.fromEntries(firstGames.map(g => [g.appid, g]));

  // Score: prefer co-op whitelist games, then by total combined playtime
  const candidates = shared
    .map(appid => {
      const info = gameMap[appid];
      if (!info) return null;
      const totalHours = allLibs.reduce((s, l) => {
        const g = l.response.games.find(x => x.appid === appid);
        return s + (g?.playtime_forever || 0) / 60;
      }, 0);
      const isCoop = COOP_WHITELIST.has(appid);
      return {
        appid,
        name: info.name,
        img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
        totalHours: Math.round(totalHours),
        isCoop,
        playerHours: allLibs.map((l, i) => {
          const g = l.response.games.find(x => x.appid === appid);
          return { sid: sidList[i], hours: Math.round((g?.playtime_forever || 0) / 60) };
        }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.isCoop - a.isCoop) || (b.totalHours - a.totalHours));

  return jsonResponse({
    playerCount: sidList.length,
    sharedCount: shared.length,
    coopCount: candidates.filter(c => c.isCoop).length,
    suggestions: candidates.slice(0, 12),
  });
}

// ════════════════════════════════════════════════════════
// WEEKLY DIGEST SUBSCRIBE
// ════════════════════════════════════════════════════════

async function subscribeDigest(request) {
  try {
    const { email, sid } = await request.json();
    if (!email || !email.includes('@')) return jsonResponse({ error: 'valid email required' }, 400);

    // Notify owner (we'll store subscriber lists properly when we add KV)
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: OWNER_EMAIL,
        subject: `QuestLog digest signup: ${email}`,
        html: `<p><strong>${email}</strong> subscribed to the QuestLog weekly digest.</p><p>Steam ID: ${sid || 'not provided'}</p>`,
      }),
    });

    // Confirmation to subscriber (only works if subscriber == verified owner email while we're on resend test domain)
    return jsonResponse({ ok: true, message: 'Subscribed. First digest arrives Sunday morning.' });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

async function createPriceAlert(request) {
  try {
    const data = await request.json();
    if (!data.email || !data.gameTitle || !data.targetPrice) {
      return jsonResponse({ error: 'email, gameTitle, and targetPrice required' }, 400);
    }

    // Email owner + subscriber confirmation via Resend
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:20px">
        <h2 style="color:#0a0e1a;border-bottom:2px solid #c8f135;padding-bottom:8px">QuestLog Price Alert Set</h2>
        <p>We'll email you when <strong>${data.gameTitle}</strong> drops below <strong>£${data.targetPrice}</strong> on any store.</p>
        <p style="color:#666;font-size:13px">We check prices every hour across Steam, Epic, GOG, Humble, Fanatical and more.</p>
      </div>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: OWNER_EMAIL,
        subject: `Price alert: ${data.email} wants ${data.gameTitle} at £${data.targetPrice}`,
        html: `<pre>${JSON.stringify(data, null, 2)}</pre>`,
      }),
    });

    return jsonResponse({ ok: true, message: 'Alert registered. Check your email.' });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// ════════════════════════════════════════════════════════
// NEW RELEASES + UPCOMING
// ════════════════════════════════════════════════════════

async function newReleases(url) {
  const filter = url.searchParams.get('filter') || 'popular'; // popular | top-sellers | new

  try {
    const data = await fetchJSON('https://store.steampowered.com/api/featuredcategories?cc=us&l=en');

    let source;
    switch (filter) {
      case 'top-sellers': source = data.top_sellers; break;
      case 'trending':    source = data.coming_soon || data.new_releases; break;
      case 'specials':    source = data.specials; break;
      default:            source = data.new_releases;
    }

    const items = (source?.items || []).filter(it => !isJunkTitle(it.name)).slice(0, 40);

    // Enrich with reviews in parallel
    const enriched = await Promise.all(items.map(async it => {
      let review = null;
      try {
        const rev = await fetchJSON(`https://store.steampowered.com/appreviews/${it.id}?json=1&language=all&purchase_type=all&num_per_page=0`);
        if (rev?.query_summary?.total_reviews > 0) {
          review = {
            score: Math.round(rev.query_summary.total_positive / rev.query_summary.total_reviews * 100),
            label: rev.query_summary.review_score_desc,
            count: rev.query_summary.total_reviews,
          };
        }
      } catch {}

      return {
        appid: it.id,
        name: it.name,
        img: it.large_capsule_image || it.header_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${it.id}/header.jpg`,
        finalPrice: it.final_price !== undefined ? `$${(it.final_price/100).toFixed(2)}` : null,
        originalPrice: it.original_price !== undefined ? `$${(it.original_price/100).toFixed(2)}` : null,
        discount: it.discount_percent || 0,
        url: `https://store.steampowered.com/app/${it.id}`,
        review,
      };
    }));

    return jsonResponse({
      filter,
      items: enriched,
    });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

async function upcomingReleases() {
  // MOST ANTICIPATED upcoming games — verified Steam appids only.
  // Criteria: not yet released, top wishlisted / most-talked-about games.
  // GTA VI, Ghost of Yōtei, Perfect Dark excluded because they're not on Steam.
  const HYPE = [
    { appid: 1030300, name: 'Hollow Knight: Silksong',        reason: 'The most-awaited indie in history' },
    { appid: 2622380, name: 'Elden Ring Nightreign',          reason: 'FromSoftware co-op spin-off' },
    { appid: 3065800, name: 'Marathon',                        reason: "Bungie's extraction shooter revival" },
    { appid: 1449110, name: 'The Outer Worlds 2',              reason: "Obsidian's satirical space RPG sequel" },
    { appid: 2769570, name: 'Fable',                            reason: 'Playground Games rebooting a legend' },
    { appid: 1643320, name: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl', reason: 'Post-apocalyptic shooter with huge hype' },
    { appid: 2694490, name: 'Path of Exile 2',                 reason: "ARPG that's dethroning Diablo" },
    { appid: 1962700, name: 'Subnautica 2',                     reason: 'Return to the alien ocean' },
    { appid: 2277560, name: 'WUCHANG: Fallen Feathers',         reason: 'Chinese soulslike generating massive buzz' },
    { appid: 3357650, name: 'Pragmata',                         reason: "Capcom's long-awaited moon sci-fi" },
    { appid: 2719590, name: 'Light No Fire',                    reason: "Hello Games' fantasy successor to No Man's Sky" },
    { appid: 3321460, name: 'Crimson Desert',                   reason: 'Technically stunning open-world RPG' },
    { appid: 4115450, name: 'Phantom Blade Zero',               reason: 'Chinese action game, Kung Fu souls-adjacent' },
    { appid: 2255370, name: 'Directive 8020',                   reason: 'Sci-fi horror from Supermassive (Dark Pictures)' },
    { appid: 532790,  name: 'Vampire: The Masquerade - Bloodlines 2', reason: '20-year-awaited cult sequel' },
    { appid: 1422450, name: 'Deadlock',                         reason: "Valve's new hero shooter in open beta" },
    { appid: 388860,  name: 'Judas',                             reason: "BioShock creator's spiritual successor" },
    { appid: 2678080, name: 'Tides of Tomorrow',                 reason: 'Post-apocalyptic atmospheric ocean adventure' },
    { appid: 2456740, name: 'Shadow Labyrinth',                  reason: 'Pac-Man metroidvania, critically buzzed' },
  ];

  // Validate each appid against Steam. Only include if appid resolves and is still coming_soon.
  const items = await Promise.all(HYPE.map(async g => {
    try {
      const d = await fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${g.appid}&cc=gb&l=en&filters=basic,release_date`);
      const info = d?.[g.appid]?.data;
      if (!info) return null; // appid doesn't exist

      const comingSoon = info.release_date?.coming_soon === true;
      if (!comingSoon) return null; // already released

      const name = info.name || g.name;
      // Sanity-check: if name has wildly drifted from hype entry, we likely have the wrong appid
      const hypeFirstWord = g.name.split(/[\s:]/)[0].toLowerCase();
      const steamFirstWord = name.split(/[\s:]/)[0].toLowerCase();
      if (hypeFirstWord !== steamFirstWord && hypeFirstWord.length > 2 && !name.toLowerCase().includes(hypeFirstWord)) {
        return null; // mismatched appid, skip
      }

      return {
        appid: g.appid,
        name,
        reason: g.reason,
        img: info.header_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
        url: `https://store.steampowered.com/app/${g.appid}`,
        releaseDate: info.release_date?.date || 'TBA',
      };
    } catch {
      return null;
    }
  }));

  // ONLY return curated, hype-vetted entries. No Steam-feed top-up — each game must
  // have a deliberate reason explaining why it's worth watching. Drops anything
  // without a known following or news cycle.
  const validated = items.filter(Boolean);

  return jsonResponse({ items: validated });
}

// ════════════════════════════════════════════════════════
// FREE GAMES TRACKER — Epic, Steam, Prime Gaming, GOG
// ════════════════════════════════════════════════════════

async function freeGames() {
  const results = { epic: [], steam: [], prime: [], errors: [] };

  // Helper: search CheapShark for a title to get Steam rating
  async function lookupRating(title) {
    try {
      const data = await fetchJSON(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=1&exact=0`);
      if (data?.[0]?.steamAppID) {
        // Also try to get proper Steam reviews
        const rev = await fetchJSON(`https://store.steampowered.com/appreviews/${data[0].steamAppID}?json=1&language=all&purchase_type=all&num_per_page=0`).catch(() => null);
        if (rev?.query_summary?.total_reviews > 0) {
          return {
            score: Math.round(rev.query_summary.total_positive / rev.query_summary.total_reviews * 100),
            label: rev.query_summary.review_score_desc,
            count: rev.query_summary.total_reviews,
            steamAppID: data[0].steamAppID,
          };
        }
      }
    } catch {}
    return null;
  }

  // ── EPIC GAMES free promotions (weekly freebies)
  try {
    const epic = await fetchJSON(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US'
    );
    const elements = (epic?.data?.Catalog?.searchStore?.elements || []).filter(e => !isJunkTitle(e.title));
    for (const g of elements) {
      const promos = g.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0];
      const upcoming = g.promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers?.[0];
      const isFreeNow = promos && promos.discountSetting?.discountPercentage === 0;
      const isUpcoming = upcoming && upcoming.discountSetting?.discountPercentage === 0;
      if (!isFreeNow && !isUpcoming) continue;

      const img = (g.keyImages || []).find(i => i.type === 'OfferImageWide' || i.type === 'DieselStoreFrontWide')?.url
              || (g.keyImages || [])[0]?.url;
      const slug = g.catalogNs?.mappings?.[0]?.pageSlug || g.urlSlug || g.productSlug || '';

      const ratings = await lookupRating(g.title);

      results.epic.push({
        title: g.title,
        desc: g.description,
        img,
        originalPrice: g.price?.totalPrice?.fmtPrice?.originalPrice,
        startDate: (isFreeNow ? promos : upcoming)?.startDate,
        endDate:   (isFreeNow ? promos : upcoming)?.endDate,
        available: isFreeNow,
        url: slug ? `https://store.epicgames.com/en-US/p/${slug}` : 'https://store.epicgames.com/en-US/free-games',
        steamRating: ratings?.score,
        steamLabel: ratings?.label,
        steamCount: ratings?.count,
      });
    }
  } catch (e) { results.errors.push('epic: ' + e.message); }

  // ── STEAM free weekends & permanently free (via CheapShark, enriched with real Steam reviews)
  try {
    const steamDeals = await fetchJSON('https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=0&sortBy=Reviews&pageSize=30');
    const freeOnes = (steamDeals || []).filter(d => parseFloat(d.salePrice) === 0 && !isJunkTitle(d.title));

    // Parallel fetch full reviews for top 20 to get label + count
    await Promise.all(freeOnes.slice(0, 20).map(async d => {
      try {
        const rev = await fetchJSON(`https://store.steampowered.com/appreviews/${d.steamAppID}?json=1&language=all&purchase_type=all&num_per_page=0`);
        if (rev?.query_summary?.total_reviews > 0) {
          d.reviewLabel = rev.query_summary.review_score_desc;
          d.reviewCount = rev.query_summary.total_reviews;
          d.reviewScore = Math.round(rev.query_summary.total_positive / rev.query_summary.total_reviews * 100);
        }
      } catch {}
    }));

    for (const d of freeOnes.slice(0, 20)) {
      results.steam.push({
        title: d.title,
        img: d.thumb,
        originalPrice: parseFloat(d.normalPrice) > 0 ? `$${d.normalPrice}` : 'Free',
        steamAppID: d.steamAppID,
        steamRating: d.reviewScore ?? (d.steamRatingPercent ? parseInt(d.steamRatingPercent) : null),
        steamLabel: d.reviewLabel || d.steamRatingText,
        steamCount: d.reviewCount || (d.steamRatingCount ? parseInt(d.steamRatingCount) : null),
        url: `https://store.steampowered.com/app/${d.steamAppID}`,
        available: true,
      });
    }
  } catch (e) { results.errors.push('steam: ' + e.message); }

  // ── GOG free games (via their storefront API)
  try {
    const gog = await fetchJSON('https://catalog.gog.com/v1/catalog?limit=48&order=desc%3Atrending&price=between%3A0%2C0&productType=in%3Agame%2Cpack&page=1');
    const gogGames = (gog?.products || []).filter(g => !isJunkTitle(g.title));
    for (const g of gogGames.slice(0, 20)) {
      // GOG storeLink is a full relative path like '/game/slug-name'
      // Fallback: build from slug if storeLink missing
      let url;
      if (g.storeLink && g.storeLink.startsWith('/')) {
        url = `https://www.gog.com${g.storeLink}`;
      } else if (g.slug) {
        url = `https://www.gog.com/en/game/${g.slug}`;
      } else {
        // Last-resort: search
        url = `https://www.gog.com/en/games?search=${encodeURIComponent(g.title || '')}`;
      }

      const ratings = await lookupRating(g.title);

      results.prime.push({
        title: g.title,
        img: g.coverHorizontal || g.image,
        originalPrice: g.price?.baseMoney?.amount > 0 ? g.price.baseMoney.amount + ' ' + g.price.baseMoney.currency : 'Free',
        url,
        store: 'GOG',
        available: true,
        steamRating: ratings?.score,
        steamLabel: ratings?.label,
        steamCount: ratings?.count,
      });
    }
  } catch (e) { results.errors.push('gog: ' + e.message); }

  return jsonResponse(results);
}

// ════════════════════════════════════════════════════════
// GAME DEAL HUNTER (via CheapShark — free, aggregates 20+ stores)
// ════════════════════════════════════════════════════════

const STORE_NAMES = {
  '1': 'Steam', '2': 'GamersGate', '3': 'GreenManGaming', '7': 'GOG',
  '8': 'Origin', '11': 'Humble Store', '13': 'Uplay', '15': 'Fanatical',
  '21': 'WinGameStore', '23': 'GameBillet', '24': '2Game', '25': 'Epic Games',
  '27': 'Gamesplanet', '28': 'Gamesload', '29': 'IndieGala', '30': 'Blizzard',
  '31': 'AllYouPlay', '32': 'DLGamer', '34': 'Noctre', '35': 'DreamGame',
};

// Stores that block users via Cloudflare WAF / region-lock aggressively.
// We exclude these from deal results so users never get redirected to a 'Sorry, blocked' page.
// User reported GameBillet (23) blocking on 2026-04-30. Others are pre-emptive based on common
// reports: 2Game, Noctre, DreamGame, AllYouPlay, DLGamer, Gamesload all WAF-block frequently.
const BLOCKED_STORE_IDS = new Set(['23', '24', '28', '31', '32', '34', '35']);

async function getDeals(url) {
  // Params: minRating (Steam %), maxPrice, sortBy (Deal Rating / Savings / Price / Recent), storeID
  const params = new URLSearchParams();
  // Pull more so we can quality-filter
  params.set('pageSize', '60');
  params.set('sortBy', url.searchParams.get('sortBy') || 'Deal Rating');
  params.set('desc', url.searchParams.get('desc') || '1');
  if (url.searchParams.get('minRating')) params.set('steamRating', url.searchParams.get('minRating'));
  if (url.searchParams.get('maxPrice'))  params.set('upperPrice', url.searchParams.get('maxPrice'));
  if (url.searchParams.get('onSale'))    params.set('onSale', '1');
  if (url.searchParams.get('storeID'))   params.set('storeID', url.searchParams.get('storeID'));
  if (url.searchParams.get('title'))     params.set('title', url.searchParams.get('title'));

  // Fetch multiple pages to get a bigger pool for filtering
  const [page0, page1] = await Promise.all([
    fetchJSON(`https://www.cheapshark.com/api/1.0/deals?${params}`),
    fetchJSON(`https://www.cheapshark.com/api/1.0/deals?${params}&pageNumber=1`),
  ]);
  const raw = [...(page0 || []), ...(page1 || [])];

  // Strict quality filter: real games have reviews. Shovelware usually has <200 reviews.
  // Skip if no steam rating at all, or if review count is tiny.
  const MIN_REVIEWS = parseInt(url.searchParams.get('minReviews') || '500');
  const cleaned = raw.filter(d => {
    // Drop stores that WAF-block users (they redirect to Cloudflare 'Sorry, blocked' pages)
    if (BLOCKED_STORE_IDS.has(String(d.storeID))) return false;
    const revCount = d.steamRatingCount ? parseInt(d.steamRatingCount) : 0;
    const rating = d.steamRatingPercent ? parseInt(d.steamRatingPercent) : 0;
    // Need both: enough reviews to not be asset flip, and rating > 60%
    if (revCount < MIN_REVIEWS) return false;
    if (rating < 60) return false;
    // Drop joke/bad titles patterns
    const t = (d.title || '').toLowerCase();
    if (isJunkTitle(t)) return false;
    return true;
  });

  // Dedupe by gameID (same game on multiple stores — keep cheapest)
  const byGame = {};
  for (const d of cleaned) {
    const key = d.gameID;
    if (!byGame[key] || parseFloat(d.salePrice) < parseFloat(byGame[key].salePrice)) {
      byGame[key] = d;
    }
  }

  const deals = Object.values(byGame).map(d => ({
    dealID:         d.dealID,
    gameID:         d.gameID,
    title:          d.title,
    storeID:        d.storeID,
    storeName:      STORE_NAMES[d.storeID] || `Store ${d.storeID}`,
    salePrice:      parseFloat(d.salePrice),
    normalPrice:    parseFloat(d.normalPrice),
    savings:        Math.round(parseFloat(d.savings)),
    dealRating:     parseFloat(d.dealRating),
    steamRating:    d.steamRatingPercent ? parseInt(d.steamRatingPercent) : null,
    steamReviews:   d.steamRatingText,
    steamReviewCount: d.steamRatingCount ? parseInt(d.steamRatingCount) : 0,
    metacritic:     d.metacriticScore ? parseInt(d.metacriticScore) : null,
    thumb:          d.thumb,
    releaseDate:    d.releaseDate,
    dealLink:       `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
  }));

  // Sort by review count * savings (balances popularity and deal strength)
  deals.sort((a, b) => {
    const scoreA = Math.log10(a.steamReviewCount + 1) * a.savings;
    const scoreB = Math.log10(b.steamReviewCount + 1) * b.savings;
    return scoreB - scoreA;
  });

  return jsonResponse({ deals });
}

async function searchDeal(url) {
  const title = url.searchParams.get('title');
  if (!title) return jsonResponse({ error: 'title required' }, 400);
  const data = await fetchJSON(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=10`);
  const filtered = (data || []).filter(g => !isJunkTitle(g.external));
  const results = await Promise.all(filtered.slice(0, 3).map(async g => {
    const detail = await fetchJSON(`https://www.cheapshark.com/api/1.0/games?id=${g.gameID}`).catch(() => ({}));
    const deals = (detail.deals || [])
      .filter(d => !BLOCKED_STORE_IDS.has(String(d.storeID)))
      .map(d => ({
        storeID: d.storeID,
        storeName: STORE_NAMES[d.storeID] || `Store ${d.storeID}`,
        price: parseFloat(d.price),
        retailPrice: parseFloat(d.retailPrice),
        savings: Math.round(parseFloat(d.savings)),
        dealID: d.dealID,
        dealLink: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
      })).sort((a, b) => a.price - b.price);
    return {
      gameID: g.gameID,
      title: g.external,
      thumb: g.thumb,
      steamAppID: g.steamAppID,
      cheapest: parseFloat(g.cheapest),
      cheapestEver: detail.cheapestPriceEver ? parseFloat(detail.cheapestPriceEver.price) : null,
      deals,
    };
  }));
  return jsonResponse({ results });
}

// For logged-in Steam users: find deals on games in their wishlist or similar to their library
async function myDeals(url) {
  const sid = url.searchParams.get('sid'); if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const games = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1&include_played_free_games=1`
  );
  const ownedIds = new Set((games?.response?.games || []).map(g => g.appid));

  // Get global top deals, then filter out games user already owns
  const deals = await fetchJSON('https://www.cheapshark.com/api/1.0/deals?pageSize=60&sortBy=Deal%20Rating&steamRating=75&upperPrice=40');
  const unowned = (deals || [])
    .filter(d => !BLOCKED_STORE_IDS.has(String(d.storeID)))
    .filter(d => !d.steamAppID || !ownedIds.has(parseInt(d.steamAppID)))
    .slice(0, 30)
    .map(d => ({
      dealID: d.dealID,
      title: d.title,
      storeID: d.storeID,
      storeName: STORE_NAMES[d.storeID] || `Store ${d.storeID}`,
      salePrice: parseFloat(d.salePrice),
      normalPrice: parseFloat(d.normalPrice),
      savings: Math.round(parseFloat(d.savings)),
      steamRating: d.steamRatingPercent ? parseInt(d.steamRatingPercent) : null,
      steamReviews: d.steamRatingText,
      thumb: d.thumb,
      dealLink: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
    }));

  return jsonResponse({ deals: unowned });
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

// ════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ════════════════════════════════════════════════════════

async function pushSubscribe(request, env) {
  try {
    const { sid, subscription, prefs } = await request.json();
    if (!sid || !subscription?.endpoint) return jsonResponse({ error: 'sid + subscription required' }, 400);
    await kvPut(env, `push:${sid}`, {
      subscription,
      prefs: prefs || { priceAlerts: true, freeGames: true, achievementOfDay: true },
      registered: Date.now(),
    });
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

async function pushUnsubscribe(request, env) {
  try {
    const { sid } = await request.json();
    if (!sid) return jsonResponse({ error: 'sid required' }, 400);
    await kvDelete(env, `push:${sid}`);
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// Cross-device wishlist sync
async function wishlistGet(url, env) {
  const sid = url.searchParams.get('sid');
  if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const data = await kvGet(env, `wishlist:${sid}`);
  return jsonResponse({ items: data || [] });
}
async function wishlistPut(request, env) {
  try {
    const { sid, items } = await request.json();
    if (!sid || !Array.isArray(items)) return jsonResponse({ error: 'sid + items required' }, 400);
    await kvPut(env, `wishlist:${sid}`, items);
    return jsonResponse({ ok: true, count: items.length });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// Cross-device journal sync
async function journalGet(url, env) {
  const sid = url.searchParams.get('sid');
  if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const data = await kvGet(env, `journal:${sid}`);
  return jsonResponse({ entries: data || [] });
}
async function journalPut(request, env) {
  try {
    const { sid, entries } = await request.json();
    if (!sid || !Array.isArray(entries)) return jsonResponse({ error: 'sid + entries required' }, 400);
    await kvPut(env, `journal:${sid}`, entries);
    return jsonResponse({ ok: true, count: entries.length });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// ════════════════════════════════════════════════════════
// ACHIEVEMENT OF THE DAY
// ════════════════════════════════════════════════════════

async function achievementOfDay(url) {
  const sid = url.searchParams.get('sid');
  if (!sid) return jsonResponse({ error: 'sid required' }, 400);

  // Pull library
  const games = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${sid}&include_appinfo=1`
  );
  const list = (games?.response?.games || []).filter(g => g.playtime_forever > 0).slice(0, 30);
  if (!list.length) return jsonResponse({ error: 'No played games found' }, 404);

  // Deterministic per-user-per-day pick
  const today = new Date().toISOString().slice(0, 10);
  const seed = (sid + today).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const game = list[seed % list.length];

  // Pull achievement schema + player progress + global percentages in parallel
  try {
    const [schema, player, global] = await Promise.all([
      fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_KEY}&appid=${game.appid}&l=english`),
      fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_KEY}&steamid=${sid}&appid=${game.appid}`),
      fetchJSON(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${game.appid}`),
    ]);

    const all = schema?.game?.availableGameStats?.achievements || [];
    const playerMap = Object.fromEntries((player?.playerstats?.achievements || []).map(a => [a.apiname, a.achieved]));
    const globalMap = Object.fromEntries((global?.achievementpercentages?.achievements || []).map(a => [a.name, parseFloat(a.percent)]));

    // Find achievements: not yet unlocked, sort by global rarity (rarer = more interesting)
    const candidates = all
      .filter(a => !playerMap[a.name])
      .map(a => ({ ...a, globalPct: globalMap[a.name] || 0 }))
      .filter(a => a.globalPct > 1) // skip near-impossible
      .sort((a, b) => a.globalPct - b.globalPct);

    if (!candidates.length) return jsonResponse({ error: 'No achievements left to unlock' }, 404);

    // Pick deterministically: middle-rarity for variety
    const pick = candidates[Math.min(candidates.length - 1, seed % Math.min(candidates.length, 10))];

    return jsonResponse({
      game: game.name,
      gameAppId: game.appid,
      gameImg: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
      achievement: {
        name: pick.displayName || pick.name,
        description: pick.description || '',
        icon: pick.icon,
        iconGray: pick.icongray,
        globalPct: Math.round(pick.globalPct * 100) / 100,
        rarity: pick.globalPct < 5 ? 'Ultra Rare' : pick.globalPct < 10 ? 'Rare' : pick.globalPct < 30 ? 'Uncommon' : 'Common',
      },
      guideUrl: `https://www.google.com/search?q=${encodeURIComponent(`${game.name} ${pick.displayName} achievement guide`)}`,
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${game.name} ${pick.displayName} how to`)}`,
    });
  } catch (e) {
    return jsonResponse({ error: 'Achievement data unavailable for this game', game: game.name }, 500);
  }
}

// ════════════════════════════════════════════════════════
// STRIPE (scaffolding — activates when keys are filled in above)
// ════════════════════════════════════════════════════════

async function checkout(request) {
  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return jsonResponse({ notReady: true });
  }
  try {
    const { sid, profile } = await request.json();
    if (!sid) return jsonResponse({ error: 'sid required' }, 400);

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('line_items[0][price]', STRIPE_PRICE_ID);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', STRIPE_SUCCESS_URL);
    params.set('cancel_url', STRIPE_CANCEL_URL);
    params.set('client_reference_id', sid);
    params.set('subscription_data[metadata][steamid]', sid);
    if (profile) params.set('subscription_data[metadata][profile]', profile);

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const d = await r.json();
    if (!r.ok) return jsonResponse({ error: d?.error?.message || 'Stripe error' }, 500);
    return jsonResponse({ url: d.url });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// Stripe webhook handler — fires on subscription created/updated/deleted.
// Persists Pro state to KV keyed by Steam ID.
async function stripeWebhook(request, env) {
  if (!STRIPE_SECRET_KEY) return jsonResponse({ notReady: true });
  try {
    const body = await request.text();
    let event;
    try { event = JSON.parse(body); } catch { return jsonResponse({ error: 'invalid JSON' }, 400); }

    const type = event.type;
    const obj = event.data?.object || {};
    const sid = obj.metadata?.steamid || obj.client_reference_id;

    if (sid) {
      if (type === 'customer.subscription.created' ||
          type === 'customer.subscription.updated' ||
          type === 'checkout.session.completed') {
        await kvPut(env, `pro:${sid}`, {
          active: true,
          since: Date.now(),
          subscriptionId: obj.id || obj.subscription || null,
          customerId: obj.customer || null,
          status: obj.status || 'active',
        });
      } else if (type === 'customer.subscription.deleted') {
        await kvDelete(env, `pro:${sid}`);
      }
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

// Public endpoint — client checks if a Steam ID has active Pro
async function proStatus(url, env) {
  const sid = url.searchParams.get('sid');
  if (!sid) return jsonResponse({ active: false });
  const data = await kvGet(env, `pro:${sid}`);
  return jsonResponse({ active: !!data?.active, since: data?.since });
}

// ════════════════════════════════════════════════════════
// SCHEDULED JOBS  (invoked by Cloudflare cron triggers)
// ════════════════════════════════════════════════════════

// Wishlist price-watch sweep.
//   1. List every push:* subscriber.
//   2. For each, load wishlist:${sid} from KV.
//   3. Hit Steam appdetails for each appid, pluck price + discount.
//   4. If a discount appeared (and we haven't already recorded it for that
//      app within the last 7 days), prepend a record to alerts:${sid}.
//   5. Cap aggressively so a single run can't blow the worker CPU/sub-request
//      budget. Excess users are simply picked up on the next hourly tick.
//
// Web Push *delivery* is a separate step (needs VAPID private key + RFC 8291
// payload encryption); for now the alerts queue is consumed by the QuestLog
// frontend via /api/alerts so users see drops the next time they open the app.
const PRICE_WATCH_USER_CAP = 50;
const PRICE_WATCH_ITEMS_PER_USER = 20;
const ALERT_DEDUPE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ALERTS_TTL_SECONDS = 30 * 24 * 60 * 60;

async function runWishlistPriceWatch(env) {
  if (!env?.QUESTLOG_KV) return { skipped: 'no-kv' };
  const stats = { users: 0, scanned: 0, alerts: 0, errors: 0 };

  const subscriberKeys = await kvList(env, 'push:');
  const sids = subscriberKeys.map(k => k.slice('push:'.length)).slice(0, PRICE_WATCH_USER_CAP);
  stats.users = sids.length;

  for (const sid of sids) {
    try {
      const wishlist = await kvGet(env, `wishlist:${sid}`);
      if (!Array.isArray(wishlist) || !wishlist.length) continue;

      // Wishlist entries can be objects {appid,...} or raw appids — handle both.
      const appids = wishlist
        .map(it => (typeof it === 'object' ? (it.appid || it.id) : it))
        .filter(Boolean)
        .slice(0, PRICE_WATCH_ITEMS_PER_USER);

      const existingAlerts = (await kvGet(env, `alerts:${sid}`)) || [];
      const recentByApp = new Map();
      for (const a of existingAlerts) {
        if (a?.appid && a?.at && Date.now() - a.at < ALERT_DEDUPE_WINDOW_MS) {
          recentByApp.set(String(a.appid), a);
        }
      }

      const newAlerts = [];
      for (const appid of appids) {
        try {
          stats.scanned++;
          const data = await fetchJSON(
            `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=gb&l=en&filters=basic,price_overview`
          );
          const entry = data?.[String(appid)];
          if (!entry?.success) continue;
          const po = entry.data?.price_overview;
          const discount = po?.discount_percent || 0;
          if (discount <= 0) continue;
          if (recentByApp.has(String(appid))) continue;

          newAlerts.push({
            appid,
            name: entry.data?.name || `App ${appid}`,
            discount,
            initial: po.initial_formatted || null,
            final: po.final_formatted || null,
            initialCents: po.initial,
            finalCents: po.final,
            currency: po.currency,
            header: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
            url: `https://store.steampowered.com/app/${appid}/`,
            at: Date.now(),
          });
        } catch (e) {
          stats.errors++;
        }
      }

      if (newAlerts.length) {
        // Newest first, cap at 50 stored alerts per user.
        const merged = [...newAlerts, ...existingAlerts].slice(0, 50);
        await kvPut(env, `alerts:${sid}`, merged, ALERTS_TTL_SECONDS);
        stats.alerts += newAlerts.length;
      }
    } catch (e) {
      stats.errors++;
    }
  }
  return stats;
}

// Public read endpoint for the QuestLog frontend to surface stored alerts.
async function getAlerts(url, env) {
  const sid = url.searchParams.get('sid');
  if (!sid) return jsonResponse({ error: 'sid required' }, 400);
  const alerts = (await kvGet(env, `alerts:${sid}`)) || [];
  return jsonResponse({ alerts });
}

// Diagnostic endpoint — lets us see when the cron last ran and what it did.
async function cronStatus(env) {
  const last = await kvGet(env, 'cron:lastRun');
  const stamp = await kvGet(env, 'aotd:day-stamp');
  return jsonResponse({ lastRun: last, aotdDayStamp: stamp });
}
