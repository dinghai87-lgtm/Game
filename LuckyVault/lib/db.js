'use strict';
/*
 * Storage layer. One SQL schema, two drivers:
 *   - SQLite (default): built into Node 22.5+, file data/luckyvault.db, zero install.
 *   - PostgreSQL: set DATABASE_URL=postgres://user:pass@host:5432/db and run `npm install pg`.
 * SQL is written once with "?" placeholders; the PG driver converts them to $1, $2 ...
 */
const fs = require('fs'), path = require('path');
const { AsyncLocalStorage } = require('async_hooks');

class SqliteDriver {
  constructor(file) {
    // node:sqlite prints an "experimental" warning on some Node versions; silence just that one.
    const emit = process.emitWarning; process.emitWarning = (w, ...a) => { if (String(w).includes('SQLite')) return; return emit.call(process, w, ...a); };
    let DatabaseSync; try { ({ DatabaseSync } = require('node:sqlite')); } catch (e) { process.emitWarning = emit; throw new Error('This server needs Node.js 22.13 or newer (it uses the built-in SQLite). You have ' + process.version + '. Install the current LTS from https://nodejs.org, or set DATABASE_URL to use PostgreSQL.'); }
    process.emitWarning = emit;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000;');
    this.kind = 'sqlite'; this.lockSuffix = ''; this.file = file;
    this._chain = Promise.resolve(); this._inTx = false; this._als = new AsyncLocalStorage();
  }
  _p(p) { return (p || []).map(v => v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v); }
  // Direct statement helpers (used inside a transaction).
  _all(sql, p) { return this.db.prepare(sql).all(...this._p(p)); }
  _get(sql, p) { return this.db.prepare(sql).get(...this._p(p)); }
  _run(sql, p) { const r = this.db.prepare(sql).run(...this._p(p)); return { changes: Number(r.changes) }; }
  // While a transaction is open, statements from other requests wait for it to finish.
  // Code running inside the open transaction (same async context) is part of it and never waits on itself.
  async _gate() { if (this._inTx && this._als.getStore() === this._txId) return; while (this._inTx) await this._txDone; }
  async all(sql, p) { await this._gate(); return this._all(sql, p); }
  async get(sql, p) { await this._gate(); return this._get(sql, p); }
  async run(sql, p) { await this._gate(); return this._run(sql, p); }
  async exec(sql) { await this._gate(); this.db.exec(sql); }
  tx(fn) {
    if (this._inTx && this._als.getStore() === this._txId) return fn(this._t); // nested: join the open transaction
    const job = this._chain.then(async () => {
      await this._gate();
      let done; this._txDone = new Promise(r => done = r); this._inTx = true;
      const t = { kind: this.kind, lockSuffix: '', all: async (s, p) => this._all(s, p), get: async (s, p) => this._get(s, p), run: async (s, p) => this._run(s, p) };
      this._t = t; const id = this._txId = Symbol('tx');
      this.db.exec('BEGIN IMMEDIATE');
      try { const r = await this._als.run(id, () => fn(t)); this.db.exec('COMMIT'); return r; }
      catch (e) { try { this.db.exec('ROLLBACK'); } catch (_) {} throw e; }
      finally { this._inTx = false; done(); }
    });
    this._chain = job.catch(() => {});
    return job;
  }
  async close() { this.db.close(); }
}

class PgDriver {
  constructor(url) {
    let pg; try { pg = require('pg'); } catch (e) { throw new Error('DATABASE_URL is set but the "pg" package is missing. Run: npm install pg'); }
    pg.types.setTypeParser(20, v => Number(v));      // BIGINT -> number
    pg.types.setTypeParser(1700, v => Number(v));    // NUMERIC -> number
    this.pool = new pg.Pool({ connectionString: url, max: +process.env.PG_POOL || 10, ssl: /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined });
    this.kind = 'postgres'; this.lockSuffix = ' FOR UPDATE';
  }
  _conv(sql) { let i = 0; return sql.replace(/\?/g, () => '$' + (++i)); }
  _p(p) { return (p || []).map(v => v === undefined ? null : v); }
  async all(sql, p, c) { const r = await (c || this.pool).query(this._conv(sql), this._p(p)); return r.rows; }
  async get(sql, p, c) { return (await this.all(sql, p, c))[0]; }
  async run(sql, p, c) { const r = await (c || this.pool).query(this._conv(sql), this._p(p)); return { changes: r.rowCount }; }
  async exec(sql) { await this.pool.query(sql); }
  async tx(fn) {
    const c = await this.pool.connect();
    const t = { kind: this.kind, lockSuffix: this.lockSuffix, all: (s, p) => this.all(s, p, c), get: (s, p) => this.get(s, p, c), run: (s, p) => this.run(s, p, c) };
    try { await c.query('BEGIN'); const r = await fn(t); await c.query('COMMIT'); return r; }
    catch (e) { try { await c.query('ROLLBACK'); } catch (_) {} throw e; }
    finally { c.release(); }
  }
  async close() { await this.pool.end(); }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY, name_lc TEXT NOT NULL UNIQUE, email_lc TEXT, phone TEXT, google_sub TEXT, apple_sub TEXT,
  created BIGINT NOT NULL, last BIGINT NOT NULL, level INTEGER NOT NULL DEFAULT 1, paid DOUBLE PRECISION NOT NULL DEFAULT 0, banned INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email_lc);
CREATE UNIQUE INDEX IF NOT EXISTS users_phone ON users(phone);
CREATE UNIQUE INDEX IF NOT EXISTS users_google ON users(google_sub);
CREATE UNIQUE INDEX IF NOT EXISTS users_apple ON users(apple_sub);
CREATE INDEX IF NOT EXISTS users_last ON users(last);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, uid BIGINT NOT NULL, created BIGINT NOT NULL, seen BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_uid ON sessions(uid);
CREATE TABLE IF NOT EXISTS counters (k TEXT PRIMARY KEY, n BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1, tag TEXT, spins BIGINT NOT NULL DEFAULT 0, bet DOUBLE PRECISION NOT NULL DEFAULT 0, win DOUBLE PRECISION NOT NULL DEFAULT 0, fs BIGINT NOT NULL DEFAULT 0, playsec BIGINT NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, uid BIGINT NOT NULL, created BIGINT NOT NULL, paid_at BIGINT, status TEXT NOT NULL, price DOUBLE PRECISION NOT NULL, coins BIGINT NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS orders_uid ON orders(uid);
CREATE INDEX IF NOT EXISTS orders_created ON orders(created);
CREATE TABLE IF NOT EXISTS rounds (id BIGINT PRIMARY KEY, t BIGINT NOT NULL, uid BIGINT NOT NULL, gid INTEGER NOT NULL, cost DOUBLE PRECISION NOT NULL, win DOUBLE PRECISION NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS rounds_t ON rounds(t);
CREATE INDEX IF NOT EXISTS rounds_uid ON rounds(uid, t);
CREATE INDEX IF NOT EXISTS rounds_gid ON rounds(gid, t);
CREATE TABLE IF NOT EXISTS tx (id BIGINT PRIMARY KEY, t BIGINT NOT NULL, uid BIGINT NOT NULL, type TEXT NOT NULL, amount DOUBLE PRECISION NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS tx_uid ON tx(uid, t);
CREATE INDEX IF NOT EXISTS tx_t ON tx(t);
CREATE TABLE IF NOT EXISTS audit (id BIGINT PRIMARY KEY, t BIGINT NOT NULL, action TEXT NOT NULL, detail TEXT);
CREATE TABLE IF NOT EXISTS daily (day TEXT PRIMARY KEY, bet DOUBLE PRECISION NOT NULL DEFAULT 0, win DOUBLE PRECISION NOT NULL DEFAULT 0, rounds BIGINT NOT NULL DEFAULT 0, rev DOUBLE PRECISION NOT NULL DEFAULT 0, orders BIGINT NOT NULL DEFAULT 0, signups BIGINT NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS daily_players (day TEXT NOT NULL, uid BIGINT NOT NULL, PRIMARY KEY (day, uid));
CREATE TABLE IF NOT EXISTS game_daily (day TEXT NOT NULL, gid INTEGER NOT NULL, uid BIGINT NOT NULL, rounds BIGINT NOT NULL DEFAULT 0, secs BIGINT NOT NULL DEFAULT 0, PRIMARY KEY (day, gid, uid));
CREATE TABLE IF NOT EXISTS devices (fp TEXT NOT NULL, uid BIGINT NOT NULL, ip TEXT, first BIGINT NOT NULL, last BIGINT NOT NULL, PRIMARY KEY (fp, uid));
CREATE INDEX IF NOT EXISTS devices_uid ON devices(uid);
CREATE TABLE IF NOT EXISTS claims (kind TEXT NOT NULL, day TEXT NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (kind, day, key));
CREATE TABLE IF NOT EXISTS codes (k TEXT PRIMARY KEY, hash TEXT NOT NULL, exp BIGINT NOT NULL, tries INTEGER NOT NULL DEFAULT 0, data TEXT);
CREATE TABLE IF NOT EXISTS push_subs (endpoint TEXT PRIMARY KEY, uid BIGINT NOT NULL, data TEXT NOT NULL, created BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS push_uid ON push_subs(uid);
CREATE TABLE IF NOT EXISTS notes (id BIGINT PRIMARY KEY, uid BIGINT NOT NULL, t BIGINT NOT NULL, title TEXT NOT NULL, body TEXT, seen INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS notes_uid ON notes(uid, t);
CREATE TABLE IF NOT EXISTS scores (board TEXT NOT NULL, uid BIGINT NOT NULL, score DOUBLE PRECISION NOT NULL DEFAULT 0, name TEXT, PRIMARY KEY (board, uid));
CREATE INDEX IF NOT EXISTS scores_board ON scores(board, score);
CREATE TABLE IF NOT EXISTS outbox (id BIGINT PRIMARY KEY, t BIGINT NOT NULL, channel TEXT NOT NULL, dest TEXT NOT NULL, subject TEXT, body TEXT, status TEXT);
CREATE TABLE IF NOT EXISTS errors (id BIGINT PRIMARY KEY, t BIGINT NOT NULL, msg TEXT NOT NULL, stack TEXT, ctx TEXT);
`;

function open() {
  const url = process.env.DATABASE_URL;
  const drv = url ? new PgDriver(url) : new SqliteDriver(process.env.SQLITE_FILE || path.join(__dirname, '..', 'data', 'luckyvault.db'));
  return drv;
}
async function migrate(drv) {
  for (const stmt of SCHEMA.split(';').map(s => s.trim()).filter(Boolean)) await drv.exec(stmt);
  // v5.10: balance as its own column (indexed totals and audits without parsing every user's JSON)
  try { await drv.exec('ALTER TABLE users ADD COLUMN bal DOUBLE PRECISION NOT NULL DEFAULT 0'); } catch (e) { /* already there */ }
  try { await drv.exec('CREATE INDEX IF NOT EXISTS users_bal ON users(bal)'); } catch (e) {}
  try { const rows = await drv.all('SELECT id,data FROM users WHERE bal=0'); for (const r of rows) { let b = 0; try { b = +JSON.parse(r.data).bal || 0; } catch (e) {} if (b) await drv.run('UPDATE users SET bal=? WHERE id=?', [b, r.id]); } } catch (e) {}
}
module.exports = { open, migrate, SqliteDriver, PgDriver, SCHEMA };
