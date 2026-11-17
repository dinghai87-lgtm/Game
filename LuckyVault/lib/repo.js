'use strict';
// Data access for Lucky Vault. Every method takes an optional executor (a transaction handle); default = pool/driver.
const r2 = x => Math.round(x * 100) / 100;
const J = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const dayKey = t => { const d = new Date(t || Date.now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

class Repo {
  constructor(d) { this.d = d; this.kind = d.kind; }
  x(t) { return t || this.d; }
  tx(fn) { return this.d.tx(fn); }

  // ---- counters / kv ----
  async next(k, start, t) {
    const x = this.x(t);
    const r = await x.get('UPDATE counters SET n=n+1 WHERE k=? RETURNING n', [k]); if (r) return Number(r.n);
    await x.run('INSERT INTO counters(k,n) VALUES(?,?) ON CONFLICT(k) DO NOTHING', [k, start]);
    return this.next(k, start, t);
  }
  async kvGet(k, def, t) { const r = await this.x(t).get('SELECT v FROM kv WHERE k=?', [k]); return r ? J(r.v) : def; }
  async kvSet(k, v, t) { await this.x(t).run('INSERT INTO kv(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v', [k, JSON.stringify(v)]); }

  // ---- users ----
  _u(row) { if (!row) return null; const u = J(row.data); u.id = Number(row.id); return u; }
  async userById(id, t, lock) { return this._u(await this.x(t).get('SELECT id,data FROM users WHERE id=?' + (lock ? this.x(t).lockSuffix || '' : ''), [id])); }
  async userByName(n, t) { return this._u(await this.x(t).get('SELECT id,data FROM users WHERE name_lc=?', [String(n).toLowerCase()])); }
  async userByEmail(e, t) { return this._u(await this.x(t).get('SELECT id,data FROM users WHERE email_lc=?', [String(e).toLowerCase()])); }
  async userByPhone(p, t) { return this._u(await this.x(t).get('SELECT id,data FROM users WHERE phone=?', [p])); }
  async userBySub(provider, sub, t) { return this._u(await this.x(t).get('SELECT id,data FROM users WHERE ' + (provider === 'apple' ? 'apple_sub' : 'google_sub') + '=?', [sub])); }
  _cols(u) { return [u.name.toLowerCase(), u.email && u.emailVerified ? u.email.toLowerCase() : null, u.phone || null, u.googleSub || null, u.appleSub || null, u.last || u.created, u.level || 1, r2((u.st && u.st.dep) || 0), u.banned ? 1 : 0, r2(u.bal || 0)]; }
  async insertUser(u, t) {
    const d = Object.assign({}, u); delete d.id;
    await this.x(t).run('INSERT INTO users(id,name_lc,email_lc,phone,google_sub,apple_sub,last,level,paid,banned,bal,created,data) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', [u.id, ...this._cols(u), u.created, JSON.stringify(d)]);
  }
  async saveUser(u, t) {
    const d = Object.assign({}, u); delete d.id;
    await this.x(t).run('UPDATE users SET name_lc=?,email_lc=?,phone=?,google_sub=?,apple_sub=?,last=?,level=?,paid=?,banned=?,bal=?,data=? WHERE id=?', [...this._cols(u), JSON.stringify(d), u.id]);
  }
  // Load a user with a row lock (PostgreSQL) inside a transaction, let fn mutate it, save it.
  withUser(id, fn) { return this.tx(async t => { const u = await this.userById(id, t, true); if (!u) return fn(null, t); const r = await fn(u, t); if (r !== false && !(r && r.skip)) await this.saveUser(u, t); return r; }); }
  async listUsers({ q, limit = 500, order = 'last' } = {}, t) {
    const x = this.x(t); let rows;
    if (q) rows = await x.all('SELECT id,data FROM users WHERE name_lc LIKE ? OR CAST(id AS TEXT)=? OR email_lc LIKE ? ORDER BY last DESC LIMIT ?', ['%' + q.toLowerCase() + '%', q, '%' + q.toLowerCase() + '%', limit]);
    else rows = await x.all('SELECT id,data FROM users ORDER BY ' + (order === 'created' ? 'created' : 'last') + ' DESC LIMIT ?', [limit]);
    return rows.map(r => this._u(r));
  }
  async countUsers(t) { return Number((await this.x(t).get('SELECT COUNT(*) AS n FROM users')).n); }
  async userIdsWhere(sql, p, t) { return (await this.x(t).all('SELECT id FROM users WHERE ' + sql, p)).map(r => Number(r.id)); }

  // ---- sessions ----
  async sessionNew(token, uid, t) { const n = Date.now(); await this.x(t).run('INSERT INTO sessions(token,uid,created,seen) VALUES(?,?,?,?)', [token, uid, n, n]); }
  async session(token) { return this.d.get('SELECT token,uid,created,seen FROM sessions WHERE token=?', [token]); }
  async sessionTouch(token) { await this.d.run('UPDATE sessions SET seen=? WHERE token=?', [Date.now(), token]); }
  async sessionDel(token) { await this.d.run('DELETE FROM sessions WHERE token=?', [token]); }
  async sessionsDelUser(uid, t) { await this.x(t).run('DELETE FROM sessions WHERE uid=?', [uid]); }
  async sessionsPrune(maxAgeMs) { await this.d.run('DELETE FROM sessions WHERE seen<?', [Date.now() - maxAgeMs]); }

  // ---- games ----
  async gamesAll() { return (await this.d.all('SELECT * FROM games')).map(r => ({ id: Number(r.id), enabled: !!r.enabled, tag: r.tag, spins: Number(r.spins), bet: Number(r.bet), win: Number(r.win), fs: Number(r.fs), playsec: Number(r.playsec) })); }
  async gamesEnsure(ids) { for (const id of ids) await this.d.run('INSERT INTO games(id) VALUES(?) ON CONFLICT(id) DO NOTHING', [id]); }
  async gameStat(id, d, t) { await this.x(t).run('UPDATE games SET spins=spins+?, bet=bet+?, win=win+?, fs=fs+? WHERE id=?', [d.spins || 0, d.bet || 0, d.win || 0, d.fs || 0, id]); }
  async gameSet(id, f) { if (f.enabled != null) await this.d.run('UPDATE games SET enabled=? WHERE id=?', [f.enabled ? 1 : 0, id]); if (f.tag !== undefined) await this.d.run('UPDATE games SET tag=? WHERE id=?', [f.tag, id]); }
  async gamePlaytime(id, secs, t) { await this.x(t).run('UPDATE games SET playsec=playsec+? WHERE id=?', [secs, id]); }

  // ---- orders ----
  _o(r) { if (!r) return null; return Object.assign(J(r.data) || {}, { id: r.id, uid: Number(r.uid), created: Number(r.created), paidAt: r.paid_at == null ? null : Number(r.paid_at), status: r.status, price: Number(r.price), coins: Number(r.coins) }); }
  async orderInsert(o, t) { await this.x(t).run('INSERT INTO orders(id,uid,created,paid_at,status,price,coins,data) VALUES(?,?,?,?,?,?,?,?)', [o.id, o.uid, o.created, o.paidAt, o.status, o.price, o.coins, JSON.stringify(o)]); }
  async orderSave(o, t) { await this.x(t).run('UPDATE orders SET paid_at=?,status=?,data=? WHERE id=?', [o.paidAt, o.status, JSON.stringify(o), o.id]); }
  async order(id, t, lock) { return this._o(await this.x(t).get('SELECT * FROM orders WHERE id=?' + (lock ? this.x(t).lockSuffix || '' : ''), [id])); }
  async orders({ status, from, to, uid, limit = 500 } = {}, t) {
    const w = [], p = []; if (status) { w.push('status=?'); p.push(status); } if (from) { w.push('created>=?'); p.push(from); } if (to) { w.push('created<?'); p.push(to); } if (uid) { w.push('uid=?'); p.push(uid); }
    return (await this.x(t).all('SELECT * FROM orders' + (w.length ? ' WHERE ' + w.join(' AND ') : '') + ' ORDER BY created DESC LIMIT ?', [...p, limit])).map(r => this._o(r));
  }
  async monthSpend(uid, t) { const d = new Date(), m0 = new Date(d.getFullYear(), d.getMonth(), 1).getTime(); const r = await this.x(t).get("SELECT COALESCE(SUM(price),0) AS s FROM orders WHERE uid=? AND status='paid' AND paid_at>=?", [uid, m0]); return r2(Number(r.s)); }
  async revenue(since, t) { const r = await this.x(t).get("SELECT COALESCE(SUM(price),0) AS rev, COUNT(*) AS n, COUNT(DISTINCT uid) AS payers, COALESCE(SUM(coins),0) AS coins FROM orders WHERE status='paid' AND paid_at>=?", [since || 0]); return { rev: r2(Number(r.rev)), n: Number(r.n), payers: Number(r.payers), coins: Number(r.coins) }; }

  // ---- rounds / tx / audit ----
  async roundInsert(r, t) { const id = await this.next('round', 1, t); r.id = id; await this.x(t).run('INSERT INTO rounds(id,t,uid,gid,cost,win,data) VALUES(?,?,?,?,?,?,?)', [id, r.t, r.uid, r.gid, r.cost, r.win, JSON.stringify(r)]); return id; }
  async rounds({ uid, gid, from, to, limit = 300 } = {}) {
    const w = [], p = []; if (uid) { w.push('uid=?'); p.push(uid); } if (gid != null) { w.push('gid=?'); p.push(gid); } if (from) { w.push('t>=?'); p.push(from); } if (to) { w.push('t<?'); p.push(to); }
    return (await this.d.all('SELECT data FROM rounds' + (w.length ? ' WHERE ' + w.join(' AND ') : '') + ' ORDER BY t DESC LIMIT ?', [...p, limit])).map(r => J(r.data));
  }
  async roundStats(since) { const r = await this.d.get('SELECT COUNT(*) AS n, COALESCE(SUM(cost),0) AS bet, COALESCE(SUM(win),0) AS win FROM rounds WHERE t>=?', [since]); return { n: Number(r.n), bet: r2(Number(r.bet)), win: r2(Number(r.win)) }; }
  async txInsert(e, t) { const id = await this.next('tx', 1, t); await this.x(t).run('INSERT INTO tx(id,t,uid,type,amount,data) VALUES(?,?,?,?,?,?)', [id, e.t, e.uid, e.type, e.amount, JSON.stringify(e)]); }
  async txList({ uid, limit = 500 } = {}) { return (await this.d.all('SELECT data FROM tx' + (uid ? ' WHERE uid=?' : '') + ' ORDER BY t DESC LIMIT ?', uid ? [uid, limit] : [limit])).map(r => J(r.data)); }
  async audit(action, detail) { const id = await this.next('audit', 1); await this.d.run('INSERT INTO audit(id,t,action,detail) VALUES(?,?,?,?)', [id, Date.now(), action, String(detail || '').slice(0, 2000)]); }
  async auditList(limit = 300) { return this.d.all('SELECT t,action,detail FROM audit ORDER BY t DESC LIMIT ?', [limit]); }

  // ---- daily aggregates ----
  async daily(field, v, t) { const k = dayKey(); await this.x(t).run('INSERT INTO daily(day,' + field + ') VALUES(?,?) ON CONFLICT(day) DO UPDATE SET ' + field + '=daily.' + field + '+excluded.' + field, [k, v]); }
  async dailyPlayer(uid, t) { await this.x(t).run('INSERT INTO daily_players(day,uid) VALUES(?,?) ON CONFLICT(day,uid) DO NOTHING', [dayKey(), uid]); }
  async gameDaily(gid, uid, rounds, secs, t) { await this.x(t).run('INSERT INTO game_daily(day,gid,uid,rounds,secs) VALUES(?,?,?,?,?) ON CONFLICT(day,gid,uid) DO UPDATE SET rounds=game_daily.rounds+excluded.rounds, secs=game_daily.secs+excluded.secs', [dayKey(), gid, uid, rounds, secs]); }
  async days(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const k = dayKey(Date.now() - i * 864e5); const d = (await this.d.get('SELECT * FROM daily WHERE day=?', [k])) || {};
      const a = await this.d.get('SELECT COUNT(*) AS n FROM daily_players WHERE day=?', [k]);
      out.push({ day: k.slice(5), date: k, bet: Number(d.bet || 0), win: Number(d.win || 0), rounds: Number(d.rounds || 0), rev: Number(d.rev || 0), orders: Number(d.orders || 0), signups: Number(d.signups || 0), active: Number(a.n) });
    }
    return out;
  }

  // ---- anti-abuse ----
  async deviceSeen(fp, uid, ip, t) { if (!fp) return; const n = Date.now(); await this.x(t).run('INSERT INTO devices(fp,uid,ip,first,last) VALUES(?,?,?,?,?) ON CONFLICT(fp,uid) DO UPDATE SET last=excluded.last, ip=excluded.ip', [fp, uid, ip, n, n]); }
  async deviceAccounts(fp, t) { if (!fp) return 0; return Number((await this.x(t).get('SELECT COUNT(*) AS n FROM devices WHERE fp=?', [fp])).n); }
  async claim(kind, key, max, t) { // returns true if under the per-day limit and records it
    const k = dayKey(); const x = this.x(t);
    await x.run('INSERT INTO claims(kind,day,key,n) VALUES(?,?,?,0) ON CONFLICT(kind,day,key) DO NOTHING', [kind, k, key]);
    const r = await x.get('UPDATE claims SET n=n+1 WHERE kind=? AND day=? AND key=? AND n<? RETURNING n', [kind, k, key, max]); return !!r;
  }
  async riskDevices(min = 2) { return this.d.all('SELECT fp, COUNT(*) AS accounts, MAX(last) AS last, MIN(ip) AS ip FROM devices GROUP BY fp HAVING COUNT(*)>=? ORDER BY COUNT(*) DESC LIMIT 200', [min]); }
  async riskIps(min = 3) { return this.d.all('SELECT ip, COUNT(DISTINCT uid) AS accounts, MAX(last) AS last FROM devices WHERE ip IS NOT NULL GROUP BY ip HAVING COUNT(DISTINCT uid)>=? ORDER BY COUNT(DISTINCT uid) DESC LIMIT 200', [min]); }
  async devicesOf(uid) { return this.d.all('SELECT fp,ip,first,last FROM devices WHERE uid=? ORDER BY last DESC', [uid]); }
  async usersOnDevice(fp) { return (await this.d.all('SELECT uid FROM devices WHERE fp=?', [fp])).map(r => Number(r.uid)); }

  // ---- verification codes ----
  async codeSet(k, hash, exp, data) { await this.d.run('INSERT INTO codes(k,hash,exp,tries,data) VALUES(?,?,?,0,?) ON CONFLICT(k) DO UPDATE SET hash=excluded.hash, exp=excluded.exp, tries=0, data=excluded.data', [k, hash, exp, JSON.stringify(data || null)]); }
  async codeGet(k) { const r = await this.d.get('SELECT * FROM codes WHERE k=?', [k]); return r ? { hash: r.hash, exp: Number(r.exp), tries: Number(r.tries), data: J(r.data) } : null; }
  async codeTry(k) { await this.d.run('UPDATE codes SET tries=tries+1 WHERE k=?', [k]); }
  async codeDel(k) { await this.d.run('DELETE FROM codes WHERE k=?', [k]); }

  // ---- notifications / push ----
  async noteAdd(uid, title, body, t) { const id = await this.next('note', 1, t); await this.x(t).run('INSERT INTO notes(id,uid,t,title,body,seen) VALUES(?,?,?,?,?,0)', [id, uid, Date.now(), title, body || '']); }
  async notes(uid, limit = 30) { return this.d.all('SELECT id,t,title,body,seen FROM notes WHERE uid=? ORDER BY t DESC LIMIT ?', [uid, limit]); }
  async notesUnseen(uid) { return Number((await this.d.get('SELECT COUNT(*) AS n FROM notes WHERE uid=? AND seen=0', [uid])).n); }
  async notesSeen(uid) { await this.d.run('UPDATE notes SET seen=1 WHERE uid=?', [uid]); }
  async pushAdd(uid, sub) { await this.d.run('INSERT INTO push_subs(endpoint,uid,data,created) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET uid=excluded.uid, data=excluded.data', [sub.endpoint, uid, JSON.stringify(sub), Date.now()]); }
  async pushDel(endpoint) { await this.d.run('DELETE FROM push_subs WHERE endpoint=?', [endpoint]); }
  async pushOf(uid) { return (await this.d.all('SELECT data FROM push_subs WHERE uid=?', [uid])).map(r => J(r.data)); }
  async pushCount() { return Number((await this.d.get('SELECT COUNT(*) AS n FROM push_subs')).n); }

  // ---- leaderboards ----
  async scoreAdd(board, uid, name, v, t) { await this.x(t).run('INSERT INTO scores(board,uid,score,name) VALUES(?,?,?,?) ON CONFLICT(board,uid) DO UPDATE SET score=scores.score+excluded.score, name=excluded.name', [board, uid, v, name]); }
  async scoreMax(board, uid, name, v, t) { await this.x(t).run('INSERT INTO scores(board,uid,score,name) VALUES(?,?,?,?) ON CONFLICT(board,uid) DO UPDATE SET score=CASE WHEN excluded.score>scores.score THEN excluded.score ELSE scores.score END, name=excluded.name', [board, uid, v, name]); }
  async top(board, n = 50) { return (await this.d.all('SELECT uid,name,score FROM scores WHERE board=? AND score>0 ORDER BY score DESC LIMIT ?', [board, n])).map(r => ({ uid: Number(r.uid), name: r.name, score: r2(Number(r.score)) })); }
  async rank(board, uid) { const me = await this.d.get('SELECT score FROM scores WHERE board=? AND uid=?', [board, uid]); if (!me) return null; const r = await this.d.get('SELECT COUNT(*) AS n FROM scores WHERE board=? AND score>?', [board, me.score]); return { rank: Number(r.n) + 1, score: r2(Number(me.score)) }; }

  // ---- outbox / errors ----
  async outbox(m) { const id = await this.next('outbox', 1); await this.d.run('INSERT INTO outbox(id,t,channel,dest,subject,body,status) VALUES(?,?,?,?,?,?,?)', [id, Date.now(), m.channel, m.dest, m.subject || '', m.body || '', m.status || '']); }
  async outboxList(n = 50) { return this.d.all('SELECT * FROM outbox ORDER BY t DESC LIMIT ?', [n]); }
  async errorAdd(msg, stack, ctx) { try { const id = await this.next('error', 1); await this.d.run('INSERT INTO errors(id,t,msg,stack,ctx) VALUES(?,?,?,?,?)', [id, Date.now(), String(msg).slice(0, 500), String(stack || '').slice(0, 4000), String(ctx || '').slice(0, 500)]); } catch (e) {} }
  async errorList(n = 100) { return this.d.all('SELECT t,msg,stack,ctx FROM errors ORDER BY t DESC LIMIT ?', [n]); }
  async errorCount(since) { return Number((await this.d.get('SELECT COUNT(*) AS n FROM errors WHERE t>=?', [since])).n); }
}
module.exports = { Repo, dayKey, r2 };
