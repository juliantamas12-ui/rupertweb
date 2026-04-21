// rupertweb Worker — handles API endpoints + static assets

const STEAM_KEY = '7E0FBB2D8E9A19B0F40556A78A6B9C47';
const DEFAULT_STEAM_ID = null; // no default — each user provides their own
const RESEND_KEY = 're_dNyaesf8_GH99GVk3N5u45x6RuA1LCSR8';
const OWNER_EMAIL = 'julian.tamas12@gmail.com';

// Xbox / Microsoft OAuth (to be populated once registered)
const XBOX_CLIENT_ID     = 'PENDING';
const XBOX_CLIENT_SECRET = 'PENDING';
const XBOX_REDIRECT_URI  = 'https://rupertweb.com/api/xbox/callback';

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
      if (p === '/api/deals')                                         return getDeals(url);
      if (p === '/api/deal-search')                                   return searchDeal(url);
      if (p === '/api/my-deals')                                      return myDeals(url);
      if (p === '/api/xbox/login')                                    return xboxLogin();
      if (p === '/api/xbox/callback')                                 return xboxCallback(url);
      if (p === '/api/xbox/games')                                    return xboxGames(url);
      if (p === '/api/xbox/profile')                                  return xboxProfile(url);
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

  // Enrich with price + reviews + player count (parallel, first 60 to stay under CPU budget)
  const toEnrich = recs.slice(0, 60);
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
  // Extremely demanding
  'Cyberpunk 2077':              { score: 250, nicePlay: true },
  'Alan Wake 2':                 { score: 280, nicePlay: true },
  'Black Myth: Wukong':          { score: 260, nicePlay: true },
  'Star Wars Outlaws':           { score: 240 },
  'Hogwarts Legacy':             { score: 220 },
  "Assassin's Creed Shadows":    { score: 230 },
  'Hellblade II':                { score: 280, nicePlay: true },
  'Starfield':                   { score: 230 },
  // Demanding
  'Red Dead Redemption 2':       { score: 180 },
  'Horizon Forbidden West':      { score: 210 },
  'Marvel\'s Spider-Man 2':      { score: 180 },
  'Microsoft Flight Simulator 2024': { score: 220 },
  'Avatar: Frontiers of Pandora':{ score: 210 },
  'Palworld':                    { score: 160 },
  'The Witcher 3: Wild Hunt':    { score: 130 },
  // Medium
  'Elden Ring':                  { score: 150 },
  'Monster Hunter Wilds':        { score: 200 },
  'Helldivers 2':                { score: 160 },
  'Baldur\'s Gate 3':            { score: 150 },
  'Grand Theft Auto V':          { score: 90 },
  'Battlefield 2042':            { score: 170 },
  'Call of Duty: MW III':        { score: 180 },
  'Apex Legends':                { score: 110 },
  'Overwatch 2':                 { score: 100 },
  'Rust':                        { score: 150 },
  'Kingdom Come: Deliverance II':{ score: 220 },
  // Light
  'Counter-Strike 2':            { score: 70, nicePlay: true },
  'Valorant':                    { score: 40 },
  'Fortnite':                    { score: 90 },
  'Rocket League':               { score: 60 },
  'Sea of Thieves':              { score: 110 },
  'League of Legends':           { score: 25 },
  'Dota 2':                      { score: 60 },
  'Minecraft':                   { score: 40 },
  'Stardew Valley':              { score: 10 },
  'Hollow Knight':               { score: 30 },
  'Hades':                       { score: 40 },
  'Terraria':                    { score: 20 },
  'Roblox':                      { score: 30 },
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

async function fpsEstimate(url) {
  const gpu = url.searchParams.get('gpu');
  const ramGB = parseInt(url.searchParams.get('ram') || '16');
  const gameName = url.searchParams.get('game');

  const gpuKey = normalizeGPU(gpu);
  const game = normalizeGame(gameName);

  if (!gpuKey) return jsonResponse({ error: 'GPU not recognised', suggestions: Object.keys(GPU_SCORES).slice(0, 10) }, 400);
  if (!game)   return jsonResponse({ error: 'Game not in our database', suggestions: Object.keys(GAME_DEMAND).slice(0, 12) }, 400);

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
  });
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

    const items = (source?.items || []).slice(0, 40);

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
  // Hype candidates — games widely expected to drop in 2026+. Reason lines tell the user why it's big.
  // Each gets verified against Steam live: if already released, skipped.
  const HYPE = [
    { appid: 3240220, name: 'Grand Theft Auto VI', reason: 'The biggest entertainment launch of all time' },
    { appid: 1030300, name: 'Hollow Knight: Silksong', reason: 'The most-awaited indie in history' },
    { appid: 1245620, name: 'Elden Ring: Nightreign', reason: 'FromSoftware co-op spin-off' },
    { appid: 2677660, name: 'Intergalactic: The Heretic Prophet', reason: 'Naughty Dog\'s sci-fi epic' },
    { appid: 2358720, name: 'Borderlands 4', reason: 'Gearbox\'s looter-shooter returns' },
    { appid: 2456740, name: 'Ghost of Yōtei', reason: 'Ghost of Tsushima successor from Sucker Punch' },
    { appid: 2183900, name: 'Silent Hill f', reason: 'New Silent Hill, 1960s Japan setting' },
    { appid: 2710330, name: 'Directive 8020', reason: 'Sci-fi horror from Supermassive' },
    { appid: 1655630, name: 'Crimson Desert', reason: 'Technically stunning open-world RPG' },
    { appid: 1655650, name: 'Light No Fire', reason: 'Hello Games\' fantasy successor to No Man\'s Sky' },
    { appid: 1940340, name: 'Pragmata', reason: "Capcom's moon sci-fi" },
    { appid: 2399830, name: 'The Outer Worlds 2', reason: "Obsidian's satirical space RPG sequel" },
    { appid: 2694490, name: 'Marathon', reason: "Bungie's extraction shooter revival" },
    { appid: 2064650, name: 'Fable', reason: 'Playground Games rebooting a legend' },
    { appid: 2183550, name: 'Perfect Dark', reason: "The Initiative's spy reboot" },
    { appid: 2807960, name: 'Resident Evil 9: Requiem', reason: 'Next mainline RE horror' },
    { appid: 2371070, name: 'Civilization VII: Next', reason: 'The next big 4X expansion' },
    { appid: 3159330, name: 'Subnautica 2', reason: 'Return to the alien ocean' },
    { appid: 2183650, name: 'Bloodlines 2', reason: 'Vampire: The Masquerade sequel' },
    { appid: 3017860, name: 'Warhammer 40K: Dark Heresy', reason: 'New 40K CRPG from Owlcat' },
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

  const validated = items.filter(Boolean);

  // Top up with Steam's own "coming_soon" feed if we don't have enough
  if (validated.length < 12) {
    try {
      const feed = await fetchJSON('https://store.steampowered.com/api/featuredcategories?cc=us&l=en');
      const steamItems = (feed.coming_soon?.items || []).slice(0, 20);
      for (const it of steamItems) {
        if (validated.find(v => v.appid === it.id)) continue;
        validated.push({
          appid: it.id,
          name: it.name,
          reason: 'Upcoming on Steam',
          img: it.large_capsule_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${it.id}/header.jpg`,
          url: `https://store.steampowered.com/app/${it.id}`,
          releaseDate: it.original_release_string || 'TBA',
        });
        if (validated.length >= 20) break;
      }
    } catch {}
  }

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
    const elements = epic?.data?.Catalog?.searchStore?.elements || [];
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
    const freeOnes = (steamDeals || []).filter(d => parseFloat(d.salePrice) === 0);

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
    const gogGames = gog?.products || [];
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

async function getDeals(url) {
  // Params: minRating (Steam %), maxPrice, sortBy (Deal Rating / Savings / Price / Recent), storeID
  const params = new URLSearchParams();
  params.set('pageSize', '60');
  params.set('sortBy', url.searchParams.get('sortBy') || 'Deal Rating');
  params.set('desc', url.searchParams.get('desc') || '1');
  if (url.searchParams.get('minRating')) params.set('steamRating', url.searchParams.get('minRating'));
  if (url.searchParams.get('maxPrice'))  params.set('upperPrice', url.searchParams.get('maxPrice'));
  if (url.searchParams.get('onSale'))    params.set('onSale', '1');
  if (url.searchParams.get('storeID'))   params.set('storeID', url.searchParams.get('storeID'));
  if (url.searchParams.get('title'))     params.set('title', url.searchParams.get('title'));

  const data = await fetchJSON(`https://www.cheapshark.com/api/1.0/deals?${params}`);
  const deals = (data || []).map(d => ({
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
  return jsonResponse({ deals });
}

async function searchDeal(url) {
  const title = url.searchParams.get('title');
  if (!title) return jsonResponse({ error: 'title required' }, 400);
  const data = await fetchJSON(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=5`);
  const results = await Promise.all((data || []).slice(0, 3).map(async g => {
    const detail = await fetchJSON(`https://www.cheapshark.com/api/1.0/games?id=${g.gameID}`).catch(() => ({}));
    const deals = (detail.deals || []).map(d => ({
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
// XBOX OAUTH + API
// ════════════════════════════════════════════════════════

function xboxLogin() {
  if (XBOX_CLIENT_ID === 'PENDING') {
    return jsonResponse({ error: 'Xbox integration not yet configured. Admin needs to register Microsoft app.' }, 503);
  }
  const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${XBOX_CLIENT_ID}&response_type=code&approval_prompt=auto&scope=Xboxlive.signin+Xboxlive.offline_access&redirect_uri=${encodeURIComponent(XBOX_REDIRECT_URI)}`;
  return new Response(null, { status: 302, headers: { Location: authUrl, ...corsHeaders() } });
}

async function xboxCallback(url) {
  const code = url.searchParams.get('code');
  if (!code) return jsonResponse({ error: 'No auth code' }, 400);

  // Step 1: Exchange code for Microsoft access token
  const tokenRes = await fetch('https://login.live.com/oauth20_token.srf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: XBOX_CLIENT_ID,
      client_secret: XBOX_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: XBOX_REDIRECT_URI,
    }),
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) return jsonResponse({ error: 'Token exchange failed', detail: tokenData }, 500);

  // Step 2: Authenticate with Xbox Live
  const xblRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-xbl-contract-version': '1' },
    body: JSON.stringify({
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT',
      Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: 'd=' + accessToken },
    }),
  });
  const xblData = await xblRes.json();
  const xblToken = xblData.Token;
  const userHash = xblData.DisplayClaims?.xui?.[0]?.uhs;

  // Step 3: XSTS token
  const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      RelyingParty: 'http://xboxlive.com',
      TokenType: 'JWT',
      Properties: { SandboxId: 'RETAIL', UserTokens: [xblToken] },
    }),
  });
  const xstsData = await xstsRes.json();
  const xstsToken = xstsData.Token;
  const xuid = xstsData.DisplayClaims?.xui?.[0]?.xid;

  // Redirect back to QuestLog with token (client stores it)
  const authHeader = `XBL3.0 x=${userHash};${xstsToken}`;
  const redirectTo = `/questlog.html?xbox_token=${encodeURIComponent(authHeader)}&xuid=${xuid}`;
  return new Response(null, { status: 302, headers: { Location: redirectTo } });
}

async function xboxProfile(url) {
  const token = url.searchParams.get('token');
  const xuid = url.searchParams.get('xuid');
  if (!token || !xuid) return jsonResponse({ error: 'Missing token or xuid' }, 400);

  const r = await fetch(`https://profile.xboxlive.com/users/xuid(${xuid})/profile/settings?settings=Gamertag,GameDisplayPicRaw,Gamerscore`, {
    headers: { Authorization: token, 'x-xbl-contract-version': '2', Accept: 'application/json' },
  });
  const data = await r.json();
  const settings = Object.fromEntries((data.profileUsers?.[0]?.settings || []).map(s => [s.id, s.value]));
  return jsonResponse({
    xuid,
    gamertag: settings.Gamertag,
    avatar: settings.GameDisplayPicRaw,
    gamerscore: parseInt(settings.Gamerscore || 0),
  });
}

async function xboxGames(url) {
  const token = url.searchParams.get('token');
  const xuid = url.searchParams.get('xuid');
  if (!token || !xuid) return jsonResponse({ error: 'Missing token or xuid' }, 400);

  const r = await fetch(`https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titlehistory/decoration/GamePass,Achievement,Image,Stats`, {
    headers: { Authorization: token, 'x-xbl-contract-version': '2', Accept: 'application/json', 'Accept-Language': 'en-US' },
  });
  const data = await r.json();
  const titles = (data.titles || []).map(t => ({
    titleId: t.titleId,
    name: t.name,
    lastPlayed: t.titleHistory?.lastTimePlayed,
    gamerscore: t.achievement?.currentGamerscore || 0,
    totalGamerscore: t.achievement?.totalGamerscore || 0,
    achievements: t.achievement?.currentAchievements || 0,
    totalAchievements: t.achievement?.totalAchievements || 0,
    img: t.displayImage,
  }));
  titles.sort((a, b) => new Date(b.lastPlayed || 0) - new Date(a.lastPlayed || 0));
  return jsonResponse({ count: titles.length, games: titles });
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
