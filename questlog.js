let STATE = { sid: null, games: [], profile: null, useSteamApp: localStorage.getItem('questlog_useapp') !== '0' };

function toggleSteamApp(on) {
  STATE.useSteamApp = on;
  localStorage.setItem('questlog_useapp', on ? '1' : '0');
}
function openSteam(appid) {
  if (STATE.useSteamApp) {
    // Try steam:// - if no Steam client, attempt a browser fallback after short delay
    const t = Date.now();
    window.location.href = `steam://store/${appid}`;
    setTimeout(() => {
      if (Date.now() - t < 2000 && !document.hidden) {
        window.open(`https://store.steampowered.com/app/${appid}`, '_blank');
      }
    }, 800);
  } else {
    window.open(`https://store.steampowered.com/app/${appid}`, '_blank');
  }
}

function switchSubTab(viewKey, sub) {
  const container = document.getElementById('view-' + viewKey);
  if (!container) return;
  container.querySelectorAll('.sub-tab').forEach(b => b.classList.toggle('active', b.dataset.sub === sub));
  container.querySelectorAll('.sub-view').forEach(v => v.classList.toggle('active', v.dataset.sub === sub));
  // Scroll to top when switching sub-tab - prevents the empty-page jump Julian saw
  window.scrollTo({ top: 0, behavior: 'instant' });
  // Lazy-load data if the sub-view hasn't been populated
  if (viewKey === 'deals') {
    if (sub === 'for-you' && !STATE.dealsForYouLoaded) { loadMyDeals(); STATE.dealsForYouLoaded = true; }
    if (sub === 'top' && !STATE.dealsTopLoaded) { loadAllDeals(); STATE.dealsTopLoaded = true; }
    if (sub === 'free' && !STATE.dealsFreeLoaded) { loadFreeGames(); STATE.dealsFreeLoaded = true; }
    if (sub === 'new' && !STATE.dealsNewLoaded) { loadNewReleases(); STATE.dealsNewLoaded = true; }
    if (sub === 'soon' && !STATE.dealsSoonLoaded) { loadUpcoming(); STATE.dealsSoonLoaded = true; }
  }
  if (viewKey === 'more') {
    if (sub === 'stats' && STATE.sid) {
      // Re-fire loaders if their panel is empty (handles first switch after data ready)
      if (document.querySelector('#wrappedPanel .loading')) loadWrapped();
      if (document.querySelector('#backlogPanel .loading')) loadBacklog();
      if (document.querySelector('#dnaPanel .loading')) loadSteamDNA();
    }
    if (sub === 'friends') refreshNowPlaying();
  }
  if (viewKey === 'pro') {
    if (sub === 'customize') renderThemeButtons();
  }
}

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const view = tab.dataset.view;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('view-' + view).classList.add('active');
    // Scroll back to the top of the new view
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Lazy-load views
    if (view === 'recs' && !STATE.recsLoaded) { loadRecs(); loadBuyRecs(); }
    if (view === 'deals' && !STATE.dealsLoaded) {
      // Only load the currently active sub-tab on first open
      loadMyDeals();
      STATE.dealsForYouLoaded = true;
      STATE.dealsLoaded = true;
    }


    if (view === 'leaderboards' && !STATE.lbLoaded) loadLeaderboards();
    if (view === 'more') {
      renderFriends();
      renderGameNightUI();
      refreshNowPlaying();
      if (!STATE.moreLoaded) {
        loadGameOfDay();
        loadWrapped();
        loadBacklog();
        loadFinishThis();
        loadSteamDNA();
        STATE.moreLoaded = true;
      }
    }
    if (view === 'pro') {
      initProFeatures();
      renderQuests();
      renderQueue();
      loadPushUI();
      if (!STATE.proLoaded) {
        loadAotd();
        loadRetrospective();
        loadStreak();
        loadGenreGaps();
        loadDemoRadar();
        loadModSpace();
        loadHot();
        STATE.proLoaded = true;
      }
    }
    if (view === 'utility') {
      renderChallengeUI();
      renderJournal();
      updateProfileUrl();
    }

    if (view === 'library') {
      if (!STATE.achLoaded && STATE.games?.length) { loadAchievements(); STATE.achLoaded = true; }
    }
    if (view === 'inventory') {
      if (!STATE.inventoryInitDone) { initInventory(); STATE.inventoryInitDone = true; }
    }
  });
});

async function api(path) {
  const r = await fetch(`${path}${path.includes('?') ? '&' : '?'}sid=${STATE.sid}`);
  if (!r.ok) throw new Error(`API error: ${r.status}`);
  return r.json();
}

async function connectSteam() {
  const sid = document.getElementById('sidInput').value.trim();
  if (!sid.match(/^7656\d{13}$/)) {
    alert('Invalid Steam ID. Should be a 17-digit number starting with 7656.');
    return;
  }
  STATE.sid = sid;
  localStorage.setItem('questlog_sid', sid);

  try {
    const [profile, games] = await Promise.all([api('/api/steam/profile'), api('/api/steam/games')]);
    if (profile.error) throw new Error(profile.error);

    if (games.error === 'privacy') {
      alert(
        'Owned Games is still private.\n\n' +
        'Your profile loads fine but Steam is hiding your games list.\n\n' +
        'Go to Steam → right-click your username → Profile → Edit Profile → Privacy Settings.\n\n' +
        'Set BOTH of these to Public:\n' +
        '• Game details\n' +
        '• Owned games  (scroll down - this is a SEPARATE setting)\n\n' +
        'Save and try again.'
      );
      return;
    }
    if (games.error) throw new Error(games.error);

    if (!games.games || games.games.length === 0) {
      alert('Connected to your Steam profile but your library is empty. Either you own no games or the "Owned games" privacy setting is hidden.');
      return;
    }

    STATE.profile = profile;
    STATE.games = games.games;
    STATE.gameCount = games.count;
    STATE.totalHours = games.totalHours;
    renderDashboard();
    showDashboard();
    checkServerPro();  // confirm Pro from KV (whitelisted users skip this)
  } catch (e) {
    alert(
      "Couldn't connect.\n\n" +
      "Most common cause: Steam privacy settings.\n\n" +
      "Go to Steam → Edit Profile → Privacy Settings. Set ALL of these to Public:\n" +
      "• My Profile\n" +
      "• Game details\n" +
      "• Owned games  ← this one is separate and is the one most people miss\n\n" +
      "Error: " + e.message
    );
  }
}

function showDashboard() {
  document.getElementById('view-landing').classList.remove('active');
  document.getElementById('view-more').classList.add('active');  // More (Home) is now the default
  document.getElementById('navUser').style.display = 'flex';
  renderProHub();  // Make sure the nav PRO badge updates as soon as Steam connects
  const t = document.getElementById('steamAppToggle');
  if (t) t.checked = STATE.useSteamApp;
  // Fire the tab-switch load hook for Home view
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const homeTab = document.querySelector('[data-view="more"]');
  if (homeTab) {
    homeTab.classList.add('active');
    renderFriends();
    renderGameNightUI();
    refreshNowPlaying();
    if (!STATE.moreLoaded) {
      loadGameOfDay();
      loadWrapped();
      loadBacklog();
      loadFinishThis();
      loadSteamDNA();
      STATE.moreLoaded = true;
    }
  }
  document.getElementById('navTabs').style.display = 'flex';
}

function disconnect() {
  localStorage.removeItem('questlog_sid');
  localStorage.removeItem('questlog_xbox_token');
  localStorage.removeItem('questlog_xbox_xuid');
  STATE = { sid: null, games: [], profile: null };
  location.reload();
}

function renderDashboard() {
  const { profile, games, gameCount, totalHours } = STATE;

  // Nav user
  document.getElementById('userAvatar').style.backgroundImage = `url('${profile.avatar}')`;
  document.getElementById('userName').textContent = profile.name;
  const greet = document.getElementById('homeGreetingName');
  if (greet) greet.textContent = ', ' + (profile.name || '').split(' ')[0];

  // Stats
  document.getElementById('statGames').textContent = gameCount.toLocaleString();
  document.getElementById('statHours').textContent = totalHours.toLocaleString();
  document.getElementById('statLevel').textContent = profile.level || '-';
  const recentHours = games.reduce((s, g) => s + (g.hoursTwoWeeks || 0), 0);
  document.getElementById('stat2Weeks').textContent = Math.round(recentHours * 10) / 10 + 'h';

  // Recent
  const recent = games.filter(g => g.hoursTwoWeeks > 0).sort((a, b) => b.hoursTwoWeeks - a.hoursTwoWeeks);
  if (recent.length) {
    renderGames('recentGames', recent.slice(0, 8));
  } else {
    document.getElementById('recentGames').innerHTML = '<div class="empty">No games played in the last 2 weeks.</div>';
  }

  // Most played
  renderGames('mostPlayed', games);  // Show ALL games
}

function renderGames(id, gs) {
  const el = document.getElementById(id);
  if (!gs.length) { el.innerHTML = '<div class="empty">No games yet.</div>'; return; }
  el.innerHTML = gs.map(g => `
    <div class="game-card" onclick="openSteam(${g.appid})">
      <div class="game-img" style="${g.img ? `background-image:url('${g.img}')` : ''}">
        <div class="game-hours">${g.hours}h</div>
      </div>
      <div class="game-body">
        <div class="game-title">${g.name}</div>
        <div class="game-meta"><span>${g.hoursTwoWeeks > 0 ? g.hoursTwoWeeks + 'h recent' : 'Not recent'}</span></div>
      </div>
    </div>
  `).join('');
}

async function loadRecs() {
  STATE.recsLoaded = true;
  document.getElementById('recList').innerHTML = '<div class="empty"><span class="loading"></span> Generating...</div>';
  try {
    const data = await api('/api/recommend');
    if (!data.recommendations?.length) {
      document.getElementById('recList').innerHTML = '<div class="empty">Need more data to recommend. Play some games!</div>';
      return;
    }
    document.getElementById('recList').innerHTML = data.recommendations.map(r => `
      <div class="rec-card" onclick="openSteam(${r.appid})">
        <div class="rec-cover" style="background-image:url('${r.img}')"></div>
        <div class="rec-info">
          <div class="rec-reason">${r.reason}</div>
          <div class="rec-title">${r.game}</div>
          <div class="rec-sub">${r.sub}</div>
        </div>
        <button class="rec-action">View →</button>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('recList').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

// ═════ MORE (Wrapped / Backlog / Game of Day / Finish This / Friend Compare / Price Alert) ═════

async function loadGameOfDay() {
  try {
    const r = await fetch('/api/game-of-the-day');
    const g = await r.json();
    document.getElementById('gameOfDay').innerHTML = `
      <div class="rec-card" onclick="window.open('${g.url}','_blank')" style="border:1px solid var(--accent)">
        <div class="rec-cover" style="background-image:url('${g.img}')"></div>
        <div class="rec-info">
          <div class="rec-reason">${new Date(g.date||Date.now()).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>
          <div class="rec-title">${g.name}</div>
          <div class="rec-sub">${g.reason}</div>
          <div class="rec-sub" style="margin-top:6px;display:flex;gap:12px;flex-wrap:wrap">
            ${g.price ? `<span style="color:var(--accent);font-weight:700">${g.price}</span>` : ''}
            ${g.review ? `<span style="color:var(--accent);font-weight:700">${g.review.score}% ★</span> <span style="color:var(--dim);font-size:11px">${g.review.label}</span>` : ''}
          </div>
        </div>
        <button class="rec-action">View →</button>
      </div>`;
  } catch (e) { document.getElementById('gameOfDay').innerHTML = `<div class="error">${e.message}</div>`; }
}

async function loadWrapped() {
  if (!STATE.sid) return;
  try {
    const r = await api('/api/wrapped');
    const el = document.getElementById('wrappedPanel');
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:24px">
        <div style="background:var(--panel2);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:var(--accent)">${r.totalHours.toLocaleString()}</div>
          <div style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">Hours Played</div>
        </div>
        <div style="background:var(--panel2);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800">${r.totalGames}</div>
          <div style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">Games Owned</div>
        </div>
        <div style="background:var(--panel2);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800">${r.completed}</div>
          <div style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">Played 30h+</div>
        </div>
        <div style="background:var(--panel2);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#ff9e42">${r.untouched}</div>
          <div style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">Never Touched</div>
        </div>
      </div>
      <h3 style="font-size:13px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Top 5 All Time</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px">
        ${r.top5.map((g,i)=>`
          <div style="position:relative" onclick="openSteam(${g.appid})">
            <div style="aspect-ratio:460/215;background:url('${g.img}') center/cover;border-radius:6px;cursor:pointer"></div>
            <div style="position:absolute;top:4px;left:4px;background:var(--accent);color:#000;font-weight:800;padding:2px 8px;border-radius:3px;font-size:11px">#${i+1}</div>
            <div style="font-size:12px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div>
            <div style="font-size:11px;color:var(--accent)">${g.hours}h</div>
          </div>
        `).join('')}
      </div>`;
  } catch (e) { document.getElementById('wrappedPanel').innerHTML = `<div class="error">${e.message}</div>`; }
}

async function loadBacklog() {
  if (!STATE.sid) return;
  try {
    const r = await api('/api/backlog-estimate');
    document.getElementById('backlogPanel').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:16px">
        <div><div style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Never Played</div><div style="font-size:22px;font-weight:800;color:#ff9e42">${r.untouchedCount}</div></div>
        <div><div style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Barely Played</div><div style="font-size:22px;font-weight:800">${r.barelyPlayedCount}</div></div>
        <div><div style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Est. Hours to Finish</div><div style="font-size:22px;font-weight:800">${r.backlogHours.toLocaleString()}h</div></div>
        <div><div style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">At Your Pace</div><div style="font-size:22px;font-weight:800;color:var(--accent)">${r.yearsToFinish} years</div></div>
      </div>
      <p style="color:var(--dim);font-size:13px">You play roughly <strong style="color:var(--text)">${r.hoursPerWeek}h/week</strong>. At that rate your backlog would take <strong style="color:var(--accent)">${r.yearsToFinish} years</strong> to clear. Maybe stop buying Steam sales.</p>`;
  } catch (e) { document.getElementById('backlogPanel').innerHTML = `<div class="error">${e.message}</div>`; }
}

async function loadFinishThis() {
  if (!STATE.sid) return;
  try {
    const r = await api('/api/finish-this');
    if (r.error) { document.getElementById('finishThisPanel').innerHTML = `<div class="empty">${r.error}</div>`; return; }
    document.getElementById('finishThisPanel').innerHTML = `
      <div class="rec-card" onclick="window.open('${r.url}','_blank')" style="border:1px solid rgba(255,158,66,0.3)">
        <div class="rec-cover" style="background-image:url('${r.img}')"></div>
        <div class="rec-info">
          <div class="rec-reason" style="color:#ff9e42">⚠ UNFINISHED</div>
          <div class="rec-title">${r.name}</div>
          <div class="rec-sub">${r.message} You already put in ${r.hoursPlayed}h.</div>
        </div>
        <button class="rec-action">Play →</button>
      </div>`;
  } catch (e) { document.getElementById('finishThisPanel').innerHTML = `<div class="error">${e.message}</div>`; }
}

function getFriends() {
  try { return JSON.parse(localStorage.getItem('questlog_friends') || '[]'); }
  catch { return []; }
}
function saveFriends(f) { localStorage.setItem('questlog_friends', JSON.stringify(f)); }

async function addFriend() {
  const sid = document.getElementById('friendSidInput').value.trim();
  const nick = document.getElementById('friendNickInput').value.trim();
  if (!sid.match(/^7656\d{13}$/)) { alert('Invalid Steam ID. Must be a 17-digit number starting with 7656.'); return; }
  if (sid === STATE.sid) { alert("That's you."); return; }

  const friends = getFriends();
  if (friends.find(f => f.sid === sid)) { alert('Already added.'); return; }

  // Fetch profile to save avatar + name
  try {
    const r = await fetch(`/api/steam/profile?sid=${sid}`);
    const p = await r.json();
    if (p.error) { alert('Could not load profile. Their account must be public.'); return; }
    friends.push({
      sid,
      name: nick || p.name,
      steamName: p.name,
      avatar: p.avatar,
      added: Date.now(),
    });
    saveFriends(friends);
    document.getElementById('friendSidInput').value = '';
    document.getElementById('friendNickInput').value = '';
    renderFriends();
  } catch (e) {
    alert('Error adding friend: ' + e.message);
  }
}

function removeFriend(sid) {
  if (!confirm('Remove this friend?')) return;
  saveFriends(getFriends().filter(f => f.sid !== sid));
  renderFriends();
}

function renderFriends() {
  const friends = getFriends();
  const el = document.getElementById('friendsList');
  if (!el) return;
  if (!friends.length) { el.innerHTML = '<div class="empty" style="text-align:left;padding:14px 0;font-size:13px">No friends added yet. Add one above.</div>'; return; }

  el.innerHTML = friends.map(f => `
    <div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--panel2);border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
      <div style="width:44px;height:44px;border-radius:50%;background:url('${f.avatar}') center/cover;flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:14px">${f.name}</div>
        ${f.name !== f.steamName ? `<div style="font-size:11px;color:var(--dim)">(Steam: ${f.steamName})</div>` : ''}
      </div>
      <button onclick="compareFriendBySid('${f.sid}','${(f.name || '').replace(/'/g,"\\'")}')" style="background:var(--accent);color:#000;border:none;padding:8px 14px;border-radius:5px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Compare</button>
      <button onclick="removeFriend('${f.sid}')" style="background:transparent;color:var(--dim);border:none;font-size:16px;cursor:pointer;padding:4px 8px" title="Remove">×</button>
    </div>
  `).join('');
}

async function compareFriendBySid(friendSid, friendName) {
  document.getElementById('compareSection').style.display = 'block';
  document.getElementById('compareTitle').textContent = 'You vs ' + (friendName || 'Friend');
  document.getElementById('friendCompareResult').innerHTML = '<div class="empty"><span class="loading"></span> Comparing libraries...</div>';
  document.getElementById('compareSection').scrollIntoView({behavior:'smooth'});
  try {
    const r = await fetch(`/api/compare-friend?sid=${STATE.sid}&friendSid=${friendSid}`);
    await renderCompareResult(r);
  } catch (e) { document.getElementById('friendCompareResult').innerHTML = `<div class="error">${e.message}</div>`; }
}


// ───── STEAM DNA ─────
async function loadSteamDNA() {
  if (!STATE.sid) return;
  const el = document.getElementById('dnaPanel');
  try {
    const r = await api('/api/steam-dna');
    if (r.error) { el.innerHTML = `<div class="error">${r.error}</div>`; return; }
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:24px">
        <div style="flex:1;min-width:220px">
          <div style="font-size:11px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Your Type</div>
          <div style="font-size:28px;font-weight:800;color:var(--accent);line-height:1;margin-bottom:8px">${r.personality}</div>
          <div style="font-size:13px;color:var(--dim);line-height:1.5">${r.description || ''}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;min-width:240px">
          <div style="background:var(--panel2);border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:800">${r.totalHours.toLocaleString()}h</div>
            <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:2px">Total</div>
          </div>
          <div style="background:var(--panel2);border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:800;color:var(--accent)">${r.topGamePct}%</div>
            <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:2px">In ${(r.topGame||'?').substring(0,15)}</div>
          </div>
          <div style="background:var(--panel2);border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:800;color:#ff9e42">${r.stats.untouched}</div>
            <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:2px">Untouched</div>
          </div>
          <div style="background:var(--panel2);border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:800">${r.stats.obsessed}</div>
            <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:2px">100h+ Games</div>
          </div>
        </div>
      </div>
      <h3 style="font-size:12px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Genre Breakdown</h3>
      ${r.topGenres.map(g => `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span>${g.name}</span>
            <span style="color:var(--dim)">${g.hours}h · ${g.pct}%</span>
          </div>
          <div style="height:6px;background:var(--panel2);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${g.pct}%;background:var(--accent)"></div>
          </div>
        </div>
      `).join('')}
    `;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── HOW LONG TO BEAT ─────
async function checkHLTB() {
  const title = document.getElementById('hltbInput').value.trim();
  if (!title) return;
  const el = document.getElementById('hltbResult');
  el.innerHTML = '<div class="empty"><span class="loading"></span> Checking...</div>';
  try {
    const r = await fetch(`/api/hltb?title=${encodeURIComponent(title)}`);
    const d = await r.json();
    if (d.error) {
      const fallback = d.fallback ? `<div style="margin-top:10px;font-size:12px"><a href="${d.fallback}" target="_blank" style="color:var(--accent)">→ Search HowLongToBeat directly</a></div>` : '';
      el.innerHTML = `<div class="error">${d.error}</div>${fallback}`;
      return;
    }
    el.innerHTML = `
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">
        ${d.image ? `<div style="width:120px;height:90px;background:url('${d.image}') center/cover;border-radius:6px;flex-shrink:0"></div>` : ''}
        <div><div style="font-size:15px;font-weight:700;margin-bottom:4px">${d.title}</div><div style="font-size:12px;color:var(--dim)">HowLongToBeat data</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
        ${d.mainStory    ? `<div style="background:var(--panel2);border-radius:6px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent)">${d.mainStory}h</div><div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">Main Story</div></div>` : ''}
        ${d.mainExtra    ? `<div style="background:var(--panel2);border-radius:6px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800">${d.mainExtra}h</div><div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">Main + Extras</div></div>` : ''}
        ${d.completionist? `<div style="background:var(--panel2);border-radius:6px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:#ff9e42">${d.completionist}h</div><div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">100%</div></div>` : ''}
      </div>`;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── BACKLOG CHALLENGE ─────
function getChallenge() {
  try { return JSON.parse(localStorage.getItem('questlog_challenge') || 'null'); } catch { return null; }
}
function saveChallenge(c) { localStorage.setItem('questlog_challenge', JSON.stringify(c)); }

function renderChallengeUI() {
  const el = document.getElementById('challengePanel');
  if (!el) return;
  const ch = getChallenge();

  if (!ch) {
    // New challenge picker - show backlog games
    if (!STATE.games || !STATE.games.length) { el.innerHTML = '<div class="empty">Connect Steam to start a challenge.</div>'; return; }
    const backlog = STATE.games.filter(g => (g.hours || 0) < 5).slice(0, 20);
    el.innerHTML = `
      <p style="color:var(--dim);font-size:12px;margin-bottom:12px">Pick exactly 3 games from your backlog:</p>
      <div style="max-height:340px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-bottom:14px" id="challengePicker">
        ${backlog.map(g => `
          <label style="display:block;cursor:pointer;position:relative">
            <input type="checkbox" value="${g.appid}" data-name="${(g.name||'').replace(/"/g,'&quot;')}" data-img="${g.img || ''}" style="position:absolute;opacity:0;pointer-events:none" onchange="toggleChallengePick(this)">
            <div class="challenge-opt" style="aspect-ratio:460/215;background:url('${g.img||''}') center/cover;border-radius:6px;border:2px solid transparent;transition:border-color 0.15s">
              <div style="background:rgba(0,0,0,0.7);padding:4px 8px;font-size:11px;text-align:center;position:absolute;bottom:0;left:0;right:0;border-radius:0 0 4px 4px">${(g.name||'').substring(0,28)}</div>
            </div>
          </label>
        `).join('')}
      </div>
      <button onclick="startChallenge()" class="btn-primary" style="padding:0 28px;height:42px;min-width:240px;font-size:12px" id="startChallengeBtn" disabled>Start 30-Day Challenge</button>
    `;
  } else {
    // Existing challenge - show progress
    const daysLeft = Math.max(0, Math.ceil((ch.endDate - Date.now()) / 86400000));
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div><div style="font-size:20px;font-weight:800;color:var(--accent)">${daysLeft} days left</div><div style="font-size:11px;color:var(--dim)">Challenge ends ${new Date(ch.endDate).toLocaleDateString('en-GB')}</div></div>
        <button onclick="cancelChallenge()" style="background:transparent;color:var(--dim);border:1px solid var(--border);padding:6px 12px;border-radius:4px;font-size:11px;cursor:pointer;font-family:inherit">Cancel</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${ch.games.map(g => `
          <div onclick="openSteam(${g.appid})" style="cursor:pointer">
            <div style="aspect-ratio:460/215;background:url('${g.img}') center/cover;border-radius:6px;border:2px solid ${g.done ? 'var(--accent)' : 'var(--border)'};position:relative">
              ${g.done ? '<div style="position:absolute;inset:0;background:rgba(200,241,53,0.3);display:flex;align-items:center;justify-content:center;font-size:40px">✓</div>' : ''}
            </div>
            <div style="font-size:12px;margin-top:6px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div>
            <label style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--dim);margin-top:2px;cursor:pointer">
              <input type="checkbox" ${g.done ? 'checked' : ''} onchange="toggleChallengeDone('${g.appid}')" style="accent-color:var(--accent)"> Finished
            </label>
          </div>
        `).join('')}
      </div>
      ${ch.games.every(g => g.done) ? '<div style="margin-top:16px;padding:14px;background:rgba(34,204,102,0.1);border:1px solid rgba(34,204,102,0.3);color:#22cc66;border-radius:6px;text-align:center">Challenge completed. You actually did it.</div>' : ''}
    `;
  }
}

STATE.challengePicks = [];
function toggleChallengePick(cb) {
  const label = cb.closest('label').querySelector('.challenge-opt');
  if (cb.checked) {
    if (STATE.challengePicks.length >= 3) { cb.checked = false; return; }
    STATE.challengePicks.push({ appid: cb.value, name: cb.dataset.name, img: cb.dataset.img });
    label.style.borderColor = 'var(--accent)';
  } else {
    STATE.challengePicks = STATE.challengePicks.filter(p => p.appid !== cb.value);
    label.style.borderColor = 'transparent';
  }
  document.getElementById('startChallengeBtn').disabled = STATE.challengePicks.length !== 3;
  document.getElementById('startChallengeBtn').textContent = `Start 30-Day Challenge (${STATE.challengePicks.length}/3)`;
}

function startChallenge() {
  if (STATE.challengePicks.length !== 3) return;
  saveChallenge({
    games: STATE.challengePicks.map(p => ({ ...p, done: false })),
    startDate: Date.now(),
    endDate: Date.now() + 30 * 86400000,
  });
  STATE.challengePicks = [];
  renderChallengeUI();
}
function toggleChallengeDone(appid) {
  const ch = getChallenge();
  if (!ch) return;
  const g = ch.games.find(g => g.appid == appid);
  if (g) g.done = !g.done;
  saveChallenge(ch);
  renderChallengeUI();
}
function cancelChallenge() {
  if (confirm('Cancel current challenge?')) { localStorage.removeItem('questlog_challenge'); renderChallengeUI(); }
}

// ───── GAME NIGHT ─────
function renderGameNightUI() {
  const el = document.getElementById('gameNightPanel');
  if (!el) return;
  const friends = getFriends();
  if (!STATE.sid) { el.innerHTML = '<div class="empty">Connect Steam first.</div>'; return; }
  if (!friends.length) { el.innerHTML = '<div class="empty">Add friends above first.</div>'; return; }

  el.innerHTML = `
    <div style="font-size:12px;color:var(--dim);margin-bottom:8px">Select who's joining:</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${friends.map(f => `
        <label style="display:flex;align-items:center;gap:6px;background:var(--panel2);padding:6px 10px;border-radius:100px;cursor:pointer;font-size:12px">
          <input type="checkbox" value="${f.sid}" style="accent-color:var(--accent)"> ${f.name}
        </label>
      `).join('')}
    </div>
  `;
}

async function findGameNight() {
  const checked = [...document.querySelectorAll('#gameNightPanel input:checked')].map(c => c.value);
  if (checked.length === 0) { alert('Select at least one friend'); return; }
  const sids = [STATE.sid, ...checked];
  const el = document.getElementById('gameNightResult');
  el.innerHTML = '<div class="empty"><span class="loading"></span> Finding overlapping co-op games...</div>';
  try {
    const r = await fetch(`/api/game-night?sids=${sids.join(',')}`);
    const d = await r.json();
    if (d.error) { el.innerHTML = `<div class="error">${d.error}</div>`; return; }
    el.innerHTML = `
      <div style="color:var(--dim);font-size:12px;margin-bottom:12px">${d.sharedCount} games in common · ${d.coopCount} support co-op</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">
        ${d.suggestions.map(s => `
          <div onclick="openSteam(${s.appid})" style="cursor:pointer">
            <div style="aspect-ratio:460/215;background:url('${s.img}') center/cover;border-radius:6px;border:2px solid ${s.isCoop ? 'var(--accent)' : 'var(--border)'};position:relative">
              ${s.isCoop ? '<span style="position:absolute;top:4px;right:4px;background:var(--accent);color:#000;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700">CO-OP</span>' : ''}
            </div>
            <div style="font-size:12px;margin-top:4px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.name}</div>
            <div style="font-size:10px;color:var(--dim)">${s.totalHours}h combined</div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── WEEKLY DIGEST ─────
async function subscribeDigest() {
  const email = document.getElementById('digestEmail').value.trim();
  if (!email || !email.includes('@')) { document.getElementById('digestResult').innerHTML = '<div class="error">Enter a valid email</div>'; return; }
  try {
    const r = await fetch('/api/subscribe-digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, sid: STATE.sid }),
    });
    const d = await r.json();
    if (d.ok) {
      document.getElementById('digestResult').innerHTML = '<div style="color:var(--accent)">✓ Subscribed. First digest arrives Sunday.</div>';
      document.getElementById('digestEmail').value = '';
    } else {
      document.getElementById('digestResult').innerHTML = `<div class="error">${d.error || 'Failed'}</div>`;
    }
  } catch (e) { document.getElementById('digestResult').innerHTML = `<div class="error">${e.message}</div>`; }
}


// ───── WHAT SHOULD I PLAY ─────
async function whatToPlay(mood) {
  if (!STATE.sid) { document.getElementById('whatToPlayResult').innerHTML = '<div class="empty">Connect Steam first.</div>'; return; }
  const el = document.getElementById('whatToPlayResult');
  el.innerHTML = '<div class="empty"><span class="loading"></span> Thinking...</div>';
  try {
    const r = await api(`/api/what-to-play?mood=${mood}`);
    if (r.error) { el.innerHTML = `<div class="error">${r.error}</div>`; return; }
    el.innerHTML = `
      <div onclick="openSteam(${r.appid})" class="rec-card" style="cursor:pointer;border-left:2px solid var(--accent)">
        <div class="rec-cover" style="background-image:url('${r.img}')"></div>
        <div style="flex:1">
          <div style="font-size:11px;letter-spacing:2px;color:var(--accent);text-transform:uppercase;margin-bottom:6px">Play this ←</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:4px">${r.name}</div>
          <div style="font-size:12px;color:var(--dim)">${r.hoursPlayed > 0 ? `${r.hoursPlayed}h played - return to it` : 'Never played - time to start'}</div>
          <div style="font-size:11px;color:var(--dim);margin-top:8px">Picked from ${r.totalCandidates} ${mood==='any'?'games':mood+' games'}</div>
        </div>
      </div>`;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── NOW PLAYING ─────
async function refreshNowPlaying() {
  const friends = getFriends();
  const el = document.getElementById('nowPlayingPanel');
  if (!el) return;
  if (!friends.length) { el.innerHTML = '<div class="empty">Add friends first (below).</div>'; return; }
  try {
    const r = await fetch(`/api/now-playing?sids=${friends.map(f=>f.sid).join(',')}`);
    const d = await r.json();
    const online = (d.playing || []).filter(p => p.inGame || p.state === 1);
    if (!online.length) { el.innerHTML = '<div class="empty">Nobody\'s online right now.</div>'; return; }
    el.innerHTML = online.map(p => `
      <div style="display:flex;gap:14px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:40px;height:40px;border-radius:50%;background:url('${p.avatar}') center/cover;border:2px solid ${p.inGame?'#22cc66':'var(--dim2)'};flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px">${p.name}</div>
          <div style="font-size:12px;color:${p.inGame?'var(--accent)':'var(--dim)'}">${p.inGame ? '▶ '+p.inGame : 'Online'}</div>
        </div>
        ${p.appid ? `<button onclick="openSteam(${p.appid})" style="background:var(--accent);color:#000;border:none;padding:6px 12px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Join</button>` : ''}
      </div>
    `).join('');
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── GAME TITLE AUTOCOMPLETE ─────
const _suggestCache = {};
let _suggestTimers = {};
let _suggestIdx = {};

const _JUNK_RE = /\b(hentai|waifu|nsfw|sex|sexy|porn|erotic|nudist|boobs|anime\s*girl|girl\s*simulator|femboy|lewd|bikini\s*girls|yaoi|yuri|h-game|ero|dating\s*sim|uncensored|milf|futa|succubus|onee|sakura|demo|soundtrack|artbook)\b/i;

async function _fetchSuggestions(term) {
  if (_suggestCache[term]) return _suggestCache[term];
  try {
    const r = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(term)}&limit=15`);
    const data = await r.json();
    // Filter out junk titles
    const clean = (data || []).filter(g => g.external && !_JUNK_RE.test(g.external)).slice(0, 8);
    _suggestCache[term] = clean;
    return clean;
  } catch { return []; }
}

function _renderSuggest(boxId, inputId, results, onClick) {
  const box = document.getElementById(boxId);
  if (!box) return;
  if (!results.length) { box.style.display = 'none'; return; }
  box.innerHTML = results.map((r, i) => `
    <div class="suggest-item" data-idx="${i}" onmousedown="event.preventDefault();${onClick}(${i})" style="display:flex;gap:10px;align-items:center;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.1s" onmouseover="this.style.background='var(--panel2)'" onmouseout="this.style.background='transparent'">
      <img src="${r.thumb||''}" style="width:60px;height:28px;object-fit:cover;border-radius:3px;flex-shrink:0">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.external}</div>
        ${r.cheapest ? `<div style="font-size:11px;color:var(--dim)">from $${r.cheapest}</div>` : ''}
      </div>
    </div>`).join('');
  box.style.display = 'block';
  _suggestIdx[boxId] = -1;
}

function _makeSuggest(inputId, boxId, cacheKey, onPick) {
  return {
    oninput(input) {
      const v = input.value.trim();
      if (v.length < 2) { document.getElementById(boxId).style.display = 'none'; return; }
      clearTimeout(_suggestTimers[boxId]);
      _suggestTimers[boxId] = setTimeout(async () => {
        const results = await _fetchSuggestions(v);
        _suggestCache['_last_'+boxId] = results;
        _renderSuggest(boxId, inputId, results, onPick);
      }, 250);
    },
    onkey(e) {
      const box = document.getElementById(boxId);
      if (box.style.display === 'none') {
        if (e.key === 'Enter') { e.preventDefault(); window[cacheKey+'Trigger'](); }
        return;
      }
      const items = box.querySelectorAll('.suggest-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _suggestIdx[boxId] = Math.min((_suggestIdx[boxId]||-1)+1, items.length-1);
        items.forEach((el,i) => el.style.background = i===_suggestIdx[boxId] ? 'var(--panel2)' : 'transparent');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _suggestIdx[boxId] = Math.max((_suggestIdx[boxId]||0)-1, 0);
        items.forEach((el,i) => el.style.background = i===_suggestIdx[boxId] ? 'var(--panel2)' : 'transparent');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (_suggestIdx[boxId] >= 0) {
          window[onPick](_suggestIdx[boxId]);
        } else {
          box.style.display = 'none';
          window[cacheKey+'Trigger']();
        }
      } else if (e.key === 'Escape') {
        box.style.display = 'none';
      }
    }
  };
}

// GUIDE suggest + finder
function guideSuggest(input) { _makeSuggest('guideInput','guideSuggestBox','guide','pickGuideSuggest').oninput(input); }
function guideSuggestKey(e) { _makeSuggest('guideInput','guideSuggestBox','guide','pickGuideSuggest').onkey(e); }
function pickGuideSuggest(idx) {
  const r = _suggestCache['_last_guideSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('guideInput').value = r.external;
  document.getElementById('guideSuggestBox').style.display = 'none';
  findGuides();
}
window.guideTrigger = () => findGuides();

function findGuides() {
  const title = document.getElementById('guideInput').value.trim();
  const el = document.getElementById('guideResults');
  if (!title) { el.innerHTML = ''; return; }
  const q = encodeURIComponent(title);
  const links = [
    { label: 'Walkthrough videos', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' walkthrough')}`, source: 'YouTube', desc: 'Top-rated video playthroughs, quest-by-quest' },
    { label: 'Boss/quest guides', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' boss guide')}`, source: 'YouTube', desc: 'Specific boss fights, hard quests, hidden areas' },
    { label: 'Fandom Wiki', url: `https://www.google.com/search?q=${q}+site%3Afandom.com`, source: 'Fandom', desc: 'Community wiki - items, locations, NPCs' },
    { label: 'Fextralife Wiki', url: `https://www.google.com/search?q=${q}+site%3Afextralife.com`, source: 'Fextralife', desc: 'Best for Souls-likes, RPGs (builds, drops)' },
    { label: 'IGN Wiki & Guide', url: `https://www.google.com/search?q=${q}+site%3Aign.com%2Fwikis`, source: 'IGN', desc: 'Structured walkthroughs with screenshots' },
    { label: 'PCGamingWiki', url: `https://www.pcgamingwiki.com/w/index.php?search=${q}`, source: 'PCGamingWiki', desc: 'Technical issues, mods, fixes, config' },
    { label: 'Steam Community Guides', url: `https://steamcommunity.com/app/search?text=${q}&sectionid=guide`, source: 'Steam', desc: 'Player-written strategy guides' },
    { label: 'GameFAQs', url: `https://gamefaqs.gamespot.com/search?game=${q}`, source: 'GameFAQs', desc: 'Classic text walkthroughs (often the most complete)' },
    { label: 'Reddit discussions', url: `https://www.reddit.com/search/?q=${encodeURIComponent(title + ' tips')}`, source: 'Reddit', desc: 'Live player discussion, tips, spoilers flagged' },
  ];

  el.innerHTML = `
    <div style="font-size:11px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">Guides for <span style="color:var(--accent)">${title}</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">
      ${links.map(l => `
        <a href="${l.url}" target="_blank" rel="noopener" style="display:block;padding:14px;background:var(--panel2);border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text);transition:all 0.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="background:var(--accent);color:#000;font-size:9px;font-weight:700;padding:2px 7px;border-radius:3px;letter-spacing:1px">${l.source.toUpperCase()}</span>
            <span style="font-weight:600;font-size:14px">${l.label}</span>
          </div>
          <div style="font-size:12px;color:var(--dim);line-height:1.4">${l.desc}</div>
          <div style="font-size:11px;color:var(--accent);margin-top:8px">Open →</div>
        </a>
      `).join('')}
    </div>
  `;
}

// HLTB suggest bindings
function hltbSuggest(input) { _makeSuggest('hltbInput','hltbSuggestBox','hltb','pickHltbSuggest').oninput(input); }
function hltbSuggestKey(e) { _makeSuggest('hltbInput','hltbSuggestBox','hltb','pickHltbSuggest').onkey(e); }
function pickHltbSuggest(idx) {
  const r = _suggestCache['_last_hltbSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('hltbInput').value = r.external;
  document.getElementById('hltbSuggestBox').style.display = 'none';
  checkHLTB();
}
window.hltbTrigger = () => checkHLTB();

// FPS GAME suggest bindings
function fpsGameSuggest(input) { _makeSuggest('fpsGame','fpsGameSuggestBox','fpsGame','pickFpsGameSuggest').oninput(input); }
function fpsGameSuggestKey(e) { _makeSuggest('fpsGame','fpsGameSuggestBox','fpsGame','pickFpsGameSuggest').onkey(e); }
function pickFpsGameSuggest(idx) {
  const r = _suggestCache['_last_fpsGameSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('fpsGame').value = r.external;
  document.getElementById('fpsGameSuggestBox').style.display = 'none';
}
window.fpsGameTrigger = () => estimateFPS();

// PRICE HISTORY suggest bindings
function priceSuggest(input) { _makeSuggest('priceHistoryInput','priceSuggestBox','priceHistory','pickPriceSuggest').oninput(input); }
function priceSuggestKey(e) { _makeSuggest('priceHistoryInput','priceSuggestBox','priceHistory','pickPriceSuggest').onkey(e); }
function pickPriceSuggest(idx) {
  const r = _suggestCache['_last_priceSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('priceHistoryInput').value = r.external;
  document.getElementById('priceSuggestBox').style.display = 'none';
  checkPriceHistory();
}
window.priceHistoryTrigger = () => checkPriceHistory();

// REVIEWS suggest bindings
function reviewSuggest(input) { _makeSuggest('reviewsInput','reviewSuggestBox','reviews','pickReviewSuggest').oninput(input); }
function reviewSuggestKey(e) { _makeSuggest('reviewsInput','reviewSuggestBox','reviews','pickReviewSuggest').onkey(e); }
function pickReviewSuggest(idx) {
  const r = _suggestCache['_last_reviewSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('reviewsInput').value = r.external;
  document.getElementById('reviewSuggestBox').style.display = 'none';
  compareReviews();
}
window.reviewsTrigger = () => compareReviews();

// WISHLIST suggest bindings
function wishlistSuggest(input) { _makeSuggest('wishlistInput','wishlistSuggestBox','wishlist','pickWishlistSuggest').oninput(input); }
function wishlistSuggestKey(e) { _makeSuggest('wishlistInput','wishlistSuggestBox','wishlist','pickWishlistSuggest').onkey(e); }
function pickWishlistSuggest(idx) {
  const r = _suggestCache['_last_wishlistSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('wishlistInput').value = r.external;
  document.getElementById('wishlistSuggestBox').style.display = 'none';
  addWishlist();
}
window.wishlistTrigger = () => addWishlist();

// DEAL SEARCH suggest
function dealSearchSuggest(input) { _makeSuggest('dealSearchInput','dealSearchSuggestBox','dealSearch','pickDealSearchSuggest').oninput(input); }
function dealSearchSuggestKey(e) { _makeSuggest('dealSearchInput','dealSearchSuggestBox','dealSearch','pickDealSearchSuggest').onkey(e); }
function pickDealSearchSuggest(idx) {
  const r = _suggestCache['_last_dealSearchSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('dealSearchInput').value = r.external;
  document.getElementById('dealSearchSuggestBox').style.display = 'none';
  searchDeal();
}
window.dealSearchTrigger = () => searchDeal();

// PRICE ALERT input suggest
function alertGameSuggest(input) { _makeSuggest('alertGameInput','alertGameSuggestBox','alertGame','pickAlertGameSuggest').oninput(input); }
function alertGameSuggestKey(e) { _makeSuggest('alertGameInput','alertGameSuggestBox','alertGame','pickAlertGameSuggest').onkey(e); }
function pickAlertGameSuggest(idx) {
  const r = _suggestCache['_last_alertGameSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('alertGameInput').value = r.external;
  document.getElementById('alertGameSuggestBox').style.display = 'none';
}
window.alertGameTrigger = () => {};

// JOURNAL input suggest
function journalSuggest(input) { _makeSuggest('journalGame','journalSuggestBox','journal','pickJournalSuggest').oninput(input); }
function journalSuggestKey(e) { _makeSuggest('journalGame','journalSuggestBox','journal','pickJournalSuggest').onkey(e); }
function pickJournalSuggest(idx) {
  const r = _suggestCache['_last_journalSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('journalGame').value = r.external;
  document.getElementById('journalSuggestBox').style.display = 'none';
}
window.journalTrigger = () => {};

// ───── PRICE HISTORY ─────
async function checkPriceHistory() {
  const title = document.getElementById('priceHistoryInput').value.trim();
  if (!title) return;
  const el = document.getElementById('priceHistoryResult');
  el.innerHTML = '<div class="empty"><span class="loading"></span> Looking up pricing...</div>';
  try {
    const r = await fetch(`/api/price-history?title=${encodeURIComponent(title)}`);
    const d = await r.json();
    if (d.error) { el.innerHTML = `<div class="error">${d.error}</div>`; return; }
    const isGoodDeal = d.historicalLow && d.currentCheapest <= d.historicalLow.price * 1.05;
    el.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
        <div style="width:120px;aspect-ratio:460/215;background:url('${d.thumb}') center/cover;border-radius:6px;flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700;margin-bottom:6px">${d.title}</div>
          <div style="font-size:13px;color:var(--dim)">Currently: <strong style="color:var(--accent)">$${d.currentCheapest.toFixed(2)}</strong></div>
          ${d.historicalLow ? `<div style="font-size:13px;color:var(--dim)">Historical low: <strong style="color:${isGoodDeal?'var(--accent)':'var(--text)'}">$${d.historicalLow.price.toFixed(2)}</strong> (${new Date(d.historicalLow.date*1000).toLocaleDateString()})</div>` : ''}
          <div style="font-size:12px;margin-top:6px;color:${isGoodDeal?'var(--accent)':'#ffb84a'};font-weight:700">${isGoodDeal ? '✓ GREAT TIME TO BUY' : 'Wait for better price'}</div>
        </div>
      </div>
      <h4 style="font-size:12px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Active deals</h4>
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        ${d.activeDeals.slice(0,8).map(deal => `
          <tr style="border-bottom:1px solid var(--border)">
            <td style="padding:8px 0"><strong>${deal.storeName}</strong></td>
            <td style="padding:8px 0;color:var(--accent);font-weight:700">$${deal.price.toFixed(2)}</td>
            <td style="padding:8px 0;color:var(--dim)">${deal.savings>0 ? '-'+deal.savings+'%' : ''}</td>
            <td style="padding:8px 0;text-align:right"><a href="${deal.dealLink}" target="_blank" style="color:var(--accent)">Buy →</a></td>
          </tr>`).join('')}
      </table>`;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── REVIEWS COMPARE ─────
async function compareReviews() {
  const title = document.getElementById('reviewsInput').value.trim();
  if (!title) return;
  const el = document.getElementById('reviewsCompareResult');
  el.innerHTML = '<div class="empty"><span class="loading"></span></div>';
  try {
    const r = await fetch(`/api/reviews-compare?title=${encodeURIComponent(title)}`);
    const d = await r.json();
    if (d.error) { el.innerHTML = `<div class="error">${d.error}</div>`; return; }
    const stColour = d.steam?.score >= 85 ? 'var(--accent)' : d.steam?.score >= 70 ? '#d5e65c' : d.steam?.score >= 50 ? '#ff9e42' : '#ff5a5a';
    const mcColour = d.metacritic?.score >= 80 ? 'var(--accent)' : d.metacritic?.score >= 60 ? '#d5e65c' : '#ff9e42';
    el.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
        ${d.img ? `<div style="width:160px;aspect-ratio:460/215;background:url('${d.img}') center/cover;border-radius:6px;flex-shrink:0"></div>` : ''}
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700;margin-bottom:6px">${d.title}</div>
          <div style="font-size:12px;color:var(--dim);margin-bottom:6px">${(d.genres||[]).join(' · ')}</div>
          ${d.releaseDate ? `<div style="font-size:11px;color:var(--dim)">Released: ${d.releaseDate} · ${d.price || ''}</div>` : ''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${d.steam ? `<div style="background:var(--panel2);border-radius:8px;padding:18px"><div style="font-size:11px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Steam Users</div><div style="font-size:32px;font-weight:800;color:${stColour};line-height:1">${d.steam.score}%</div><div style="font-size:12px;color:var(--dim);margin-top:4px">${d.steam.label}</div><div style="font-size:11px;color:var(--dim)">${d.steam.count.toLocaleString()} reviews</div></div>` : ''}
        ${d.metacritic ? `<div style="background:var(--panel2);border-radius:8px;padding:18px"><div style="font-size:11px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Metacritic (Critics)</div><div style="font-size:32px;font-weight:800;color:${mcColour};line-height:1">${d.metacritic.score}</div><div style="font-size:12px;color:var(--dim);margin-top:4px">out of 100</div><a href="${d.metacritic.url}" target="_blank" style="font-size:11px;color:var(--accent)">View on Metacritic →</a></div>` : '<div style="background:var(--panel2);border-radius:8px;padding:18px;color:var(--dim);font-size:12px">No Metacritic score</div>'}
      </div>`;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── LIBRARY FILTERS ─────
function filterLibrary(mode) {
  if (!STATE.games?.length) { document.getElementById('libraryFilterResult').innerHTML = '<div class="empty">Connect Steam first.</div>'; return; }
  let list = STATE.games;
  if (mode === 'played') list = list.filter(g => g.hours > 0);
  if (mode === 'untouched') list = list.filter(g => g.hours === 0);
  if (mode === 'short') list = list.filter(g => g.hours > 0 && g.hours < 2);
  if (mode === 'obsessed') list = list.filter(g => g.hours >= 100);
  const el = document.getElementById('libraryFilterResult');
  if (!list.length) { el.innerHTML = '<div class="empty">No games match.</div>'; return; }
  el.innerHTML = `
    <div style="font-size:12px;color:var(--dim);margin-bottom:10px">${list.length} games</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;max-height:500px;overflow-y:auto">
      ${list.slice(0, 40).map(g => `
        <div onclick="openSteam(${g.appid})" style="cursor:pointer">
          <div style="aspect-ratio:460/215;background:url('${g.img||''}') center/cover;border-radius:4px"></div>
          <div style="font-size:11px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.name}</div>
          <div style="font-size:10px;color:var(--dim)">${g.hours}h</div>
        </div>`).join('')}
    </div>`;
}

// ───── PUBLIC PROFILE URL ─────
function updateProfileUrl() {
  const box = document.getElementById('profileUrl');
  if (!box || !STATE.sid) return;
  const customUrl = localStorage.getItem('questlog_custom_url');
  const theme = localStorage.getItem('questlog_theme') || 'gamerlux';
  const isPro = localStorage.getItem('questlog_pro') === '1';
  const base = customUrl || STATE.sid;
  const params = [];
  if (theme !== 'dark') params.push(`theme=${theme}`);
  if (isPro) params.push('pro=1');
  const q = params.length ? '?' + params.join('&') : '';
  box.textContent = `${location.origin}/u/${base}${q}`;
}
function initProFeatures() {
  renderProHub();
  if (isProActive()) {
    renderPriceAlerts();
    renderWishlist();
    renderRecentDrops();
    renderSystemStatus();
    renderThemeButtons();
    loadActiveTheme();
    const savedCustom = localStorage.getItem('questlog_custom_url');
    const input = document.getElementById('customUrlInput');
    if (input && savedCustom) input.value = savedCustom;
    if (!STATE.spendLoaded) { loadSpendAnalytics(); STATE.spendLoaded = true; }
  }
}

// Owner + a whitelist of Steam IDs that get auto-Pro
const PRO_WHITELIST = new Set([
  '76561199040427763', // Julian (owner)
  '76561199473348194', // NIXO
]);
function isProActive() {
  if (STATE.sid && PRO_WHITELIST.has(STATE.sid)) return true;
  if (STATE.serverProActive) return true;
  return localStorage.getItem('questlog_pro') === '1';
}

// Verify Pro state with the server once we know the user's Steam ID.
// Used by Stripe-paid Pro accounts where Stripe webhook wrote Pro state to KV.
async function checkServerPro() {
  if (!STATE.sid) return;
  try {
    const r = await fetch(`/api/pro-status?sid=${STATE.sid}`);
    const d = await r.json();
    if (d.active) {
      STATE.serverProActive = true;
      renderProHub();
    }
  } catch {}
}

function renderProHub() {
  const gated = document.getElementById('proHubGated');
  const unlocked = document.getElementById('proHubUnlocked');
  const navBadge = document.getElementById('proBadgeNav');
  const navTabPro = document.getElementById('navTabPro');
  const active = isProActive();
  if (gated) gated.style.display = active ? 'none' : 'block';
  if (unlocked) unlocked.style.display = active ? 'block' : 'none';
  if (navBadge) navBadge.style.display = active ? 'inline-block' : 'none';
  if (navTabPro) navTabPro.classList.toggle('show', active);
  // Hide the home upgrade banner once user is Pro
  const homeBanner = document.getElementById('homeProBanner');
  if (homeBanner) homeBanner.style.display = active ? 'none' : 'flex';
  // Show "Manage subscription" only for *paying* Pro users (server-active),
  // not demo togglers and not whitelisted owner accounts. Stripe billing
  // portal needs a customerId, which only exists for real subscriptions.
  const manageBtn = document.getElementById('manageSubBtn');
  if (manageBtn) manageBtn.style.display = STATE.serverProActive ? 'inline-block' : 'none';
}

// Open Stripe-hosted billing portal so Pro users can cancel, update card,
// or view invoices without contacting support. Endpoint returns:
//   {url}        -> redirect there
//   {notReady}   -> Stripe key not yet configured (pre-launch)
//   {noCustomer} -> no Stripe customer on file (shouldn't happen for serverPro,
//                   but guard anyway in case webhook missed customerId).
async function manageSubscription() {
  if (!STATE.sid) { alert('Sign in with Steam first.'); return; }
  try {
    const r = await fetch('/api/stripe/billing-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: STATE.sid }),
    });
    const d = await r.json();
    if (d.url) { window.location.href = d.url; return; }
    if (d.notReady) { alert('Subscription management isn\u2019t live yet \u2013 Stripe is being finalised. Email julian.tamas12@gmail.com if you need to cancel in the meantime.'); return; }
    if (d.noCustomer) { alert('No Stripe subscription found on this account. If you paid for Pro and see this, email julian.tamas12@gmail.com.'); return; }
    alert('Could not open billing portal: ' + (d.error || 'unknown error'));
  } catch (e) {
    alert('Billing portal unavailable right now. ' + e.message);
  }
}

function goToPro() {
  document.querySelector('[data-view="pro"]').click();
}

function togglePro() {
  const now = isProActive();
  if (now) {
    localStorage.removeItem('questlog_pro');
  } else {
    localStorage.setItem('questlog_pro', '1');
  }
  renderProHub();
  initProFeatures();
  updateProfileUrl();
}

async function upgradeToPro() {
  if (!STATE.sid) {
    alert('Connect your Steam account first so we can attach Pro to your profile.');
    return;
  }
  try {
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: STATE.sid, profile: STATE.profile?.name || '' }),
    });
    const d = await r.json();
    if (d.url) {
      window.location.href = d.url;
      return;
    }
    if (d.notReady) {
      alert('Pro launches very soon - the Stripe checkout is being finalised. Try the "Preview Pro (demo)" button below to explore Pro features in the meantime.');
      return;
    }
    alert('Could not start checkout: ' + (d.error || 'unknown error'));
  } catch (e) {
    alert('Checkout unavailable right now. ' + e.message);
  }
}
function copyProfileUrl() {
  if (!STATE.sid) return;
  const url = `${location.origin}/u/${STATE.sid}`;
  navigator.clipboard.writeText(url).then(() => {
    const box = document.getElementById('profileUrl');
    const orig = box.textContent;
    box.textContent = '✓ Copied!';
    setTimeout(() => box.textContent = orig, 1500);
  });
}

// ───── GAME JOURNAL ─────
function getJournal() { try { return JSON.parse(localStorage.getItem('questlog_journal') || '[]'); } catch { return []; } }
function saveJournal(j) { localStorage.setItem('questlog_journal', JSON.stringify(j)); }
function addJournal() {
  const game = document.getElementById('journalGame').value.trim();
  const rating = document.getElementById('journalRating').value;
  const note = document.getElementById('journalNote').value.trim();
  if (!game) return;
  const j = getJournal();
  j.unshift({ game, rating, note, date: Date.now() });
  saveJournal(j);
  document.getElementById('journalGame').value = '';
  document.getElementById('journalRating').value = '';
  document.getElementById('journalNote').value = '';
  renderJournal();
}
function deleteJournal(ts) {
  if (!confirm('Delete entry?')) return;
  saveJournal(getJournal().filter(e => e.date !== ts));
  renderJournal();
}
function renderJournal() {
  const el = document.getElementById('journalList');
  if (!el) return;
  const j = getJournal();
  if (!j.length) { el.innerHTML = '<div class="empty" style="text-align:left;font-size:12px;padding:12px 0">No entries yet.</div>'; return; }
  el.innerHTML = j.map(e => `
    <div style="background:var(--panel2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div>
          <div style="font-weight:700;font-size:14px">${e.game}</div>
          ${e.rating ? `<div style="font-size:11px;color:var(--accent);margin-top:2px">${e.rating}</div>` : ''}
        </div>
        <button onclick="deleteJournal(${e.date})" style="background:transparent;color:var(--dim);border:none;cursor:pointer;font-size:14px">×</button>
      </div>
      ${e.note ? `<div style="font-size:13px;color:var(--dim);margin-top:6px;white-space:pre-wrap">${e.note}</div>` : ''}
      <div style="font-size:10px;color:var(--dim);margin-top:6px;letter-spacing:1px">${new Date(e.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</div>
    </div>`).join('');
}

// ───── CUSTOM URL (PRO) ─────
function saveCustomUrl() {
  const name = document.getElementById('customUrlInput').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!name || name.length < 3) { document.getElementById('customUrlResult').innerHTML = '<span style="color:#ff5a5a">Min 3 characters, a-z 0-9 - only.</span>'; return; }
  localStorage.setItem('questlog_custom_url', name);
  const url = `${location.origin}/u/${name}`;
  document.getElementById('customUrlResult').innerHTML = `<span style="color:var(--accent)">✓ Saved. Your URL: ${url}</span>`;
  updateProfileUrl();
}

// ───── THEME (PRO) ─────
const THEMES = {
  dark:       { label:'Dark',       free:true,  bg:'#0e1419', panel:'#16202d', panel2:'#1f2933', accent:'#66c0f4', accent2:'#1b75bb', text:'#c7d5e0', dim:'rgba(199,213,224,0.55)',     border:'rgba(102,192,244,0.08)' },
  light:      { label:'Light',      free:true,  bg:'#f5f2e8', panel:'#fffbf2', panel2:'#ece6d5', accent:'#b89452', accent2:'#8c7035', text:'#1a1a1a', dim:'rgba(26,26,26,0.6)',         border:'rgba(0,0,0,0.1)' },
  gold:       { label:'Gold',       free:false, bg:'#1a1206', panel:'#2a1f0a', panel2:'#3a2c12', accent:'#e8c068', accent2:'#b8935a', text:'#f4e8cc', dim:'rgba(244,232,204,0.6)',       border:'rgba(232,192,104,0.18)' },
  retro:      { label:'Retro',      free:false, bg:'#2d0a2d', panel:'#3a1040', panel2:'#4a1450', accent:'#ff3a8c', accent2:'#cc2a6a', text:'#fce8ff', dim:'rgba(252,232,255,0.6)',       border:'rgba(255,58,140,0.18)' },
  neon:       { label:'Neon',       free:false, bg:'#0a001f', panel:'#14063a', panel2:'#1f0a4a', accent:'#00e0ff', accent2:'#00a8c2', text:'#e8e8ff', dim:'rgba(232,232,255,0.6)',       border:'rgba(0,224,255,0.18)' },
  forest:     { label:'Forest',     free:false, bg:'#0a1a10', panel:'#0f2418', panel2:'#163020', accent:'#5cd67a', accent2:'#3a9a4d', text:'#e0f0e4', dim:'rgba(224,240,228,0.6)',       border:'rgba(92,214,122,0.15)' },
  blood:      { label:'Blood',      free:false, bg:'#1a0606', panel:'#2a0a0a', panel2:'#3a1212', accent:'#ff4a4a', accent2:'#cc2828', text:'#ffe0e0', dim:'rgba(255,224,224,0.55)',     border:'rgba(255,74,74,0.18)' },
  sunset:     { label:'Sunset',     free:false, bg:'#1a0a14', panel:'#2a1018', panel2:'#3a1822', accent:'#ff9e42', accent2:'#cc7028', text:'#ffe8d8', dim:'rgba(255,232,216,0.6)',       border:'rgba(255,158,66,0.18)' },
  mint:       { label:'Mint',       free:false, bg:'#0a1a18', panel:'#0f2422', panel2:'#16302d', accent:'#5ce0c2', accent2:'#3aa090', text:'#dff5f0', dim:'rgba(223,245,240,0.6)',       border:'rgba(92,224,194,0.15)' },
  monochrome: { label:'Monochrome', free:false, bg:'#0a0a0a', panel:'#141414', panel2:'#1c1c1c', accent:'#ffffff', accent2:'#aaaaaa', text:'#f0f0f0', dim:'rgba(240,240,240,0.5)',       border:'rgba(255,255,255,0.08)' },
  royal:      { label:'Royal',      free:false, bg:'#0a0a1f', panel:'#0f1030', panel2:'#1a1a45', accent:'#a070ff', accent2:'#7848cc', text:'#e8e0ff', dim:'rgba(232,224,255,0.6)',       border:'rgba(160,112,255,0.18)' },
  ocean:      { label:'Ocean',      free:false, bg:'#040c1a', panel:'#0a1830', panel2:'#102448', accent:'#42b8e0', accent2:'#2880a8', text:'#dff0ff', dim:'rgba(223,240,255,0.6)',       border:'rgba(66,184,224,0.18)' },
  gamerlux:   { label:'Gamer',      free:true,  bg:'#1b2838', panel:'#16202d', panel2:'#1a2735', accent:'#67c1f5', accent2:'#417a9b', text:'#c7d5e0', dim:'rgba(199,213,224,0.5)',       border:'rgba(255,255,255,0.06)', mode:'gamer' },
};

// Shade a hex colour by amount (-1..1). Negative darkens, positive lightens.
function _shadeHex(hex, amt) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  if (amt < 0) {
    r = Math.max(0, Math.round(r * (1 + amt)));
    g = Math.max(0, Math.round(g * (1 + amt)));
    b = Math.max(0, Math.round(b * (1 + amt)));
  } else {
    r = Math.min(255, Math.round(r + (255 - r) * amt));
    g = Math.min(255, Math.round(g + (255 - g) * amt));
    b = Math.min(255, Math.round(b + (255 - b) * amt));
  }
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// User-customisable accent colour overrides the theme's accent
function applyAccentOverride() {
  const accent = localStorage.getItem('questlog_custom_accent');
  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) {
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    // Generate a slightly darker accent2
    const r = parseInt(accent.slice(1,3),16), g = parseInt(accent.slice(3,5),16), b = parseInt(accent.slice(5,7),16);
    const dark = '#' + [Math.round(r*0.75), Math.round(g*0.75), Math.round(b*0.75)].map(x => x.toString(16).padStart(2,'0')).join('');
    root.style.setProperty('--accent2', dark);
  }
}

// Custom background colour override - same pattern as accent.
// Recomputes --panel / --panel2 / --bg-deep / --text-bright relative to the chosen bg
// so the rest of the UI still reads correctly on a custom palette.
function applyBgOverride() {
  const bg = localStorage.getItem('questlog_custom_bg');
  if (!bg || !/^#[0-9a-f]{6}$/i.test(bg)) return;
  const root = document.documentElement;
  root.style.setProperty('--bg', bg);
  // Derive related surfaces. If the bg is light, lighten panels by 5-10%; if dark, darken.
  const r = parseInt(bg.slice(1,3),16), g = parseInt(bg.slice(3,5),16), b = parseInt(bg.slice(5,7),16);
  const luma = (0.299*r + 0.587*g + 0.114*b) / 255;
  const isLight = luma > 0.5;
  root.style.setProperty('--panel',  _shadeHex(bg, isLight ? -0.04 : 0.06));
  root.style.setProperty('--panel2', _shadeHex(bg, isLight ? -0.08 : 0.12));
  root.style.setProperty('--bg-deep', _shadeHex(bg, isLight ? -0.12 : -0.25));
  root.style.setProperty('--text', isLight ? '#1a1a1a' : '#c7d5e0');
  root.style.setProperty('--text-bright', isLight ? '#000' : '#fff');
  root.style.setProperty('--dim', isLight ? 'rgba(26,26,26,0.6)' : 'rgba(199,213,224,0.55)');
  root.style.setProperty('--border', isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)');
  // Tell mobile chrome bar what colour to paint
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
  meta.content = bg;
}

function setCustomBg(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
  localStorage.setItem('questlog_custom_bg', hex);
  const hexEl = document.getElementById('customBgHex');
  if (hexEl) hexEl.value = hex;
  applyBgOverride();
}
function clearCustomBg() {
  localStorage.removeItem('questlog_custom_bg');
  const hexEl = document.getElementById('customBgHex');
  if (hexEl) hexEl.value = '';
  // Re-apply current theme, then re-apply accent override on top
  applyTheme(localStorage.getItem('questlog_theme') || 'gamerlux');
}

function applyTheme(theme) {
  const t = THEMES[theme] || THEMES.dark;
  // Free users can only use free themes - silently downgrade
  if (!t.free && !isProActive()) {
    return applyTheme('dark');
  }
  const root = document.documentElement;
  root.style.setProperty('--bg', t.bg);
  root.style.setProperty('--panel', t.panel);
  root.style.setProperty('--panel2', t.panel2);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent2', t.accent2);
  root.style.setProperty('--text', t.text);
  root.style.setProperty('--dim', t.dim);
  root.style.setProperty('--border', t.border);
  // Derive --bg-deep (nav fill) by darkening --bg ~25% - keeps nav legible on every palette
  root.style.setProperty('--bg-deep', _shadeHex(t.bg, -0.25));
  root.style.setProperty('--text-bright', t.text === '#1a1a1a' ? '#000' : '#fff');
  // Theme-mode hooks - drives the gamer-minimalist overlay (typography, formatting, layout)
  if (t.mode) root.setAttribute('data-theme-mode', t.mode);
  else root.removeAttribute('data-theme-mode');
  applyAccentOverride();
  applyBgOverride();
  applyDensity();
  applyFontSize();
  applyCornerStyle();
  applyThemeMode(t.mode || null);
}

// Gamer-minimalist mode: ships extra CSS that changes typography, formatting and layout -
// not just colours. Inspired by Steam, Apex Legends, and Steam Deck UI.
function applyThemeMode(mode) {
  let s = document.getElementById('theme-mode-overrides');
  if (!s) {
    s = document.createElement('style');
    s.id = 'theme-mode-overrides';
    document.head.appendChild(s);
  }
  if (mode !== 'gamer') { s.textContent = ''; return; }
  // Gamer mode is now thin - the base CSS already follows DESIGN.md.
  // Only the truly Steam-specific cosmetics live here.
  s.textContent = `
    /* ─── GAMER MODE ─── Steam client cosmetics layered over the
       palette-agnostic Ferrari skeleton. */
    html[data-theme-mode='gamer'] body{
      font-family:'Motiva Sans','Inter',sans-serif;
    }
    html[data-theme-mode='gamer'] nav{
      background:#171a21 !important;
    }
    html[data-theme-mode='gamer'] .btn-primary,
    html[data-theme-mode='gamer'] .connect-btn{
      background:#3d6b8d !important;
      color:#e8f0f7 !important;
      font-weight:600 !important;
      letter-spacing:0.3px !important;
      text-transform:none !important;
    }
    html[data-theme-mode='gamer'] .btn-primary:hover,
    html[data-theme-mode='gamer'] .connect-btn:hover{
      background:#4a8fc1 !important;
      color:#fff !important;
    }
    html[data-theme-mode='gamer'] *::-webkit-scrollbar-thumb{
      background:#3d4450 !important;
    }
    html[data-theme-mode='gamer'] *::-webkit-scrollbar-thumb:hover{
      background:var(--accent) !important;
    }

    /* Numbers - always tabular mono */
    html[data-theme-mode='gamer'] .mono,
    html[data-theme-mode='gamer'] [class*='stat-num'],
    html[data-theme-mode='gamer'] [class*='stat-value']{
      font-family:'JetBrains Mono',monospace !important;
      font-feature-settings:'tnum' 1,'zero' 1;
    }

  `;
}

function injectStyleOverrides() {
  const density = localStorage.getItem('questlog_density') || 'normal';
  const corners = localStorage.getItem('questlog_corners') || 'rounded';
  let css = '';

  if (density === 'compact') {
    css += `
      main{padding:14px 18px}
      .section{margin-bottom:18px}
      .stat-card{padding:10px}
      .sidebar-card{padding:10px}
      .game-card .game-body{padding:6px 8px}
      .rec-card{padding:10px;gap:10px;margin-bottom:6px}
      .game-grid{gap:8px}
      .nav-tab{padding:5px 10px}
      .pillar{padding:18px 14px}
      .feature{padding:16px}
      .leaderboard-table th,.leaderboard-table td{padding:5px 4px}
    `;
  } else if (density === 'spacious') {
    css += `
      main{padding:32px 40px}
      .section{margin-bottom:42px}
      .stat-card{padding:24px}
      .sidebar-card{padding:24px}
      .game-card .game-body{padding:14px 18px}
      .rec-card{padding:24px;gap:22px;margin-bottom:14px}
      .game-grid{gap:20px}
      .nav-tab{padding:11px 20px}
      .pillar{padding:36px 30px}
      .feature{padding:36px}
      .leaderboard-table th,.leaderboard-table td{padding:14px 10px}
    `;
  }

  // Corner radius: sharp (0), soft (6), round (14). Avatars always 50%.
  let radius = '0';
  if (corners === 'soft') radius = '6px';
  else if (corners === 'round') radius = '14px';
  // Cards/tiles use a slightly smaller radius than buttons for hierarchy
  const tileRadius = corners === 'round' ? '10px' : (corners === 'soft' ? '4px' : '0');
  css += `
    .connect-btn,.btn-primary,.btn-ghost,.btn,.btn-portal,.btn-xl,.sid-input,.theme-btn,.density-btn,.corner-btn,.mood-btn{border-radius:${radius} !important}
    .stat-card,.game-card,.rec-card,.sidebar-card,.feature-card,.feature,.kit-card,.plan,.empty,.error,.sub-tab{border-radius:${tileRadius} !important}
    button:not([class*='btn']):not([class*='-btn']):not(.nav-tab):not(.sub-tab){border-radius:${radius} !important}
    .game-img,.rec-cover,.ach-icon{border-radius:${tileRadius} !important}
    .nav-user-avatar{border-radius:50% !important}
    input[type=text],input[type=email],input[type=number],input[type=date],input[type=color],input[type=search],input[type=password],select,textarea{border-radius:${radius} !important}
  `;

  let s = document.getElementById('user-style-overrides');
  if (!s) {
    s = document.createElement('style');
    s.id = 'user-style-overrides';
    document.head.appendChild(s);
  }
  s.textContent = css;
}

function applyDensity() { injectStyleOverrides(); }
function applyCornerStyle() { injectStyleOverrides(); }
function applyFontSize() {
  const pct = parseFloat(localStorage.getItem('questlog_fontsize') || '100');
  // Use CSS zoom for live smooth scaling. Backed by a transition for buttery feel.
  // Falls back to transform:scale on browsers that don't honour zoom (Firefox).
  const ratio = pct / 100;
  if ('zoom' in document.body.style || /chrome|safari|edg/i.test(navigator.userAgent)) {
    document.body.style.zoom = ratio.toString();
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
    document.body.style.width = '';
  } else {
    document.body.style.zoom = '';
    document.body.style.transform = `scale(${ratio})`;
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = (100 / ratio) + '%';
  }
}

function renderThemeButtons() {
  const wrap = document.getElementById('themeButtons');
  if (!wrap) return;
  wrap.innerHTML = Object.entries(THEMES).map(([key, t]) => {
    const locked = !t.free && !isProActive();
    return `<button onclick="setTheme('${key}')" class="theme-btn" data-theme="${key}" style="background:linear-gradient(135deg,${t.bg},${t.panel2});color:${t.text};border:2px solid transparent;padding:14px 12px;border-radius:6px;font-family:inherit;font-size:12px;font-weight:600;cursor:${locked?'not-allowed':'pointer'};transition:all 0.15s;position:relative;${locked?'opacity:0.6':''}">${t.label}${locked?' \u00b7 PRO':''}<span style="display:block;width:14px;height:14px;background:${t.accent};border-radius:50%;margin:6px auto 0"></span></button>`;
  }).join('');
  loadActiveTheme();
}

function setCustomAccent(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
  localStorage.setItem('questlog_custom_accent', hex);
  document.getElementById('customAccentHex').value = hex;
  applyAccentOverride();
}
function clearCustomAccent() {
  localStorage.removeItem('questlog_custom_accent');
  document.getElementById('customAccentHex').value = '';
  applyTheme(localStorage.getItem('questlog_theme') || 'gamerlux');
}

function setDensity(d) {
  localStorage.setItem('questlog_density', d);
  applyDensity();
  document.querySelectorAll('.density-btn').forEach(b => b.classList.toggle('active', b.dataset.density === d));
}
function setCorners(c) {
  localStorage.setItem('questlog_corners', c);
  applyCornerStyle();
  document.querySelectorAll('.corner-btn').forEach(b => b.classList.toggle('active', b.dataset.corners === c));
}
function setFontSize(s) {
  localStorage.setItem('questlog_fontsize', s);
  applyFontSize();
  const lbl = document.getElementById('fontSizeLabel');
  if (lbl) lbl.textContent = s + '%';
}

function setTheme(theme) {
  const t = THEMES[theme];
  if (t && !t.free && !isProActive()) {
    document.querySelector('[data-view="pro"]')?.click();
    return;
  }
  localStorage.setItem('questlog_theme', theme);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
  applyTheme(theme);
  const note = document.createElement('div');
  note.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--accent);color:#000;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.4)';
  note.textContent = `✓ Theme: ${theme}`;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 1500);
}

function loadActiveTheme() {
  const saved = localStorage.getItem('questlog_theme') || 'gamerlux';
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === saved));
  applyTheme(saved);
  // Re-sync the customisation controls so they reflect saved state
  const accent = localStorage.getItem('questlog_custom_accent');
  if (accent) {
    const ce = document.getElementById('customAccent');
    const ch = document.getElementById('customAccentHex');
    if (ce) ce.value = accent;
    if (ch) ch.value = accent;
  }
  const bg = localStorage.getItem('questlog_custom_bg');
  if (bg) {
    const be = document.getElementById('customBg');
    const bh = document.getElementById('customBgHex');
    if (be) be.value = bg;
    if (bh) bh.value = bg;
  }
  const density = localStorage.getItem('questlog_density') || 'normal';
  document.querySelectorAll('.density-btn').forEach(b => b.classList.toggle('active', b.dataset.density === density));
  const corners = localStorage.getItem('questlog_corners') || 'rounded';
  document.querySelectorAll('.corner-btn').forEach(b => b.classList.toggle('active', b.dataset.corners === corners));
  const fs = localStorage.getItem('questlog_fontsize') || '100';
  const slider = document.getElementById('fontSizeSlider');
  const lbl = document.getElementById('fontSizeLabel');
  if (slider) slider.value = fs;
  if (lbl) lbl.textContent = fs + '%';
}

// ───── PRICE ALERTS (PRO) ─────
function getAlerts() { try { return JSON.parse(localStorage.getItem('questlog_alerts') || '[]'); } catch { return []; } }
function saveAlerts(a) { localStorage.setItem('questlog_alerts', JSON.stringify(a)); }

async function addPriceAlert() {
  const game = document.getElementById('alertGameInput').value.trim();
  const target = parseFloat(document.getElementById('alertTarget').value);
  const email = document.getElementById('alertEmailPro').value.trim();
  if (!game || !target || !email) { alert('Fill all fields'); return; }
  try {
    const r = await fetch('/api/price-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameTitle: game, targetPrice: target, email, sid: STATE.sid }),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'Failed');
    const alerts = getAlerts();
    alerts.unshift({ game, target, email, created: Date.now(), active: true });
    saveAlerts(alerts);
    document.getElementById('alertGameInput').value = '';
    document.getElementById('alertTarget').value = '';
    renderPriceAlerts();
  } catch (e) { alert(e.message); }
}
function removeAlert(ts) {
  if (!confirm('Remove this alert?')) return;
  saveAlerts(getAlerts().filter(a => a.created !== ts));
  renderPriceAlerts();
}
function renderPriceAlerts() {
  const el = document.getElementById('priceAlertsList');
  if (!el) return;
  const list = getAlerts();
  if (!list.length) { el.innerHTML = '<div class="empty" style="text-align:left;font-size:12px;padding:8px 0">No alerts yet.</div>'; return; }
  el.innerHTML = list.map(a => `
    <div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13px">${a.game}</div>
        <div style="font-size:11px;color:var(--dim)">Target: <span style="color:var(--accent)">£${a.target.toFixed(2)}</span> - ${a.email}</div>
      </div>
      <span style="background:rgba(34,204,102,0.15);color:#22cc66;padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">ACTIVE</span>
      <button onclick="removeAlert(${a.created})" style="background:transparent;color:var(--dim);border:none;cursor:pointer;font-size:16px">×</button>
    </div>`).join('');
}

// ───── WISHLIST SYNC (PRO) ─────
function getWishlist() { try { return JSON.parse(localStorage.getItem('questlog_wishlist') || '[]'); } catch { return []; } }
function saveWishlist(w) { localStorage.setItem('questlog_wishlist', JSON.stringify(w)); }

async function addWishlist() {
  const game = document.getElementById('wishlistInput').value.trim();
  if (!game) return;
  try {
    const r = await fetch(`/api/deal-search?title=${encodeURIComponent(game)}`);
    const d = await r.json();
    if (!d.results?.[0]) { alert('Game not found'); return; }
    const g = d.results[0];
    const w = getWishlist();
    if (w.find(x => x.gameID === g.gameID)) { alert('Already in wishlist'); return; }
    w.unshift({ gameID: g.gameID, title: g.title, thumb: g.thumb, cheapestEver: g.cheapestEver, cheapest: g.cheapest, added: Date.now() });
    saveWishlist(w);
    document.getElementById('wishlistInput').value = '';
    renderWishlist();
  } catch (e) { alert(e.message); }
}
function removeWishlist(id) {
  if (!confirm('Remove from wishlist?')) return;
  saveWishlist(getWishlist().filter(x => x.gameID !== id));
  renderWishlist();
}
async function renderWishlist() {
  const el = document.getElementById('wishlistItems');
  if (!el) return;
  const list = getWishlist();
  if (!list.length) { el.innerHTML = '<div class="empty" style="text-align:left;font-size:12px;padding:8px 0">No games yet.</div>'; return; }
  const refreshed = await Promise.all(list.map(async item => {
    try {
      const r = await fetch(`/api/deal-search?title=${encodeURIComponent(item.title)}`);
      const d = await r.json();
      if (d.results?.[0]) return { ...item, cheapest: d.results[0].cheapest, deals: d.results[0].deals };
    } catch {}
    return item;
  }));
  el.innerHTML = refreshed.map(item => {
    const cheapestDeal = item.deals?.[0];
    const isLow = item.cheapestEver && item.cheapest <= item.cheapestEver * 1.05;
    return `
      <div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:80px;aspect-ratio:460/215;background:url('${item.thumb}') center/cover;border-radius:4px;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px">${item.title}</div>
          <div style="font-size:11px;color:var(--dim)">Now: <strong style="color:${isLow?'var(--accent)':'var(--text)'}">$${(item.cheapest||0).toFixed(2)}</strong>${item.cheapestEver?` · Low: $${item.cheapestEver.toFixed(2)}`:''}${cheapestDeal?` - ${cheapestDeal.storeName}`:''}</div>
        </div>
        ${isLow?'<span style="background:rgba(200,241,53,0.15);color:var(--accent);padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">GOOD DEAL</span>':''}
        ${cheapestDeal?`<a href="${cheapestDeal.dealLink}" target="_blank" style="background:var(--accent);color:#000;padding:6px 12px;border-radius:4px;font-size:11px;font-weight:700;text-decoration:none">Buy</a>`:''}
        <button onclick="removeWishlist('${item.gameID}')" style="background:transparent;color:var(--dim);border:none;cursor:pointer;font-size:16px">×</button>
      </div>`;
  }).join('');
}

// ───── RECENT PRICE DROPS (server-detected, /api/alerts) ─────
// Manual refresh: triggers a self-scoped wishlist sweep on the server
// (/api/cron/run-now) instead of waiting up to an hour for the next cron tick.
// Self-scoped + bounded by PRICE_WATCH_ITEMS_PER_USER on the worker, so safe
// to expose without admin auth. Doubles as the soft-launch "first-run" path:
// new users can hit this immediately after syncing a wishlist instead of
// staring at an empty panel for up to 60 minutes.
async function refreshDrops() {
  const btn = document.getElementById('refreshDropsBtn');
  if (!STATE.sid) return;
  if (btn) {
    if (btn.dataset.busy === '1') return; // simple debounce
    btn.dataset.busy = '1';
    btn.disabled = true;
    btn.textContent = 'Scanning...';
    btn.style.opacity = '0.6';
  }
  try {
    const r = await fetch(`/api/cron/run-now?sid=${encodeURIComponent(STATE.sid)}`);
    const d = await r.json().catch(() => ({}));
    await renderRecentDrops();
    if (btn) {
      const newCount = (d && typeof d.alerts === 'number') ? d.alerts : 0;
      btn.textContent = newCount > 0 ? `+${newCount} new` : 'Up to date';
      setTimeout(() => { if (btn) btn.textContent = 'Refresh'; }, 2500);
    }
  } catch (e) {
    if (btn) btn.textContent = 'Failed';
    setTimeout(() => { if (btn) btn.textContent = 'Refresh'; }, 2500);
  } finally {
    if (btn) {
      btn.dataset.busy = '0';
      btn.disabled = false;
      btn.style.opacity = '';
    }
  }
}
// Re-read the persisted badge count from the 'questlog-badge' Cache and
// re-decorate the heading. Cheap (~1 cache read, no network), idempotent.
// Used both inside renderRecentDrops() and from the visibilitychange +
// IntersectionObserver hooks installed below, so a Pro user who has the
// Pro tab open in the background, gets a push, then switches back / scrolls
// the Recent Price Drops panel into view sees the "(N new)" decoration
// update without having to reload. Safe to call before renderRecentDrops()
// has ever run.
async function refreshDropsHeading() {
  let unread = 0;
  try {
    if (self.caches && typeof self.caches.open === 'function') {
      const c = await self.caches.open('questlog-badge');
      const hit = await c.match('/__questlog_badge__');
      if (hit) {
        const n = parseInt(await hit.text(), 10);
        if (Number.isFinite(n) && n > 0) unread = n;
      }
    }
  } catch (_) {}
  try {
    const h = document.getElementById('recentDropsHeading');
    if (h) h.textContent = unread > 0 ? `Recent Price Drops (${unread} new)` : 'Recent Price Drops';
  } catch (_) {}
  // Only post clear-badge when we actually painted a count, so a no-op
  // re-check (unread=0) doesn't churn the SW message channel.
  if (unread > 0) {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'clear-badge' });
      }
    } catch (_) {}
  }
  return unread;
}
// Install visibilitychange + IntersectionObserver hooks once. The heading
// element exists in the static HTML, so we can wire the IO immediately.
// visibilitychange catches the tab-switch case; the IO catches the
// scroll-back-into-view case for users who keep the Pro tab pinned and
// scroll away from the drops panel.
(function installDropsHeadingHooks() {
  if (typeof window === 'undefined' || window._dropsHeadingHooked) return;
  window._dropsHeadingHooked = true;
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshDropsHeading();
    });
  } catch (_) {}
  try {
    const h = document.getElementById('recentDropsHeading');
    if (h && typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) refreshDropsHeading();
        }
      }, { threshold: 0.1 });
      io.observe(h);
    }
  } catch (_) {}
})();
async function renderRecentDrops() {
  const el = document.getElementById('recentDropsList');
  if (!el || !STATE.sid) return;
  try {
    const r = await fetch(`/api/alerts?sid=${encodeURIComponent(STATE.sid)}`);
    const d = await r.json();
    const list = Array.isArray(d.alerts) ? d.alerts : [];
    if (!list.length) {
      el.innerHTML = '<div class="empty" style="text-align:left;font-size:12px;padding:8px 0">No drops spotted yet. We check your wishlist hourly.</div>';
      return;
    }
    const fmt = (n, cur) => {
      const sym = cur === 'GBP' ? '£' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '';
      const v = (typeof n === 'number') ? (n / 100).toFixed(2) : '';
      return v ? `${sym}${v}` : '';
    };
    const ago = ts => {
      const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
      if (s < 3600) return `${Math.floor(s/60)}m ago`;
      if (s < 86400) return `${Math.floor(s/3600)}h ago`;
      return `${Math.floor(s/86400)}d ago`;
    };
    // Read the persisted badge count BEFORE clearing it, so we can decorate
    // the heading with "(N new)" for users on browsers without the Badging API
    // (Firefox, older Safari). The count lives in the 'questlog-badge' Cache
    // managed by questlog-sw.js; CacheStorage is shared between window and SW
    // contexts on the same origin. Defensive: any read failure -> no decoration,
    // no error surfaced. After decorating, we post clear-badge to the SW which
    // resets the count AND calls clearAppBadge() (no-op on Firefox).
    let unread = 0;
    try {
      if (self.caches && typeof self.caches.open === 'function') {
        const c = await self.caches.open('questlog-badge');
        const hit = await c.match('/__questlog_badge__');
        if (hit) {
          const n = parseInt(await hit.text(), 10);
          if (Number.isFinite(n) && n > 0) unread = n;
        }
      }
    } catch (_) {}
    try {
      const h = document.getElementById('recentDropsHeading');
      if (h) h.textContent = unread > 0 ? `Recent Price Drops (${unread} new)` : 'Recent Price Drops';
    } catch (_) {}
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'clear-badge' });
      }
    } catch (_) {}
    el.innerHTML = list.slice(0, 12).map(a => {
      const name = (a.name || '').replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
      const cur = a.currency || 'USD';
      const final = fmt(a.final, cur);
      const initial = fmt(a.initial, cur);
      const pct = (typeof a.discount_percent === 'number') ? a.discount_percent : 0;
      const img = a.header_image || '';
      const url = a.store_url || '#';
      return `
      <div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        ${img ? `<div style="width:80px;aspect-ratio:460/215;background:url('${img}') center/cover;border-radius:4px;flex-shrink:0"></div>` : ''}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
          <div style="font-size:11px;color:var(--dim)">Now: <strong style="color:var(--accent)">${final}</strong>${initial ? ` <span style="text-decoration:line-through;opacity:0.6">${initial}</span>` : ''} · ${ago(a.ts || Date.now())}</div>
        </div>
        <span style="background:rgba(200,241,53,0.15);color:var(--accent);padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">-${pct}%</span>
        <a href="${url}" target="_blank" rel="noopener" style="background:var(--accent);color:#000;padding:6px 12px;border-radius:4px;font-size:11px;font-weight:700;text-decoration:none">Buy</a>
      </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<div class="empty" style="text-align:left;font-size:12px;padding:8px 0;color:#ff5a5a">Could not load recent drops.</div>';
  }
}

// Pro System Status widget. Reads /api/cron-status (which exposes
// cron:lastRun written by the hourly scheduled() handler in worker.js) and
// renders a small health panel. The cron runs hourly; we treat anything
// over 90 min stale (1.5x the interval) as 'Stale' in amber. Per-sid push
// counters are summed client-side since the top-level stats object only
// tracks users/scanned/alerts/errors - pushSent/pushSkipped live on perSid.
async function renderSystemStatus() {
  const el = document.getElementById('systemStatusPanel');
  if (!el) return;
  try {
    const r = await fetch('/api/cron-status');
    const d = await r.json();
    const last = d && d.lastRun;
    if (!last || !last.finishedAt) {
      el.innerHTML = '<div class="empty" style="text-align:left;font-size:12px;padding:8px 0">No cron runs recorded yet. The hourly sweep writes here after it first fires.</div>';
      return;
    }
    const pw = (last.jobs && last.jobs.priceWatch) || {};
    const perSid = Array.isArray(pw.perSid) ? pw.perSid : [];
    let pushSent = 0, pushSkipped = 0;
    for (const s of perSid) {
      if (typeof s.pushSent === 'number') pushSent += s.pushSent;
      if (typeof s.pushSkipped === 'number') pushSkipped += s.pushSkipped;
    }
    const ageMs = Date.now() - last.finishedAt;
    const ageMin = Math.floor(ageMs / 60000);
    const ageStr = ageMin < 1 ? 'just now'
      : ageMin < 60 ? `${ageMin}m ago`
      : ageMin < 1440 ? `${Math.floor(ageMin/60)}h ${ageMin%60}m ago`
      : `${Math.floor(ageMin/1440)}d ago`;
    const stale = ageMs > 90 * 60000;
    const errored = pw.error || (typeof pw.errors === 'number' && pw.errors > 0);
    const bannerColor = errored ? '#ff5a5a' : stale ? '#ff9e42' : 'var(--accent)';
    const bannerText  = errored ? 'Errors in last run'
                     : stale   ? 'Stale (>90 min)'
                     :           'All systems normal';
    const dur = (typeof last.durationMs === 'number') ? `${last.durationMs}ms` : '—';
    const cron = (last.cron || '').trim() || 'manual';
    const rows = [
      ['Last run',     ageStr],
      ['Trigger',      cron === '0 * * * *' ? 'hourly' : cron === '0 0 * * *' ? 'daily 00:00 UTC' : cron],
      ['Duration',     dur],
      ['Users swept',  String(pw.users || 0)],
      ['Items scanned', String(pw.scanned || 0)],
      ['Alerts produced', String(pw.alerts || 0)],
      ['Push sent',    String(pushSent)],
      ['Push skipped', String(pushSkipped)],
      ['Errors',       String(pw.errors || 0)],
    ];
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.02);border-left:3px solid ${bannerColor};border-radius:3px;margin-bottom:12px">
        <span style="width:8px;height:8px;border-radius:50%;background:${bannerColor};flex-shrink:0"></span>
        <span style="font-size:12px;color:${bannerColor};font-weight:600;letter-spacing:0.3px">${bannerText}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:6px 16px;font-size:12px">
        ${rows.map(([k,v]) => `<div style="color:var(--dim)">${k}</div><div style="color:var(--text);font-variant-numeric:tabular-nums">${v}</div>`).join('')}
      </div>
    `;
  } catch (e) {
    el.innerHTML = '<div class="empty" style="text-align:left;font-size:12px;padding:8px 0;color:#ff5a5a">Could not load system status.</div>';
  }
}

// ───── STEAM ID WIZARD ─────
function openSteamIdWizard()  { document.getElementById('sidWizard').style.display = 'block'; }
function closeSteamIdWizard() { document.getElementById('sidWizard').style.display = 'none'; }
async function resolveVanity() {
  const v = document.getElementById('vanityInput').value.trim();
  const out = document.getElementById('vanityResult');
  if (!v) return;
  out.innerHTML = '<span style="color:var(--dim)">Looking up…</span>';
  try {
    const r = await fetch(`/api/steam/resolve-vanity?vanity=${encodeURIComponent(v)}`);
    const d = await r.json();
    if (d.steamid) {
      out.innerHTML = `<span style="color:var(--accent)">✓ Your Steam ID: <strong>${d.steamid}</strong></span><br><button onclick="document.getElementById('sidInput').value='${d.steamid}'; closeSteamIdWizard(); connectSteam()" class="connect-btn" style="margin-top:8px;padding:10px 16px;font-size:12px">Use this and connect</button>`;
    } else {
      out.innerHTML = '<span style="color:#ff5a5a">Not found. Make sure the vanity name is exact.</span>';
    }
  } catch (e) { out.innerHTML = `<span style="color:#ff5a5a">${e.message}</span>`; }
}

// ───── ACHIEVEMENT OF THE DAY (PRO) ─────
async function loadAotd() {
  if (!STATE.sid) return;
  const el = document.getElementById('aotdPanel');
  if (!el) return;
  try {
    const r = await fetch(`/api/achievement-of-day?sid=${STATE.sid}`);
    const d = await r.json();
    if (d.error) { el.innerHTML = `<div class="empty" style="font-size:13px">${d.error}${d.game ? ' (game: ' + d.game + ')' : ''}</div>`; return; }
    const a = d.achievement;
    const rarityColor = a.rarity === 'Ultra Rare' ? '#ff5a5a' : a.rarity === 'Rare' ? '#ff9e42' : a.rarity === 'Uncommon' ? 'var(--accent)' : 'var(--dim)';
    el.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start">
        <div style="width:140px;aspect-ratio:460/215;background:url('${d.gameImg}') center/cover;border-radius:6px;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;letter-spacing:2px;color:${rarityColor};text-transform:uppercase;margin-bottom:4px">${a.rarity} · ${a.globalPct}% of players</div>
          <div style="font-size:18px;font-weight:700;line-height:1.2;margin-bottom:6px">${a.name}</div>
          <div style="font-size:13px;color:var(--dim);line-height:1.5;margin-bottom:8px">${a.description || 'No description'}</div>
          <div style="font-size:12px;color:var(--accent)">From: ${d.game}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="openSteam(${d.gameAppId})" class="connect-btn" style="flex:1;padding:10px;font-size:12px">Play ${d.game}</button>
        <a href="${d.guideUrl}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:10px;background:var(--panel2);border:1px solid var(--border);border-radius:5px;font-size:12px;font-weight:600;color:var(--text);text-decoration:none">Guide →</a>
        <a href="${d.youtubeUrl}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:10px;background:var(--panel2);border:1px solid var(--border);border-radius:5px;font-size:12px;font-weight:600;color:var(--text);text-decoration:none">Video →</a>
      </div>
      <p style="font-size:11px;color:var(--dim);margin-top:12px;text-align:center">Refreshes daily at midnight UTC</p>
    `;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── PUSH NOTIFICATIONS (PRO) ─────
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}
async function loadPushUI() {
  const status = document.getElementById('pushStatus');
  const btn = document.getElementById('pushToggleBtn');
  const prefs = document.getElementById('pushPrefs');
  if (!status || !btn) return;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    status.innerHTML = '<span style="color:#ff9e42">⚠ Push not supported in this browser</span>';
    btn.disabled = true; btn.textContent = 'Not supported';
    return;
  }
  if (Notification.permission === 'denied') {
    status.innerHTML = '<span style="color:#ff5a5a">Notifications blocked. Enable in browser settings.</span>';
    btn.disabled = true; btn.textContent = 'Blocked';
    return;
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();

  if (sub) {
    status.innerHTML = '<span style="color:var(--accent)">✓ Notifications active</span>';
    btn.textContent = 'Disable notifications';
    prefs.style.display = 'block';
    // Load saved prefs
    const saved = JSON.parse(localStorage.getItem('questlog_push_prefs') || '{}');
    document.getElementById('prefPriceAlerts').checked = saved.priceAlerts !== false;
    document.getElementById('prefFreeGames').checked = saved.freeGames !== false;
    document.getElementById('prefAotd').checked = saved.achievementOfDay !== false;
  } else {
    status.innerHTML = '<span style="color:var(--dim)">Not subscribed yet</span>';
    btn.textContent = 'Enable notifications';
    prefs.style.display = 'none';
  }
}
async function togglePush() {
  if (!STATE.sid) { alert('Connect Steam first.'); return; }
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  if (sub) {
    // Unsubscribe
    await sub.unsubscribe();
    await fetch('/api/push/unsubscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sid: STATE.sid }) });
    loadPushUI();
    return;
  }

  // Subscribe
  try {
    const keyRes = await fetch('/api/push/vapid-key');
    const { key } = await keyRes.json();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    await fetch('/api/push/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: STATE.sid, subscription: sub.toJSON(), prefs: getPushPrefs() }),
    });
    loadPushUI();
  } catch (e) {
    alert('Could not enable notifications: ' + e.message);
  }
}
function getPushPrefs() {
  return {
    priceAlerts: document.getElementById('prefPriceAlerts')?.checked ?? true,
    freeGames: document.getElementById('prefFreeGames')?.checked ?? true,
    achievementOfDay: document.getElementById('prefAotd')?.checked ?? true,
  };
}
// ── Push test "last sent" indicator (localStorage-backed, idempotent) ──
function _formatPushTestAge(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '';
  const s = Math.floor(ms / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 30) return d + 'd ago';
  // Beyond 30 days the relative phrasing reads worse than a date.
  try { return 'on ' + new Date(Date.now() - ms).toISOString().slice(0, 10); } catch (_) { return ''; }
}
function renderPushTestLastSent() {
  try {
    const el = document.getElementById('pushTestLastSent');
    if (!el) return;
    const raw = localStorage.getItem('questlog_push_test_last_sent');
    const ts = raw ? parseInt(raw, 10) : 0;
    if (!ts || !Number.isFinite(ts) || ts <= 0 || ts > Date.now() + 60000) {
      el.textContent = '';
      return;
    }
    const age = _formatPushTestAge(Date.now() - ts);
    el.textContent = age ? 'Last sent: ' + age : '';
  } catch (_) { /* localStorage may be unavailable; silent */ }
}
if (!window._pushTestLastSentHooked) {
  window._pushTestLastSentHooked = true;
  // Refresh on tab visibility so the label is fresh when the user comes back.
  try { document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') renderPushTestLastSent(); }); } catch (_) {}
  // Cheap periodic refresh so the label ages without a page reload.
  try { setInterval(renderPushTestLastSent, 60000); } catch (_) {}
  // Initial render once DOM is ready (script is deferred so the element exists).
  try { renderPushTestLastSent(); } catch (_) {}
}
async function sendTestPush() {
  const btn = document.getElementById('pushTestBtn');
  const status = document.getElementById('pushTestStatus');
  if (!STATE.sid) { status.innerHTML = '<span style="color:#ff5a5a">Connect Steam first.</span>'; return; }
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = 'Sending...';
  status.textContent = '';
  try {
    const r = await fetch('/api/push/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: STATE.sid }),
    });
    const j = await r.json();
    if (r.status === 429) {
      status.innerHTML = '<span style="color:#ff9e42">Slow down - try again in a few minutes.</span>';
    } else if (j.result && j.result.sent) {
      status.innerHTML = '<span style="color:var(--accent)">Sent. Check your device.</span>';
      try { localStorage.setItem('questlog_push_test_last_sent', String(Date.now())); } catch (_) {}
      try { renderPushTestLastSent(); } catch (_) {}
    } else {
      const reason = (j.result && j.result.reason) || j.error || 'unknown';
      status.innerHTML = '<span style="color:#ff5a5a">Could not send: ' + reason + '</span>';
    }
  } catch (e) {
    status.innerHTML = '<span style="color:#ff5a5a">Network error: ' + e.message + '</span>';
  } finally {
    setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 2000);
  }
}
async function savePushPrefs() {
  const p = getPushPrefs();
  localStorage.setItem('questlog_push_prefs', JSON.stringify(p));
  if (!STATE.sid) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid: STATE.sid, subscription: sub.toJSON(), prefs: p }),
      });
    }
  } catch {}
}

// ───── MOD SPACE (PRO) ─────
function loadModSpace() {
  const el = document.getElementById('modSpacePanel');
  if (!el) return;
  // Curated list of moddable games - link to NexusMods directly per-game
  const MODDABLE = {
    'Skyrim Special Edition':           'skyrimspecialedition',
    'Skyrim':                            'skyrim',
    "Baldur's Gate 3":                   'baldursgate3',
    'RimWorld':                          'rimworld',
    'Stardew Valley':                    'stardewvalley',
    'Fallout 4':                         'fallout4',
    'Fallout: New Vegas':                'newvegas',
    'Cyberpunk 2077':                    'cyberpunk2077',
    'The Witcher 3':                     'witcher3',
    'Minecraft':                         null,  // not on Nexus, use CurseForge
    'Mount & Blade II: Bannerlord':      'mountandblade2bannerlord',
    'Starfield':                         'starfield',
    'Oblivion':                          'oblivion',
    'Morrowind':                         'morrowind',
    'Kenshi':                            'kenshi',
    'X4: Foundations':                   'x4foundations',
    'Resident Evil 4 Remake':            'residentevil42023',
    'Elden Ring':                        'eldenring',
    'Dark Souls III':                    'darksouls3',
    'Sekiro':                            'sekiro',
    'Monster Hunter: World':             'monsterhunterworld',
    'Monster Hunter Rise':               'monsterhunterrise',
    'Dragon Age: Inquisition':           'dragonageinquisition',
    'Dragon Age: Origins':               'dragonageorigins',
  };

  if (!STATE.games?.length) { el.innerHTML = '<div class="empty" style="font-size:13px">Connect Steam first.</div>'; return; }
  const owned = STATE.games.filter(g => MODDABLE[g.name]).slice(0, 12);
  if (!owned.length) {
    el.innerHTML = `<div class="empty" style="font-size:13px">None of your games are in our moddable list yet. <a href="https://www.nexusmods.com/games" target="_blank" style="color:var(--accent)">Browse Nexus Mods →</a></div>`;
    return;
  }
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
      ${owned.map(g => {
        const slug = MODDABLE[g.name];
        const url = slug ? `https://www.nexusmods.com/${slug}` : `https://www.curseforge.com/${g.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
        return `
          <a href="${url}" target="_blank" rel="noopener" style="display:block;background:var(--panel2);border:1px solid var(--border);border-radius:6px;overflow:hidden;text-decoration:none;color:var(--text);transition:border-color 0.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="aspect-ratio:460/215;background:url('${g.img}') center/cover"></div>
            <div style="padding:10px">
              <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div>
              <div style="font-size:11px;color:var(--accent);margin-top:4px">${slug ? 'Browse Nexus →' : 'Browse CurseForge →'}</div>
            </div>
          </a>`;
      }).join('')}
    </div>
    <p style="font-size:11px;color:var(--dim);margin-top:14px">Click any game to browse top mods. Direct API integration with weekly trending coming soon.</p>
  `;
}

// ───── WHAT'S HOT (PRO) ─────
async function loadHot() {
  const el = document.getElementById('hotPanel');
  if (!el) return;
  if (!STATE.games?.length) { el.innerHTML = '<div class="empty" style="font-size:13px">Connect Steam first.</div>'; return; }

  // Heuristic: pick games with high lifetime hours but zero recent playtime - "forgotten favourites"
  // and games with current high player counts (popularity check via Steam's GetNumberOfCurrentPlayers)
  const candidates = STATE.games
    .filter(g => g.hours > 5)
    .slice(0, 20);

  if (!candidates.length) { el.innerHTML = '<div class="empty">Not enough play history.</div>'; return; }

  // Fetch live player counts for these in parallel
  const counts = await Promise.all(candidates.map(async g => {
    try {
      const r = await fetch(`/api/steam/game-stats/${g.appid}`);
      const d = await r.json();
      return { ...g, currentPlayers: d.currentPlayers || 0 };
    } catch { return { ...g, currentPlayers: 0 }; }
  }));

  // Sort by current player count desc, take top 6, mark forgotten favourites
  const hot = counts
    .filter(g => g.currentPlayers > 100)
    .sort((a,b) => b.currentPlayers - a.currentPlayers)
    .slice(0, 6);

  if (!hot.length) { el.innerHTML = '<div class="empty">Nothing trending hard from your library right now.</div>'; return; }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
      ${hot.map(g => {
        const forgotten = g.hoursTwoWeeks === 0;
        return `
          <div onclick="openSteam(${g.appid})" style="cursor:pointer;background:var(--panel2);border:1px solid var(--border);border-radius:6px;overflow:hidden">
            <div style="aspect-ratio:460/215;background:url('${g.img}') center/cover;position:relative">
              <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.8);color:var(--accent);padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">● ${g.currentPlayers.toLocaleString()} playing</span>
              ${forgotten ? '<span style="position:absolute;top:6px;right:6px;background:#ff9e42;color:#000;padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">FORGOTTEN</span>' : ''}
            </div>
            <div style="padding:10px">
              <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div>
              <div style="font-size:11px;color:var(--dim);margin-top:2px">${g.hours}h played · <a href="https://www.reddit.com/search/?q=${encodeURIComponent(g.name)}" target="_blank" onclick="event.stopPropagation()" style="color:var(--accent)">Reddit →</a></div>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
}

// ───── PERSONAL QUESTS ─────
function getQuests() { try { return JSON.parse(localStorage.getItem('questlog_quests') || '[]'); } catch { return []; } }
function saveQuests(q) { localStorage.setItem('questlog_quests', JSON.stringify(q)); }
function addQuest() {
  const game = document.getElementById('questGame').value.trim();
  const goal = document.getElementById('questGoal').value.trim();
  const deadline = document.getElementById('questDeadline').value;
  if (!game || !goal) { alert('Game and goal required'); return; }
  const q = getQuests();
  q.unshift({ id: Date.now(), game, goal, deadline, started: Date.now(), done: false });
  saveQuests(q);
  document.getElementById('questGame').value = '';
  document.getElementById('questGoal').value = '';
  document.getElementById('questDeadline').value = '';
  renderQuests();
}
function toggleQuest(id) {
  const q = getQuests();
  const item = q.find(x => x.id === id);
  if (item) item.done = !item.done;
  saveQuests(q);
  renderQuests();
}
function removeQuest(id) {
  if (!confirm('Remove this quest?')) return;
  saveQuests(getQuests().filter(x => x.id !== id));
  renderQuests();
}

function renderQuests() {
  const el = document.getElementById('questsList');
  if (!el) return;
  const list = getQuests();
  if (!list.length) { el.innerHTML = '<div class="empty" style="text-align:left;padding:8px 0;font-size:12px">No quests yet. Pick a game and a goal.</div>'; return; }
  el.innerHTML = list.map(q => {
    const daysLeft = q.deadline ? Math.ceil((new Date(q.deadline).getTime() - Date.now()) / 86400000) : null;
    const overdue = daysLeft !== null && daysLeft < 0 && !q.done;
    const colour = q.done ? 'var(--accent)' : overdue ? '#ff5a5a' : 'var(--text)';
    return `
      <div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <input type="checkbox" ${q.done ? 'checked' : ''} onchange="toggleQuest(${q.id})" style="accent-color:var(--accent);width:18px;height:18px;cursor:pointer">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;color:${colour};${q.done ? 'text-decoration:line-through;opacity:0.5' : ''}">${q.game} - ${q.goal}</div>
          ${q.deadline ? `<div style="font-size:11px;color:${overdue ? '#ff5a5a' : 'var(--dim)'}">${overdue ? `Overdue by ${-daysLeft}d` : daysLeft === 0 ? 'Due today' : daysLeft > 0 ? `${daysLeft} days left` : ''}</div>` : ''}
        </div>
        <button onclick="removeQuest(${q.id})" style="background:transparent;color:var(--dim);border:none;cursor:pointer;font-size:16px">×</button>
      </div>`;
  }).join('');
}

// ───── BACKLOG QUEUE ─────
function getQueue() { try { return JSON.parse(localStorage.getItem('questlog_queue') || '[]'); } catch { return []; } }
function saveQueue(q) { localStorage.setItem('questlog_queue', JSON.stringify(q)); }
function queueSuggest(input) { _makeSuggest('queueInput','queueSuggestBox','queue','pickQueueSuggest').oninput(input); }
function queueSuggestKey(e) { _makeSuggest('queueInput','queueSuggestBox','queue','pickQueueSuggest').onkey(e); }
function pickQueueSuggest(idx) {
  const r = _suggestCache['_last_queueSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('queueInput').value = r.external;
  document.getElementById('queueSuggestBox').style.display = 'none';
  addQueue();
}
window.queueTrigger = () => addQueue();
async function addQueue() {
  const title = document.getElementById('queueInput').value.trim();
  if (!title) return;
  const q = getQueue();
  if (q.find(x => x.title.toLowerCase() === title.toLowerCase())) { alert('Already in queue'); return; }
  // Try HLTB lookup
  let hours = null;
  try {
    const r = await fetch(`/api/hltb?title=${encodeURIComponent(title)}`);
    const d = await r.json();
    if (d && !d.error) hours = d.mainStory;
  } catch {}
  q.push({ id: Date.now(), title, hours, added: Date.now() });
  saveQueue(q);
  document.getElementById('queueInput').value = '';
  renderQueue();
}
function moveQueue(id, dir) {
  const q = getQueue();
  const i = q.findIndex(x => x.id === id);
  if (i < 0) return;
  const j = i + dir;
  if (j < 0 || j >= q.length) return;
  [q[i], q[j]] = [q[j], q[i]];
  saveQueue(q);
  renderQueue();
}
function removeQueue(id) {
  if (!confirm('Remove from queue?')) return;
  saveQueue(getQueue().filter(x => x.id !== id));
  renderQueue();
}
function renderQueue() {
  const el = document.getElementById('queueList');
  if (!el) return;
  const q = getQueue();
  if (!q.length) { el.innerHTML = '<div class="empty" style="text-align:left;padding:8px 0;font-size:12px">Queue is empty. Add games above.</div>'; return; }
  const totalHours = q.reduce((s, x) => s + (x.hours || 0), 0);
  el.innerHTML = `
    <div style="font-size:11px;color:var(--dim);margin-bottom:10px;letter-spacing:1px">${q.length} games · ~${Math.round(totalHours)}h total</div>
    ${q.map((x, i) => `
      <div style="display:flex;gap:12px;align-items:center;padding:10px 12px;background:var(--panel2);border-radius:6px;margin-bottom:6px">
        <div style="font-weight:800;color:var(--accent);width:24px">#${i+1}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.title}</div>
          <div style="font-size:11px;color:var(--dim)">${x.hours ? `~${x.hours}h main story` : 'Time unknown'}</div>
        </div>
        <button onclick="moveQueue(${x.id},-1)" ${i === 0 ? 'disabled' : ''} style="background:transparent;color:var(--dim);border:none;cursor:pointer;font-size:14px;padding:2px 6px;${i === 0 ? 'opacity:0.3;cursor:not-allowed' : ''}">↑</button>
        <button onclick="moveQueue(${x.id},1)" ${i === q.length-1 ? 'disabled' : ''} style="background:transparent;color:var(--dim);border:none;cursor:pointer;font-size:14px;padding:2px 6px;${i === q.length-1 ? 'opacity:0.3;cursor:not-allowed' : ''}">↓</button>
        <button onclick="removeQueue(${x.id})" style="background:transparent;color:var(--dim);border:none;cursor:pointer;font-size:14px;padding:2px 6px">×</button>
      </div>
    `).join('')}
  `;
}

// ───── WEEKLY RETROSPECTIVE ─────
async function loadRetrospective() {
  if (!STATE.sid) return;
  const el = document.getElementById('retroPanel');
  if (!el) return;
  try {
    const r = await fetch(`/api/steam/recent?sid=${STATE.sid}`);
    const d = await r.json();
    const games = d.games || [];
    const totalHours = games.reduce((s, g) => s + (g.hoursTwoWeeks || 0), 0);
    const top = games.sort((a,b) => b.hoursTwoWeeks - a.hoursTwoWeeks).slice(0, 5);
    if (totalHours === 0) {
      el.innerHTML = '<div class="empty" style="text-align:left;font-size:13px">You haven\'t played anything in the last 2 weeks. Time to fire up Steam.</div>';
      return;
    }
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
        <div style="background:var(--panel2);padding:14px;border-radius:6px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--accent)">${Math.round(totalHours)}h</div>
          <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">Past 2 weeks</div>
        </div>
        <div style="background:var(--panel2);padding:14px;border-radius:6px;text-align:center">
          <div style="font-size:24px;font-weight:800">${games.length}</div>
          <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">Games played</div>
        </div>
      </div>
      <h3 style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Top games this fortnight</h3>
      ${top.map(g => `
        <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="width:80px;aspect-ratio:460/215;background:url('${g.img}') center/cover;border-radius:4px"></div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div>
            <div style="font-size:11px;color:var(--dim)">${g.hoursTwoWeeks}h · ${g.totalHours}h total</div>
          </div>
          <button onclick="openSteam(${g.appid})" style="background:var(--accent);color:#000;border:none;padding:5px 10px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer">Play</button>
        </div>
      `).join('')}
    `;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}

// ───── STREAK TRACKER ─────
function loadStreak() {
  if (!STATE.sid) return;
  const el = document.getElementById('streakPanel');
  if (!el) return;
  // Compute streak from local history of "recent activity" snapshots
  const today = new Date().toISOString().slice(0, 10);
  const history = JSON.parse(localStorage.getItem('questlog_streak_' + STATE.sid) || '{}');
  const recentTotal = (STATE.games || []).reduce((s, g) => s + (g.hoursTwoWeeks || 0), 0);
  if (!history[today]) { history[today] = recentTotal; localStorage.setItem('questlog_streak_' + STATE.sid, JSON.stringify(history)); }
  // Streak = consecutive days where we recorded activity
  const days = Object.keys(history).sort().reverse();
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(); expected.setDate(expected.getDate() - i);
    if (days[i] === expected.toISOString().slice(0, 10) && history[days[i]] > 0) streak++;
    else break;
  }
  // Find most-neglected game (longest gap since play)
  const neglected = (STATE.games || [])
    .filter(g => g.hours > 5 && g.hoursTwoWeeks === 0 && g.lastPlayed)
    .sort((a, b) => a.lastPlayed - b.lastPlayed)
    .slice(0, 3);

  el.innerHTML = `
    <div style="display:flex;gap:48px;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap">
      <div>
        <div style="font-size:64px;font-weight:300;color:var(--accent);line-height:1;letter-spacing:-2px">${streak}</div>
        <div style="font-size:11px;color:var(--dim);letter-spacing:1px;margin-top:6px">Day streak</div>
      </div>
      <div>
        <div style="font-size:64px;font-weight:300;color:var(--text-bright);line-height:1;letter-spacing:-2px">${days.length}</div>
        <div style="font-size:11px;color:var(--dim);letter-spacing:1px;margin-top:6px">Days tracked</div>
      </div>
      <div style="flex:1;min-width:200px">
        <div style="font-size:11px;color:var(--dim);letter-spacing:1px;margin-bottom:8px">Streak counts days you check QuestLog with active Steam playtime.</div>
      </div>
    </div>
    ${neglected.length > 0 ? `
      <h3 style="font-size:11px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Long-neglected favourites</h3>
      ${neglected.map(g => {
        const days = g.lastPlayed ? Math.floor((Date.now()/1000 - g.lastPlayed) / 86400) : '?';
        return `
          <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="width:80px;aspect-ratio:460/215;background:url('${g.img}') center/cover;border-radius:4px"></div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div>
              <div style="font-size:11px;color:var(--dim)">${g.hours}h played · ${days}d ago</div>
            </div>
          </div>`;
      }).join('')}
    ` : ''}
    <p style="font-size:11px;color:var(--dim);margin-top:14px;font-style:italic">Streak counts days you check QuestLog with active Steam playtime.</p>
  `;
}

// ───── GENRE GAPS ─────
function loadGenreGaps() {
  if (!STATE.sid || !STATE.games) return;
  const el = document.getElementById('genreGapPanel');
  if (!el) return;
  // Use SteamDNA's genre map (already in worker)
  const games = STATE.games;
  const byGenre = { RPG: 0, Strategy: 0, FPS: 0, Adventure: 0, Roguelike: 0, Racing: 0, Indie: 0 };
  // Rough heuristic from game names
  const genreKeywords = {
    RPG: /witcher|elder scrolls|fallout|baldur|divinity|persona|yakuza|dragon age|mass effect|skyrim|kingdom come/i,
    Strategy: /civilization|total war|stellaris|hearts of iron|crusader kings|xcom|age of empires/i,
    FPS: /counter-?strike|call of duty|battlefield|doom|cs2|cs:?go|valorant|overwatch|titanfall|destiny/i,
    Adventure: /uncharted|tomb raider|red dead|grand theft|witcher|assassin|spider-?man|horizon/i,
    Roguelike: /hades|slay the spire|risk of rain|enter the gungeon|dead cells|binding of isaac|noita/i,
    Racing: /forza|gran turismo|f1|need for speed|dirt|wrc|burnout|trackmania/i,
    Indie: /hollow knight|celeste|stardew|undertale|cuphead|terraria|minecraft|factorio/i,
  };
  for (const g of games) {
    for (const [genre, re] of Object.entries(genreKeywords)) {
      if (re.test(g.name)) byGenre[genre] += g.hours || 0;
    }
  }
  const total = Object.values(byGenre).reduce((s, h) => s + h, 0);
  const gaps = Object.entries(byGenre).filter(([_, h]) => h < total * 0.05).map(([g]) => g);
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:16px">
      ${Object.entries(byGenre).map(([g, h]) => `
        <div style="background:var(--panel2);padding:10px;border-radius:6px;text-align:center;${h < 5 ? 'opacity:0.5;border:1px dashed var(--border)' : ''}">
          <div style="font-size:18px;font-weight:800;color:${h < 5 ? '#ff9e42' : 'var(--accent)'}">${Math.round(h)}h</div>
          <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:4px">${g}</div>
        </div>
      `).join('')}
    </div>
    ${gaps.length ? `<p style="font-size:13px;color:var(--dim);line-height:1.5">You barely play <strong style="color:#ff9e42">${gaps.join(', ')}</strong>. Try one. The Discover tab can suggest options if you filter by these genres.</p>` : '<p style="font-size:13px;color:var(--dim)">You\'ve got pretty even spread across genres.</p>'}
  `;
}

// ───── DEMO RADAR ─────
async function loadDemoRadar() {
  const el = document.getElementById('demoRadarPanel');
  if (!el) return;
  el.innerHTML = '<div class="empty"><span class="loading"></span> Finding demos...</div>';
  try {
    // Steam Featured > 'specials' or 'new_releases' often surface demos. Search store for free titles labelled "Demo".
    // Easiest: hit Steam search HTML page. We can't scrape it directly so route via SteamSpy genre filter
    const r = await fetch(`https://store.steampowered.com/api/featuredcategories?cc=us&l=en`);
    const d = await r.json();
    const all = [...(d.new_releases?.items || []), ...(d.coming_soon?.items || [])];
    const demos = all.filter(it => /demo/i.test(it.name)).slice(0, 8);
    if (!demos.length) { el.innerHTML = '<div class="empty" style="font-size:13px">No demos in the current Steam Featured feed. <a href="https://store.steampowered.com/demos" target="_blank" style="color:var(--accent)">Browse all demos on Steam →</a></div>'; return; }
    el.innerHTML = demos.map(g => `
      <div onclick="openSteam(${g.id})" style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer">
        <div style="width:120px;aspect-ratio:460/215;background:url('${g.large_capsule_image || g.header_image}') center/cover;border-radius:4px"></div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div>
          <div style="font-size:11px;color:var(--accent)">FREE DEMO</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<div class="empty" style="font-size:13px"><a href="https://store.steampowered.com/demos" target="_blank" style="color:var(--accent)">Browse demos on Steam →</a></div>`;
  }
}

// ───── TWITCH ─────
function twitchSuggest(input) { _makeSuggest('twitchInput','twitchSuggestBox','twitch','pickTwitchSuggest').oninput(input); }
function twitchSuggestKey(e) { _makeSuggest('twitchInput','twitchSuggestBox','twitch','pickTwitchSuggest').onkey(e); }
function pickTwitchSuggest(idx) {
  const r = _suggestCache['_last_twitchSuggestBox']?.[idx]; if (!r) return;
  document.getElementById('twitchInput').value = r.external;
  document.getElementById('twitchSuggestBox').style.display = 'none';
  openTwitch();
}
window.twitchTrigger = () => openTwitch();
function openTwitch() {
  const title = document.getElementById('twitchInput').value.trim();
  if (!title) return;
  const url = `https://www.twitch.tv/directory/category/${encodeURIComponent(title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))}`;
  document.getElementById('twitchResult').innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a href="${url}" target="_blank" rel="noopener" style="flex:1;background:var(--panel2);padding:12px;border-radius:6px;text-decoration:none;color:var(--text);min-width:160px">
        <div style="font-size:11px;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Twitch</div>
        <div style="font-size:13px;font-weight:600">Live streamers playing ${title}</div>
        <div style="font-size:11px;color:var(--dim);margin-top:6px">Open Twitch →</div>
      </a>
      <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' gameplay live')}" target="_blank" rel="noopener" style="flex:1;background:var(--panel2);padding:12px;border-radius:6px;text-decoration:none;color:var(--text);min-width:160px">
        <div style="font-size:11px;color:#ff5a5a;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">YouTube</div>
        <div style="font-size:13px;font-weight:600">Live + recent ${title} videos</div>
        <div style="font-size:11px;color:var(--dim);margin-top:6px">Open YouTube →</div>
      </a>
    </div>`;
}

// ───── SPEND ANALYTICS ─────
async function loadSpendAnalytics() {
  if (!STATE.sid) return;
  const el = document.getElementById('spendPanel');
  try {
    const r = await api('/api/spend-analytics');
    if (r.error) { el.innerHTML = `<div class="error">${r.error}</div>`; return; }
    const wastedPct = r.estimatedSpend > 0 ? Math.round((r.wastedSpendEstimate / r.estimatedSpend) * 100) : 0;
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px">
        <div style="background:var(--panel2);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:var(--accent);line-height:1">$${r.estimatedSpend.toLocaleString()}</div>
          <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:6px">Estimated Spend</div>
        </div>
        <div style="background:var(--panel2);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#ff9e42;line-height:1">$${r.wastedSpendEstimate.toLocaleString()}</div>
          <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:6px">Wasted on Untouched (${wastedPct}%)</div>
        </div>
        <div style="background:var(--panel2);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;line-height:1">$${r.averageCostPerHour.toFixed(2)}</div>
          <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:6px">Avg Cost / Hour</div>
        </div>
        <div style="background:var(--panel2);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;line-height:1">${r.totalHours.toLocaleString()}h</div>
          <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:6px">Total Hours</div>
        </div>
      </div>

      <h3 style="font-size:12px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Best Value (lowest cost/hour)</h3>
      ${r.bestValue.map(g => `
        <div onclick="openSteam(${g.appid})" style="cursor:pointer;display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:80px;aspect-ratio:460/215;background:url('${g.img}') center/cover;border-radius:4px;flex-shrink:0"></div>
          <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div><div style="font-size:11px;color:var(--dim)">$${g.price} - ${g.hours}h - <span style="color:var(--accent)">$${g.costPerHour.toFixed(3)}/hour</span></div></div>
        </div>`).join('')}

      <h3 style="font-size:12px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin:24px 0 10px">Worst Value (highest cost/hour)</h3>
      ${r.worstValue.map(g => `
        <div onclick="openSteam(${g.appid})" style="cursor:pointer;display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:80px;aspect-ratio:460/215;background:url('${g.img}') center/cover;border-radius:4px;flex-shrink:0"></div>
          <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div><div style="font-size:11px;color:var(--dim)">$${g.price} - ${g.hours}h - <span style="color:#ff9e42">$${g.costPerHour.toFixed(2)}/hour</span></div></div>
        </div>`).join('')}

      <p style="font-size:11px;color:var(--dim);margin-top:16px;font-style:italic">${r.note}</p>
    `;
  } catch (e) { el.innerHTML = `<div class="error">${e.message}</div>`; }
}


async function estimateFPS() {
  const gpu = document.getElementById('fpsGpu').value.trim();
  const ram = document.getElementById('fpsRam').value;
  const game = document.getElementById('fpsGame').value.trim();
  const el = document.getElementById('fpsResult');
  if (!gpu || !game) { el.innerHTML = '<div class="error">Enter both GPU and game</div>'; return; }
  el.innerHTML = '<div class="empty"><span class="loading"></span> Crunching numbers...</div>';

  try {
    const r = await fetch(`/api/fps-estimate?gpu=${encodeURIComponent(gpu)}&ram=${ram}&game=${encodeURIComponent(game)}`);
    const d = await r.json();
    if (d.error) {
      const sugg = d.suggestions ? `<div style="font-size:12px;color:var(--dim);margin-top:8px">Try one of: ${d.suggestions.join(', ')}</div>` : '';
      el.innerHTML = `<div class="error">${d.error}</div>${sugg}`;
      return;
    }

    const verdictColor = d.gpuScore/d.gameDemand > 1.5 ? 'var(--accent)' : d.gpuScore/d.gameDemand > 0.7 ? '#ffb84a' : '#ff5a5a';
    el.innerHTML = `
      <div style="background:var(--panel2);border:1px solid ${verdictColor}44;border-radius:8px;padding:18px;margin-bottom:16px">
        <div style="font-size:10px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:6px">Verdict</div>
        <div style="font-size:18px;font-weight:700;color:${verdictColor};margin-bottom:4px">${d.verdict}</div>
        ${d.inferred ? `<div style="font-size:11px;color:var(--dim);margin-bottom:4px">⚠ Inferred from Steam requirements (recommended GPU: ${d.inferred.gpu}) - less accurate than our curated data</div>` : ''}
        <div style="font-size:12px;color:var(--dim)">${d.gpu} · ${d.ram}GB RAM · ${d.game}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${d.estimates.map(e => {
          const c = e.fps >= 120 ? 'var(--accent)' : e.fps >= 60 ? '#d5e65c' : e.fps >= 30 ? '#ffb84a' : '#ff5a5a';
          return `<div style="background:var(--panel2);border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase">${e.setting}</div>
            <div style="font-size:26px;font-weight:800;color:${c};margin-top:4px">${e.fps}</div>
            <div style="font-size:10px;color:var(--dim)">fps</div>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:11px;color:var(--dim);margin-top:12px;text-align:center">Estimates based on GPU performance score vs game demand. Actual results vary by driver, settings, CPU bottleneck.</div>
    `;
  } catch (e) {
    el.innerHTML = `<div class="error">${e.message}</div>`;
  }
}

// Populate GPU datalist on load
fetch('/api/gpu-list').then(r => r.json()).then(d => {
  const list = document.getElementById('gpuList');
  if (list && d.gpus) list.innerHTML = d.gpus.map(g => `<option>${g}</option>`).join('');
}).catch(() => {});


// ═════ NEW RELEASES ═════

STATE.newFilter = 'popular';


function renderNewReleaseCard(g) {
  const scoreColour = g.review?.score >= 85 ? 'var(--accent)' : g.review?.score >= 70 ? '#d5e65c' : g.review?.score >= 50 ? '#ff9e42' : '#ff5a5a';
  const price = g.discount > 0
    ? `<span style="color:var(--accent);font-weight:700">${g.finalPrice}</span> <span style="text-decoration:line-through;color:var(--dim);font-size:11px">${g.originalPrice}</span> <span style="color:var(--accent);font-weight:700">-${g.discount}%</span>`
    : (g.finalPrice ? `<span style="color:var(--text);font-weight:600">${g.finalPrice}</span>` : '');

  return `
    <div class="rec-card" onclick="window.open('${g.url}','_blank')">
      <div class="rec-cover" style="background-image:url('${g.img}')"></div>
      <div class="rec-info">
        <div class="rec-reason"><span style="background:rgba(200,241,53,0.15);color:var(--accent);padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">NEW RELEASE</span></div>
        <div class="rec-title">${g.name}</div>
        <div class="rec-sub" style="margin-top:4px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          ${price}
          <span style="color:${scoreColour};font-weight:700">${g.review.score}% ★</span> <span style="color:var(--dim);font-size:11px">${g.review.label} (${g.review.count.toLocaleString()})</span>
        </div>
      </div>
      <button class="rec-action">View →</button>
    </div>
  `;
}

async function loadNewReleases() {
  document.getElementById('newReleasesList').innerHTML = '<div class="empty"><span class="loading"></span> Loading...</div>';
  try {
    const r = await fetch(`/api/new-releases?filter=${STATE.newFilter || 'popular'}`);
    const data = await r.json();
    const el = document.getElementById('newReleasesList');
    // Filter: must have at least 150 reviews - excludes shovelware/untested
    const filtered = (data.items || []).filter(g => g.review && g.review.count >= 150);
    if (!filtered.length) { el.innerHTML = '<div class="empty">No new releases with enough reviews yet. Check back later.</div>'; return; }
    el.innerHTML = filtered.map(renderNewReleaseCard).join('');
  } catch (e) {
    document.getElementById('newReleasesList').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

async function loadUpcoming() {
  document.getElementById('upcomingList').innerHTML = '<div class="empty"><span class="loading"></span> Loading...</div>';
  try {
    const r = await fetch('/api/upcoming');
    const data = await r.json();
    const el = document.getElementById('upcomingList');
    if (!data.items?.length) { el.innerHTML = '<div class="empty">No upcoming releases.</div>'; return; }
    el.innerHTML = data.items.map(g => `
      <div class="rec-card" onclick="openSteam(${g.appid})">
        <div class="rec-cover" style="background-image:url('${g.img}')"></div>
        <div class="rec-info">
          <div class="rec-reason"><span style="background:rgba(200,160,32,0.15);color:#c8a020;padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">UPCOMING</span></div>
          <div class="rec-title">${g.name}</div>
          <div class="rec-sub" style="margin-top:4px;line-height:1.5">${g.reason || ''}</div>
          <div class="rec-sub" style="margin-top:4px;font-size:11px">⏱ <span style="color:var(--accent);font-weight:600">${g.releaseDate || 'TBA'}</span></div>
        </div>
        <button class="rec-action">Wishlist →</button>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('upcomingList').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

// ═════ FREE GAMES ═════

function daysLeft(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const ms = d - Date.now();
  if (ms < 0) return 'expired';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

function renderFreeGame(g, showCountdown = true) {
  const badge = g.available
    ? `<span style="background:rgba(34,204,102,0.15);color:#22cc66;padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">FREE NOW</span>`
    : `<span style="background:rgba(200,160,32,0.15);color:#c8a020;padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px">UPCOMING</span>`;
  const price = g.originalPrice && g.originalPrice !== 'Free'
    ? `<span style="text-decoration:line-through;color:var(--dim);font-size:12px">${g.originalPrice}</span>`
    : '';
  const countdown = showCountdown && g.endDate && g.available
    ? `<span style="color:#ff9e42;font-size:11px;font-weight:600">• ${daysLeft(g.endDate)}</span>`
    : '';

  const scoreColour = g.steamRating >= 85 ? 'var(--accent)' : g.steamRating >= 70 ? '#d5e65c' : g.steamRating >= 50 ? '#ff9e42' : '#ff5a5a';
  const reviewBadge = g.steamRating
    ? `<span style="color:${scoreColour};font-weight:700;font-size:12px">${g.steamRating}% ★</span>${g.steamLabel ? ` <span style="color:var(--dim);font-size:11px">${g.steamLabel}${g.steamCount ? ` (${g.steamCount.toLocaleString()})` : ''}</span>` : ''}`
    : '';

  return `
    <div class="rec-card" onclick="window.open('${g.url}','_blank')">
      <div class="rec-cover" style="background-image:url('${g.img || ''}')"></div>
      <div class="rec-info">
        <div class="rec-reason" style="display:flex;gap:8px;align-items:center">${badge} ${countdown}</div>
        <div class="rec-title">${g.title}</div>
        <div class="rec-sub" style="margin-top:4px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span style="color:var(--accent);font-weight:700">FREE</span>
          ${price}
          ${reviewBadge}
        </div>
      </div>
      <button class="rec-action">${g.available ? 'Claim →' : 'Remind me'}</button>
    </div>
  `;
}

async function loadFreeGames() {
  ['freeEpic','freeSteam','freeGog'].forEach(id => {
    document.getElementById(id).innerHTML = '<div class="empty"><span class="loading"></span></div>';
  });

  try {
    const r = await fetch('/api/free-games');
    const data = await r.json();

    // Epic
    const epic = document.getElementById('freeEpic');
    if (!data.epic?.length) {
      epic.innerHTML = '<div class="empty">No Epic free games right now.</div>';
    } else {
      epic.innerHTML = data.epic.map(g => renderFreeGame(g)).join('');
    }

    // Steam
    const steam = document.getElementById('freeSteam');
    if (!data.steam?.length) {
      steam.innerHTML = '<div class="empty">No Steam freebies right now.</div>';
    } else {
      steam.innerHTML = data.steam.slice(0, 12).map(g => renderFreeGame(g, false)).join('');
    }

    // GOG
    const gog = document.getElementById('freeGog');
    if (!data.prime?.length) {
      gog.innerHTML = '<div class="empty">No GOG freebies right now.</div>';
    } else {
      gog.innerHTML = data.prime.slice(0, 12).map(g => renderFreeGame(g, false)).join('');
    }
  } catch (e) {
    document.getElementById('freeEpic').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

// ═════ DEAL HUNTER ═════

function renderDealCard(d, compact = false) {
  const ratingColor = d.steamRating >= 85 ? 'var(--accent)' : d.steamRating >= 70 ? '#d5e65c' : d.steamRating >= 50 ? '#ff9e42' : '#ff5a5a';
  const storeBadge = `<span style="background:var(--panel2);color:var(--text);padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.5px">${d.storeName}</span>`;
  const savings = d.savings >= 1 ? `<span style="color:var(--accent);font-weight:700">-${d.savings}%</span>` : '';
  const price = `<span style="color:${d.savings >= 10 ? 'var(--accent)' : 'var(--text)'};font-weight:700;font-size:15px">$${d.salePrice.toFixed(2)}</span>` +
                (d.savings >= 1 ? ` <span style="text-decoration:line-through;color:var(--dim);font-size:11px">$${d.normalPrice.toFixed(2)}</span>` : '');

  return `
    <div class="rec-card" onclick="window.open('${d.dealLink}','_blank')">
      <div class="rec-cover" style="background-image:url('${d.thumb}')"></div>
      <div class="rec-info">
        <div class="rec-reason">${storeBadge} ${savings}</div>
        <div class="rec-title">${d.title}</div>
        <div class="rec-sub" style="margin-top:4px;display:flex;gap:14px;flex-wrap:wrap;align-items:center">
          ${price}
          ${d.steamRating ? `<span style="color:${ratingColor};font-weight:700">${d.steamRating}% ★</span> <span style="color:var(--dim);font-size:11px">${d.steamReviews || ''}</span>` : ''}
          ${d.metacritic ? `<span style="color:var(--dim);font-size:11px">Metacritic ${d.metacritic}</span>` : ''}
        </div>
      </div>
      <button class="rec-action">Buy →</button>
    </div>
  `;
}

async function loadMyDeals() {
  if (!STATE.sid) {
    document.getElementById('myDealsList').innerHTML = '<div class="empty">Connect Steam to see deals filtered to games you don\'t own.</div>';
    return;
  }
  document.getElementById('myDealsList').innerHTML = '<div class="empty"><span class="loading"></span> Loading...</div>';
  try {
    const data = await api('/api/my-deals');
    const el = document.getElementById('myDealsList');
    // Filter out 100%-off items (those belong in Free Now tab)
    const actual = data.deals.filter(d => d.savings < 100 && d.salePrice > 0);
    if (!actual.length) { el.innerHTML = '<div class="empty">No personalised deals right now.</div>'; return; }
    el.innerHTML = actual.slice(0, 12).map(d => renderDealCard(d)).join('');
  } catch (e) {
    document.getElementById('myDealsList').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

async function loadAllDeals() {
  const store  = document.getElementById('dealStoreSelect').value;
  const rating = document.getElementById('dealRatingSelect').value;
  const maxPrice = document.getElementById('dealPriceSelect').value;
  const sortBy = document.getElementById('dealSortSelect').value;

  const params = new URLSearchParams();
  if (store)    params.set('storeID', store);
  if (rating)   params.set('minRating', rating);
  if (maxPrice) params.set('maxPrice', maxPrice);
  params.set('sortBy', sortBy);
  params.set('onSale', '1');

  document.getElementById('allDealsList').innerHTML = '<div class="empty"><span class="loading"></span> Loading deals...</div>';
  try {
    const r = await fetch('/api/deals?' + params.toString());
    const data = await r.json();
    const el = document.getElementById('allDealsList');
    const actual = (data.deals || []).filter(d => d.savings < 100 && d.salePrice > 0);
    if (!actual.length) { el.innerHTML = '<div class="empty">No deals match these filters.</div>'; return; }
    el.innerHTML = actual.slice(0, 30).map(d => renderDealCard(d)).join('');
  } catch (e) {
    document.getElementById('allDealsList').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

async function searchDeal() {
  const title = document.getElementById('dealSearchInput').value.trim();
  if (!title) return;
  document.getElementById('dealSearchResults').innerHTML = '<div class="empty"><span class="loading"></span> Searching all stores...</div>';
  try {
    const r = await fetch(`/api/deal-search?title=${encodeURIComponent(title)}`);
    const data = await r.json();
    const el = document.getElementById('dealSearchResults');
    if (!data.results?.length) { el.innerHTML = '<div class="empty">No games found matching that title.</div>'; return; }

    el.innerHTML = data.results.map(g => `
      <div class="sidebar-card" style="margin-bottom:12px">
        <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:12px">
          <div style="width:120px;aspect-ratio:460/215;background:url('${g.thumb}') center/cover;border-radius:4px;flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:15px;font-weight:700;margin-bottom:4px">${g.title}</div>
            <div style="font-size:12px;color:var(--dim)">Cheapest now: <strong style="color:var(--accent)">$${g.cheapest.toFixed(2)}</strong> · Historical low: ${g.cheapestEver ? '$' + g.cheapestEver.toFixed(2) : '-'}</div>
          </div>
        </div>
        <table style="width:100%;font-size:13px;border-collapse:collapse">
          ${g.deals.map(d => `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:8px 0"><strong>${d.storeName}</strong></td>
              <td style="padding:8px 0;color:var(--accent);font-weight:700">$${d.price.toFixed(2)}</td>
              <td style="padding:8px 0;color:var(--dim);font-size:11px">${d.savings > 0 ? '-' + d.savings + '%' : ''} ${d.retailPrice > d.price ? '<span style="text-decoration:line-through">$' + d.retailPrice.toFixed(2) + '</span>' : ''}</td>
              <td style="padding:8px 0;text-align:right"><a href="${d.dealLink}" target="_blank" style="color:var(--accent);font-size:12px">Buy →</a></td>
            </tr>
          `).join('')}
        </table>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('dealSearchResults').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

const GENRE_GROUPS = {
  'RPG':        ['rpg','souls'],
  'FPS/Shooter':['fps','shooter','battleroyale'],
  'Action':     ['action','hero'],
  'Strategy':   ['strategy','rts','4x','grand','turnbased','moba'],
  'Simulation': ['simulation','farming','citybuilder','management','flight','driving'],
  'Racing':     ['racing','rally'],
  'Sports':     ['sports','football','basketball'],
  'Fighting':   ['fighting'],
  'Horror':     ['horror','survival'],
  'Co-op':      ['coop'],
  'Multiplayer':['multiplayer','competitive','mmo'],
  'Indie':      ['indie'],
  'Roguelike':  ['roguelike','deckbuilder'],
  'Open World': ['openworld','exploration','sandbox'],
  'Story':      ['story','cinematic'],
  'Puzzle':     ['puzzle'],
  'Platformer': ['platformer','metroidvania'],
  'Cosy':       ['cosy','relaxing','cute'],
  'Fantasy':    ['fantasy','medieval'],
  'Sci-Fi':     ['scifi','cyberpunk','space','postapocalyptic'],
  'Historical': ['historical','ww2','viking','western'],
  'Crafting':   ['crafting'],
  'Free':       ['free'],
};

STATE.selectedGenres = new Set();

function renderGenrePills() {
  const el = document.getElementById('genrePills');
  if (!el) return;
  el.innerHTML = Object.keys(GENRE_GROUPS).map(g => {
    const active = STATE.selectedGenres.has(g);
    return `<button onclick="toggleGenre('${g}')" style="background:${active ? 'var(--accent)' : 'var(--panel)'};color:${active ? '#000' : 'var(--text)'};border:1px solid ${active ? 'var(--accent)' : 'var(--border)'};padding:5px 12px;border-radius:100px;font-size:11px;font-family:inherit;cursor:pointer;font-weight:${active ? 700 : 500};transition:all 0.15s">${g}</button>`;
  }).join('') +
    (STATE.selectedGenres.size > 0 ? `<button onclick="clearGenres()" style="background:transparent;color:var(--dim);border:none;padding:5px 12px;font-size:11px;font-family:inherit;cursor:pointer;text-decoration:underline">Clear all</button>` : '');

  const countEl = document.getElementById('genreCount');
  if (countEl) {
    countEl.textContent = STATE.selectedGenres.size > 0 ? `(${STATE.selectedGenres.size} selected)` : '';
  }
}

function toggleGenre(g) {
  if (STATE.selectedGenres.has(g)) STATE.selectedGenres.delete(g);
  else STATE.selectedGenres.add(g);
  renderGenrePills();
  renderBuyRecs();
}

function clearGenres() {
  STATE.selectedGenres.clear();
  renderGenrePills();
  renderBuyRecs();
}

function matchesGenres(rec) {
  if (STATE.selectedGenres.size === 0) return true;
  const recTags = rec.tags || [];
  // Match if ANY selected genre group overlaps with rec tags
  for (const g of STATE.selectedGenres) {
    const groupTags = GENRE_GROUPS[g] || [];
    if (groupTags.some(t => recTags.includes(t))) return true;
  }
  return false;
}

async function loadBuyRecs() {
  document.getElementById('buyRecList').innerHTML = '<div class="empty"><span class="loading"></span> Finding deals & matches...</div>';
  renderGenrePills();
  try {
    const data = await api('/api/recommend-buy');
    if (!data.recommendations?.length) {
      document.getElementById('buyRecList').innerHTML = '<div class="empty">No buy recommendations yet.</div>';
      return;
    }
    STATE.buyRecs = data.recommendations;
    renderBuyRecs();
  } catch (e) {
    document.getElementById('buyRecList').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  if (priceStr === 'Free') return 0;
  const m = priceStr.match(/([£€$])([\d.,]+)/);
  if (!m) return null;
  return parseFloat(m[2].replace(',', '.'));
}

function renderBuyRecs() {
  if (!STATE.buyRecs) return;
  const sort = document.getElementById('buySortSelect').value;
  const priceFilter = document.getElementById('buyPriceSelect').value;
  const reviewMin = parseInt(document.getElementById('buyReviewSelect').value);

  let list = [...STATE.buyRecs];

  // Filter: genres
  list = list.filter(matchesGenres);

  // Filter: reviews
  if (reviewMin > 0) list = list.filter(r => (r.reviewScore || 0) >= reviewMin);

  // Filter: price
  list = list.filter(r => {
    const p = parsePrice(r.price);
    switch (priceFilter) {
      case 'free':       return p === 0;
      case 'under10':    return p !== null && p < 10;
      case 'under20':    return p !== null && p < 20;
      case 'under40':    return p !== null && p < 40;
      case 'discounted': return r.discounted;
      default:           return true;
    }
  });

  // Sort
  switch (sort) {
    case 'review':     list.sort((a, b) => (b.reviewScore || 0) - (a.reviewScore || 0)); break;
    case 'players':    list.sort((a, b) => (b.currentPlayers || 0) - (a.currentPlayers || 0)); break;
    case 'price-low':  list.sort((a, b) => (parsePrice(a.price) ?? Infinity) - (parsePrice(b.price) ?? Infinity)); break;
    case 'price-high': list.sort((a, b) => (parsePrice(b.price) ?? -1) - (parsePrice(a.price) ?? -1)); break;
    case 'discount':   list.sort((a, b) => (b.discounted ? 1 : 0) - (a.discounted ? 1 : 0) || 0); break;
  }

  const el = document.getElementById('buyRecList');
  if (!list.length) {
    el.innerHTML = '<div class="empty">No games match these filters. Loosen the criteria.</div>';
    return;
  }

  el.innerHTML = list.map(r => {
    const scoreColour = r.reviewScore >= 85 ? 'var(--accent)' : r.reviewScore >= 70 ? '#d5e65c' : r.reviewScore >= 50 ? '#ff9e42' : '#ff5a5a';
    const badges = [];
    if (r.reviewScore) badges.push(`<span style="color:${scoreColour};font-weight:700">${r.reviewScore}% ★</span> <span style="color:var(--dim);font-size:11px">${r.reviewLabel || ''} (${(r.reviewCount||0).toLocaleString()})</span>`);
    if (r.currentPlayers > 100) badges.push(`<span style="color:var(--accent)">●</span> <span style="color:var(--dim);font-size:11px">${r.currentPlayers.toLocaleString()} playing</span>`);
    if (r.price) badges.push(`<span style="color:${r.discounted ? 'var(--accent)' : 'var(--text)'};font-weight:600">${r.price}</span>`);
    return `
      <div class="rec-card" onclick="openSteam(${r.appid})">
        <div class="rec-cover" style="background-image:url('${r.img}')"></div>
        <div class="rec-info">
          <div class="rec-reason">${r.reason}</div>
          <div class="rec-title">${r.game}</div>
          <div class="rec-sub">${r.sub}</div>
          <div class="rec-sub" style="margin-top:6px;display:flex;gap:14px;flex-wrap:wrap">${badges.join(' <span style="color:var(--dim2)">·</span> ')}</div>
        </div>
        <button class="rec-action">${r.price === 'Free' ? 'Install' : 'Buy →'}</button>
      </div>
    `;
  }).join('');
}

async function loadNews() {
  STATE.newsLoaded = true;
  STATE.newsLoadedAt = Date.now();
  const el = document.getElementById('newsFeed');
  if (el) el.innerHTML = '<div class="empty"><span class="loading"></span> Fetching news…</div>';
  const topGames = STATE.games.slice(0, 5);
  const allNews = [];

  for (const g of topGames) {
    try {
      const r = await fetch(`/api/steam/news/${g.appid}`);
      const data = await r.json();
      for (const n of (data.items || []).slice(0, 2)) {
        allNews.push({ ...n, gameName: g.name });
      }
    } catch {}
  }

  allNews.sort((a, b) => b.date - a.date);

  if (!allNews.length) { el.innerHTML = '<div class="empty">No news available.</div>'; return; }

  el.innerHTML = allNews.slice(0, 15).map(n => {
    const ago = relativeTime(n.date * 1000);
    return `
      <div class="news-item">
        <a href="${n.url}" target="_blank" rel="noopener">
          <div class="game">${n.gameName}</div>
          <div class="title">${n.title}</div>
          <div class="date">${ago} · ${n.feed || 'Steam'}</div>
        </a>
      </div>
    `;
  }).join('');
}

async function loadAchievements() {
  STATE.achLoaded = true;
  const topGames = STATE.games.slice(0, 10);
  const rows = [];

  for (const g of topGames) {
    try {
      const r = await fetch(`/api/steam/achievements/${g.appid}?sid=${STATE.sid}`);
      const data = await r.json();
      if (!data.error && data.total > 0) {
        rows.push({ ...g, unlocked: data.unlocked, total: data.total, pct: data.completionPct });
      }
    } catch {}
  }

  const el = document.getElementById('achGameList');
  if (!rows.length) { el.innerHTML = '<div class="empty">No achievement data available for your top games.</div>'; return; }

  el.innerHTML = rows.map(r => `
    <div class="ach-item" style="cursor:pointer" onclick="loadAchDetail(${r.appid},'${r.name.replace(/'/g,"\\'")}')">
      <div class="ach-icon" style="background-image:url('${r.img}')"></div>
      <div class="ach-info">
        <div class="ach-name">${r.name}</div>
        <div class="ach-desc">${r.unlocked} of ${r.total} · ${r.hours}h played</div>
      </div>
      <div class="ach-rarity">${r.pct}%</div>
    </div>
  `).join('');
}

async function loadAchDetail(appid, name) {
  document.getElementById('achDetail').style.display = 'block';
  document.getElementById('achDetailTitle').textContent = name;
  document.getElementById('achDetailList').innerHTML = '<div class="empty"><span class="loading"></span></div>';
  try {
    const r = await fetch(`/api/steam/achievements/${appid}?sid=${STATE.sid}`);
    const data = await r.json();
    // Show unlocked, sorted by unlock time desc, plus easiest uncompleted
    const unlocked = data.achievements.filter(a => a.unlocked).sort((a, b) => b.unlockTime - a.unlockTime).slice(0, 8);
    const easiest = data.achievements.filter(a => !a.unlocked).sort((a, b) => b.globalPct - a.globalPct).slice(0, 8);

    document.getElementById('achDetailList').innerHTML = `
      <h3>Recent unlocks</h3>
      ${unlocked.map(a => `
        <div class="ach-item">
          <div class="ach-icon" style="background-image:url('${a.icon}')"></div>
          <div class="ach-info">
            <div class="ach-name">${a.name}</div>
            <div class="ach-desc">${a.desc || 'Unlocked'}</div>
          </div>
          <div class="ach-rarity">${Math.round(a.globalPct)}%</div>
        </div>
      `).join('')}
      <h3 style="margin-top:20px">Easiest to unlock next</h3>
      ${easiest.map(a => `
        <div class="ach-item">
          <div class="ach-icon" style="background-image:url('${a.iconGray || a.icon}');opacity:0.6"></div>
          <div class="ach-info">
            <div class="ach-name">${a.name}</div>
            <div class="ach-desc">${a.desc || '(Hidden)'}</div>
          </div>
          <div class="ach-rarity">${Math.round(a.globalPct)}%</div>
        </div>
      `).join('')}
    `;
    document.getElementById('achDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    document.getElementById('achDetailList').innerHTML = `<div class="error">${e.message}</div>`;
  }
}

async function loadLeaderboards() {
  STATE.lbLoaded = true;
  const topGames = STATE.games.slice(0, 10);
  const rows = await Promise.all(topGames.map(async g => {
    try {
      const [stats, reviews] = await Promise.all([
        fetch(`/api/steam/game-stats/${g.appid}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/reviews/${g.appid}`).then(r => r.json()).catch(() => ({})),
      ]);
      return { ...g, currentPlayers: stats.currentPlayers, reviewScore: reviews.score, reviewLabel: reviews.label, reviewCount: reviews.total };
    } catch {
      return g;
    }
  }));

  const el = document.getElementById('playerCounts');
  el.innerHTML = rows.map(r => {
    const scoreColour = r.reviewScore >= 85 ? 'var(--accent)' : r.reviewScore >= 70 ? '#d5e65c' : r.reviewScore >= 50 ? '#ff9e42' : '#ff5a5a';
    return `
      <div class="ach-item">
        <div class="ach-icon" style="background-image:url('${r.img}')"></div>
        <div class="ach-info">
          <div class="ach-name">${r.name}</div>
          <div class="ach-desc">${r.hours}h played by you · ${r.reviewScore ? `<span style="color:${scoreColour}">${r.reviewScore}% ★ ${r.reviewLabel || ''}</span>` : 'No reviews'}</div>
        </div>
        <div class="ach-rarity" style="color:${r.currentPlayers > 10000 ? 'var(--accent)' : 'var(--dim)'}">${r.currentPlayers !== null && r.currentPlayers !== undefined ? r.currentPlayers.toLocaleString() + ' online' : '-'}</div>
      </div>
    `;
  }).join('');

  // Simple "leaderboard" - your most played games ranked with mock global averages
  document.getElementById('leaderboard').innerHTML = `
    <thead><tr><th>#</th><th>Game</th><th>Your Hours</th><th>Global Avg</th><th>Your Percentile</th></tr></thead>
    <tbody>
      ${STATE.games.slice(0, 10).map((g, i) => {
        // Rough estimate: global avg for popular games ~50-300h
        const globalAvg = Math.round(80 + Math.random() * 200);
        const percentile = g.hours > globalAvg * 2 ? 'Top 1%' : g.hours > globalAvg ? 'Top 20%' : 'Average';
        const colour = percentile === 'Top 1%' ? 'var(--accent)' : percentile === 'Top 20%' ? '#a0c838' : 'var(--dim)';
        return `
          <tr>
            <td><span class="rank">${i+1}</span></td>
            <td><strong>${g.name}</strong></td>
            <td>${g.hours}h</td>
            <td style="color:var(--dim)">~${globalAvg}h</td>
            <td style="color:${colour};font-weight:700">${percentile}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;
}

function relativeTime(ms) {
  const diff = Date.now() - ms;
  const m = diff / 60000;
  if (m < 60) return Math.round(m) + 'm ago';
  if (m < 1440) return Math.round(m/60) + 'h ago';
  if (m < 10080) return Math.round(m/1440) + 'd ago';
  return new Date(ms).toLocaleDateString();
}

// Steam-only sign-in flow - cleanup any leftover Xbox tokens from previous version
localStorage.removeItem('questlog_xbox_token');
localStorage.removeItem('questlog_xbox_xuid');

// Auto-connect saved Steam session
const savedSid = localStorage.getItem('questlog_sid');
if (savedSid) {
  document.getElementById('sidInput').value = savedSid;
  connectSteam();
}
// Apply saved theme on load (works even without Pro - saved in localStorage)
const savedTheme = localStorage.getItem('questlog_theme') || 'gamerlux';
if (typeof applyTheme === 'function') applyTheme(savedTheme);

// Shrink nav on scroll
(function(){
  const nav = document.querySelector('nav');
  if (!nav) return;
  let ticking = false;
  function update(){
    const y = window.scrollY || window.pageYOffset || 0;
    nav.classList.toggle('shrunk', y > 60);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

// ═══════════════════════════════════════════════════════════════
// INVENTORY (CS2 / Dota 2 / Rust / TF2)
// ═══════════════════════════════════════════════════════════════
//
// Loads each game's tradable inventory + live Steam Market prices,
// caches per-game results in STATE.inventory[appid].
//
// Snapshots historic value via POST /api/steam/inventory/snapshot
// on first daily open, so the chart fills out automatically.

const INV_DEFS = [
  { appid: '730',    name: 'CS2',    short: 'cs2',   accent: '#d97a2e' },
  { appid: '570',    name: 'Dota 2', short: 'dota',  accent: '#c83838' },
  { appid: '252490', name: 'Rust',   short: 'rust',  accent: '#cd5b1e' },
  { appid: '440',    name: 'TF2',    short: 'tf2',   accent: '#b75d3a' },
];
const INV_CURRENCY = '£';
STATE.inventory = STATE.inventory || {};   // { appid: { items, totalValue, ... } }
STATE.invActiveAppid = STATE.invActiveAppid || '730';
STATE.invFilter = STATE.invFilter || '';
STATE.invSort = STATE.invSort || 'value';

function fmtMoney(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1000) return INV_CURRENCY + n.toFixed(0);
  return INV_CURRENCY + n.toFixed(2);
}

// Marketplace deep links — opens search for a market_hash_name on each site.
// All four sites accept a plain text search query in their URL.
function marketplaceLinks(appid, marketHashName) {
  const q = encodeURIComponent(marketHashName);
  const out = [
    { name: 'Steam Market', url: `https://steamcommunity.com/market/listings/${appid}/${encodeURIComponent(marketHashName)}` },
  ];
  // CS2 / Rust / Dota2 all use the same external markets
  if (appid === '730') {
    out.push({ name: 'Skinport',  url: `https://skinport.com/market?search=${q}` });
    out.push({ name: 'CSFloat',   url: `https://csfloat.com/search?type=any&market_hash_name=${q}` });
    out.push({ name: 'DMarket',   url: `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${q}` });
    out.push({ name: 'BUFF163',   url: `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${q}` });
  } else if (appid === '570') {
    out.push({ name: 'Skinport',  url: `https://skinport.com/dota2/market?search=${q}` });
    out.push({ name: 'DMarket',   url: `https://dmarket.com/ingame-items/item-list/dota2?title=${q}` });
    out.push({ name: 'BUFF163',   url: `https://buff.163.com/market/dota2#tab=selling&page_num=1&search=${q}` });
  } else if (appid === '252490') {
    out.push({ name: 'Skinport',  url: `https://skinport.com/rust/market?search=${q}` });
    out.push({ name: 'DMarket',   url: `https://dmarket.com/ingame-items/item-list/rust?title=${q}` });
  } else if (appid === '440') {
    out.push({ name: 'Backpack.tf', url: `https://backpack.tf/search?text=${q}&item_type=any` });
    out.push({ name: 'Marketplace.tf', url: `https://marketplace.tf/items?text=${q}` });
    out.push({ name: 'Scrap.tf', url: `https://scrap.tf/search?q=${q}` });
  }
  return out;
}

async function initInventory() {
  renderInvSummary();   // skeletons
  renderInvGameTabs();
  bindInvControls();
  await loadInvAll();
  renderInvHistory();
  // Save a snapshot so the history chart starts populating
  try { await fetch(`/api/steam/inventory/snapshot?sid=${STATE.sid}`, { method: 'POST' }); } catch(e){}
}

function renderInvGameTabs() {
  const holder = document.getElementById('invGameTabs');
  if (!holder) return;
  holder.innerHTML = INV_DEFS.map(g => `
    <button class="sub-tab ${g.appid === STATE.invActiveAppid ? 'active' : ''}"
            data-appid="${g.appid}"
            style="border:1px solid var(--border);background:transparent;color:var(--text-bright);padding:8px 16px;font-family:inherit;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:700;cursor:pointer;${g.appid === STATE.invActiveAppid ? `color:${g.accent};border-color:${g.accent}` : ''}">
      ${g.name}
    </button>
  `).join('');
  holder.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.invActiveAppid = btn.dataset.appid;
      renderInvGameTabs();
      renderInvItems();
    });
  });
}

function bindInvControls() {
  const search = document.getElementById('invSearch');
  const sort = document.getElementById('invSort');
  const refresh = document.getElementById('invRefreshBtn');
  if (search) search.addEventListener('input', e => { STATE.invFilter = e.target.value.toLowerCase(); renderInvItems(); });
  if (sort) sort.addEventListener('change', e => { STATE.invSort = e.target.value; renderInvItems(); });
  if (refresh) refresh.addEventListener('click', async () => {
    refresh.textContent = 'Refreshing…'; refresh.disabled = true;
    // Invalidate cache: re-fetch the currently-active game (the server
    // controls TTL, but we re-request to surface latest cached prices).
    STATE.inventory[STATE.invActiveAppid] = null;
    await loadInvSingle(STATE.invActiveAppid);
    renderInvSummary();
    renderInvItems();
    refresh.textContent = 'Refresh prices'; refresh.disabled = false;
  });
}

async function loadInvAll() {
  // Fire all four in parallel so the summary grid fills as each lands.
  await Promise.all(INV_DEFS.map(g => loadInvSingle(g.appid)));
  renderInvSummary();
  renderInvItems();
  updateInvGrandTotal();
}

async function loadInvSingle(appid) {
  const card = document.querySelector(`[data-inv-card="${appid}"]`);
  if (card) card.classList.add('inv-loading');
  try {
    const r = await fetch(`/api/steam/inventory?sid=${STATE.sid}&appid=${appid}`);
    const j = await r.json();
    if (j.error) {
      STATE.inventory[appid] = { error: j.error, items: [], totalValue: 0, totalCount: 0 };
    } else {
      STATE.inventory[appid] = j;
    }
  } catch (e) {
    STATE.inventory[appid] = { error: e.message, items: [], totalValue: 0, totalCount: 0 };
  } finally {
    if (card) card.classList.remove('inv-loading');
  }
  // Re-render the affected card immediately
  renderInvSummary();
  updateInvGrandTotal();
}

function renderInvSummary() {
  const grid = document.getElementById('invSummaryGrid');
  if (!grid) return;
  grid.innerHTML = INV_DEFS.map(g => {
    const data = STATE.inventory[g.appid];
    if (!data) {
      return `<div class="stat-card" data-inv-card="${g.appid}" style="border-left:3px solid ${g.accent};padding:16px">
        <div style="color:var(--dim);font-size:11px;letter-spacing:1px;text-transform:uppercase">${g.name}</div>
        <div style="color:var(--text-bright);font-size:22px;font-weight:800;margin-top:8px"><span class="loading"></span></div>
      </div>`;
    }
    if (data.error) {
      const isPrivate = /private/i.test(data.error);
      return `<div class="stat-card" data-inv-card="${g.appid}" style="border-left:3px solid var(--dim);padding:16px;opacity:0.7">
        <div style="color:var(--dim);font-size:11px;letter-spacing:1px;text-transform:uppercase">${g.name}</div>
        <div style="color:var(--text-bright);font-size:14px;margin-top:8px;font-weight:600">${isPrivate ? 'Private' : 'Unavailable'}</div>
        <div style="color:var(--dim);font-size:11px;margin-top:4px">${isPrivate ? 'Set inventory to Public in Steam' : (data.error.slice(0, 60))}</div>
      </div>`;
    }
    const top = data.items && data.items[0];
    const isEmpty = !data.totalCount;
    return `<div class="stat-card" data-inv-card="${g.appid}" style="border-left:3px solid ${g.accent};padding:16px;cursor:pointer;${isEmpty ? 'opacity:0.55' : ''}" onclick="switchInvTab('${g.appid}')">
      <div style="color:var(--dim);font-size:11px;letter-spacing:1px;text-transform:uppercase">${g.name}</div>
      <div style="color:${isEmpty ? 'var(--dim)' : 'var(--accent)'};font-size:24px;font-weight:800;margin-top:6px;line-height:1">${isEmpty ? '—' : fmtMoney(data.totalValue)}</div>
      <div style="color:var(--dim);font-size:11px;margin-top:6px">${isEmpty ? 'No tradable items' : `${data.totalCount} items · ${(data.items||[]).length} types`}</div>
      ${top ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${top.name}">Top: ${top.name}</div>` : ''}
    </div>`;
  }).join('');
}

function updateInvGrandTotal() {
  const totalEl = document.getElementById('invGrandTotal');
  const subEl = document.getElementById('invGrandSub');
  if (!totalEl) return;
  let total = 0, loaded = 0, count = 0;
  for (const g of INV_DEFS) {
    const d = STATE.inventory[g.appid];
    if (d && !d.error) { total += (d.totalValue || 0); count += (d.totalCount || 0); loaded++; }
  }
  totalEl.textContent = fmtMoney(total);
  if (subEl) subEl.textContent = `${count} items · ${loaded}/4 games loaded`;
}

function switchInvTab(appid) {
  STATE.invActiveAppid = appid;
  renderInvGameTabs();
  renderInvItems();
  // Scroll to the items section
  const holder = document.getElementById('invItemsHolder');
  if (holder) holder.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderInvItems() {
  const holder = document.getElementById('invItemsHolder');
  if (!holder) return;
  const data = STATE.inventory[STATE.invActiveAppid];
  if (!data) {
    holder.innerHTML = `<div class="empty" style="text-align:center;padding:40px 0;color:var(--dim)"><span class="loading"></span> Loading inventory…</div>`;
    return;
  }
  if (data.error) {
    const isPrivate = /private/i.test(data.error);
    holder.innerHTML = `<div class="empty" style="text-align:center;padding:40px 20px;color:var(--dim)">
      <div style="font-size:14px;color:var(--text-bright);margin-bottom:12px">${isPrivate ? 'This inventory is private.' : 'Could not load inventory.'}</div>
      <div style="font-size:12px;max-width:480px;margin:0 auto;line-height:1.6">${isPrivate
        ? 'Open Steam → your profile → Edit Profile → Privacy Settings. Set <b>My profile</b> and <b>Inventory</b> to Public, then refresh.'
        : data.error}</div>
    </div>`;
    return;
  }
  let items = (data.items || []).slice();
  // Filter
  if (STATE.invFilter) {
    items = items.filter(it => (it.name || '').toLowerCase().includes(STATE.invFilter));
  }
  // Sort
  const sort = STATE.invSort;
  items.sort((a, b) => {
    if (sort === 'price') return (b.priceMedian || b.priceLowest || 0) - (a.priceMedian || a.priceLowest || 0);
    if (sort === 'count') return b.count - a.count;
    if (sort === 'name')  return (a.name || '').localeCompare(b.name || '');
    if (sort === 'volume') return (b.volume || 0) - (a.volume || 0);
    return (b.value || 0) - (a.value || 0); // value
  });

  if (!items.length) {
    holder.innerHTML = `<div class="empty" style="text-align:center;padding:40px 0;color:var(--dim)">No items match.</div>`;
    return;
  }
  holder.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
      ${items.map(it => renderInvCard(STATE.invActiveAppid, it)).join('')}
    </div>
    <div style="color:var(--dim);font-size:11px;margin-top:16px;text-align:center">
      Showing ${items.length} of ${(data.items||[]).length} items · Prices via Steam Community Market${data.stale ? ' · Cached (Steam rate-limited)' : ''}
    </div>
  `;
}

function renderInvCard(appid, it) {
  const price = it.priceMedian ?? it.priceLowest;
  const rarityColor = it.rarityColor ? `#${it.rarityColor}` : '#888';
  const links = marketplaceLinks(appid, it.marketHashName);
  const linkHtml = links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" style="font-size:10px;padding:3px 6px;background:rgba(200,241,53,0.08);color:var(--accent);text-decoration:none;border:1px solid rgba(200,241,53,0.2);letter-spacing:0.5px">${l.name}</a>`).join('');
  return `
    <div style="border:1px solid var(--border);background:rgba(0,0,0,0.2);padding:12px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;gap:10px;align-items:flex-start">
        ${it.icon ? `<img src="${it.icon}" alt="" style="width:64px;height:64px;object-fit:contain;background:linear-gradient(135deg,${rarityColor}20,transparent);border-left:3px solid ${rarityColor};flex-shrink:0" loading="lazy">` : '<div style="width:64px;height:64px;background:rgba(0,0,0,0.4);flex-shrink:0"></div>'}
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:var(--text-bright);font-weight:700;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escapeHtml(it.name)}</div>
          ${it.exterior ? `<div style="font-size:10px;color:var(--dim);margin-top:2px">${escapeHtml(it.exterior)}</div>` : ''}
          ${it.rarity ? `<div style="font-size:10px;color:${rarityColor};margin-top:2px;font-weight:600">${escapeHtml(it.rarity)}</div>` : ''}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--border);padding-top:8px">
        <div>
          <div style="color:var(--accent);font-size:16px;font-weight:800">${price != null ? fmtMoney(price) : '—'}</div>
          ${it.count > 1 ? `<div style="color:var(--dim);font-size:10px">× ${it.count} = ${fmtMoney(it.value)}</div>` : ''}
        </div>
        <div style="text-align:right">
          ${it.volume ? `<div style="color:var(--dim);font-size:10px">vol ${it.volume}/day</div>` : ''}
          ${it.priceStale ? `<div style="color:#cc7722;font-size:9px">stale</div>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${linkHtml}</div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

async function renderInvHistory() {
  const holder = document.getElementById('invHistoryChart');
  if (!holder) return;
  try {
    const r = await fetch(`/api/steam/inventory/history?sid=${STATE.sid}`);
    const j = await r.json();
    const points = j.history || [];
    if (points.length < 2) {
      holder.innerHTML = `<div class="empty" style="text-align:center;padding:60px 0;color:var(--dim);font-size:12px">
        ${points.length === 0 ? 'No snapshots yet. Reload the Inventory tab tomorrow to see the chart fill in.' : 'Need at least 2 snapshots before charting. Come back tomorrow.'}
      </div>`;
      return;
    }
    drawInvHistoryChart(holder, points);
  } catch (e) {
    holder.innerHTML = `<div class="empty" style="text-align:center;padding:60px 0;color:var(--dim);font-size:12px">Could not load history.</div>`;
  }
}

function drawInvHistoryChart(holder, points) {
  holder.innerHTML = '';
  const w = holder.clientWidth || 600, h = 160;
  const svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block">
    ${buildInvChartSVG(points, w, h)}
  </svg>
  <div style="display:flex;justify-content:space-between;color:var(--dim);font-size:10px;margin-top:6px">
    <span>${new Date(points[0].ts).toLocaleDateString()}</span>
    <span>${new Date(points[points.length-1].ts).toLocaleDateString()}</span>
  </div>`;
  holder.innerHTML = svg;
}

function buildInvChartSVG(points, w, h) {
  const pad = 8;
  const ws = w - pad * 2, hs = h - pad * 2;
  const values = points.map(p => p.total || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 0.01);
  const xStep = ws / Math.max(points.length - 1, 1);
  const pts = points.map((p, i) => {
    const x = pad + i * xStep;
    const y = pad + hs - ((p.total - min) / range) * hs;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${pts.join(' L ')}`;
  const fillPath = `${linePath} L ${(pad + (points.length - 1) * xStep).toFixed(1)},${(pad + hs).toFixed(1)} L ${pad},${(pad + hs).toFixed(1)} Z`;
  return `
    <defs>
      <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c8f135" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#c8f135" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${fillPath}" fill="url(#invFill)"/>
    <path d="${linePath}" stroke="#c8f135" stroke-width="2" fill="none"/>
    <text x="${w-4}" y="${pad+12}" text-anchor="end" fill="#888" font-size="10">${INV_CURRENCY}${max.toFixed(2)}</text>
    <text x="${w-4}" y="${h-pad}" text-anchor="end" fill="#888" font-size="10">${INV_CURRENCY}${min.toFixed(2)}</text>
  `;
}

// Make switchInvTab globally callable from inline onclick
window.switchInvTab = switchInvTab;
