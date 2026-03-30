/* ═══════════════════════════════════════════════════════════
   RUPERT WEB — main.js
   All data lives here. Edit the arrays below to update the
   dashboard. No framework, no build step.
   ═══════════════════════════════════════════════════════════ */

/* ── Clock ─────────────────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('clock').textContent = `${hh}:${mm}:${ss}`;
  document.getElementById('date').textContent =
    `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
updateClock();
setInterval(updateClock, 1000);


/* ══════════════════════════════════════════════════════════════
   DATA — ESSAYS
   Add objects to this array to add essay cards.
   Fields: title, date (YYYY-MM-DD), category, excerpt
   Categories: 'History' | 'Geopolitics' | 'Philosophy' | 'Politics'
   ══════════════════════════════════════════════════════════════ */
const ESSAYS = [
  {
    title: "The Revolution They Buried: Haiti and the Event That Remade the Atlantic World",
    date: "2026-03-30",
    category: "History",
    excerpt: "The French Revolution gets the glory. 1776 gets the mythology. But neither of those revolutions did what the Haitian Revolution did: it destroyed the most profitable slave colony on earth from the inside, created the first Black republic in history, ...",
    url: "essays/2026-03-30-the-revolution-they-buried-haiti-and-the-event-that-remade-t.html"
  },
  {
    title: "The Peace That Lasted: Metternich, the Concert of Europe, and the Art of Managed Multipolarity",
    date: "2026-03-29",
    category: "History",
    excerpt: "Most peace settlements fail. The Treaty of Versailles lasted twenty years before the continent it supposedly pacified destroyed itself again. The Peace of Westphalia held better but still crumbled under Louis XIV's ambitions within a generation. The ...",
    url: "essays/2026-03-29-the-peace-that-lasted-metternich-the-concert-of-europe-and-t.html"
  },
  {
    title: "The Revolution France Wanted to Forget: Haiti, 1804, and the Limits of Enlightenment",
    date: "2026-03-28",
    category: "History",
    excerpt: "The French Revolution is taught as the great rupture of modernity — Liberty, Equality, Fraternity proclaimed from the barricades of Paris. Less discussed is what happened when the enslaved people of Saint-Domingue took those words seriously....",
    url: "essays/2026-03-28-the-revolution-france-wanted-to-forget-haiti-1804-and-the-li.html"
  },
  {
    title: "The Iron Law of the Ruling Class: Pareto, Mosca, and Why Democracies Don't Rule Themselves",
    date: "2026-03-27",
    category: "History",
    excerpt: "Every few years, somewhere in the Western world, a politician rises on a wave of anti-establishment fury. They promise to give power back to the people. They win. And within a term or two, they are the establishment — governing much as their predeces...",
    url: "essays/2026-03-27-the-iron-law-of-the-ruling-class-pareto-mosca-and-why-democr.html"
  },
  {
    title: "The Lights Go Out: The Bronze Age Collapse and What It Teaches About Systemic Fragility",
    date: "2026-03-26",
    category: "History",
    excerpt: "Around 1200 BC, within the span of roughly fifty years, almost every major civilization in the Eastern Mediterranean ceased to exist. The Hittite Empire — which had fought Egypt to a standstill at Kadesh and negotiated the oldest known peace treaty i...",
    url: "essays/2026-03-26-the-lights-go-out-the-bronze-age-collapse-and-what-it-teache.html"
  },
  {
    title: "The Ransom of Haiti: How a Nation Paid for Its Own Freedom",
    date: "2026-03-25",
    category: "History",
    excerpt: "In 1825, the most successful slave revolution in history was extorted. Haiti — the first Black republic, born from the blood of men and women who had burned the plantations of Saint-Domingue and defeated Napoleon's best generals — agreed to pay Franc...",
    url: "essays/2026-03-25-the-ransom-of-haiti-how-a-nation-paid-for-its-own-freedom.html"
  },
  {
    title: "The War That Killed Thirty Million People (And Nobody Talks About It)",
    date: "2026-03-24",
    category: "History",
    excerpt: "Between 1850 and 1864, a civil war tore through southern China that killed somewhere between twenty and thirty million people. Some estimates push the figure to seventy million. Even at the conservative end, it is the deadliest civil conflict in reco...",
    url: "essays/2026-03-24-the-war-that-killed-thirty-million-people-and-nobody-talks-a.html"
  },
  {
    title: "The Melian Dialogue and the Lie at the Heart of International Order",
    date: "2026-03-23",
    category: "Geopolitics",
    excerpt: "In 416 BC Athens massacred the island of Melos and delivered the most honest speech in diplomatic history. The strong do what they can, the weak suffer what they must. Every UN resolution since is a response to this — and none have been adequate.",
    url: "essays/2026-03-23-melian-dialogue.html"
  },
  {
    title: "The Man Who Understood Civilizations Before Anyone Else",
    date: "2026-03-22",
    category: "History",
    excerpt: "Ibn Khaldun sat in a desert fortress in 14th-century Algeria and wrote the introduction to a history of the world. That introduction turned out to be more important than anything written in the five centuries since. Western intellectual tradition has largely ignored him. This is a mistake.",
    url: null  // full text not recovered — available from next run onwards
  },
];


/* ══════════════════════════════════════════════════════════════
   DATA — SCHOOL (ManageBac)
   Add objects to this array to add tasks.
   Fields: subject, title, due (YYYY-MM-DD), status ('pending'|'done')
   ══════════════════════════════════════════════════════════════ */
const SCHOOL_TASKS = [
  // Last updated: 2026-03-29 via ManageBac scraper
  // --- Past (Mon Mar 23) ---
  { subject: "Math 8", title: "Math 8: Apothem Exercises", due: "2026-03-23", time: "8:30 AM", status: "done", type: "Homework" },
  { subject: "English 7", title: "Eng 7 hw", due: "2026-03-23", time: "9:00 AM", status: "done", type: "Homework" },
  { subject: "Science 7", title: "Classwork Science 7", due: "2026-03-23", time: "10:30 AM", status: "done", type: "Class work" },
  { subject: "Science 7", title: "HW Science 7", due: "2026-03-23", time: "11:35 AM", status: "done", type: "Homework" },
  { subject: "History 7", title: "Classical period worksheet", due: "2026-03-23", time: "12:45 PM", status: "done", type: "Homework" },
  // --- Past (Tue Mar 24) ---
  { subject: "Italian", title: "Test di GRAMMATICA (Futuro)", due: "2026-03-24", time: "All Day", status: "done", type: "Test" },
  { subject: "Ed. Technology 7", title: "Ed. Tech 7 - Locally sourced building materials", due: "2026-03-24", time: "8:30 AM", status: "done", type: "Homework" },
  { subject: "Science 7", title: "Classwork Science 7", due: "2026-03-24", time: "11:10 AM", status: "done", type: "Class work" },
  { subject: "Rel Ed 7", title: "Jesus at the Temple and Passover Meal", due: "2026-03-24", time: "12:25 PM", status: "done", type: "Homework" },
  { subject: "German 7", title: "Cover Work - Dative Case Practice", due: "2026-03-24", time: "12:35 PM", status: "done", type: "Homework" },
  // --- Past (Wed Mar 25) ---
  { subject: "Math 8", title: "Math 8: Surface Area of Prisms", due: "2026-03-25", time: "12:30 PM", status: "done", type: "Homework" },
  { subject: "Math 7", title: "Math 7 (Formative)", due: "2026-03-25", time: "12:35 PM", status: "done", type: "Quiz" },
  { subject: "Math 7", title: "Math 7 (HW)", due: "2026-03-25", time: "12:35 PM", status: "done", type: "Homework" },
  { subject: "Math 7", title: "Geometry nrich", due: "2026-03-25", time: "1:10 PM", status: "done", type: "Homework" },
  { subject: "Ed. Technology 7", title: "Ed. Tech 7 - Classroom Pods", due: "2026-03-25", time: "1:35 PM", status: "done", type: "Presentations/Classwork" },
  { subject: "Art 7", title: "RENAISSANCE PRESENTATIONS FIRST GROUPS", due: "2026-03-25", time: "2:30 PM", status: "done", type: "Presentation" },
  // --- Past (Thu Mar 26) ---
  { subject: "English 7", title: "Eng 7 hw", due: "2026-03-26", time: "9:00 AM", status: "done", type: "Homework" },
  { subject: "Science 7", title: "Classwork Science 7", due: "2026-03-26", time: "9:25 AM", status: "done", type: "Class work" },
  { subject: "General Music 7", title: "Sub plan", due: "2026-03-26", time: "12:35 PM", status: "done", type: "Class work" },
  // --- Past (Fri Mar 27) ---
  { subject: "History 7", title: "Age of Exploration Summative Assessment", due: "2026-03-27", time: "11:20 AM", status: "done", type: "Summative" },
  { subject: "Art 7", title: "RENAISSANCE PRESENTATIONS SECOND GROUPS", due: "2026-03-27", time: "2:30 PM", status: "done", type: "Presentation" },
  // --- Upcoming (Mon Mar 30) ---
  { subject: "Science 7", title: "HW Science 7", due: "2026-03-30", time: "10:00 AM", status: "pending", type: "Summative" },
  { subject: "History/Geography 7", title: "Upload weeks 11 - 14 work", due: "2026-03-30", time: "12:10 PM", status: "pending", type: "Summative" },
  { subject: "General Music 7", title: "Ukulele Assessment", due: "2026-03-30", time: "12:35 PM", status: "pending", type: "Performance/Assessment" },
];


/* ══════════════════════════════════════════════════════════════
   DATA — STEAM
   Will be populated via Steam API later.
   Edit these fields manually in the meantime.
   ══════════════════════════════════════════════════════════════ */
const STEAM = {
  profile: "MrWhale12",
  totalGames: 49,
  mostPlayed: "Sea of Thieves (2221h)",
  hoursThisWeek: 46,         // Wallpaper Engine 24h + Overwatch 22h past 2 weeks
  lastUpdated: "2026-03-22",
};


/* ══════════════════════════════════════════════════════════════
   DATA — PROJECTS
   Add objects to this array to add project cards.
   Fields: name, url (optional), desc, tags (array of strings)
   ══════════════════════════════════════════════════════════════ */
const PROJECTS = [
  {
    name: "Rupert Web",
    url: "https://rupertweb.com",
    desc: "Personal command center and life dashboard. The page you are currently looking at.",
    tags: ["HTML", "CSS", "JS", "Cloudflare"]
  },
];


/* ══════════════════════════════════════════════════════════════
   DATA — LIFE STATS
   Add objects to this array for custom counters.
   Fields: label, value (string|number), unit (optional string)
   ══════════════════════════════════════════════════════════════ */
const LIFE_STATS = [
  { label: "Games on Steam", value: 49, unit: "games" },
  { label: "Hours in Sea of Thieves", value: 2221, unit: "h" },
  { label: "Projects shipped", value: 1, unit: "live" },
];


/* ═══════════════════════════════════════════════════════════
   RENDER FUNCTIONS — do not edit unless changing structure
   ═══════════════════════════════════════════════════════════ */

/* Helper */
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

const fmtDate = (str) => {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/* Essays */
function renderEssays() {
  const grid = document.getElementById('essays-grid');
  if (!grid) return;
  const sorted = [...ESSAYS].sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach(essay => {
    const tagKey = essay.category.toLowerCase().replace(/\s+/g, '');
    const card = el('div', 'essay-card' + (essay.url ? ' essay-card--linked' : ''));
    card.innerHTML = `
      <div class="essay-card__meta">
        <span class="essay-card__tag tag--${tagKey}">${essay.category}</span>
        <span class="essay-card__date">${fmtDate(essay.date)}</span>
      </div>
      <div class="essay-card__title">${essay.title}</div>
      <div class="essay-card__excerpt">${essay.excerpt}</div>
      ${essay.url ? '<div class="essay-card__read">Read essay &rarr;</div>' : '<div class="essay-card__read essay-card__read--na">Full text not yet archived</div>'}
    `;
    if (essay.url) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => { window.location.href = essay.url; });
    }
    grid.appendChild(card);
  });
}

/* School */
function renderSchool() {
  const list = document.getElementById('school-list');
  if (!list) return;
  const sorted = [...SCHOOL_TASKS].sort((a, b) => {
    if (a.status === b.status) return a.due.localeCompare(b.due);
    return a.status === 'done' ? 1 : -1;
  });
  sorted.forEach(task => {
    const row = el('div', `task-row${task.status === 'done' ? ' done' : ''}`);
    row.innerHTML = `
      <span class="task-subject">${task.subject}</span>
      <span class="task-title">${task.title}</span>
      <span class="task-due">${fmtDate(task.due)}</span>
      <span class="task-status task-status--${task.status}">${task.status}</span>
    `;
    list.appendChild(row);
  });
}

/* Steam */
function renderSteam() {
  const container = document.getElementById('steam-stats');
  if (!container) return;

  const stats = [
    {
      label: "Games Owned",
      value: STEAM.totalGames !== null ? STEAM.totalGames.toLocaleString() : null,
      note: `@${STEAM.profile}`
    },
    {
      label: "Most Played",
      value: STEAM.mostPlayed || null,
      note: "all time"
    },
    {
      label: "Hours This Week",
      value: STEAM.hoursThisWeek !== null ? `${STEAM.hoursThisWeek}h` : null,
      note: "last 7 days"
    },
  ];

  stats.forEach(s => {
    const stat = el('div', 'steam-stat');
    const isPlaceholder = s.value === null;
    stat.innerHTML = `
      <span class="steam-stat__label">${s.label}</span>
      <span class="steam-stat__value${isPlaceholder ? ' placeholder' : ''}">${isPlaceholder ? 'API pending' : s.value}</span>
      <span class="steam-stat__note">${s.note}</span>
    `;
    container.appendChild(stat);
  });
}

/* Projects */
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  PROJECTS.forEach(project => {
    const card = el('div', 'project-card');
    const urlHtml = project.url
      ? `<a class="project-card__url" href="${project.url}" target="_blank" rel="noopener">${project.url.replace(/^https?:\/\//, '')}</a>`
      : '';
    const tagsHtml = (project.tags || []).map(t => `<span class="project-tag">${t}</span>`).join('');
    card.innerHTML = `
      <div class="project-card__name">${project.name}</div>
      ${urlHtml}
      <div class="project-card__desc">${project.desc}</div>
      <div class="project-card__tags">${tagsHtml}</div>
    `;
    grid.appendChild(card);
  });
}

/* Life Stats */
function renderLifeStats() {
  const grid = document.getElementById('life-grid');
  if (!grid) return;
  LIFE_STATS.forEach(stat => {
    const tile = el('div', 'life-stat');
    tile.innerHTML = `
      <span class="life-stat__label">${stat.label}</span>
      <span class="life-stat__value">${stat.value}</span>
      ${stat.unit ? `<span class="life-stat__unit">${stat.unit}</span>` : ''}
    `;
    grid.appendChild(tile);
  });
}

/* Boot */
renderEssays();
renderSchool();
renderSteam();
renderProjects();
renderLifeStats();
