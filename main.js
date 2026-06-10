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
    title: "The Afternoon of 4 August 1914 in Downing Street When Grey's Ultimatum Was Designed to Expire Unanswered and Britain Chose the Balance of Power Over Belgium",
    date: "2026-06-10",
    category: "History",
    excerpt: "On the afternoon of Tuesday, 4 August 1914, at approximately 14:00 London time, Sir Edward Grey signed a telegram to Sir Edward Goschen, the British ambassador in Berlin, instructing him to require from the German Imperial Government, before midnight Berlin time, a 'satisfactory answer' to the British demand that Germany respect the neutrality of Belgium. There was no satisfactory answer. At 23:00 London time, Big Ben having just struck the hour, the British Empire was at war with Germany — by operation of an ultimatum that Grey had drafted in the certain knowledge that no German government, having already crossed into Belgium that morning, could conceivably accept its terms within nine hours. The standard account treats the British entry as a moral response to the violation of Belgian neutrality. It is false in a specific and important sense. The British government had decided, by the evening of 2 August — thirty-six hours before the German army crossed the Belgian frontier — that it would enter the war on the French side regardless of what happened to Belgium. The 1839 Treaty was not the reason for British entry. It was the parliamentary instrument by which Grey converted a decision already taken on balance-of-power grounds into a vote the Liberal Cabinet would actually pass...",
    url: "essays/2026-06-10-the-afternoon-of-4-august-1914-in-downing-street-when-greys-ultimatum-was-designed-to-expire-unanswered-and-britain-chose-the-balance-of-power-over-belgium.html"
  },
  {
    title: "The Evening of 9 November 1989 When Günter Schabowski Misread a Note at a Press Conference and the Berlin Wall Fell by Administrative Accident",
    date: "2026-06-09",
    category: "History",
    excerpt: "On the evening of Thursday, 9 November 1989, at 18:53 Berlin time, the Politburo spokesman Günter Schabowski looked down at a sheet of paper that had been handed to him by Egon Krenz forty minutes earlier and read out, in the flat administrative cadence of a man reading something he had not seen before, the new East German travel regulations. Asked by Riccardo Ehrman of ANSA when the new rules came into force, he hesitated, looked at the paper again, said 'as far as I know — effective immediately, without delay.' The standard account treats the fall of the Wall as the culmination of a popular revolution. There is one in the background. None of it explains the specific fact that the Wall fell on 9 November, at that hour, in that way, rather than three weeks later in a managed process of staged concessions. The Wall fell because a sixty-year-old apparatchik with a head cold, working from a typewritten note he had not been briefed on, used the words 'ab sofort' when the document was meant to come into force the following morning...",
    url: "essays/2026-06-09-the-evening-of-9-november-1989-when-gunter-schabowski-misread-a-note-at-a-press-conference-and-the-berlin-wall-fell-by-administrative-accident.html"
  },
  {
    title: "The Forty-Eight Hours in September 1992 When the Bundesbank Chose the D-Mark Over the ERM and Let Sterling Burn",
    date: "2026-06-08",
    category: "History",
    excerpt: "On the evening of Tuesday, 15 September 1992, an interview given by Helmut Schlesinger, president of the Deutsche Bundesbank, to the Handelsblatt and the Wall Street Journal was on every dealer's screen in the City by 22:00 London time. The standard account of Black Wednesday treats it as the day the markets defeated a government. The phrase 'the market' is doing a great deal of work in that account. The market that broke sterling was perhaps thirty institutions running a combined book of around fifteen billion dollars in short sterling positions; George Soros's was about ten billion by close of trade. Against this stood UK reserves of roughly forty-four billion in liquid form, plus an unused Bundesbank swap line, plus an interest rate weapon Major's Cabinet was prepared to use without limit. The arithmetic favoured the defender. The defender lost because the second central bank in the equation, sitting in Frankfurt, had decided three weeks earlier that the German national interest required it to lose...",
    url: "essays/2026-06-08-the-forty-eight-hours-in-september-1992-when-the-bundesbank-chose-the-d-mark-over-the-erm-and-let-sterling-burn.html"
  },
  {
    title: "The Seventy-Two Hours in August 1961 When the Berlin Wall Went Up and the Kennedy Administration Decided Not to Stop It",
    date: "2026-06-07",
    category: "History",
    excerpt: "On the morning of Sunday, 13 August 1961, at roughly 01:00 Berlin time, East German Volkspolizei and armed factory militias began stringing barbed wire along the twenty-seven-mile boundary between East and West Berlin. The standard account treats the next seventy-two hours as a fait accompli. Khrushchev moved. The West watched. There was nothing to be done. This is wrong. The Wall, on the morning of 13 August, was a string of fence posts and concertina wire that any platoon of American military police could have pushed over with a jeep. Honecker's troops had explicit orders to retreat in the face of Western intervention. Marshal Konev's Soviet contingency orders forbade engagement with American forces. The Wall was put up by people who expected it to be torn down, and who had operational instructions to fold if it was. It was not torn down because the Kennedy administration, between Sunday morning and Wednesday afternoon, decided that the alternative to the Wall was worse than the Wall...",
    url: "essays/2026-06-07-the-seventy-two-hours-in-august-1961-when-the-berlin-wall-went-up-and-the-kennedy-administration-decided-not-to-stop-it.html"
  },
  {
    title: "The Afternoon at Safwan on 3 March 1991 When Schwarzkopf Negotiated a Ceasefire on a Map He Had Not Read and Let the Republican Guard Walk Home",
    date: "2026-06-06",
    category: "History",
    excerpt: "On the afternoon of Sunday, 3 March 1991, in a tent pitched on a captured Iraqi airstrip at Safwan, General Norman Schwarzkopf sat down opposite Lieutenant-General Sultan Hashim Ahmad to dictate the terms of a ceasefire that had already been in force for forty-eight hours. The shooting had stopped at 0800 local on 28 February, by personal order of George H. W. Bush, after exactly one hundred hours of ground combat. Bush had wanted a round number. He had got one. What happened in the tent at Safwan that afternoon was not a negotiation but a transcription, until Sultan Hashim asked a question that was not on Schwarzkopf's list. He asked whether Iraqi military helicopters could fly across the demarcation line. Schwarzkopf, exhausted and without a map of Iraq's internal political geography, said yes. That single concession, granted in roughly ten seconds at the end of a four-hour meeting, kept Saddam Hussein in power for twelve more years...",
    url: "essays/2026-06-06-the-afternoon-at-safwan-on-3-march-1991-when-schwarzkopf-negotiated-a-ceasefire-on-a-map-he-had-not-read.html"
  },
  {
    title: "The Afternoon Aboard the Polar Star at Björkö in July 1905 When the Kaiser Got the Tsar to Sign Away the French Alliance and the Russian Cabinet Quietly Tore It Up",
    date: "2026-06-05",
    category: "History",
    excerpt: "On the afternoon of Monday, 24 July 1905, in the lee of a granite islet in the Gulf of Finland called Björkö, two imperial yachts lay at anchor about a cable's length apart. The Hohenzollern belonged to Wilhelm II of Germany. The Polar Star belonged to Nicholas II of Russia. Between them, on the deck of the Polar Star, in the presence of one witness on each side, the two emperors signed a treaty of mutual defence. It was, in operational meaning, a unilateral repudiation of the Franco-Russian Alliance of 1894, the cornerstone of the European state system. Wilhelm wept when Nicholas signed. By the second week of October the treaty was dead. It had been killed not by France, not by Britain, not by any foreign chancery, but by two Russian ministers who refused to countersign. It is one of the cleanest examples in the modern record of a sovereign signing his name to a document that turned out to be worth nothing because the ministerial apparatus he depended on declined to validate it...",
    url: "essays/2026-06-05-the-afternoon-aboard-the-polar-star-at-bjorko-in-july-1905-when-the-kaiser-got-the-tsar-to-sign-away-the-french-alliance.html"
  },
  {
    title: "The Afternoon at Plombières in July 1858 When Cavour Sold Nice and Savoy to Buy Italy",
    date: "2026-06-04",
    category: "History",
    excerpt: "On the afternoon of Wednesday, 21 July 1858, in the spa town of Plombières-les-Bains in the Vosges, Count Cavour took a four-hour walk with Napoleon III. No advisers, no minute-takers. Cavour wrote up the conversation that evening in a fifteen-page letter to Victor Emmanuel II, marked secrétissime. It is the entire documentary record of what passed between them, and one of the most consequential pieces of paper in nineteenth-century European history, because what those two men agreed to during the walk was the manufacture of a war. The standard account of Italian unification dwells on Garibaldi's red shirts and Mazzini's exhortations. All real, all downstream. The thing that actually unified Italy was a cynical bilateral compact: Piedmont would provoke Austria, France would intervene with two hundred thousand men, and Piedmont would pay in Nice and Savoy...",
    url: "essays/2026-06-04-the-afternoon-at-plombieres-in-july-1858-when-cavour-sold-nice-and-savoy-to-buy-italy.html"
  },
  {
    title: "The Sixty Hours in August 1991 When the Soviet Coup Lost the Television War",
    date: "2026-06-03",
    category: "History",
    excerpt: "On the morning of Monday, 19 August 1991, at 06:00 Moscow time, Radio Moscow announced that Mikhail Gorbachev was unable to perform his duties and that a State Committee for the State of Emergency had assumed his powers. By 09:00 four tank battalions had taken up positions around the Kremlin, the Lubyanka, Ostankino, and — almost as an afterthought — the Russian White House. Sixty hours later the plotters were drunk and weeping, the Interior Minister had shot himself, and Boris Yeltsin was on a balcony in front of 150,000 people. The standard explanation is that the army refused to fire and the plotters were incompetent. Both are true. Neither is the actual mechanism. The actual mechanism was that the GKChP lost the broadcast — Yanayev sweating into a microphone on Vremya, against four minutes of foolscap read off a tank turret and beamed back into the Soviet Union via Radio Liberty within two hours...",
    url: "essays/2026-06-03-the-sixty-hours-in-august-1991-when-the-soviet-coup-lost-the-television-war.html"
  },
  {
    title: "The Three Days in January 1923 When Stanley Baldwin Sold Sterling to Pay America",
    date: "2026-06-02",
    category: "History",
    excerpt: "On the evening of Wednesday, 17 January 1923, the British delegation to the World War Debt Funding Commission arrived in Washington aboard the Majestic. The Chancellor of the Exchequer, Stanley Baldwin, was forty-five years old, six months into the job, and had been given by the Cabinet a written negotiating instruction with a hard floor: no settlement above 2.5 per cent over sixty-two years. Andrew Mellon opened at 4.25 per cent over twenty-five. The figures were not bridgeable. The Cabinet's expectation was that Baldwin would walk out. By Saturday evening Baldwin had signed at 3.3 per cent over sixty-two years, well above his ceiling, cabled London a brief telegram, and sailed home on the Olympic. The Cabinet read the terms at the same time as the public. Bonar Law drafted a resignation letter that night and recorded in his diary that the British Empire would pay for this mistake for two generations. He was wrong about the duration and right about everything else...",
    url: "essays/2026-06-02-the-three-days-in-january-1923-when-stanley-baldwin-sold-sterling-to-pay-america.html"
  },
  {
    title: "The Seven Minutes Over the Strait of Hormuz When the United States Decided It Could Not Apologise: 3 July 1988",
    date: "2026-06-01",
    category: "History",
    excerpt: "At 10:24 local time on Sunday, 3 July 1988, the guided missile cruiser USS Vincennes, on patrol in the central Persian Gulf, fired two SM-2 surface-to-air missiles at Iran Air Flight 655, an Airbus A300 climbing out of Bandar Abbas on a scheduled twenty-eight-minute hop to Dubai. Both missiles hit. The aircraft, which carried 290 people, disintegrated over the Strait of Hormuz. There were no survivors. Sixty-six of the dead were children. The aircraft had been in the air for seven minutes. What happened over the next seventy-two hours is the more interesting story, because it determined how the United States learned to talk about its own mistakes for the next thirty-five years, and produced a doctrine of institutional self-defence that has outlived every president, every Secretary of Defense, and every chairman of the Joint Chiefs of Staff who participated in it...",
    url: "essays/2026-06-01-the-seven-minutes-over-the-strait-of-hormuz-when-the-united-states-decided-it-could-not-apologise.html"
  },
  {
    title: "The Weekend in June 1970 When the Federal Reserve Invented Too Big to Fail and Refused to Admit It",
    date: "2026-05-31",
    category: "Economics",
    excerpt: "On the morning of Sunday, 21 June 1970, the Penn Central Transportation Company filed for bankruptcy in the Eastern District of Pennsylvania. It was, at $6.3 billion in assets, the largest corporate failure in American history up to that point, larger than every previous bankruptcy combined. What the Federal Reserve did over the seventy-two hours preceding that filing was unprecedented in American central banking, was never publicly described as what it was, and quietly became the template for every subsequent crisis intervention through Continental Illinois in 1984, LTCM in 1998, Bear Stearns in 2008, and Silicon Valley Bank in 2023. The Federal Reserve, between Thursday 18 June and Saturday 20 June 1970, decided that the commercial paper market — not Penn Central — was too big to fail, and bailed it out without using the word, without congressional authorisation, and without telling the public what it had done until the relevant minutes were declassified more than a decade later...",
    url: "essays/2026-05-31-the-weekend-in-june-1970-when-the-federal-reserve-invented-too-big-to-fail-and-refused-to-admit-it.html"
  },
  {
    title: "The Three Weeks in May 1958 When de Gaulle Took France Without Firing a Shot",
    date: "2026-05-30",
    category: "History",
    excerpt: "On 13 May 1958, a crowd of European settlers stormed the headquarters of the Government-General in Algiers and set up a Committee of Public Safety chaired by General Jacques Massu. Its first cable to Paris demanded a government of national unity under Charles de Gaulle, who had been in political retirement for almost twelve years. Twenty-two days later the National Assembly voted him full powers as the last Prime Minister of the Fourth Republic. On 28 September the French electorate approved his new constitution by 82.6 per cent. De Gaulle took power in 1958 without leading a single soldier, without issuing a single threat, and without breaking, on paper, a single article of the existing constitution. He took power because, for three weeks in May, he allowed the army in Algiers to believe he was about to lead a coup, allowed the politicians in Paris to believe he was the only man who could stop one, and never confirmed either reading to either audience. It is one of the cleanest examples in twentieth-century European history of a politician winning by saying as little as possible to as many people as possible...",
    url: "essays/2026-05-30-the-three-weeks-in-may-1958-when-de-gaulle-took-france-without-firing-a-shot.html"
  },
  {
    title: "The Eleven Days in November 1923 When Germany Stopped a Hyperinflation With a Lie",
    date: "2026-05-29",
    category: "History",
    excerpt: "On 15 November 1923 the German government began issuing a new currency called the Rentenmark, at an exchange rate of one Rentenmark to one trillion paper marks. Twelve days earlier, a dollar had cost 420 billion paper marks at the Berlin Bourse; by the 14th it cost 2.52 trillion. On the 16th, the day after the new note appeared, the rate of depreciation stopped. Within ten weeks prices in Berlin had stabilised. The hyperinflation, the most extreme monetary disorder in the history of an industrial country, simply ended. The Rentenmark had no proper backing, no gold reserve, no foreign loan, no credible fiscal rebalancing behind it. It was a confidence trick that worked because everybody involved, including the people running it, behaved as if it would not. The mortgages on every farm and factory in Germany were a fiction. There was no mechanism by which a Rentenmark holder could actually go to a farm in Pomerania and claim a slice of it. What made the trick work was one bad-tempered banker in an unheated office refusing to take phone calls from the Finance Ministry...",
    url: "essays/2026-05-29-the-eleven-days-in-november-1923-when-germany-stopped-a-hyperinflation-with-a-lie.html"
  },
  {
    title: "The Imperial Conference of 6 September 1941 That Made Pearl Harbor a Bookkeeping Problem",
    date: "2026-05-28",
    category: "History",
    excerpt: "On the morning of 6 September 1941, in a long room on the second floor of the Imperial Palace in Tokyo, eleven men sat down on either side of a brocaded table in front of the Showa Emperor and approved a document, four paragraphs long, that said Japan would complete preparations for war against the United States, Britain and the Netherlands by the end of October, and that if no acceptable settlement had been reached by approximately 10 October, would immediately decide on war. The Emperor said almost nothing. He read aloud a tanka his grandfather, the Meiji Emperor, had written in 1904 about all the seas being brothers — a hint, transmitted through a wall of court protocol, that he disliked what was being decided in his name. The meeting lasted under two hours. Pearl Harbor was three months and a day away. Japan in 1941 was not a state with a war policy. It was a state with a deadline policy...",
    url: "essays/2026-05-28-the-imperial-conference-of-6-september-1941-that-made-pearl-harbor-a-bookkeeping-problem.html"
  },
  {
    title: "The Three Hours at Fashoda When France Decided Germany Was the Enemy: 18 September 1898",
    date: "2026-05-27",
    category: "History",
    excerpt: "On the morning of 18 September 1898, a small steamer flying the white ensign came up the White Nile and tied to the bank below a half-ruined Egyptian fort at a place called Fashoda, in what is now South Sudan. Out of it stepped Lord Kitchener, Sirdar of the Egyptian Army, sweating in a tarboush and an Egyptian uniform he had put on instead of his British one for diplomatic reasons. Waiting for him on the bank was Captain Jean-Baptiste Marchand of the French Marine Infantry, who had spent the previous fourteen months crossing Africa on foot from the Atlantic with eight French officers, a hundred and twenty Senegalese tirailleurs, and a collapsible steam launch carried in pieces by porters. The two men sat down in the shade of a tamarind tree with a bottle of champagne and over the next three hours decided, between themselves, that there would be no war. Fashoda is the moment France gave up the world and chose Europe...",
    url: "essays/2026-05-27-the-three-hours-at-fashoda-when-france-decided-germany-was-the-enemy.html"
  },
  {
    title: "The Three Days at Sèvres When Britain Stopped Being a Great Power: 22-24 October 1956",
    date: "2026-05-26",
    category: "History",
    excerpt: "On the afternoon of Monday, 22 October 1956, a small French air force aircraft landed at a private airfield outside Paris carrying two passengers travelling under false names. One was Selwyn Lloyd, the British Foreign Secretary. The other was Sir Patrick Dean, a senior official of the Foreign Office. They were driven, in cars with curtains drawn across the windows, to a villa in the suburb of Sèvres, the same town where the Allied powers had imposed the terms of the Ottoman partition in 1920. Waiting for them were the French Prime Minister Guy Mollet, his defence and foreign ministers, and a delegation from Israel led by David Ben-Gurion himself, Moshe Dayan, and Shimon Peres. Over the next seventy-two hours, the three governments agreed in writing to fake a war. Sèvres is the moment Britain ceased to be a great power...",
    url: "essays/2026-05-26-the-three-days-at-sevres-when-britain-stopped-being-a-great-power.html"
  },
  {
    title: "The Week at Locarno When France Signed Its Own Death Warrant: October 1925",
    date: "2026-05-25",
    category: "History",
    excerpt: "In the second week of October 1925, in a lakeside hotel in the Swiss canton of Ticino, the foreign ministers of seven European states initialled a set of treaties that the chancelleries of the continent immediately hailed as the founding document of a new European order. Aristide Briand and Gustav Stresemann embraced for the cameras. Locarno entered the diplomatic vocabulary as a synonym for reconciliation, the way Munich would enter it thirteen years later as a synonym for capitulation, and almost nobody at the time noticed that the two words named the same process at different stages of its completion. Locarno was not the moment Germany rejoined Europe as an equal. It was the moment France formally consented to the proposition that the eastern half of the Versailles settlement could be revised by force, and signed a document saying so...",
    url: "essays/2026-05-25-the-week-at-locarno-when-france-signed-its-own-death-warrant.html"
  },
  {
    title: "The Afternoon at Annual That Killed the Spanish Monarchy: 22 July 1921",
    date: "2026-05-24",
    category: "History",
    excerpt: "On the afternoon of 22 July 1921, in a stony Rif valley about ninety kilometres south of Melilla, a Spanish colonial army of roughly twenty thousand men ceased to exist. By nightfall its commanding general, Manuel Fernández Silvestre, was dead, and a force of perhaps three thousand tribesmen under a former mine clerk named Abd el-Krim was advancing east through the Spanish positions with effectively no opposition. This is the worst defeat any European colonial power suffered in the twentieth century before Dien Bien Phu, and it is the moment that the Spanish constitutional monarchy of Alfonso XIII began to die. The line from Annual to the Spanish Civil War, fifteen years later, is shorter and straighter than almost any other causal chain in interwar European history...",
    url: "essays/2026-05-24-the-afternoon-at-annual-that-killed-the-spanish-monarchy.html"
  },
  {
    title: "The Night at Okęcie Airport When Gomułka Stared Down Khrushchev: 19 October 1956",
    date: "2026-05-23",
    category: "History",
    excerpt: "At about seven in the morning on Friday, 19 October 1956, four Ilyushin-14s landed at Okęcie airport outside Warsaw without permission, without clearance, and without notifying the Polish government. Out of them came Khrushchev, Molotov, Kaganovich and Mikoyan — half the Soviet Politburo — together with eleven Red Army generals in field uniform. Soviet armoured columns from the Northern Group of Forces had begun moving south from Legnica at three that morning, heading for the capital. This is the morning the Eastern Bloc nearly came apart eleven days before Hungary did, and the reason it did not come apart is that a recently rehabilitated Polish communist, who had spent four years in prison under Stalin, refused to get into a car...",
    url: "essays/2026-05-23-the-night-at-okecie-airport-when-gomulka-stared-down-khrushchev.html"
  },
  {
    title: "The Fortnight at Erfurt When Talleyrand Sold Napoleon to the Tsar: September-October 1808",
    date: "2026-05-22",
    category: "History",
    excerpt: "On the evening of 27 September 1808, in a candle-lit room in the Hôtel des Princes at Erfurt, Charles-Maurice de Talleyrand-Périgord, Prince of Benevento and Grand Chamberlain of the French Empire, requested a private audience with Alexander I, Emperor of All the Russias. He had been instructed by Napoleon to assist in tightening the Franco-Russian alliance forged at Tilsit fifteen months earlier. He used the audience to do the precise opposite. With two sentences delivered in private, the most useful French diplomat of his generation went into treason against the man who had made him. This is the moment the First Empire's destruction was set in motion — not Bailén, not the Spanish ulcer, not the Russian winter of 1812, but a fortnight in Erfurt when the choreographer of imperial spectacle decided that France could no longer afford its emperor...",
    url: "essays/2026-05-22-the-fortnight-at-erfurt-when-talleyrand-sold-napoleon-to-the-tsar.html"
  },
  {
    title: "The Morning the Bundesbank Killed Bretton Woods: 5 May 1971",
    date: "2026-05-21",
    category: "Economics",
    excerpt: "On Wednesday morning, 5 May 1971, at approximately 9:35 in Frankfurt, the Bundesbank's foreign exchange desk stopped quoting a price for the United States dollar and walked away from the market. By 10:30, four other European central banks had done the same. By the end of the trading day, the gold-dollar standard that had organised the world economy since Bretton Woods had effectively ceased to function, though it would take Nixon another fifteen weeks to publicly recognise this and close the gold window. The decision was taken in a small back room of the Bundesbank's Frankfurt headquarters by perhaps eight men. There was no announcement. There was no consultation with the IMF or the US Treasury. The Bundesbank simply stopped buying dollars, and a global monetary order ended...",
    url: "essays/2026-05-21-the-morning-the-bundesbank-killed-bretton-woods.html"
  },
  {
    title: "The Mutiny at Kiel: How the German Navy Toppled the Kaiserreich in Seventy-Two Hours, October-November 1918",
    date: "2026-05-20",
    category: "History",
    excerpt: "On the evening of 29 October 1918, in the roadstead of Schillig outside Wilhelmshaven, the stokers and seamen of the German High Seas Fleet refused to weigh anchor. The order had come from Admiral Scheer's headquarters that morning: the fleet was to sortie into the North Sea, engage the Grand Fleet, and — in the words of Operation Order 19, drafted by Admiral Adolf von Trotha — 'die honourably.' Germany was two weeks into an armistice negotiation. The Imperial Navy's senior officers, who had spent four years watching the army fight the war while their dreadnoughts swung at anchor, decided independently that they would not allow the war to end without a final action. The lower deck refused. This is the moment the Kaiserreich ended — not the abdication on 9 November, not the armistice at Compiègne, but the night when twenty thousand sailors decided they would rather face a firing squad than be sacrificed to redeem the honour of an officer corps they despised...",
    url: "essays/2026-05-20-the-mutiny-at-kiel.html"
  },
  {
    title: "The Stranded Army That Decided the Russian Civil War: The Czechoslovak Legion and the Trans-Siberian Railway, 1918",
    date: "2026-05-19",
    category: "History",
    excerpt: "On the afternoon of 14 May 1918, at the railway station in Chelyabinsk, a Hungarian prisoner of war returning home under Brest-Litovsk threw a piece of cast iron out of his train carriage at a Czech soldier on the opposite platform. His comrades lynched the Hungarian on the platform. Within a fortnight, the rest of the Czechoslovak Legion — forty thousand former Habsburg prisoners of war strung out along four thousand miles of the Trans-Siberian Railway — had risen against the Soviet government and effectively detached Siberia from Moscow's control. The Bolsheviks were almost destroyed in the summer of 1918, and the reason was not Denikin, not Kolchak, and not the British landing at Murmansk. The reason was forty thousand Czechs who had been trying to go home and could not...",
    url: "essays/2026-05-19-the-stranded-army-that-decided-the-russian-civil-war.html"
  },
  {
    title: "The Afternoon at Heathrow That Killed British Social Democracy: 28 September 1976",
    date: "2026-05-18",
    category: "History",
    excerpt: "On the afternoon of Tuesday, 28 September 1976, Denis Healey, Chancellor of the Exchequer in James Callaghan's Labour government, was driven from the Treasury to Heathrow airport, intending to board a flight to Hong Kong for the IMF and World Bank annual meetings. He never boarded. By the time he reached the airport, sterling was in free fall, and the duty clerk at the Treasury had Healey's private secretary on the line begging him to come back. Three days later, at the Labour Conference in Blackpool, he told a furious hall that he was applying to the IMF for the largest loan in its history. Tony Benn recorded in his diary that night that he had just witnessed the death of the Labour Party as a socialist project. He was three years out and entirely correct. The 1976 IMF crisis, and not Thatcher's 1979 victory, was the moment British social democracy came to an end...",
    url: "essays/2026-05-18-the-afternoon-at-heathrow-that-killed-british-social-democracy.html"
  },
  {
    title: "The Saturday Morning at the Plaza That Broke Japan: 22 September 1985",
    date: "2026-05-17",
    category: "History",
    excerpt: "On the morning of Saturday, 22 September 1985, the finance ministers and central bank governors of the United States, Japan, West Germany, France, and the United Kingdom arrived at the Plaza Hotel on Fifth Avenue and in under three hours produced a one-page communiqué that announced the dollar was overvalued. The Japanese delegation was led by Finance Minister Noboru Takeshita, who had checked into the Plaza under a false name and let it be reported in Tokyo that he was playing golf at home. By the close of trading on Monday, the yen had risen eight per cent. Within four years the Tokyo stock market and Tokyo property market had inflated into the largest twin bubbles in the history of capitalism. The conventional reading is that the Plaza Accord was a successful piece of multilateral coordination and that what happened to Japan afterwards was the fault of the Bank of Japan. This reading is half right and entirely misleading...",
    url: "essays/2026-05-17-the-saturday-morning-at-the-plaza-that-broke-japan.html"
  },
  {
    title: "The Four Sick Old Men Who Killed the Soviet Union: The Politburo Session of 12 December 1979",
    date: "2026-05-16",
    category: "History",
    excerpt: "On the afternoon of 12 December 1979, four men met in a small room next to Leonid Brezhnev's office on Staraya Square in Moscow. Brezhnev was barely lucid. Andropov was already in kidney failure. Ustinov was seventy-one, Gromyko seventy. Between them they decided to send forty thousand Soviet soldiers across the Amu Darya into Afghanistan. They did not inform the full Politburo. They did not inform the General Staff's operations directorate, whose chief had spent the previous month begging them not to do it. The conventional reading is that this was the high tide of Brezhnev-era expansionism. This reading inverts cause and effect. The Soviet Union did not invade Afghanistan because it was strong. It invaded because the institutions designed to restrain four old men no longer functioned well enough to prevent them...",
    url: "essays/2026-05-16-the-four-sick-old-men-who-killed-the-soviet-union.html"
  },
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
    "title": "S2 Examination Study Guide",
    "due": "",
    "subject": "",
    "status": "upcoming"
  },
  {
    "title": "Semester 2 Exam",
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
    name: "The Praefatio",
    url: "https://thepraefatio.com",
    desc: "Public landing page for the Letters to Builders project. Editorial-style overview of the mission, methodology, targets, and a specimen letter. Variants at /praefatio-italian, /praefatio-forest, /praefatio-linen, /praefatio-black.",
    tags: ["Letters", "Editorial", "Public", "thepraefatio.com"]
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

  // Wheel-scroll: vertical scroll wheel pushes the rail horizontally.
  grid.addEventListener('wheel', (e) => {
    if (e.deltaY === 0) return;
    const max = grid.scrollWidth - grid.clientWidth;
    if (max <= 0) return;
    // Only intercept if we have room to scroll horizontally in that direction.
    const goingRight = e.deltaY > 0;
    if ((goingRight && grid.scrollLeft < max) || (!goingRight && grid.scrollLeft > 0)) {
      e.preventDefault();
      grid.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}

/* ME & RUPERT stats */
const RUPERT_STATS = {
  firstSession: '2026-03-23',
  sessions: 66,
  msgsFromJulian: 2726,
  msgsFromRupert: 11881,
  essaysWritten: 59,
  memoryLines: 1171,
};
function renderStats() {
  const grid = document.getElementById('stats-grid');
  const sub = document.getElementById('stats-sub');
  if (!grid) return;
  const today = new Date();
  const start = new Date(RUPERT_STATS.firstSession + 'T00:00:00');
  const days = Math.max(1, Math.floor((today - start) / 86400000));
  const totalMsgs = RUPERT_STATS.msgsFromJulian + RUPERT_STATS.msgsFromRupert;
  const avgPerDay = Math.round(totalMsgs / days);
  const fmt = (n) => n.toLocaleString('en-GB');
  if (sub) sub.textContent = `Together since ${fmtDate(RUPERT_STATS.firstSession)}`;

  const cards = [
    { value: fmt(days), label: 'Days together', sub: `since ${fmtDate(RUPERT_STATS.firstSession)}` },
    { value: fmt(totalMsgs), label: 'Messages exchanged', sub: `~${fmt(avgPerDay)} per day` },
    { value: fmt(RUPERT_STATS.msgsFromJulian), label: 'From Julian', sub: 'questions, requests, ideas' },
    { value: fmt(RUPERT_STATS.msgsFromRupert), label: 'From Rupert', sub: 'replies, drafts, fixes' },
    { value: fmt(RUPERT_STATS.sessions), label: 'Sessions', sub: 'separate conversation threads' },
    { value: fmt(RUPERT_STATS.essaysWritten), label: 'Essays written', sub: 'history & politics nightly' },
    { value: fmt(RUPERT_STATS.memoryLines), label: 'Lines remembered', sub: 'in MEMORY.md + daily logs' },
  ];
  cards.forEach(c => {
    const card = el('div', 'stat-card');
    card.innerHTML = `
      <div class="stat-card__value">${c.value}</div>
      <div class="stat-card__label">${c.label}</div>
      <div class="stat-card__sub">${c.sub}</div>
    `;
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

/* Media - anything Rupert generates that lives on rupertweb */
async function renderMedia() {
  const body = document.getElementById('media-body');
  const sub = document.getElementById('media-sub');
  if (!body) return;
  try {
    const r = await fetch('/media-index.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('no index');
    const d = await r.json();
    const items = d.items || [];
    if (sub) sub.textContent = items.length + ' item' + (items.length === 1 ? '' : 's');
    if (!items.length) {
      body.innerHTML = `<div style="color:#666;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:0.1em">Nothing here yet.</div>`;
      return;
    }
    // Sort newest first
    const sorted = [...items].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px">${sorted.map(it => renderMediaTile(it)).join('')}</div>`;
  } catch (e) {
    body.innerHTML = `<div style="color:#666;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:0.1em">Nothing here yet.</div>`;
  }
}
function renderMediaTile(it) {
  const kind = (it.kind || 'file').toLowerCase();
  const tags = (it.tags || []).slice(0, 2).map(t => `<span style="color:#666;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase">${t}</span>`).join(' &middot; ');
  let preview = '';
  if (kind === 'image') {
    preview = `<div style="width:100%;aspect-ratio:1/1;background:#0a0a0a url('${it.url}') center/cover;border:1px solid #1a1a1a;border-radius:2px"></div>`;
  } else if (kind === 'page' || kind === 'link') {
    preview = `<div style="width:100%;aspect-ratio:1/1;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:2px;display:flex;align-items:center;justify-content:center;color:#c8f135;font-family:Times,serif;font-size:32px;font-style:italic">${escapeHtml(it.title?.[0] || '?')}</div>`;
  } else {
    preview = `<div style="width:100%;aspect-ratio:1/1;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:2px"></div>`;
  }
  return `<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:block">
    ${preview}
    <div style="margin-top:8px">
      <div style="color:#fff;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.05em;line-height:1.3;margin-bottom:3px">${escapeHtml(it.title || '')}</div>
      <div style="color:#888;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:0.05em">${escapeHtml(it.subtitle || '')}</div>
      ${tags ? `<div style="margin-top:4px">${tags}</div>` : ''}
    </div>
  </a>`;
}
function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* Boot */
renderEssays();
renderStats();
renderSchool();
renderSteam();
renderProjects();
renderLifeStats();
renderSpend();
renderMedia();
