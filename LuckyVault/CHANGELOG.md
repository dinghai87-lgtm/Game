# Changelog
## v1 — 2026-11-15 23:30
- 50 original slots on 4 engines (Tumble+multipliers, Cluster, 20 Lines, 243 Ways), English UI
- RTP tuned to ~96% per engine via 3M-spin simulations
- Server-authoritative Node backend: accounts, spins, free-spin state, coin store (sandbox pay), daily bonus
- Back office: overview, games on/off + badges, players (adjust/suspend), orders (paid/refund/cancel), rounds, coin ledger, settings, audit
- Fixed: cells stayed dimmed after tumble rounds

## v1.1 — 2026-11-15 23:50
- Mobile-adaptive game screen: game title banner on tall phones, board fills the width, 2-row thumb-friendly controls
- Landscape phones: controls move to a right-side column so the board gets the full height
- Board resizes when free spins start/end without misplacing symbols
- No double-tap zoom on buttons

## v1.2 — 2026-11-16 00:05
- Quick stop: tap SPIN (or Space) while reels spin to slam them to a stop and skip win animations
- Gem and jelly lows are now drawn as faceted CSS gems (Star Gems, Gem Mine, Jelly Kingdom) instead of flat emoji squares
- Fixed board slightly overflowing the frame on narrow phones

## v2.0 — 2026-11-16 01:10
- 100 games: +10 Classic 3-reel slots, +10 Hold & Win jackpot slots, +30 table/card/instant games
- New table engine (server-authoritative, shared with demo mode): blackjack (hit/stand/double/split), roulette with animated wheel, baccarat with real third-card rules, dragon tiger, sic bo, craps (point rounds), 6 video poker paytables with hold/draw, three card poker, casino hold'em, caribbean stud, casino war, red dog, money wheel, keno (classic + power), scratch cards
- Lobby redesigned like a casino app: hero banners, category rows (Jackpots, Table games, Video poker, Classic, Instant…), tabs per game family
- Math fixes: bonus buy and new ante bet now return ~96% (simulated 2M spins); free-spin features made stronger and rarer like real tumble slots
- Unfinished table rounds resume after refresh

## v2.1 — 2026-11-16 01:40
- Fixed: pop-ups (store, paytable, messages) were squashed after table games loaded (CSS class clash)
- Ante bet toggle on Tumble and Cluster slots (+25% bet, about 2x free-spin chance, RTP stays ~96%; Buy is disabled while ante is on, like real games)
- Paytables + payline diagrams for Classic 3-reel and Hold & Win games, jackpot values shown in coins
- Video poker paytables set to real "full pay" versions under 100%: Deuces Wild (NSUD 99.7%), Double Bonus 9/7 (99.1%)
- Keno prizes rounded to clean values; Sic Bo single-number labels fixed
- Long game titles shrink to fit on phones; admin can set table min/max stakes

## v2.2 — 2026-11-16 02:05
- Roulette inside bets: tap the line between numbers for a split (17:1), the corner for a corner bet (8:1), the bottom edge for a street (11:1) or six line (5:1). Server validates every bet position.
- Full regression passed: all 70 slots opened and spun in the browser; all 100 games played through the server API; admin endpoints and game on/off checked

## v2.3 — 2026-11-16 02:30
- App-store ready basics: PWA manifest, app icons (192/512/maskable/apple-touch), offline cache for the game client, full-screen standalone mode
- Responsible play: reality-check reminder (default every 60 min, adjustable 15/30/60/120/off) with session time, rounds, coins played/won; ⚙ settings in the lobby
- Admin: filter game rounds by game, CSV export for players, orders, rounds and coin ledger
- Fixed: table rounds logged with 0 stake in admin when the final action was free (e.g. Stand)

## v2.4 — 2026-11-16 00:50 (overnight round 2)
- Autoplay panel like real slots: number of spins, loss limit (required), single-win limit, stop on bonus
- Wins count up in the win bar instead of appearing instantly
- Bet history (⏱) in every slot and table game: last rounds with bet, win and feature notes
- RTP re-check, 2M spins each: Lines 96.6%, 243 Ways 96.7%, Tumble 96.8% (ante 95.2%), Cluster 96.5% (ante 97.9%), Classic 96.0%, Hold & Win 95.4%; ante boost fine-tuned
- Tested desktop + mobile in demo mode and server mode

## v2.5 — 2026-11-16 02:10 (overnight round 3)
- Each machine now has its own scenery: floating theme art in the background, vignette lighting, symbol glow tinted to the theme
- Machine cabinets per type: chrome cabinet with cream reels for Classic 3-reel, gold cabinet for Hold & Win jackpots, glass frame for Tumble/Cluster
- Reels bounce slightly when they land
- Feature intro and big-win screens get rotating light rays; free-spin count pulses; coin shower toned down so the win amount stays readable
- Regression: all 100 games via server API (no errors), autoplay/history UI on desktop + mobile

## v2.6 — 2026-11-16 02:40
- Blackjack: insurance offered when the dealer shows an Ace (pays 2:1, dealer checks for blackjack after you choose); Vegas Strip table adds late surrender (half bet back)
- Edge cases tested and passing: reload in the middle of free spins (demo + server) resumes the feature; reload mid blackjack hand resumes the hand; triple-tap spin charges once; out-of-coins prompt; server restart keeps balances and unfinished rounds
- Payments: double payment of the same order rejected; admin refund removes the coins and drops the order from revenue; admin "mark paid" credits once; coin adjustments require a reason; free bonus can't be claimed twice; negative or over-max bets rejected
- Fixed: in server mode the client didn't remember an active free-spin game until a reload

## v2.7 — 2026-11-16 03:05
- Card tables now look like real casino layouts: felt table with a gold rail and the house rules printed on the felt (e.g. "Blackjack pays 3 to 2 · Insurance pays 2 to 1")
- Table games scale up on desktop: bigger cards, chips, betting spots, dice, roulette board and wheel, scratch tickets
- Result text sized down on phones so it no longer wraps

## v2.8 — 2026-11-16 03:30
- Performance check with 6x CPU slowdown on a phone-sized screen: ~57 fps average during spins, tumbles and Hold & Win
- Server: sessions expire after 30 days of inactivity; extra security headers on pages
- Accessibility: keyboard focus outlines, game tiles open with Enter, screen-reader labels on icon buttons
- Full regression again: 70 slots in the browser, 100 games via server API — no errors

## v2.9 — 2026-11-16 03:45
- start.bat checks that Node.js is installed and opens the browser only after the server is ready (no more "can't connect" page on first launch)
- Clear message if port 8080 is already in use, with how to pick another port

## v2.10 — 2026-11-16 04:00
- Admin overview: 14-day charts for revenue, active players, rounds played and house result (stored as daily totals, so they survive the round-log trimming)

## v2.11 — 2026-11-16 03:10 (loop round A)
- Unit tests for the poker hand evaluators: 42 video-poker hands across all 6 paytables (incl. deuces/joker wilds, ace-low straights, bonus quads) all correct; three card poker hand frequencies match theory
- Phones in landscape: table games no longer cut off at the top (content scrolls), compact cards/board/wheel, keno shows 20 numbers per row, smaller scratch ticket
- Regression: all 30 table games played through again with no errors

## v2.12 — 2026-11-16 03:40 (overnight round 4 — math QA)
- 3M-spin simulation per engine, now also measuring volatility (standard deviation per spin) and how often 100x+ wins land:
  | Engine | RTP | Hit rate | Bonus | SD | 100x+ win |
  |---|---|---|---|---|---|
  | Classic 3-reel | 96.2% | 37% | — | 3.6 | 1 in 42k |
  | 20 Lines | 96.5% | 34% | 1 in 210 | 3.2 | 1 in 16k |
  | 243 Ways | 96.8% | 40% | 1 in 207 | 3.8 | 1 in 7.7k |
  | Cluster | 96.4% (ante 96.6%) | 17% | 1 in 367 | 6.2 | 1 in 1.4k |
  | Tumble | 96.9% (ante ~96.6% over 9M spins) | 28% | 1 in 593 | 8.4 | 1 in 1.5k |
  | Hold & Win | 96.1% | 27% | 1 in 269 | 15.0 | 1 in 4.2k |
- Volatility labels in the paytables now match the measured numbers: Classic Low, 20 Lines Low-Medium, 243 Ways Medium, Cluster Medium-High, Tumble High, Hold & Win Very High
- Ante boost re-tuned for both Tumble and Cluster (both ~96.6%)

## v2.13 — 2026-11-16 03:55 (loop round B)
- Automatic database backups: on every server start and every 6 hours to data/backups (latest 14 kept); restore steps in README
- Anti-bot limit: max 15 game actions per second per player (normal and turbo play is far below this)
- Regression: all 100 games via server API pass with the new limit

## v2.14 — 2026-11-16 04:55 (overnight round 5 — store readiness)
- Age gate on first launch (18+ confirmation, explains coins have no cash value); "Leave" closes the app content
- Monthly spending limit in ⚙ Settings (No limit / $20 / $50 / $100 / $250 / $500). Lowering works immediately; raising or removing takes effect after 24 hours (standard cooling-off). Enforced on the server for real orders and in demo mode
- Admin: date-range filters on Orders and Game rounds (CSV export follows the filter)
- Already in place from earlier rounds: PWA manifest + icons, safe-area padding, landscape layouts, ~57 fps under 6x CPU slowdown, keyboard/screen-reader basics, reality-check reminders

## v2.15 — 2026-11-16 05:35 (loop round C)
- Player levels: every coin played (slots and tables) earns 1 XP; level badge with progress bar in the lobby header; each level-up pays a bonus worth ~3% of the XP needed for that level (plus 50), shown in a "Level N!" pop-up. Server-authoritative and logged in the coin ledger as level_bonus; works in demo mode too
- Level rewards are kept small on purpose (about 4-6% extra return at mid levels) so the store and economy stay balanced

## v2.16 — 2026-11-16 06:20 (overnight round 6 — full regression)
- Full regression: all 70 slots spun on desktop and mobile; bonus bought on all 26 Tumble/Cluster games and every feature paid out its full free spins; all 30 table games played through on mobile — 0 errors, 0 stuck rounds, 0 layout faults
- Tap any symbol on the reels to see what it pays at your current bet (like real slots); wilds, scatters, coins and multipliers explain what they do

## v2.17 — 2026-11-16 06:55 (loop round D)
- Daily login reward with a 7-day streak (500 → 3,000 coins); missing a day restarts at day 1. Pops up once a day after the age gate / login, and is also reachable from the Store. Server-authoritative (one claim per day, logged as daily_reward); works in demo mode

## v2.18 — 2026-11-16 07:45 (overnight round 7 — final QA)
- FIXED: admin "Players" page failed to load (a CSV button was missing since v2.3). Every admin page is now smoke-tested in the regression
- FIXED: refunds now also come off the daily revenue chart
- Admin flow verified end to end: buy → refund (coins removed, revenue reversed) → manual coin adjustment with reason → game switched off (disappears from the lobby) → settings saved → ledger and audit log entries present
- Final simulations (3M spins each): Lines 96.6%, 243 Ways 96.6%, Tumble 96.5% (ante 97.2%, buy 95.6%), Cluster 96.1% (ante 96.3%, buy 94.7%), Classic 96.0%; Hold & Win line pays nudged up, now 96.4% averaged over 6M spins
- Server API regression of all 100 games: no errors

## v2.19 — 2026-11-16 08:10 (final regression before handover)
- All 70 slots spun on desktop and mobile; all 30 table games played through on desktop and mobile; all 100 games via the server API; all 8 admin pages load — 0 errors

## v3.0 — 2026-11-16 09:45 — installable on phones
- New mobile/ folder: Capacitor app project for Android and iOS. build-android.bat builds an installable LuckyVault.apk (sets the app icon, bundles the game, points it at your server or runs offline)
- The game can now talk to a server on another address (config.js), with CORS for the app; tested from a separate origin: login, balance and spins work
- server.js prints the "Phone:" address to open on phones on the same Wi-Fi (iPhone: Safari → Add to Home Screen)

## v4.0 — 2026-11-16
Platform release: everything on the "do all of these" list except the public deploy and store IAP.
- **Database:** new server on SQLite (built in, zero install) with a PostgreSQL option (`DATABASE_URL`). Transactions with row locks, automatic import of the old `db.json`, 6-hourly SQLite backups.
- **Accounts:** email verification (+1,000 coin bonus), forgot/reset password, phone verification by SMS, Sign in with Apple / Google (ID tokens verified against Apple/Google keys), change password, self-service account deletion (App Store requirement). Login with username or email. Passwords now 8+ characters.
- **Legal:** Terms of Service and Privacy Policy pages (`/terms`, `/privacy`), linked from sign-up and Account. Fill in company name/address/email.
- **Engagement:** 3 daily missions, 18 achievements with pop-ups, weekly leaderboards (total won / biggest multiplier, top 10 paid every Monday), admin-run tournaments with automatic payout, notification bell, web push (free coins ready, daily reward, prizes, campaigns), first-run tour, background music (🎵).
- **Art:** drawn SVG covers per engine behind every lobby tile; drop-in pipeline for designer covers, backgrounds, symbols and music (`ART-SPEC.md`).
- **Math:** new volatility variants — 20 Lines · High (x5 free spins, 2,500x top symbol) and 243 Ways · Very High (x8 free spins); 10 games moved onto them. All ~96% over 3M spins. Paytables show the real per-game numbers.
- **Back office:** Analytics (DAU/WAU/MAU, D1/D7/D30 retention, conversion, ARPPU/ARPDAU, per-game play time), Campaigns (message and coin gifts by audience, with push), Tournaments, Risk (multi-account devices/networks, linked accounts per player), System (health, integrations, email/SMS outbox, error log, test alert), store promotions and anti-abuse settings.
- **Monitoring:** `/api/health`, error log in the database, alert webhook on error bursts.
- **Anti-cheat:** per-device welcome-bonus cap, one daily reward per device, per-network daily cap, multi-account flags.
- **Tests:** `test.bat` / `npm test` runs 79 checks (engine maths, all 30 tables, every API) on a throw-away database.
- Fixed: header buttons overflowing on 320–400px phones.

## v4.1 — 2026-11-16 11:45
- Sound: new casino sound set (reel whoosh, stop thuds, bell wins, coin clinks, fanfares, drum-roll anticipation) through a compressor — much louder and fuller.
- Music: casino lounge groove (drums, bass, chords, lead) ON by default, quieter in the lobby. Toggle with 🎵 or Settings → Music.
- Art: jewel-framed high symbols (gold / ruby / sapphire / emerald), metallic A-K-Q-J-10, gold WILD and glowing BONUS plates, deeper reel glass, haloed lobby tiles.
- Motion: vertical motion blur on spinning reels with a crisp snap on landing; winning symbols bounce with a shine sweep and sparkle bursts; glowing animated win lines; chasing marquee lights that flash on wins; coins fly to the balance; big wins escalate BIG → MEGA → EPIC → LEGENDARY with screen shake and a tier meter; idle spin-button glow; lobby tiles shimmer and float, hero banners auto-rotate with dots.

## v4.2 — 2026-11-16 12:30
- 36 new feature slots (game ids 100+, older ids unchanged) on 18 new maths profiles, each simulated to ~96% RTP over 1M+ spins:
  Expanding Wilds, Sticky Wilds (free spins), Walking Wilds (free respins), Multiplier Wilds (x2-x10, multiply together), Wild Reels, Mystery Symbols, Lightning Wilds, Colossal 3x3 symbols, Cash Collect (fisherman-style, retrigger ladder x2/x3/x10), Treasure Pick bonus, Prize Wheel bonus with upgrades, Choose-your-free-spins — on 20 lines and 243 ways.
- Gamble (double-up) after any base-game slot win: red/black x2 or suit x4, fair odds, up to 5 times.
- New lobby tab and row "Bonus Features"; tiles show the feature name; paytable explains each feature.
- Server: /api/gamble; spin accepts a free-spins choice; tests cover every slot incl. features and gamble.

## v4.3 — 2026-11-16 12:55
- First games on purchased CraftPix art (Slot Machine Game Kit): Lucky 777, Triple Sevens and Fruit Burst now use the kit's illustrated symbols, white classic reel strips, checker-pattern backgrounds and new lobby covers.
- Skin system: a game with artwork in assets/games/<slug>/ drops the emoji plates automatically (reel-strip image, background, cover, symbols).
- Footer shows the real game count; logged-out header no longer shows cached coins/level.

## v4.4 — 2026-11-16
- Purchased CraftPix art applied to 29 games (real symbols, backgrounds, lobby covers):
  - Slot kits: Golden Slots (gold frame + logo), Vegas Nights, Blazing Fruits (Classic Sevens kit), Zombieland (new, replaces Ghost Manor; graveyard backdrop, stone reels, logo)
  - Candy pack: Candy Carnival, Jelly Kingdom, Cosmic Candy
  - Gem pack: Star Gems, Gem Mine, Giant Gems, Star Burst, Diamond Strike
  - Pirate loot: Pirate Plunder, Pirate Gold Link, Treasure Island Pick
  - Magic artifacts: Potion Lab, Wizard Tower, Mystic Runes, Wandering Wizard
  - Chests & treasures / match-3 set: Dragon Hoard, Gold Rush, Gold Mine Cash
  - Western backgrounds: Wild Frontier, Wild Rodeo, Thunder Bison
- tools/build_skins.py rebuilds every skin from the kits (procedural themed backgrounds for icon-only packs)
- Service worker cache bumped (lv-v10) so phones pick up the new art

## v5.0 — 2026-11-16 (Heart-of-Vegas-style retention systems, original implementation)
- Lobby dock: COLLECT (free coins every 3 hours, grows with level and VIP tier), DAILY WHEEL, DAILY RUSH (missions), ALBUM, VIP CLUB
- Daily wheel replaces the daily reward panel: 12-segment wheel up to 10,000, multiplied by streak (up to ×1.6), level (up to ×3) and VIP tier
- Shared progressive jackpot (GRAND / MAJOR / MINOR / MINI): 1% of every slot bet feeds the pools, any spin can hit (chance scales with bet), live ticking meters in the lobby and above the reels, jackpot win celebration
- Vault Collection album: 8 sets × 10 cards (1–5 stars) made from the purchased icon packs; cards drop while spinning (more at higher bets) and a 3-card pack on every level-up; set prizes 20K–120K, grand prize 1,000,000 for the full album
- VIP Club: Bronze / Silver / Gold / Platinum / Diamond by lifetime purchases, multiplies free bonuses and the daily wheel
- Level locks: the first 16 slots are open, one more unlocks per level (LV_CONFIG.levelLocks = false turns this off)
- Real recorded chip, card, dice, shuffle and card-pack sounds (Kenney Casino Audio, CC0) in the table games and album

## v5.1 — 2026-11-16 (42 more games restored with purchased art)
- Visible games: 53 → 95. Every new skin uses a real painted background from the purchased CraftPix packs (not procedural)
  - Halloween backgrounds + icons: Pumpkin Night, Monster Party, Vampire Castle, Moon Wolf, Wolf Moon Mystery, Wolf Moon Link
  - Dragon loot: Golden Dragon, Dragon Fortune Link, Dragon Multiplier, Titans Colossal, Fortune God
  - Viking loot: Viking Raid, Viking Gold Link, Thor’s Hammer, Storm Chaser, Buffalo Stampede, Buffalo Wild Reels, Buffalo Thunder Link
  - Egypt backgrounds + jewelry: Pharaoh Gold, Nile Queen, Egypt Riches Link, Sun God Ra, Pharaoh’s Tomb Pick, Aztec Sun, Aztec Treasure Link, Aztec Expanding, Mayan Mystery
  - Ocean backgrounds + underwater objects: Ocean Treasure, Ocean Pearl Link, Ocean Wilds, Shark Hunter, Big Catch Bonanza
  - Jungle backgrounds + fruit icons: Jungle Reels, Monkey Business, Jungle King, Electric Jungle, Wild Cherry Deluxe
  - Sweet backgrounds + sweets: Sweet Bakery, Donut Party, Holiday Gifts, Carnival Spin
  - Animals pack: Happy Farm
  - Winter/fairy-tale backgrounds: Frozen Kingdom, Ice Queen, Frozen Peaks, Zeus Lightning, Lucky Mystery
  - Bamboo/jade: Bamboo Panda, Panda Fortune, Lucky Panda Link, Lucky Clover
  - Classic Sevens symbols: Hot Chilli 7s, Gold Bar 7s, Lucky Clover 7s, Neon Retro 7s, Royal Crown Classic, Liberty Bells
- Each restored game is assigned a matching sound family (horror, golden, magic, western, gems, pirate, candy, casino)
- Service worker cache bumped (lv-v13)

## v5.2 — 2026-11-16 (fixes + baccarat squeeze)
- Baccarat squeeze: the side you bet on is dealt face down and you peel each card yourself (drag up or sideways); OPEN / OPEN ALL buttons; SQUEEZE ON/OFF toggle on the table (Speed Baccarat skips it)
- Autoplay: win count-ups and big-win screens can no longer stall the chain (timer fallbacks), plus a watchdog that resumes autoplay if it ever stops between spins
- Roulette: wheel bowl art re-centred so the pointer sits on the winning pocket; bigger number board; split / corner / street hit areas roughly doubled
- Jackpot meters in games no longer cut off the numbers; lobby tabs wrap onto a second row on desktop instead of hiding under the search box
- Level locks off for testing (config.js levelLocks: false) — every game is open

## v5.3 — 2026-11-16 (animated symbols, space & ocean kits, 16 sound families)
- Win animations: when a symbol is part of a win it plays the kit's frame animation (sprite strip, 6–12 frames)
  - Zombieland (zombies, ghost wild, skull, brain, eye, free-spins), Golden Slots (all 11 symbols), ocean games (mermaids, sharks, fish, jellyfish, crabs, sea urchin), space games (alien ships)
  - Symbols without frames get a light-sweep shine on win
- New games from the Space Adventures kit: Alien Invasion, Space Odyssey, Cosmic Choice, Robot Factory, Robot Walkers
- New: Thunder Temple (sky backgrounds), Fiesta Loca (desert backgrounds)
- Ocean games now use the Underwater World kit creatures; winter games and two Halloween games use the new painted backgrounds
- Sound: 8 new families with their own music and SFX (space, ocean, egypt, asian, winter, jungle, sweet, dragon) → 16 families in total
- 116 visible games

## v5.4 — 2026-11-16 (Pin-Up kit + one-click local start)
- New game: Pin-Up Glam (20 lines) from the Pin-Up Girls Slots kit — all 11 symbols animate on wins, kit stage background
- start.bat: if Node.js 22.13+ is missing it now downloads the portable Node 22 LTS into .\runtime automatically (checksum-verified), then starts the server and opens the browser
- 117 visible games

## v5.5 — 2026-11-16 (security + install location)
- Admin password is no longer admin123 by default: on first start the server generates a random password, prints it in the server window and saves it in data/admin-pass.txt (ADMIN_PASS env still overrides; delete the file to roll a new one)
- Recommended install location moved out of OneDrive (C:\LuckyVault) so the SQLite database is not touched by cloud sync

## v5.6 — 2026-11-16 (autoplay fix, bigger bets, baccarat squeeze + roads, 8 more games)
- Autoplay freeze fixed: frame waits no longer depend on the browser drawing (hidden / covered / slow windows used to stall a round); ambient background effects pause while the reels move; slow devices switch to a low-effects mode automatically; a watchdog finishes a round that is stuck for 15s during autoplay. QA: 93 slots × 12 autoplay spins, 0 stalls, 0 errors
- Bets: max bet 100 → 5,000 (new steps 200 / 500 / 1,000 / 2,000 / 5,000); card drops and jackpot odds still peak at a 100 bet
- Baccarat squeeze: both of your cards side by side; peek at either one as far as you like, let go and it lies back down unopened, switch freely; corner indices stay covered until a card is opened (OPEN under each card, double-tap, or OPEN ALL); the other side's cards and total are shown above while you squeeze
- Baccarat & Dragon Tiger scoreboard: Bead Plate, Big Road (ties, pairs, dragon tail), Big Eye Boy, Small Road, Cockroach Road, shoe counts and "ask road" for Banker / Player; one 72-hand shoe kept per table, NEW SHOE button
- New/restored: Fortune Wheel Deluxe, Neon Nights, Koi Pond (animated fish), Classic Keno, Power Keno, Lucky Cash Scratch, Gold Rush Scratch, Diamond Dazzle Scratch
- Lobby music file restored

## v5.7 — 2026-11-17
- 13 new Las Vegas table games (now 43 tables): Ultimate Texas Hold'em, Let It Ride, Mississippi Stud, Four Card Poker, High Card Flush, Free Bet Blackjack, Spanish 21, Blackjack Switch, EZ Baccarat (Dragon 7 / Panda 8), Triple Play / Ten Play video poker (Jacks, Deuces Wild, Double Bonus)
- Multi-hand video poker: held cards copy to every hand, mini hands show results, total win summary
- Deal button shows the real total (UTH blind, Let It Ride 3 bets, Switch 2 hands)
- Fixed: lobby deep-link crash with sparse game ids; craps test loop cap
- Tests: 85/85 (every one of the 43 table games deals and settles on engine and server)

## v5.8 — 2026-11-17 (overnight)
- Las Vegas style: marquee bulb strip, neon section titles, bulb-framed jackpots, original "Welcome to Lucky Vault" sign hero, Strip skyline above the footer, table-limit placards and printed felt; all motion pauses while spinning / in low-FX mode
- New "Vegas Strip" lobby tab and "The Vegas Strip · new tables" row
- New: Pai Gow Poker (joker, house way, Fortune bonus), Pai Gow Tiles (32 dominoes, house way), Four Card Keno, Vegas Wheel 7s (bonus wheel up to 500x), Triple Fortune Wilds (2x/3x/5x wilds, up to 125x)
- Full QA: every slot autoplay-soaked (97/97 clean), every table played through UI on desktop + mobile
- Fixed: Mississippi Stud fold crashed the server view; Ten Play mobile overflow; Squeeze toggle hidden behind the dealer on mobile; "13 tables" banner text now live
- Tests: random-action fuzz over every table game

## v5.9 — 2026-11-17
- Baccarat squeeze: squeeze cards use the same card art as the table; corner covers match the card stock colour; the other side's cards stay face down until you tap them, one at a time (on the squeeze screen or on the table)
- Baccarat side bets: P/B Dragon Bonus, 小龙 Small Dragon (Player wins with a 2-card 7, 16:1), 大龙 Big Dragon (3-card 7, 33:1), 小老虎 Small Tiger (Banker wins with a 2-card 6, 23:1), 大老虎 Big Tiger (3-card 6, 54:1)
- Blackjack side bets on every blackjack table: Perfect Pairs and 21+3
- New: Lucky Strike Roulette (1–5 struck numbers with 50x–500x multipliers), Rocket Crash (cash out before the rocket flies away, auto cash-out)
- Wide screens: table and felt centred and scaled, control bar centred, baccarat / dragon-tiger roadmap moves to the side; side bets shown as compact spots
- Cartoon dealer removed from the tables
- Kenney CC0 casino sounds: several card / chip / dice variations played at random
- Fixed: Daily Wheel close (X) button only worked on its top half
- v5.9.1: bets show as a real chip stack centred on the betting spot (largest chip at the bottom) with the amount underneath; chip sounds by value — small chips a light click, 25+ add a chip-stack rattle, 100+ add a low thud, 500+ a heavy "bang"
- v5.9.2: baccarat / dragon-tiger allow only one side per round (Player or Banker, Dragon or Tiger); level-up no longer opens a pop-up — a small banner shows the new level and bonus, coins are added automatically; roadmap fits on one screen without scrolling (side panel on wide screens, stacked on phones); squeeze corner covers enlarged so rank and suit are fully hidden; Pai Gow Tiles shows Chinese tile names (天牌、地牌、至尊…) and hand names (双天、天王、天杠…), bigger tiles
- v5.9.2: jackpot meters never jump backwards (only drop when a jackpot is actually won) and climb smoothly; lobby table covers redrawn without the cartoon dealer

## v5.9.3 — 2026-11-17
- Baccarat: every 补牌 (third card, Player's and Banker's) is dealt face down and can be squeezed; OPEN ALL only skips the current squeeze.
- Jackpots are now fixed: MINI 200 · MINOR 1,000 · MAJOR 10,000 · GRAND 100,000. Meters never move; a hit pays exactly the amount shown.
- Baccarat / Dragon Tiger: all bets bilingual (庄/闲/和/对子/龙宝/小龙/大龙/小老虎/大老虎/龙7/熊猫8, 龙/虎/同花和) with a ? rule card on every spot.
- Scoreboard rebuilt like a casino display: 珠盘路 / 大路 / 大眼仔 / 小路 / 曱甴路 on one aligned grid, 庄/闲问路 preview (blinks on every road), % stats,
  special results (小老虎, 大老虎, 小龙, 大龙, 龙7, 熊猫8, 例牌, 同花和) marked on the roads and counted, and a 记录 LOG of every hand (cards, points, tags).
- Wide screens: scoreboard sits beside the table, bigger.
- Sic Bo, Roulette, Blackjack bets bilingual with rule cards; Blackjack side bets need a main bet (clear message).
- Pushes / money back now say RETURN and no longer show the YOU WIN banner; Keno "1 HIT · NO WIN".
- A round still animating no longer writes its result into the next table you open.
- Felt rule print hides when the table content would cover it; empty roulette history box hidden; 咪牌 toggle no longer overlaps on phones.
- Hold & Win games: their coin prizes are labelled "本游戏金币奖 · Link prizes" so they are not confused with the fixed jackpots.

## v5.9.5 — 2026-11-17
- Baccarat / dragon tiger: table and scoreboard stacked on one centre line (table on top, scoreboard directly under it, same centre), sized so both fit the screen; limits placard and 咪牌 toggle sit on the table's top corners; the LOG opens as a panel above the scoreboard.
- Daily wheel never pops up by itself: the DAILY WHEEL button in the lobby dock glows "SPIN!" when it is ready and players open it themselves.

## v5.10 — 2026-11-17
- 版权 Copyright: all games © 2026 万泰游戏开发 (Wantai Game Development) — lobby footer, rules, game info, terms, privacy, admin, source headers, COPYRIGHT.txt.
- Real 8-deck shoe for baccarat & dragon tiger (server-kept per player and table): burn card, cut card 14-19 from the back, new shoe after the cut card;
  the scoreboard is the shoe's own record (server side, follows the account across devices), shows shoe number and cards left.
- 多人百家乐 Shared baccarat rooms (1号桌 / 2号桌): everyone shares one shoe, one hand and one scoreboard; 15 s betting countdown,
  confirm/add bets, online count, players betting, live bet feed and table totals per spot; pushed with Server-Sent Events.
- 规则中心 Rules hub: Chinese + English rules for every table game (table ⓘ button and lobby footer).
- Phones: baccarat side bets fold into "更多边注 More side bets" so the scoreboard is visible; cards fly in from the shoe when dealt.
- Missions: baccarat hands, shared-table hands; achievements: 虎啸龙吟 (win a tiger/dragon side bet), 同桌 (play a shared table).
- Architecture: tables UI split into js/tables/*.js (built into tables-ui.js); tools/ui_smoke.py plays every table on desktop + phone;
  users.bal column (fast totals); Admin → Coin ledger → 对账 Reconcile checks every balance against the ledger + rounds.
- update.bat: drag a new zip onto it — backs up data, stops the server, installs, restarts. COMPLIANCE.md: app-store checklist.

## v5.11 — 2026-11-17
- More shared tables: 多人龙虎 (shared 8-deck shoe + scoreboard), 多人骰宝, 多人轮盘 (recent results strip) — same countdown / confirm-bet flow.
- 多人百家乐 咪牌: the biggest Player/Banker bettor squeezes for the table (20 s); everyone else sees the cards face down and
  "XX 正在咪牌…" until they are opened, then all reveal together.
- 快捷聊天 Quick chat 💬 on every shared table: fixed phrases and emoji (no free text) shown as bubbles.
- 新手任务 New-player journey: 5 first steps (slot spin, baccarat, another table, shared table, level 3) with coin rewards + 2,000 bonus, lobby card with GO buttons.
- 活动 Events: admin Settings → Event: XP multiplier and free-bonus multiplier with start/end; lobby banner while active.
- 好友 Friends: add by name, online status, one free 100-coin gift per friend per day (costs the sender nothing; receiving capped 20/day), collect gifts.
- Alerts: hourly balance reconciliation, ALERT_EMAIL / ALERT_WEBHOOK, Admin → System shows recent alerts.
- Cloud deploy ready: Dockerfile + deploy/ (docker-compose with automatic HTTPS via Caddy, .env.example, README).
- Shared tables: the live status bar (countdown, online, recent results, bet feed, 💬) is a slim strip above the table instead of sitting on the felt.

## v5.12 — 2026-11-17
- 加载提速: lobby uses 300×400 thumbnails loaded only when scrolled into view (phone first load 7.3 MB → 1.3 MB); scripts/pages served gzip-compressed.
- 负责任娱乐: daily play-time limit and take-a-break (1/7/30/90 days), enforced by the server on every bet; raising a limit waits 24 h.
- 后台: several admin accounts with roles (admin / operations / support / viewer), two-factor login (authenticator app), every change audited.
- 客服中心: players open support tickets in the app; staff reply in Admin → Support; players are notified.
- 私人房: open a private shared table (6-letter code) from any shared table or the friends panel; friends join by code.
- 俱乐部: create / join clubs (50 members), weekly club ranking by members' wins.
- 牌局回放: baccarat / dragon tiger hands in the bet history can be replayed card by card (solo and shared tables).
- 多人咪牌: if the squeezer runs out of time everything opens automatically.
- Free CC0 assets added: Kenney Particle Pack → glowing sparkles on wins, sparkle rain + light burst on BIG WIN, glow on winning bet spots;
  OpenGameArt win jingles on table-game wins; success chime on achievements / missions / new-player steps.
- More free CC0 assets: lounge jazz background loop on all table games (OpenGameArt, Emma_MA); Kenney Interface Sounds for dialog open/close and an error blip on "not enough coins" / table-max messages.
- Fonts bundled (SIL Open Font License): Anton for all big titles / win numbers (phones have no Impact, so titles used to fall back to a plain font), Cinzel for the gold table rule text and headings.
- Sonniss GDC 2026 sounds: real casino card-shuffler on new shoes, crowd cheering on every BIG WIN plus fireworks on MEGA / EPIC wins, magic bells on level-up, and a quiet bar-crowd murmur under the lounge music at table games.
- More Sonniss sounds: coin "ting" on bonus collect, confetti burst on every BIG WIN, a happy chime when a game opens, a real card-flip in the deal pool, a scratch/rub sound while squeezing (咪牌) cards, new achievement/mission chime, softer error blip, magical swell on the GRAND jackpot, confirmation chime on "saved / copied / joined" messages.
- 中文 / English / 双语 language switch (Settings → 语言 Language). Defaults to the phone's language. Game names stay in English; all menus, buttons, rules and messages are translated.
- tools/release_check.js (+ release-check.bat): one-click pre-release check — missing scripts/art/sounds, syntax, legal pages, credits, brand names, version, data folder.
- Security: tools/security_probe.py black-box test (20 checks). Fixed: bets must be real numbers; wrong passwords now lock that account for 15 minutes after 10 tries (from any IP); the rate limiter can no longer be reset by flooding it.
- New slot mechanic: 4,096 Ways (6 reels × 4 rows, any-position adjacent wins, free spins ×2) — first game "Dragon Empire 4096" (RTP 95.9% over 1M simulated spins). Slot screens now use each variant's own grid size.
- Weekly events run automatically when no manual event is set: Lucky Monday (1.5× XP), Bonus Wednesday (free bonus ×1.5), Weekend Double XP (Fri 18:00 – Sun). Turn off with setting autoEvents=false.
- Shared tables: bet updates are batched (max 4 per second per room) — tested with 800 players in one room: 1,600 bets, 0 errors, p95 26 ms, ledger 0 mismatched (tools/load_test.js).
- Phones (Samsung Fold etc.): fixed slot flicker — no blur filter on very tall spinning reels on touch screens, shorter reel strips, stopped reels keep their symbols instead of being rebuilt, browser-bar resizes no longer rebuild the reels, sparkle canvas only shown while sparkles play.
- Fixed Dragon Empire 4096: the 6th reel errored while spinning and started empty.
- App Store / Google Play: real in-app purchases — server verifies Apple / Google receipts (lib/iap.js, /api/iap/verify, configured by env), app buys coins with cordova-plugin-purchase and shows store prices; no other payment shown in the app. Release scripts mobile/build-android-release.bat (signed .aab) and mobile/build-ios.sh; HTTPS-only release config; appId com.wantai.luckyvault; deploy/.env.example has PAY_SANDBOX=0 and the store keys; store/上架步骤_STORE_RELEASE.md step-by-step guide.
- Phone top bar fits on 390px screens in English (settings button was cut off); Rewards tabs fit on small phones.
- New test tools: tools/slot_smoke.py (every slot, phone + desktop: 200 runs, 0 problems) and tools/panel_smoke.py (all panels on 5 screen sizes × 2 languages).
- Phones: short vibration on wins and a pattern on BIG WIN (Android / app; Settings → 震动 Vibration to turn off).
- Leaving a table in the middle of a deal animation no longer logs errors. Memory test: 120 game opens/closes, no growth in timers or listeners.
- 中文 mode: table results and error messages are now translated too (龙赢 / 庄家赢 / 平局 / 赢 10.00 / 10 手中赢了 3 手 …). Accessibility labels on the account and friends buttons.
- 中文 mode: all table rules, side-bet tables, keno / scratch / crash texts translated (about 130 more phrases). The translator never re-writes an unchanged text (guards against an endless update loop).
- Maths: "20 Lines · Cash Collect" games were paying ~104% (more than they take in) — retuned to ~96.5% (4M-spin simulation). "Expanding Wilds" ways games trimmed from ~97.2% to ~95.7%. Full test suite incl. RTP: 120/120.
- Lobby search understands Chinese in every language mode (百家乐, 21点, 轮盘, 龙虎, 骰宝, 奖池, 刮刮卡 …).
- New players: the first-time lobby tour no longer pops up on top of a table or slot (it pauses and continues back in the lobby).
- Baccarat / Dragon Tiger on landscape tablets and phones: bets on the left, roadmap on the right, so the whole table fits without scrolling on tablets.
- Test tools: ui_smoke.py supports LV_VIEWS=desktop,phone,tablet-land,phone-land; fixed a false "round did not finish" report on Craps. All tables × 3 screen sizes × 2 rounds: 0 problems.
- Account deletion: typing a wrong password no longer logs the player out (it used to end the session, so the second, correct try failed). Required by Apple's account-deletion rule — now verified end to end.
- 中文 mode: every slot paytable / feature description translated (29 slot types checked).
- Settings → 音量 Volume: separate sound-effect and music sliders (0–100%), saved per device.
- Short landscape screens: popups use compact buttons so the whole settings menu fits; volume panel styled as a card with themed sliders.
- Phone landscape lobby: brand text hidden below 900px so the level bar no longer overlaps it; rewards dock compact on short screens.
- First load: sounds and music now download after the first tap (browsers can't play audio before that) — lobby first load 2.4 MB → 1.05 MB.
- Re-encoded 139 high-bitrate sounds (112k sfx / 128k music): audio 16 MB → 14 MB.
- Phone tap targets: ante button no longer squeezed to 21px, onboarding ✕ / GO and bet −/+ enlarged.
- Table game covers rebuilt with dealers (CraftPix roulette/slot-machine kit dealers added); Big Catch Bonanza and Pirate Gold Link get their own symbol sets (CraftPix RPG sea-theme icons); shop coin packages get money-pack icons (CraftPix gold coins & money UI pack).
- Own symbol sets for Blazing Fruits (painted fruit), Aztec Expanding (stone-age/tribal) and Lucky Clover (fairy garden) from CraftPix 512px packs.
- Panda Fortune gets its own Asian symbol set (CraftPix monk skill icons, rounded gold-rim tiles).
- New: Piggy Bank (dock) — 3% of every bet is saved, break it once a day at 200+ coins (cap 10,000); server-side, ledger type 'piggy'.
- New: Weekly Pass (Rewards panel) — 1 point per 10 coins bet, 10 tiers (300→6,000 coins), resets Monday; server-side, ledger type 'pass'.
- High-limit bets now unlock with level (500@L3, 1,000@L5, 2,000@L8, 5,000@L10), enforced server-side; locked + button shows 🔒.
- New: lobby big-win ticker (wins ≥2,000 and ≥20× bet, names masked, tap to open the game).
- New: welcome-back gift — away 3+ days → 2,000 coins (+500/day, max 5,000), once a week; server-side, ledger type 'comeback'.
- Theme music: 15 slot families now use real composed loops (Abstraction/Tallbeard Music Loop Bundle, CC0), loudness-normalised.
- Lobby hero banners use real art (WILD badge + chips, blackjack dealer + cards, royal flush fan) instead of emoji; LOG IN no longer wraps on phones.
- Rewards panel fully translated to Chinese (achievements, missions, counters).
