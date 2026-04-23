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
      if (p === '/api/steam-dna')                                     return steamDNA(url);
      if (p === '/api/hltb')                                          return howLongToBeat(url);
      if (p === '/api/subscribe-digest' && request.method === 'POST') return subscribeDigest(request);
      if (p === '/api/game-night')                                    return gameNight(request, url);
      if (p === '/api/price-history')                                  return priceHistory(url);
      if (p === '/api/now-playing')                                    return nowPlaying(url);
      if (p === '/api/what-to-play')                                   return whatToPlay(url);
      if (p === '/api/curator')                                        return curator(url);
      if (p === '/api/reviews-compare')                                return reviewsCompare(url);
      if (p.startsWith('/u/'))                                         return publicProfile(url);
      if (p === '/api/spend-analytics')                                return spendAnalytics(url);
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
    const deals = (detail.deals || []).map(d => ({
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
// CURATOR BOT  — parse natural language query, filter catalog
// ════════════════════════════════════════════════════════

async function curator(url) {
  const q = (url.searchParams.get('q') || '').toLowerCase();
  if (!q) return jsonResponse({ error: 'query required' }, 400);

  // Parse signals from the query
  const signals = {
    price: null,       // max price in GBP
    discount: false,   // wants on sale
    free: false,
    coop: /\b(co-?op|coop|together|friends|multi(player)?|with (a )?friend)\b/.test(q),
    story: /\bstory|narrative|plot|single[- ]?player\b/.test(q),
    short: /\bshort|quick|under \d+ ?h|brief|bite[- ]?size/.test(q),
    long: /\blong|huge|massive|100\+|hundreds\b/.test(q),
    chill: /\bchill|cosy|cozy|relax|peaceful|calm\b/.test(q),
    intense: /\bintense|hard|difficult|challeng|punishing|hardcore\b/.test(q),
    openworld: /\bopen[- ]?world|sandbox|explore\b/.test(q),
    indie: /\bindie\b/.test(q),
    roguelike: /\brogue(like|lite)?\b/.test(q),
    horror: /\bhorror|scary|spooky\b/.test(q),
    rpg: /\brpg|role[- ]?playing\b/.test(q),
    fps: /\bfps|shooter|shoot/.test(q),
    racing: /\brac(e|ing)|driv(e|ing)|car\b/.test(q),
    strategy: /\bstrateg|4x|rts|turn[- ]?based\b/.test(q),
    fighting: /\bfight(ing)?\b/.test(q),
    cosy: /\bcosy|cozy|cute|farming\b/.test(q),
  };
  // Price extraction: "under £20", "less than 15", "£10"
  const priceMatch = q.match(/(?:under|less than|below|for|at most) ?\u00a3?(\d+)/) || q.match(/\u00a3(\d+)/);
  if (priceMatch) signals.price = parseFloat(priceMatch[1]);
  if (/\b(free|f2p|free[- ]?to[- ]?play)\b/.test(q)) signals.free = true;
  if (/\b(deal|sale|discount|on sale|cheap)\b/.test(q)) signals.discount = true;

  // Map signals to tag requirements for the catalog
  const needTags = [];
  if (signals.coop) needTags.push('coop');
  if (signals.story) needTags.push('story');
  if (signals.openworld) needTags.push('openworld');
  if (signals.indie) needTags.push('indie');
  if (signals.roguelike) needTags.push('roguelike');
  if (signals.horror) needTags.push('horror');
  if (signals.rpg) needTags.push('rpg');
  if (signals.fps) needTags.push('fps','shooter');
  if (signals.racing) needTags.push('racing');
  if (signals.strategy) needTags.push('strategy','turnbased');
  if (signals.fighting) needTags.push('fighting');
  if (signals.cosy) needTags.push('cosy','farming','relaxing');
  if (signals.chill) needTags.push('cosy','relaxing','indie');
  if (signals.intense) needTags.push('souls','hardcore');

  // Use CheapShark as catalog — real pricing + reviews
  const params = new URLSearchParams();
  params.set('pageSize', '60');
  params.set('sortBy', signals.discount ? 'Savings' : 'Deal Rating');
  params.set('steamRating', '75');
  if (signals.discount) params.set('onSale', '1');
  if (signals.free) { params.set('upperPrice', '0'); params.set('lowerPrice', '0'); }
  else if (signals.price) params.set('upperPrice', String(Math.ceil(signals.price * 1.2)));

  const raw = await fetchJSON(`https://www.cheapshark.com/api/1.0/deals?${params}`);
  // Filter: require enough reviews and filter junk
  let filtered = (raw || []).filter(d => {
    const revs = d.steamRatingCount ? parseInt(d.steamRatingCount) : 0;
    const rate = d.steamRatingPercent ? parseInt(d.steamRatingPercent) : 0;
    if (revs < 500 || rate < 70) return false;
    const t = (d.title || '').toLowerCase();
    if (/\bhentai|\bwaifu|\bsex|\bnsfw|\bdemo\b|\bsoundtrack\b/.test(t)) return false;
    return true;
  });

  return jsonResponse({
    query: q,
    detected: signals,
    matchedTags: needTags,
    results: filtered.slice(0, 15).map(d => ({
      gameID: d.gameID,
      title: d.title,
      thumb: d.thumb,
      price: parseFloat(d.salePrice),
      retailPrice: parseFloat(d.normalPrice),
      savings: Math.round(parseFloat(d.savings)),
      steamRating: d.steamRatingPercent ? parseInt(d.steamRatingPercent) : null,
      steamLabel: d.steamRatingText,
      storeID: d.storeID,
      storeName: STORE_NAMES[d.storeID] || '',
      dealLink: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
    })),
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
      const d = await fetchJSON(`https://store.steampowered.com/api/appdetails?appids=${g.appid}&cc=gb&l=en&filters=price_overview,basic`);
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
    const revCount = d.steamRatingCount ? parseInt(d.steamRatingCount) : 0;
    const rating = d.steamRatingPercent ? parseInt(d.steamRatingPercent) : 0;
    // Need both: enough reviews to not be asset flip, and rating > 60%
    if (revCount < MIN_REVIEWS) return false;
    if (rating < 60) return false;
    // Drop joke/bad titles patterns
    const t = (d.title || '').toLowerCase();
    if (/\bhentai\b|\bwaifu\b|\bgirl ?simulator\b|\bsex\b|\bnsfw\b|\bboobs\b|\bnudist\b/.test(t)) return false;
    // Drop demos/DLC tracked separately
    if (/\bdemo\b|\bsoundtrack\b|\bost\b(\s|$)/.test(t)) return false;
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
