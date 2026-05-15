/* ═══════════════════════════════════════════════════════════
   RUPERT WEB - main.js
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
   DATA - ESSAYS
   Add objects to this array to add essay cards.
   Fields: title, date (YYYY-MM-DD), category, excerpt
   Categories: 'History' | 'Geopolitics' | 'Philosophy' | 'Politics'
   ══════════════════════════════════════════════════════════════ */
const ESSAYS = [
  {
    title: "The Night Two Junior Officers Conquered Manchuria and Killed Japanese Democracy",
    date: "2026-05-15",
    category: "History",
    excerpt: "On the evening of 18 September 1931, a small charge of dynamite exploded on the South Manchuria Railway line just outside Mukden. The damage was negligible. By morning the Kwantung Army had occupied Mukden, killed several hundred Chinese soldiers in their barracks, and begun a campaign that within five months had seized a territory larger than France, Germany, and Italy combined. The Japanese cabinet learned about it from the newspapers. The conventional reading is that Mukden was the opening shot of Japanese militarism. This reading mistakes the consequence for the cause. Japan in September 1931 was a parliamentary democracy. What Mukden did was to establish a constitutional principle that destroyed the civilian state from within: that field officers, acting without orders, could initiate foreign wars, and that Tokyo would ratify their decisions retroactively rather than punish them...",
    url: "essays/2026-05-15-the-night-two-junior-officers-conquered-manchuria-and-killed-japanese-democracy.html"
  },
  {
    title: "The Forgery That Killed the First Labour Government: The Zinoviev Letter",
    date: "2026-05-14",
    category: "History",
    excerpt: "On 25 October 1924, four days before a British general election, the Daily Mail led with a banner that read: CIVIL WAR PLOT BY SOCIALISTS' MASTERS. Below it was a letter purportedly written by Grigory Zinoviev, head of the Communist International, to the British communists, instructing them on how to use Ramsay MacDonald's Labour government to advance world revolution. It was a complete fabrication. Four days later Labour lost ninety seats. The conventional reading is that a foolish electorate threw out a competent government on the strength of a letter that turned out to be fake. This reading is wrong in almost every detail. What the letter actually did was teach the British state that it could destroy a Labour government from inside its own intelligence apparatus, and teach Labour that the British state would, given the chance, do exactly that...",
    url: "essays/2026-05-14-the-forgery-that-killed-the-first-labour-government.html"
  },
  {
    title: "The 55 Days That Killed the Italian Left: Aldo Moro and the Historic Compromise",
    date: "2026-05-13",
    category: "History",
    excerpt: "On the morning of 16 March 1978, a unit of the Red Brigades ambushed Aldo Moro's convoy in Rome, killed his five-man escort in under ninety seconds, and took him alive. Fifty-five days later he was shot eleven times in the boot of a red Renault 4, parked with deliberate symbolism halfway between the Christian Democrat and Communist Party headquarters. The conventional reading is that a small Marxist terror cell derailed Italy's evolution toward a left-Catholic governing coalition. This reading is correct in mechanism and wrong in agency. The Red Brigades pulled the trigger. They did not decide that Moro should die. That decision was made by the Italian state — in full knowledge that refusal to negotiate meant his execution, because Moro himself, in eighty-six smuggled letters, said so explicitly...",
    url: "essays/2026-05-13-the-55-days-that-killed-the-italian-left.html"
  },
  {
    title: "The Night Mao's Revolution Ate Itself: Lin Biao and the Trident at Öndörkhaan",
    date: "2026-05-12",
    category: "History",
    excerpt: "At 02:30 on 13 September 1971, a British-built Hawker Siddeley Trident bearing Chinese air force markings crashed in a grassland near Öndörkhaan in eastern Mongolia. One of the burned bodies was Lin Biao — Marshal of the People's Republic, Vice Chairman of the Communist Party, the man Mao had personally inscribed as his successor in the Party constitution two years earlier. The official Chinese explanation was that Lin attempted a coup, failed, and fled toward the Soviet Union until his plane ran out of fuel. This explanation is almost certainly false in its details and entirely true in its meaning, and the gap between the two is where the Cultural Revolution dies...",
    url: "essays/2026-05-12-the-night-maos-revolution-ate-itself.html"
  },
  {
    title: "The Ambiguity That Made the Modern Middle East: McMahon, Hussein, and the Districts of Damascus",
    date: "2026-05-11",
    category: "History",
    excerpt: "The grievance is canonical. In 1915 and 1916, the British High Commissioner in Cairo, Sir Henry McMahon, exchanged ten letters with the Sharif of Mecca, Hussein bin Ali, promising an independent Arab kingdom in exchange for a revolt against the Ottomans. The Arabs revolted. The British then carved up the promised territory with the French at Sykes-Picot. The Arabs were betrayed. This story is true in outline and badly wrong in detail. The McMahon-Hussein correspondence was not a betrayed promise. It was a deliberately ambiguous document that both sides read against each other, and the ambiguity was Hussein's invention as much as McMahon's...",
    url: "essays/2026-05-11-the-ambiguity-that-made-the-modern-middle-east.html"
  },
  {
    title: "The Bank That Killed the World Economy: Why Creditanstalt, Not Wall Street, Caused the Great Depression",
    date: "2026-05-10",
    category: "History",
    excerpt: "The single most durable lie in twentieth-century economic history is that the Great Depression began with the Wall Street Crash of October 1929. It did not. By April 1930 the Dow had clawed back nearly half its losses and American industrial production was still above mid-1928. What turned a sharp American recession into a ten-year global depression that destroyed three empires and produced Hitler was a run on a single Austrian bank in May 1931, and more specifically the French government's deliberate decision to let that bank fail in order to extract a political concession from Vienna over a customs union the Hague was about to strike down anyway. The Great Depression was not caused. It was chosen...",
    url: "essays/2026-05-10-the-bank-that-killed-the-world-economy.html"
  },
  {
    title: "The Last Man Who Could Have Saved the Tsar: Why Stolypin Was Killed by the Okhrana",
    date: "2026-05-09",
    category: "History",
    excerpt: "On the evening of 1 September 1911, in the Kiev Opera House during a gala performance attended by Nicholas II, a 24-year-old anarchist named Dmitry Bogrov shot Pyotr Stolypin twice at point-blank range. The standard line is that Bogrov was a lone fanatic who slipped through inadequate security. The truth is that Bogrov was a paid informant of the Kiev Okhrana, that he was inside the Opera House because the Okhrana had given him the ticket, and that the man Tsar Nicholas was about to dismiss anyway died in a way the regime declined to investigate. A diagnosis, not a tragedy...",
    url: "essays/2026-05-09-the-last-man-who-could-have-saved-the-tsar.html"
  },
  {
    title: "The Run on the Pound That Ended the British Empire: Eisenhower, Suez, and the Five Days in November 1956",
    date: "2026-05-08",
    category: "History",
    excerpt: "The conventional account of the Suez Crisis is that Britain, France, and Israel colluded to seize the canal in November 1956, that the United States and the Soviet Union both opposed them, and that the resulting humiliation marked the end of Britain as a great power. This is true in the way that saying 'the Titanic hit an iceberg' is true. It identifies the proximate cause and ignores the mechanism. The mechanism was a deliberate, surgical run on sterling engineered by the Eisenhower administration over five days in early November 1956 — the most precise use of financial coercion by one ally against another in the twentieth century, and the moment at which the United States demonstrated that the dollar was now the only currency that mattered...",
    url: "essays/2026-05-08-the-run-on-the-pound-that-ended-the-british-empire.html"
  },
  {
    title: "The Weekend That Made Partition Inevitable: Jinnah's Direct Action Day",
    date: "2026-05-07",
    category: "History",
    excerpt: "On 16 August 1946 Jinnah called for a general strike across British India. By the morning of 17 August Calcutta was on fire. Four days later perhaps 10,000 people were dead in a single city, the corpses so thick that the British garrison commander ordered army trucks to dump them in the Hooghly because the burning ghats and graveyards could not keep pace. The standard textbook version is that this was a tragic communal explosion that convinced a war-exhausted Britain to leave India in a hurry. The standard version misses the point. Direct Action Day was not a riot that got out of hand. It was a demonstration by a constitutional politician who had run out of constitutional moves, and the thing being demonstrated was that Jinnah could produce as many corpses as he needed...",
    url: "essays/2026-05-07-the-weekend-that-made-partition-inevitable-jinnahs-direct-action-day.html"
  },
  {
    title: "The Peasant Who Made Catherine the Great a Tyrant: Pugachev and the Invention of Modern Russian Serfdom",
    date: "2026-05-06",
    category: "History",
    excerpt: "In September 1773 a semi-literate Cossack deserter declared himself the murdered Tsar Peter III and within ten months commanded an army of a hundred thousand peasants, Cossacks, Old Believers, and frontier tribes. He took Kazan. He massacred the nobility of half a dozen provinces. The standard story is that Catherine crushed the rebellion and resumed her enlightened reforms. The standard story is wrong. What actually happened in the decade after Pugachev is that Catherine the Great, the most prolific reader of the French Enlightenment ever to wear a crown, doubled the percentage of Russians held in legal servitude and built the system of bondage that would not be dismantled until 1861...",
    url: "essays/2026-05-06-the-peasant-who-made-catherine-the-great-a-tyrant-pugachev-and-the-invention-of-modern-russian-serfdom.html"
  },
  {
    title: "The Bond Vigilantes of 1994: How a Bunch of Traders Mugged Bill Clinton",
    date: "2026-05-05",
    category: "Economics",
    excerpt: "In February 1994 the US economy was, by every conventional measure, in good shape. Inflation was 2.7 percent. GDP had just printed 7.5 percent annualised. Then Greenspan raised rates by twenty-five basis points, and the bond market lost its mind. $1.5 trillion in global bond value evaporated. Orange County went bankrupt. Mexico blew up. Kidder Peabody collapsed. The Great Bond Massacre of 1994 was not a story about inflation - it was a story about who actually runs economic policy in a country financed by capital markets, and the answer turned out not to be the elected government...",
    url: "essays/2026-05-05-the-bond-vigilantes-of-1994-how-a-bunch-of-traders-mugged-bill-clinton.html"
  },
  {
    title: "The Bluff at Portsmouth: How Sergei Witte Won a Peace Russia Had Already Lost",
    date: "2026-05-04",
    category: "History",
    excerpt: "By the summer of 1905 the Russian Empire had no business being at the negotiating table on equal terms. Its Pacific fleet had been sunk, its Baltic fleet annihilated at Tsushima in forty minutes, its army driven out of Mukden, and St Petersburg was in open revolution. Yet Russia walked out of Portsmouth having conceded almost nothing she had not already lost in fact, and Japan walked out with riots in Tokyo. The man responsible was Sergei Witte, sent to New Hampshire because nobody else wanted the job. What he did there was the most successful diplomatic bluff of the twentieth century - and the mechanics tell you something durable about how peace settlements actually work...",
    url: "essays/2026-05-04-the-bluff-at-portsmouth-how-sergei-witte-won-a-peace-russia-had-already-lost.html"
  },
  {
    title: "The Afternoon That Ended the German Hyperinflation: How a Fictional Currency Saved the Weimar Republic",
    date: "2026-05-03",
    category: "Economics",
    excerpt: "The German hyperinflation of 1923 is usually told as a parable about fiat currency, central bank discipline, and the need for hard money. This is the wrong lesson. The hyperinflation ended on the afternoon of 15 November 1923, when Hjalmar Schacht introduced a currency backed by nothing, redeemable for nothing, whose collateral was an imaginary mortgage on land the issuing entity did not own. It worked instantly. The Rentenmark was a confidence trick - and the lesson is not about monetary mechanics but about class war waged through the printing press, and what it actually takes to end one...",
    url: "essays/2026-05-03-the-afternoon-that-ended-the-german-hyperinflation.html"
  },
  {
    title: "The Coup That Almost Wasn't: Why Operation Ajax Failed Before It Succeeded",
    date: "2026-05-02",
    category: "History",
    excerpt: "The standard story of the 1953 Iranian coup is a story of American omnipotence - a clean CIA operation, the founding myth of covert action. Almost none of it is correct. The coup that actually happened in August 1953 was not Operation Ajax. The real plan failed completely on the night of 15 August: the conspiracy had been penetrated, Colonel Nassiri was arrested delivering the firman, the Shah fled to Rome, and Washington cabled Kermit Roosevelt to abort. He didn't. What followed was a salvage job by one officer who disobeyed his recall order, $1 million in unmarked notes, and a hired mob from the south Tehran bazaars...",
    url: "essays/2026-05-02-the-coup-that-almost-wasnt-why-operation-ajax-failed-before-it-succeeded.html"
  },
  {
    title: "The Bribe That Bought Three Centuries: Sekigahara and the Defection of Kobayakawa Hideaki",
    date: "2026-05-01",
    category: "History",
    excerpt: "On the morning of 21 October 1600, in a fog-bound mountain pass in central Japan, around 160,000 men were arranged for battle in what every commander believed would decide the future of the country. By mid-afternoon it had, but not in the way the larger army expected. The Battle of Sekigahara is taught as the founding event of the Tokugawa Shogunate - the regime that would rule Japan for the next 268 years. What it actually was, on the day, was a coin flip resolved by a single defection. The defector was nineteen years old, had been bribed for months, and at the critical hour sat on a hill called Matsuo and refused to move until Ieyasu's arquebusiers shot at his own position to remind him of the deal...",
    url: "essays/2026-05-01-the-bribe-that-bought-three-centuries-sekigahara-and-the-defection-of-kobayakawa-hideaki.html"
  },
  {
    title: "The Two Weeks in 1923 That Killed the League of Nations",
    date: "2026-04-30",
    category: "History",
    excerpt: "On 27 August 1923, an Italian general named Enrico Tellini and four members of his staff were ambushed and murdered on the Greek side of the Greek-Albanian border. Mussolini, ten months into office and looking for exactly this kind of opportunity, gave Athens a 24-hour ultimatum and bombarded Corfu when they refused. This episode is filed somewhere between the Ruhr Crisis and the Locarno Treaties as post-war detritus. It deserves to be filed as the moment the League of Nations died, twelve years before everyone agrees it died, and as the prototype for every subsequent piece of fascist foreign policy that would eventually destroy the European order...",
    url: "essays/2026-04-30-the-two-weeks-in-1923-that-killed-the-league-of-nations.html"
  },
  {
    title: "The Cossack Who Built Modern Russia By Failing",
    date: "2026-04-29",
    category: "History",
    excerpt: "In September 1773, a semi-literate Don Cossack named Yemelyan Pugachev declared himself to be the assassinated Tsar Peter III, miraculously alive, and called on the peasants of the Urals and the Volga to rise. Within nine months he commanded an army of perhaps a hundred thousand. By January 1775 he had been hauled back to the capital in an iron cage. The Pugachev rebellion is the moment Russia's ruling class decided, irrevocably, that the empire could not be reformed from above without being destroyed from below - and built the institutions of nineteenth-century autocracy specifically to ensure that 1773 would never happen again...",
    url: "essays/2026-04-29-the-cossack-who-built-modern-russia-by-failing.html"
  },
  {
    title: "The Sunday Mass Assassination That Made the Medici Untouchable",
    date: "2026-04-28",
    category: "History",
    excerpt: "On Sunday, 26 April 1478, during High Mass at the Cathedral of Santa Maria del Fiore in Florence, two priests pulled daggers from beneath their robes and attacked Lorenzo de' Medici at the moment of the elevation of the Host. Giuliano died on the cathedral floor with nineteen wounds. Lorenzo, slashed across the neck, vaulted the altar rail and survived. This is usually told as a thriller. It is also one of the cleanest examples in European history of how a botched assassination entrenches the regime it was meant to destroy...",
    url: "essays/2026-04-28-the-sunday-mass-assassination-that-made-the-medici-untouchable.html"
  },
  {
    title: "The Two Men Thrown Out a Window Who Killed a Third of Germany",
    date: "2026-04-27",
    category: "History",
    excerpt: "On 23 May 1618, a group of Bohemian Protestant nobles entered Prague Castle, seized two Catholic regents named Slavata and Martinitz along with their secretary Fabricius, dragged them across a council chamber, and threw all three out of a third-storey window. They survived. The Catholics later said angels caught them. The Protestants said they landed in a dung heap. What is not in dispute is that this minor act of political theatre set off a war that lasted thirty years and killed a third of Germany...",
    url: "essays/2026-04-27-the-two-men-thrown-out-a-window-who-killed-a-third-of-germany.html"
  },
  {
    title: "The War That Killed a Country: Paraguay, 1864-1870",
    date: "2026-04-26",
    category: "History",
    excerpt: "Between 1864 and 1870, the Republic of Paraguay fought a war against Brazil, Argentina, and Uruguay simultaneously, and lost. The losing was not the unusual part. The unusual part is what the loss looked like. By the time the Paraguayan dictator Francisco Solano López was speared to death on a riverbank at Cerro Corá in March 1870, somewhere between half and two-thirds of the country's pre-war population was dead. Most credible modern estimates put the male population loss at around ninety percent. Not ninety percent of soldiers. Ninety percent of men...",
    url: "essays/2026-04-26-the-war-that-killed-a-country-paraguay-1864-1870.html"
  },
  {
    title: "The Yam: How the Mongols Invented the State by Accident",
    date: "2026-04-25",
    category: "History",
    excerpt: "The standard story of the modern state is a European one - medieval kings, Italian city-states, Westphalia, the Napoleonic prefecture. The state, we are told, is something Europe slowly and painfully figured out between 1300 and 1800. This is wrong. The infrastructure that makes a modern state possible - the ability of a centre to receive accurate information from a periphery faster than the periphery can rebel - was invented in 1234 by a Mongol named Ögedei, on the steppe, for reasons that had nothing to do with governance...",
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
    excerpt: "On 9 May 1873, a Friday, the Vienna Stock Exchange opened at its usual hour and by noon had stopped functioning. Within four months, the panic had crossed the Atlantic, taken down Jay Cooke & Company, and forced the NYSE to shut its doors for the first time in its history. The economic crisis that followed lasted until 1896. People at the time called it the Great Depression - they stopped only after 1929 gave them a worse one to name...",
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
    excerpt: "In 1545, an indigenous llama herder named Diego Huallpa slipped on a mountainside in what is now Bolivia, grabbed a shrub to steady himself, and pulled up roots coated in raw silver. The mountain was Cerro Rico - the Rich Hill - and within a decade it had become the most valuable piece of real estate on Earth...",
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
    excerpt: "In 1377, a North African scholar named Ibn Khaldun sat in a remote fortress in what is now Algeria and wrote what he called a mere introduction to a larger history. That introduction - the Muqaddimah - turned out to be one of the most extraordinary w...",
    url: "essays/2026-04-18-the-forgotten-theorist-who-understood-power-better-than-anyo.html"
  },
  {
    title: "The Line That Wasn't: Sykes-Picot and the Convenient Myth of the Artificial Border",
    date: "2026-04-17",
    category: "History",
    excerpt: "Ask almost anyone why the Middle East is unstable and you will hear the same answer delivered with great confidence: the Sykes-Picot Agreement. In 1916, the story goes, two imperial bureaucrats - a British diplomat named Mark Sykes and a French one n...",
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
    excerpt: "Around 1200 BCE, something extraordinary happened. In the space of roughly fifty years - less than a human lifetime - virtually every major civilization in the Eastern Mediterranean ceased to exist. The Hittite Empire, which had battled Egypt to a st...",
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
    excerpt: "The Cartographers of Conquest: How the Berlin Conference Invented Modern International Law - and Why That Should Disturb You...",
    url: "essays/2026-04-13-this-is-usually-taught-as-a-story-about-imperialism-it-shoul.html"
  },
  {
    title: "The Venetian Republic and the Art of Institutional Survival",
    date: "2026-04-12",
    category: "History",
    excerpt: "For a thousand years - from the late seventh century to 1797 - the Republic of Venice governed itself without a revolution, without a successful coup, and without a single monarch. That alone should make it one of the most studied political entities ...",
    url: "essays/2026-04-12-the-venetian-republic-and-the-art-of-institutional-survival.html"
  },
  {
    title: "The Thousand-Year Republic: How Venice Made Tyranny Structurally Impossible",
    date: "2026-04-11",
    category: "History",
    excerpt: "The Venetian Republic lasted from 697 to 1797 - 1,100 years without a successful internal revolution, without a coup, without a strongman seizing permanent power. For comparison, the Roman Republic endured about five centuries before Caesar crossed t...",
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
    excerpt: "Everyone learns about Versailles. It is the cautionary tale of modern diplomatic history - the vindictive peace that humiliated Germany, wrecked the Weimar Republic, and handed Hitler his grievances pre-packaged. The lesson taught in classrooms is mo...",
    url: "essays/2026-04-07-the-peace-that-worked-what-the-congress-of-vienna-gets-right.html"
  },
  {
    title: "The Westphalian Myth: How a Peace Treaty Became the World's Most Useful Fiction",
    date: "2026-04-06",
    category: "History",
    excerpt: "In 1648, two treaties signed in the German cities of Osnabrück and Münster ended thirty years of catastrophic religious warfare in Europe. Hundreds of thousands were dead. The Holy Roman Empire - that peculiar, multi-layered constitutional structure ...",
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
    excerpt: "In 1804, Haiti became the first nation born of a successful slave revolt. The enslaved population of Saint-Domingue - France's most profitable colony, producing roughly 40 percent of Europe's sugar and more than half its coffee - had fought for thirt...",
    url: "essays/2026-04-04-the-ransom-of-freedom-haitis-independence-debt-and-the-archi.html"
  },
  {
    title: "Haiti, 1804: The Revolution the Enlightenment Could Not Afford",
    date: "2026-04-03",
    category: "History",
    excerpt: "The French Revolution is taught as the opening chapter of the modern world. Liberty, equality, fraternity - the universalist creed that would eventually expand across the globe. What is almost never taught in the same breath is what happened when a g...",
    url: "essays/2026-04-03-haiti-1804-the-revolution-the-enlightenment-could-not-afford.html"
  },
  {
    title: "Asabiyyah: The Forgotten Theory That Explains Why Empires Die",
    date: "2026-04-02",
    category: "History",
    excerpt: "Ibn Khaldun (1332-1406) was a North African jurist, historian, and diplomat who wrote the Muqaddimah - an introduction to his universal history that turned out to be one of the most original works of social philosophy ever produced. He was writing in...",
    url: "essays/2026-04-02-asabiyyah-the-forgotten-theory-that-explains-why-empires-die.html"
  },
  {
    title: "The Myth of the Westphalian Order: Why the \"Rules-Based International System\" Never Actually Existed",
    date: "2026-04-01",
    category: "History",
    excerpt: "The phrase \"rules-based international order\" gets invoked constantly - by Western diplomats, think-tank scholars, editorial boards. It is used to describe something worth defending, a structure of norms and institutions that constrains state behaviou...",
    url: "essays/2026-04-01-the-myth-of-the-westphalian-order-why-the-rules-based-intern.html"
  },
  {
    title: "The Ideology That Wasn't: Realpolitik and the Molotov-Ribbentrop Pact",
    date: "2026-03-31",
    category: "History",
    excerpt: "In August 1939, the two most ideologically opposed regimes in modern history signed a non-aggression pact. Nazi Germany and the Soviet Union - one built on racial supremacism and violent anti-communism, the other on proletarian internationalism and v...",
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
    excerpt: "The French Revolution is taught as the great rupture of modernity - Liberty, Equality, Fraternity proclaimed from the barricades of Paris. Less discussed is what happened when the enslaved people of Saint-Domingue took those words seriously....",
    url: "essays/2026-03-28-the-revolution-france-wanted-to-forget-haiti-1804-and-the-li.html"
  },
  {
    title: "The Iron Law of the Ruling Class: Pareto, Mosca, and Why Democracies Don't Rule Themselves",
    date: "2026-03-27",
    category: "History",
    excerpt: "Every few years, somewhere in the Western world, a politician rises on a wave of anti-establishment fury. They promise to give power back to the people. They win. And within a term or two, they are the establishment - governing much as their predeces...",
    url: "essays/2026-03-27-the-iron-law-of-the-ruling-class-pareto-mosca-and-why-democr.html"
  },
  {
    title: "The Lights Go Out: The Bronze Age Collapse and What It Teaches About Systemic Fragility",
    date: "2026-03-26",
    category: "History",
    excerpt: "Around 1200 BC, within the span of roughly fifty years, almost every major civilization in the Eastern Mediterranean ceased to exist. The Hittite Empire - which had fought Egypt to a standstill at Kadesh and negotiated the oldest known peace treaty i...",
    url: "essays/2026-03-26-the-lights-go-out-the-bronze-age-collapse-and-what-it-teache.html"
  },
  {
    title: "The Ransom of Haiti: How a Nation Paid for Its Own Freedom",
    date: "2026-03-25",
    category: "History",
    excerpt: "In 1825, the most successful slave revolution in history was extorted. Haiti - the first Black republic, born from the blood of men and women who had burned the plantations of Saint-Domingue and defeated Napoleon's best generals - agreed to pay Franc...",
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
    excerpt: "In 416 BC Athens massacred the island of Melos and delivered the most honest speech in diplomatic history. The strong do what they can, the weak suffer what they must. Every UN resolution since is a response to this - and none have been adequate.",
    url: "essays/2026-03-23-melian-dialogue.html"
  },
  {
    title: "The Man Who Understood Civilizations Before Anyone Else",
    date: "2026-03-22",
    category: "History",
    excerpt: "Ibn Khaldun sat in a desert fortress in 14th-century Algeria and wrote the introduction to a history of the world. That introduction turned out to be more important than anything written in the five centuries since. Western intellectual tradition has largely ignored him. This is a mistake.",
    url: null  // full text not recovered - available from next run onwards
  },
];


/* ══════════════════════════════════════════════════════════════
   DATA - SCHOOL (ManageBac)
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
    "title": "Eng 7: Read Part 4",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Classwork Science 7",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Cover Work_Exampreparation_May26",
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
    "title": "HW Science 7",
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
    "title": "2nd Semester Exams 2026_Listening",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "2nd Semester Exams 2026_Speaking",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "2nd Semester Exams 2026_Speaking (Teil II)",
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
   DATA - STEAM
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
   DATA - PROJECTS
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
    name: "Scribe",
    url: "https://rupertweb.com/scribe.html",
    desc: "Private workspace for the Letters to Builders project. Two 14-year-olds writing deeply researched letters to founders, investors and operators. Targets, question architecture, letter template, idea bin.",
    tags: ["Letters", "Interviews", "Research", "Book"]
  },
  {
    name: "Rupert Web",
    url: "https://rupertweb.com",
    desc: "Personal command center and life dashboard. The page you are currently looking at.",
    tags: ["HTML", "CSS", "JS", "Cloudflare"]
  },
];


/* ══════════════════════════════════════════════════════════════
   DATA - LIFE STATS
   Add objects to this array for custom counters.
   Fields: label, value (string|number), unit (optional string)
   ══════════════════════════════════════════════════════════════ */
const LIFE_STATS = [
  { label: "Games on Steam", value: 49, unit: "games" },
  { label: "Hours in Sea of Thieves", value: 2221, unit: "h" },
  { label: "Projects shipped", value: 4, unit: "live" },
];


/* ═══════════════════════════════════════════════════════════
   RENDER FUNCTIONS - do not edit unless changing structure
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

/* Spend */
async function renderSpend() {
  const body = document.getElementById('spend-body');
  const sub = document.getElementById('spend-sub');
  if (!body) return;
  try {
    const r = await fetch('/api/spend');
    if (!r.ok) throw new Error('api ' + r.status);
    const d = await r.json();
    const usd2 = n => '$' + (n || 0).toFixed(2);
    const usd4 = n => '$' + (n || 0).toFixed(4);
    const fmtCost = n => (n || 0) >= 1 ? usd2(n) : usd4(n);

    const today = d.today || {};
    const todayCost = today.total || 0;
    const monthCost = d.monthTotal || 0;
    const weekCost = d.weekTotal || 0;
    const subsMonthly = d.subsMonthly || 0;
    const totalMonthAll = monthCost + subsMonthly;

    // Friendly labels for purpose keys: "anthropic:telegram" -> "Claude / Telegram chat"
    const purposeLabel = (key) => {
      const [kind, purpose] = key.split(':');
      const k = {
        anthropic: 'Claude',
        openai: 'GPT-4o',
        elevenlabs: 'ElevenLabs TTS',
        serpapi: 'SerpAPI',
        brave: 'Brave Search',
        resend: 'Resend',
        fixed: 'Other',
      }[kind] || kind;
      const p = {
        scribe:     'Scribe research',
        telegram:   'Telegram chat',
        essay:      'Nightly essay',
        heartbeat:  'Heartbeats',
        cron:       'Cron jobs',
        digest_signup: 'Digest signups',
        price_alert_signup: 'Price alert signups',
        fleet_signup: 'FleetWatch signups',
        misc:       'Misc',
      }[purpose] || purpose;
      return `${k} / ${p}`;
    };

    // Per-purpose rows for the month
    const purposeRows = Object.entries(d.monthByPurpose || {})
      .filter(([k, v]) => (v.cost || 0) > 0 || (v.count || 0) > 0)
      .sort((a, b) => (b[1].cost || 0) - (a[1].cost || 0))
      .map(([k, v]) => {
        const tokensInfo = v.tokens > 0 ? `<span style="color:#444;margin-left:6px">· ${v.tokens.toLocaleString()} tok</span>` : '';
        return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;font-family:'Space Mono',monospace;font-size:12px;color:#aaa;border-bottom:1px solid #1a1a1a">
          <span>${purposeLabel(k)}<span style="color:#555;margin-left:8px">x${v.count}</span>${tokensInfo}</span>
          <span style="color:#c8f135">${fmtCost(v.cost)}</span>
        </div>`;
      }).join('') || '<div style="color:#666;font-family:Space Mono,monospace;font-size:12px;padding:6px 0">No usage yet.</div>';

    // Subscriptions list
    const subsRows = (d.subscriptions || [])
      .map(s => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-family:'Space Mono',monospace;font-size:12px;color:#aaa;border-bottom:1px solid #1a1a1a">
        <span>${s.name}${s.note ? `<span style="color:#555;margin-left:8px">${s.note}</span>` : ''}</span>
        <span style="color:#fff">${(s.usdMonth||0) > 0 ? usd2(s.usdMonth) + '/mo' : 'free'}</span>
      </div>`).join('');

    // Sparkline of daily totals (last 14 days)
    const last14 = (d.days || []).slice(-14);
    const max = Math.max(0.0001, ...last14.map(x => x.total || 0));
    const bars = last14.map(x => {
      const h = Math.max(2, Math.round((x.total || 0) / max * 28));
      const col = (x.total || 0) > 0 ? '#c8f135' : '#1a1a1a';
      return `<div title="${x.day}: ${usd4(x.total || 0)}" style="flex:1;height:${h}px;background:${col};opacity:${(x.total||0)>0?1:0.3};border-radius:1px"></div>`;
    }).join('');

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">
        <div><div style="color:#888;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-family:'Space Mono',monospace">Today</div><div style="color:#c8f135;font-size:20px;font-weight:700;font-family:'Space Mono',monospace;margin-top:2px">${fmtCost(todayCost)}</div></div>
        <div><div style="color:#888;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-family:'Space Mono',monospace">7-day</div><div style="color:#fff;font-size:20px;font-weight:700;font-family:'Space Mono',monospace;margin-top:2px">${fmtCost(weekCost)}</div></div>
        <div><div style="color:#888;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-family:'Space Mono',monospace">API 30-day</div><div style="color:#fff;font-size:20px;font-weight:700;font-family:'Space Mono',monospace;margin-top:2px">${fmtCost(monthCost)}</div></div>
        <div><div style="color:#888;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-family:'Space Mono',monospace">Total /mo</div><div style="color:#fff;font-size:20px;font-weight:700;font-family:'Space Mono',monospace;margin-top:2px">${usd2(totalMonthAll)}</div></div>
      </div>
      <div style="display:flex;gap:2px;align-items:flex-end;height:32px;margin-bottom:18px;background:#0a0a0a;padding:2px;border-radius:2px">${bars}</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>
          <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#888;font-family:'Space Mono',monospace;margin-bottom:8px">Variable · last 30 days</div>
          ${purposeRows}
        </div>
        <div>
          <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#888;font-family:'Space Mono',monospace;margin-bottom:8px">Subscriptions · ${usd2(subsMonthly)}/mo</div>
          ${subsRows}
        </div>
      </div>
      <div style="margin-top:12px;font-size:10px;color:#444;font-family:'Space Mono',monospace;letter-spacing:0.05em">Estimates from per-token / per-call pricing. Verify on each provider dashboard for billing.</div>
    `;
    if (sub) sub.textContent = `${usd2(totalMonthAll)} /mo all-in · ${fmtCost(monthCost)} variable`;
  } catch (e) {
    body.innerHTML = `<div style="color:#666;font-family:'Space Mono',monospace;font-size:12px">Spend tracking unavailable.</div>`;
  }
}

/* Boot */
renderEssays();
renderSchool();
renderSteam();
renderProjects();
renderLifeStats();
renderSpend();
