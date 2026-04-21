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
      if (p.startsWith('/api/reviews/'))                              return steamReviews(p);
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

// Games to BUY — large curated pool with genre tags
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
    431960:  ['casual', 'relaxing'],                                         // Wallpaper Engine
    105600:  ['sandbox', 'crafting', 'exploration', 'survival'],            // Terraria
    813780:  ['strategy', 'historical', 'rts'],                             // Age of Empires II DE
    1086940: ['rpg', 'story', 'turnbased', 'fantasy'],                      // BG3
    570:     ['moba', 'competitive', 'multiplayer'],                        // Dota 2
    440:     ['fps', 'shooter', 'multiplayer', 'casual'],                   // TF2
    582010:  ['action', 'rpg', 'coop', 'fantasy', 'grind'],                 // Monster Hunter World
    582160:  ['stealth', 'openworld', 'action'],                            // Assassin's Creed Origins
    377160:  ['rpg', 'openworld', 'postapocalyptic'],                       // Fallout 4
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

  // Enrich with price + reviews + player count (parallel, first 50 to stay under CPU budget)
  const toEnrich = recs.slice(0, 50);
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
