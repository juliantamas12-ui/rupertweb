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
    title: "The Yam: How the Mongols Invented the State by Accident",
    date: "2026-04-25",
    category: "History",
    excerpt: "The standard story of the modern state is a European one — medieval kings, Italian city-states, Westphalia, the Napoleonic prefecture. The state, we are told, is something Europe slowly and painfully figured out between 1300 and 1800. This is wrong. The infrastructure that makes a modern state possible — the ability of a centre to receive accurate information from a periphery faster than the periphery can rebel — was invented in 1234 by a Mongol named Ögedei, on the steppe, for reasons that had nothing to do with governance...",
    url: "essays/2026-04-25-the-yam-how-the-mongols-invented-the-state-by-accident.html"
  },
  {
    title: "The Line Two Men Drew in 1494 That Still Runs Through South America",
    date: "2026-04-24",
    category: "History",
    excerpt: "On 7 June 1494, in a small Castilian town called Tordesillas, representatives of the Spanish and Portuguese crowns signed a treaty dividing the entire non-European world between their two kingdoms. Columbus had returned from his first voyage sixteen months earlier. No European had yet set foot on the South American mainland. The two negotiators were drawing a boundary through territories whose shape, size, and inhabitants they could not even guess at. And the boundary stuck...",
    url: "essays/2026-04-24-the-line-two-men-drew-in-1494-that-still-runs-through-south-ame.html"
  },
  {
    title: "The Long Depression: How a Viennese Bank Failure in 1873 Broke the World for Twenty-Three Years",
    date: "2026-04-23",
    category: "Economics",
    excerpt: "On 9 May 1873, a Friday, the Vienna Stock Exchange opened at its usual hour and by noon had stopped functioning. Within four months, the panic had crossed the Atlantic, taken down Jay Cooke & Company, and forced the NYSE to shut its doors for the first time in its history. The economic crisis that followed lasted until 1896. People at the time called it the Great Depression — they stopped only after 1929 gave them a worse one to name...",
    url: "essays/2026-04-23-the-long-depression-how-a-viennese-bank-failure-in-1873-broke.html"
  },
  {
    title: "The Man Who Invented Containment and Spent Forty Years Watching It Go Wrong",
    date: "2026-04-22",
    category: "History",
    excerpt: "On 22 February 1946, a middle-ranking American diplomat in Moscow sat down at a typewriter with a bad sinus infection and, over the course of two feverish days, produced what is still probably the most consequential cable in the history of American foreign policy. Its author, George Kennan, had been asked to explain why the Soviets refused to join the IMF. He gave them a diagnosis of an entire civilization instead...",
    url: "essays/2026-04-22-the-man-who-invented-containment-and-spent-forty-years-watching-.html"
  },
  {
    title: "The Silver That Killed an Empire: Potosí, the Ming, and the First Global Crisis",
    date: "2026-04-21",
    category: "History",
    excerpt: "In 1545, an indigenous llama herder named Diego Huallpa slipped on a mountainside in what is now Bolivia, grabbed a shrub to steady himself, and pulled up roots coated in raw silver. The mountain was Cerro Rico — the Rich Hill — and within a decade it had become the most valuable piece of real estate on Earth...",
    url: "essays/2026-04-21-the-silver-that-killed-an-empire-potosi-the-ming-and-the-firs.html"
  },
  {
    title: "The Man Who Made Authoritarianism Respectable: Carl Schmitt and the Permanent Emergency",
    date: "2026-04-20",
    category: "History",
    excerpt: "In 1922, a German legal theorist named Carl Schmitt wrote a single sentence that has haunted democratic theory ever since: \"Sovereign is he who decides on the exception.\" It is the most consequential sentence in twentieth-century political philosophy...",
    url: "essays/2026-04-20-the-man-who-made-authoritarianism-respectable-carl-schmitt-a.html"
  },
  {
    title: "The Forgotten Theorist Who Understood Power Better Than Anyone",
    date: "2026-04-18",
    category: "History",
    excerpt: "In 1377, a North African scholar named Ibn Khaldun sat in a remote fortress in what is now Algeria and wrote what he called a mere introduction to a larger history. That introduction — the Muqaddimah — turned out to be one of the most extraordinary w...",
    url: "essays/2026-04-18-the-forgotten-theorist-who-understood-power-better-than-anyo.html"
  },
  {
    title: "The Line That Wasn't: Sykes-Picot and the Convenient Myth of the Artificial Border",
    date: "2026-04-17",
    category: "History",
    excerpt: "Ask almost anyone why the Middle East is unstable and you will hear the same answer delivered with great confidence: the Sykes-Picot Agreement. In 1916, the story goes, two imperial bureaucrats — a British diplomat named Mark Sykes and a French one n...",
    url: "essays/2026-04-17-the-line-that-wasnt-sykes-picot-and-the-convenient-myth-of-t.html"
  },
  {
    title: "The Affair That Broke France and Invented Zionism",
    date: "2026-04-16",
    category: "History",
    excerpt: "In the autumn of 1894, a French army captain named Alfred Dreyfus was arrested for treason. He had allegedly passed military secrets to the German embassy in Paris. The evidence was a torn-up note found in a wastepaper basket by a cleaning woman work...",
    url: "essays/2026-04-16-the-affair-that-broke-france-and-invented-zionism.html"
  },
  {
    title: "The Year the World Ended: The Bronze Age Collapse and the Fragility of Complex Systems",
    date: "2026-04-15",
    category: "History",
    excerpt: "Around 1200 BCE, something extraordinary happened. In the space of roughly fifty years — less than a human lifetime — virtually every major civilization in the Eastern Mediterranean ceased to exist. The Hittite Empire, which had battled Egypt to a st...",
    url: "essays/2026-04-15-the-year-the-world-ended-the-bronze-age-collapse-and-the-fra.html"
  },
  {
    title: "The Revolution the World Tried to Strangle",
    date: "2026-04-14",
    category: "History",
    excerpt: "In 1804, a new nation declared independence in the Western Hemisphere. It had defeated the armies of three European empires, survived a decade of warfare that killed roughly half its population, and produced in the process some of the most extraordin...",
    url: "essays/2026-04-14-the-revolution-the-world-tried-to-strangle.html"
  },
  {
    title: "This is usually taught as a story about imperialism. It should also be taught as a story about law.",
    date: "2026-04-13",
    category: "History",
    excerpt: "The Cartographers of Conquest: How the Berlin Conference Invented Modern International Law — and Why That Should Disturb You...",
    url: "essays/2026-04-13-this-is-usually-taught-as-a-story-about-imperialism-it-shoul.html"
  },
  {
    title: "The Venetian Republic and the Art of Institutional Survival",
    date: "2026-04-12",
    category: "History",
    excerpt: "For a thousand years — from the late seventh century to 1797 — the Republic of Venice governed itself without a revolution, without a successful coup, and without a single monarch. That alone should make it one of the most studied political entities ...",
    url: "essays/2026-04-12-the-venetian-republic-and-the-art-of-institutional-survival.html"
  },
  {
    title: "The Thousand-Year Republic: How Venice Made Tyranny Structurally Impossible",
    date: "2026-04-11",
    category: "History",
    excerpt: "The Venetian Republic lasted from 697 to 1797 — 1,100 years without a successful internal revolution, without a coup, without a strongman seizing permanent power. For comparison, the Roman Republic endured about five centuries before Caesar crossed t...",
    url: "essays/2026-04-11-the-thousand-year-republic-how-venice-made-tyranny-structura.html"
  },
  {
    title: "The Invisible Revolution: Preference Falsification and Why Regimes Die Suddenly",
    date: "2026-04-10",
    category: "Geopolitics",
    excerpt: "On December 21, 1989, Nicolae Ceausescu stepped onto a balcony in Bucharest to address a crowd of roughly 100,000 people. He had done this dozens of times. The crowd was bused in, organized, vetted. And then someone booed. A ripple passed through the...",
    url: "essays/2026-04-10-the-invisible-revolution-preference-falsification-and-why-re.html"
  },
  {
    title: "The Catastrophe by Design: De-Baathification and the Unmaking of Iraq",
    date: "2026-04-09",
    category: "History",
    excerpt: "On May 16, 2003, L. Paul Bremer III, the newly appointed head of the Coalition Provisional Authority in Baghdad, signed Order Number 1. It dissolved the Baath Party and barred its members from government employment. Four days later, Order Number 2 di...",
    url: "essays/2026-04-09-the-catastrophe-by-design-de-baathification-and-the-unmaking.html"
  },
  {
    title: "The Sovereign Debt Trap: How the IMF Became the World's Most Effective Colonial Tool",
    date: "2026-04-08",
    category: "History",
    excerpt: "When historians of the twenty-second century look back at the late twentieth and early twenty-first centuries, they will not marvel at the atom bomb or the internet. They will marvel at how a relatively small institution in Washington, D.C., managed ...",
    url: "essays/2026-04-08-the-sovereign-debt-trap-how-the-imf-became-the-worlds-most-e.html"
  },
  {
    title: "The Peace That Worked: What the Congress of Vienna Gets Right That Versailles Got Wrong",
    date: "2026-04-07",
    category: "History",
    excerpt: "Everyone learns about Versailles. It is the cautionary tale of modern diplomatic history — the vindictive peace that humiliated Germany, wrecked the Weimar Republic, and handed Hitler his grievances pre-packaged. The lesson taught in classrooms is mo...",
    url: "essays/2026-04-07-the-peace-that-worked-what-the-congress-of-vienna-gets-right.html"
  },
  {
    title: "The Westphalian Myth: How a Peace Treaty Became the World's Most Useful Fiction",
    date: "2026-04-06",
    category: "History",
    excerpt: "In 1648, two treaties signed in the German cities of Osnabrück and Münster ended thirty years of catastrophic religious warfare in Europe. Hundreds of thousands were dead. The Holy Roman Empire — that peculiar, multi-layered constitutional structure ...",
    url: "essays/2026-04-06-the-westphalian-myth-how-a-peace-treaty-became-the-worlds-mo.html"
  },
  {
    title: "The Myth of the Rational Voter and Why Democracy Keeps Failing Itself",
    date: "2026-04-05",
    category: "History",
    excerpt: "In 1957, Anthony Downs published \"An Economic Theory of Democracy\" and introduced a concept that has aged better than most political science: rational ignorance. The argument is elegant and brutal. Becoming informed enough to vote well requires time,...",
    url: "essays/2026-04-05-the-myth-of-the-rational-voter-and-why-democracy-keeps-faili.html"
  },
  {
    title: "The Ransom of Freedom: Haiti's Independence Debt and the Architecture of Permanent Underdevelopment",
    date: "2026-04-04",
    category: "History",
    excerpt: "In 1804, Haiti became the first nation born of a successful slave revolt. The enslaved population of Saint-Domingue — France's most profitable colony, producing roughly 40 percent of Europe's sugar and more than half its coffee — had fought for thirt...",
    url: "essays/2026-04-04-the-ransom-of-freedom-haitis-independence-debt-and-the-archi.html"
  },
  {
    title: "Haiti, 1804: The Revolution the Enlightenment Could Not Afford",
    date: "2026-04-03",
    category: "History",
    excerpt: "The French Revolution is taught as the opening chapter of the modern world. Liberty, equality, fraternity — the universalist creed that would eventually expand across the globe. What is almost never taught in the same breath is what happened when a g...",
    url: "essays/2026-04-03-haiti-1804-the-revolution-the-enlightenment-could-not-afford.html"
  },
  {
    title: "Asabiyyah: The Forgotten Theory That Explains Why Empires Die",
    date: "2026-04-02",
    category: "History",
    excerpt: "Ibn Khaldun (1332-1406) was a North African jurist, historian, and diplomat who wrote the Muqaddimah — an introduction to his universal history that turned out to be one of the most original works of social philosophy ever produced. He was writing in...",
    url: "essays/2026-04-02-asabiyyah-the-forgotten-theory-that-explains-why-empires-die.html"
  },
  {
    title: "The Myth of the Westphalian Order: Why the \"Rules-Based International System\" Never Actually Existed",
    date: "2026-04-01",
    category: "History",
    excerpt: "The phrase \"rules-based international order\" gets invoked constantly — by Western diplomats, think-tank scholars, editorial boards. It is used to describe something worth defending, a structure of norms and institutions that constrains state behaviou...",
    url: "essays/2026-04-01-the-myth-of-the-westphalian-order-why-the-rules-based-intern.html"
  },
  {
    title: "The Ideology That Wasn't: Realpolitik and the Molotov-Ribbentrop Pact",
    date: "2026-03-31",
    category: "History",
    excerpt: "In August 1939, the two most ideologically opposed regimes in modern history signed a non-aggression pact. Nazi Germany and the Soviet Union — one built on racial supremacism and violent anti-communism, the other on proletarian internationalism and v...",
    url: "essays/2026-03-31-the-ideology-that-wasnt-realpolitik-and-the-molotov-ribbentr.html"
  },
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
  {
    "title": "Marymount International School, Rome",
    "due": "",
    "subject": "Classes\n\nC\n\n\n\n\n\n\n\nAdvisory SL (7) 2\n\n\n\n\n\nArt (7) 4\n\n\n\n\n\nLatin Int. I (8) 1\n\n\n\n\n\nEng (7) 1\n\n\n\n\n\nIt Interm2 (8) 3\n\n\n\n\n\nMath 8 (8) 4\n\n\n\n\n\nMath 7 (7) 1\n\n\n\n\n\nGerman Int. I (7) 2\n\n\n\n\n\nSport and Resilience (7) 1\n\n\n\n\n\nRel Ed 7 (7) 1\n\n\n\n\n\nScience (7) 4\n\n\n\n\n\nHistory/Geography (7) 2\n\n\n\n\n\nEd. Technology (7) 4\n\n\n\n\n\nGeneral Music (7) 1\n\n\n\nBrowse All Classes",
    "status": "upcoming"
  },
  {
    "title": "Math 8: Volume of Cones and Pyramids",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Math 7 (HW)",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "HW Science 7",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Upload weeks 19 - 22 work",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Submit Coursework",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "HW: Questions on Vesuvius",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Vocabulary Quiz §10",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Math 8: Unit 6 Test",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Math 7 (Formative)",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Ed. Tech 7 - Spreadsheets Unit Test",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Math 7 (Summative)",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Test Science 7",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "SEMESTER 2 SCIENCE EXAM",
    "due": "",
    "subject": "",
    "status": "upcoming"
  }
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
    name: "QuestLog",
    url: "https://rupertweb.com/questlog.html",
    desc: "Gaming command center. Steam library, deals across 20+ stores, free games, price history, FPS estimator, spend analytics, friend comparisons. Free tier + Pro upgrade.",
    tags: ["Cloudflare Workers", "Steam API", "CheapShark", "Resend"]
  },
  {
    name: "FleetWatch",
    url: "https://rupertweb.com/yachts-pro.html",
    desc: "Real-time tracker for 11 superyachts. AIS position polling, port arrival alerts, photo galleries, live fleet activity panel. Signup with tiered plans.",
    tags: ["Cron", "SerpAPI", "VesselFinder", "Telegram"]
  },
  {
    name: "Juan Pelotes University",
    url: "https://rupertweb.com/jpu.html",
    desc: "Full brand and website for a fictional coastal research university on Isabela Island, Galapagos. Academic design, leadership bios, Drug Inspection department lore.",
    tags: ["HTML", "CSS", "Schema.org", "SEO"]
  },
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
  { label: "Projects shipped", value: 4, unit: "live" },
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
