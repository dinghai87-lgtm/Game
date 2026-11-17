# Lucky Vault — 100-game social casino

© 2026 万泰游戏开发 (Wantai Game Development). 版权所有 All rights reserved. See COPYRIGHT.txt.

**更新 Update:** 把新的 `LuckyVault-vX.zip` 拖到 `update.bat` 上 — 自动备份 `data`、停服、覆盖程序、重启。Drag the new zip onto `update.bat`.
**上架 App stores:** see `COMPLIANCE.md`.

Free-to-play social casino: 70 slots + 30 table games, virtual coins only (no cash value,
no withdrawals), for adults 18+. Server-authoritative, works in any browser, installs to a
phone home screen (PWA) and builds into an Android/iOS app (see `mobile/README.md`).

## Quick start (Windows)
1. Install **Node.js 22.13 or newer** (the current LTS) from nodejs.org.
2. Double-click `start.bat` (or run `node server.js`).
3. Players: http://localhost:8080 · Admin: http://localhost:8080/admin (user `admin`; the password is generated on first start, printed in the server window and saved in `data/admin-pass.txt`)
4. Phones on the same Wi-Fi: open the `Phone:` address the server prints.

Double-click `test.bat` (or `npm test`) to run the full automatic test suite: maths of every
slot engine, every table game, and every player/admin API on a throw-away database.

## Configuration (environment variables)
| Variable | What it does |
|---|---|
| `PORT` | Port (default 8080) |
| `ADMIN_USER`, `ADMIN_PASS` | Back-office login. **Change `ADMIN_PASS` before going live.** |
| `DATABASE_URL` | Use PostgreSQL instead of the built-in SQLite file, e.g. `postgres://user:pass@host:5432/luckyvault`. Run `npm install` once (installs `pg`). Tables are created automatically. |
| `SQLITE_FILE` | Where the SQLite database lives (default `data/luckyvault.db`) |
| `MAIL_PROVIDER` (`resend` or `sendgrid`), `MAIL_API_KEY`, `MAIL_FROM` | Sends verification and password-reset emails. Without them, codes are printed in the console and shown in Admin → System. |
| `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM` | Sends phone verification SMS |
| `GOOGLE_CLIENT_ID` | Shows "Continue with Google" (OAuth web client ID from Google Cloud) |
| `APPLE_CLIENT_ID`, `APPLE_REDIRECT_URI` | Shows "Continue with Apple" (Services ID from developer.apple.com) |
| `ALERT_WEBHOOK` | Slack/Discord/Teams incoming-webhook URL for alerts (server start, error bursts) |
| `ALLOWED_ORIGINS` | Extra web origins allowed to call the API (comma-separated) |
| `TRUST_PROXY=1` | Use `X-Forwarded-For` for client IPs when behind a load balancer |
| `PAY_SANDBOX=0` | Start with sandbox payments off |

Windows example: `set ADMIN_PASS=MyStrongPass && set MAIL_PROVIDER=resend && set MAIL_API_KEY=re_xxx && set MAIL_FROM=no-reply@yourdomain.com && node server.js`

## What's inside
- `public/` – the game client (index.html), back office (admin.html), shared engines in `js/`,
  `legal/` (Terms + Privacy — fill in your company name, address and support email),
  `assets/` (art and music drop-in, see `ART-SPEC.md`).
- `server.js` + `lib/` – the server: `db.js` (SQLite/PostgreSQL), `repo.js` (all queries),
  `auth.js` (passwords, codes, Apple/Google token checks), `notify.js` (email, SMS, web push),
  `engage.js` (missions, achievements, leaderboards, tournaments).
- `tests/run.js` – one-click test suite. `tools/` – long simulations.
- `mobile/` – Capacitor project for Android/iOS builds.

## Player features
Accounts with email/phone verification, password reset, Apple/Google sign-in and self-service
account deletion · 3 daily missions · 18 achievements · weekly leaderboards with prizes ·
tournaments · daily streak rewards · free coins every few hours · levels with rewards ·
in-app notification bell + optional push notifications · first-run tour · background music ·
spending limit and reality-check reminders.

## Back office
Overview · Games (on/off, badges) · Players (search, detail with devices and linked accounts,
adjust coins, suspend) · Orders (mark paid, refund, cancel, CSV) · Game rounds · Coin ledger ·
**Analytics** (DAU/WAU/MAU, D1/D7/D30 retention, conversion, ARPPU, ARPDAU, per-game players and
play time) · **Campaigns** (message and/or coin gift to an audience, with push) · **Tournaments** ·
**Risk** (multi-account devices/networks) · Settings (economy, store **promotions**, anti-abuse
limits) · **System** (health, integrations, email/SMS outbox, error log, test alert) · Audit log.

## Monitoring
`GET /api/health` returns 200 when the server and database are fine (point UptimeRobot or your
cloud's health check at it). Errors are logged to the database (Admin → System), and 5 errors in
5 minutes trigger an `ALERT_WEBHOOK` message.

## Anti-abuse
Each install gets a random device ID. Only the first 3 accounts on a device get the welcome bonus
(configurable); the daily reward can be collected once per device and a limited number of times
per network per day; Admin → Risk lists devices and networks with many accounts.

## Economy and payments
Coins can be bought and won but never withdrawn, exchanged or transferred. Payments are in
**sandbox mode** by default (test purchases, nothing charged). For App Store / Google Play the coins
must be sold through Apple/Google in-app purchase: verify the receipt in `POST /api/iap/verify`
and credit the order with `creditOrder()`.

## Math (simulated over millions of spins)
| Engine | RTP | Volatility | Free spins |
|---|---|---|---|
| 20 Lines | ~96% | Low-Medium | 3+ BONUS → 10/15/20 spins, wins x2 |
| 20 Lines · High | ~96% | High | 3+ BONUS (rarer) → 12/18/25 spins, wins x5, top symbol 2,500x |
| 243 Ways | ~96% | Medium | 3+ BONUS → 10/15/20 spins, wins x3 |
| 243 Ways · Very High | ~96% | Very High | 3+ BONUS (rarer) → 12/18/25 spins, wins x8 |
| Tumble | ~96% | High | 4+ SCATTER → 15 spins, multiplier bombs add up |
| Cluster | ~96% | Medium-High | 3+ SCATTER → 10 spins, cascade multiplier never resets |
| Classic 3-reel | ~96% | Low | Wilds multiply x2 / x4 |
| Hold & Win | ~96% | Very High | 6+ coins → 3 respins, Mini 10x / Minor 25x / Major 100x / Grand 1000x |

Which slots use the High variants is set in `public/js/catalog.js` (11th column `'hi'`).
Table games use standard rules (blackjack ~99.5%, European roulette 97.3%, banker 98.9%).
Max win 5,000x. `node tools/sim.cjs <engine> 1000000` re-runs a simulation.

## Data and backups
SQLite: the database is `data/luckyvault.db`. A copy is written to `data/backups/` on start and
every 6 hours (latest 14 kept). To restore, stop the server and copy a backup over
`data/luckyvault.db`. PostgreSQL: use your provider's automatic backups.
Upgrading from v3: the first start imports the old `data/db.json` automatically (players, balances,
orders, history) and renames it to `db.json.migrated`.
