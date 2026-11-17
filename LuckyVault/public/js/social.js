// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
/* Lucky Vault — accounts, missions, leaderboards, notifications, onboarding, music, covers.
   Loaded after the main script; uses its globals (API, S, T, GAMES, $, msg, toast, fmt, setUser, save ...). */
(function () {
  'use strict';
  const X = window.LVX = {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const srv = () => API.mode === 'server';
  const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + 'm ago' : s < 86400 ? Math.floor(s / 3600) + 'h ago' : Math.floor(s / 86400) + 'd ago'; };
  const left = t => { let s = Math.max(0, Math.round((t - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'; };
  const num = n => Math.round(n).toLocaleString('en-US');

  // ---------------- styles ----------------
  const css = document.createElement('style');
  css.textContent = `
.nbadge{position:absolute;top:-4px;right:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#ef4444;color:#fff;font:800 10px/17px system-ui;font-style:normal;text-align:center}
.card.wide{max-width:560px;width:calc(100vw - 24px);max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px);overflow:auto;text-align:left}
.xh{display:flex;align-items:center;gap:10px;margin-bottom:10px}.xh h2{flex:1;margin:0}.xx{background:none;border:0;color:#8a9bb0;font-size:26px;cursor:pointer;line-height:1}
.xtabs{display:flex;gap:6px;margin:0 0 12px;overflow-x:auto}.xtabs button{flex:0 0 auto;border:1px solid var(--line);background:#0e1724;color:#cfe;padding:7px 12px;border-radius:20px;font-weight:800;font-size:13px;cursor:pointer}.xtabs button.on{background:var(--acc,#22c55e);color:#04140b;border-color:transparent}
.xrow{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #ffffff12}.xrow:last-child{border-bottom:0}.xrow .grow{flex:1;min-width:0}.xrow small{display:block;color:#8a9bb0;font-size:12px;margin-top:2px}
.xbtn{border:0;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer;background:#22c55e;color:#04140b;font-size:13px;white-space:nowrap}.xbtn.alt{background:#1e2b3c;color:#e6eef8}.xbtn.red{background:#3b1220;color:#ff8fa3}.xbtn:disabled{opacity:.45;cursor:default}
.xbar{height:8px;background:#ffffff14;border-radius:5px;overflow:hidden;margin-top:6px}.xbar i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#a3e635);border-radius:5px}
.xach{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.xach div{background:#0e1724;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:13px}.xach div.lock{opacity:.45;filter:grayscale(1)}.xach b{display:block;margin:4px 0 2px}.xach .ic{font-size:24px}
.xlb{width:100%;border-collapse:collapse;font-size:14px}.xlb td{padding:7px 6px;border-bottom:1px solid #ffffff10}.xlb tr.me td{background:#22c55e22}.xlb td:first-child{width:36px;font-weight:900;color:#facc15}.xlb td:last-child{text-align:right;font-weight:800}
.xin{display:flex;gap:8px;margin-top:8px}.xin .inp{flex:1;min-width:0}
.social{display:flex;flex-direction:column;gap:8px;align-items:center}.social:empty{display:none}.social .or{color:#8a9bb0;font-size:12px}
.apbtn{background:#000;color:#fff;border:1px solid #fff4;border-radius:22px;padding:10px 18px;font-weight:700;font-size:15px;cursor:pointer;min-width:230px}
.tour-dim{position:fixed;inset:0;z-index:95;pointer-events:auto}
.tour-hole{position:fixed;z-index:96;border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,.72),0 0 0 3px #facc15;transition:all .25s;pointer-events:none}
.tour-tip{position:fixed;z-index:97;max-width:300px;background:#111c2b;border:1px solid #facc15;border-radius:14px;padding:14px;color:#e6eef8;box-shadow:0 10px 30px #000a;transition:all .25s}
.tour-tip b{display:block;font-size:16px;margin-bottom:4px;color:#facc15}.tour-tip p{margin:0 0 10px;font-size:14px;line-height:1.4}.tour-tip .row{display:flex;gap:8px;justify-content:flex-end;align-items:center}.tour-tip .row span{flex:1;color:#8a9bb0;font-size:12px}
.achpop{position:fixed;left:50%;top:14px;transform:translate(-50%,-120%);z-index:90;background:linear-gradient(135deg,#3b2a05,#111c2b);border:1px solid #facc15;border-radius:14px;padding:10px 16px;display:flex;gap:10px;align-items:center;color:#fff;box-shadow:0 8px 24px #000b;transition:transform .35s}
.achpop.show{transform:translate(-50%,0)}.achpop .ic{font-size:28px}.achpop small{display:block;color:#facc15;font-weight:800;font-size:11px;letter-spacing:.5px}
.tile .cov{position:absolute;inset:0;background-size:cover;background-position:center;z-index:-1}
.tile.has-art .art,.tile.has-art .fl{display:none}
.xnote{color:#8a9bb0;font-size:12px;line-height:1.4;margin-top:10px}
.card.wide a,#auth a{color:#4ade80}
`;
  document.head.appendChild(css);

  // ---------------- generic panel ----------------
  function panel(title, html, onClose) {
    const c = $('#xovC'); c.innerHTML = '<div class="xh"><h2>' + esc(title) + '</h2><button class="xx" aria-label="Close">×</button></div><div id="xb">' + html + '</div>';
    const ov = $('#xov'); ov.classList.add('show');
    const close = () => { ov.classList.remove('show'); if (onClose) onClose(); };
    c.querySelector('.xx').onclick = close; ov.onclick = e => { if (e.target === ov) close(); };
    return c.querySelector('#xb');
  }
  X.close = () => $('#xov').classList.remove('show');
  function prompt2(title, text, fields, okLabel, onOk) {
    const b = panel(title, '<p>' + text + '</p>' + fields.map(f => '<input class="inp" style="width:100%;margin-top:8px" id="pf_' + f.id + '" type="' + (f.type || 'text') + '" placeholder="' + esc(f.ph) + '" ' + (f.ac ? 'autocomplete="' + f.ac + '"' : '') + ' ' + (f.mode ? 'inputmode="' + f.mode + '"' : '') + '>').join('') +
      '<p id="pfErr" style="color:#ff6b81;min-height:18px;margin:8px 0 0"></p><div class="btnrow"><button class="bigbtn" id="pfOk">' + esc(okLabel) + '</button></div>');
    const go = async () => {
      const v = {}; fields.forEach(f => v[f.id] = b.querySelector('#pf_' + f.id).value.trim());
      const btn = b.querySelector('#pfOk'); btn.disabled = true; const err = await onOk(v); btn.disabled = false; if (err) b.querySelector('#pfErr').textContent = err;
    };
    b.querySelector('#pfOk').onclick = go; b.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') go(); });
    setTimeout(() => { const i = b.querySelector('input'); if (i) i.focus(); }, 50);
  }

  // ---------------- login extras: forgot password + social ----------------
  $('#aForgot').onclick = e => {
    e.preventDefault(); if (!srv()) { toast('Password reset needs the online server'); return; } closeOv('#auth');
    prompt2('Reset password', 'Enter the email on your account. We’ll send a 6-digit code.', [{ id: 'email', type: 'email', ph: 'Email', ac: 'email' }], 'Send code', async v => {
      const r = await API.call('/api/auth/forgot', { email: v.email }); if (r.err) return r.msg || r.err;
      prompt2('Reset password', esc(r.msg), [{ id: 'code', ph: '6-digit code', mode: 'numeric', ac: 'one-time-code' }, { id: 'pass', type: 'password', ph: 'New password (8+ characters)', ac: 'new-password' }], 'Set new password', async w => {
        const x = await API.call('/api/auth/reset', { email: v.email, code: w.code, pass: w.pass }); if (x.err) return x.msg || x.err;
        loggedIn(x); X.close(); toast('Password changed — you’re logged in');
      });
    });
  };
  function loggedIn(r) { API.token = r.token; try { localStorage.setItem('lv_token', r.token); } catch (e) {} setUser(r); closeOv('#auth'); renderLobby(); setTimeout(() => checkDaily(), 800); }
  const loadScript = src => new Promise((ok, bad) => { if (document.querySelector('script[src="' + src + '"]')) return ok(); const s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
  async function social(provider, idToken) {
    if (!$('#aAge').checked) { $('#aErr').textContent = 'Please confirm you are 18 or older first.'; return; }
    const r = await API.call('/api/auth/' + provider, { idToken, adult: true }); if (r.err) { $('#aErr').textContent = r.msg || r.err; return; }
    loggedIn(r); toast('Welcome, ' + r.user.name);
  }
  async function setupSocial() {
    const a = API.cfg && API.cfg.auth; const box = $('#aSocial'); if (!a || (!a.google && !a.apple)) return; box.innerHTML = '<span class="or">or</span>';
    if (a.google) {
      const d = document.createElement('div'); box.appendChild(d);
      try { await loadScript('https://accounts.google.com/gsi/client'); google.accounts.id.initialize({ client_id: a.google, callback: res => social('google', res.credential) }); google.accounts.id.renderButton(d, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 230 }); } catch (e) { d.remove(); }
    }
    if (a.apple) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'apbtn'; b.textContent = '  Continue with Apple'; box.appendChild(b);
      b.onclick = async () => {
        try {
          await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
          AppleID.auth.init({ clientId: a.apple, scope: 'email', redirectURI: a.appleRedirect || location.origin + '/', usePopup: true });
          const r = await AppleID.auth.signIn(); social('apple', r.authorization.id_token);
        } catch (e) { if (e && e.error !== 'popup_closed_by_user') $('#aErr').textContent = 'Apple sign-in was not completed.'; }
      };
    }
  }

  // ---------------- account center ----------------
  X.account = async function () {
    if (!srv() || !API.user) { openAuth(); return; }
    const me = await API.call('/api/me'); if (me.user) setUser(me); const u = API.user;
    const pushOn = await pushState();
    const b = panel('Account', `
      <div class="xrow"><div class="grow"><b>${esc(u.name)}</b><small>Level ${u.level} · Player ID ${u.id}</small></div><button class="xbtn alt" id="acOut">Log out</button></div>
      <div class="xrow"><div class="grow">Email<small>${u.email ? esc(u.email) + (u.emailVerified ? ' · verified ✓' : ' · not verified') : 'Not set — add one so you can recover your account'}</small></div><button class="xbtn${u.email && u.emailVerified ? ' alt' : ''}" id="acMail">${u.email ? (u.emailVerified ? 'Change' : 'Verify') : 'Add'}</button></div>
      <div class="xrow"><div class="grow">Phone<small>${u.phone ? esc(u.phone) + ' · verified ✓' : 'Not set'}</small></div><button class="xbtn alt" id="acPhone">${u.phone ? 'Change' : 'Add'}</button></div>
      <div class="xrow"><div class="grow">Password<small>${u.hasPassword ? 'Set' : 'Not set (you sign in with ' + (u.google ? 'Google' : 'Apple') + ')'}</small></div><button class="xbtn alt" id="acPass">${u.hasPassword ? 'Change' : 'Set'}</button></div>
      ${u.google || u.apple ? '<div class="xrow"><div class="grow">Linked sign-in<small>' + [u.google ? 'Google' : '', u.apple ? 'Apple' : ''].filter(Boolean).join(', ') + '</small></div></div>' : ''}
      <div class="xrow"><div class="grow">Notifications<small>Free-coin reminders, prizes and events</small></div><button class="xbtn${pushOn ? ' alt' : ''}" id="acPush">${pushOn === null ? 'Not supported' : pushOn ? 'Turn off' : 'Turn on'}</button></div>
      <div class="xrow"><div class="grow">Music<small>Casino background music</small></div><button class="xbtn alt" id="acMusic">${musicOn() ? 'On' : 'Off'}</button></div>
      <div class="xrow"><div class="grow">Spending limit<small>Set a monthly cap on coin purchases</small></div><button class="xbtn alt" id="acLim">Open</button></div>
      <div class="xrow"><div class="grow">Show the tour again</div><button class="xbtn alt" id="acTour">Start</button></div>
      <div class="xrow"><div class="grow">Delete account<small>Permanently removes your account and coins</small></div><button class="xbtn red" id="acDel">Delete</button></div>
      <p class="xnote"><a href="legal/terms.html" target="_blank" rel="noopener">Terms of Service</a> · <a href="legal/privacy.html" target="_blank" rel="noopener">Privacy Policy</a> · 18+ only. Coins are virtual and have no cash value.</p>`);
    b.querySelector('#acOut').onclick = async () => { await API.call('/api/logout', {}); API.token = null; API.user = null; try { localStorage.removeItem('lv_token'); } catch (e) {} renderAuth(); X.close(); toast('Logged out'); };
    b.querySelector('#acMail').onclick = () => (u.email && !u.emailVerified) ? verifyEmail(u.email, true) : verifyEmail('', false);
    b.querySelector('#acPhone').onclick = verifyPhone;
    b.querySelector('#acPass').onclick = () => prompt2(u.hasPassword ? 'Change password' : 'Set password', 'Use at least 8 characters.', (u.hasPassword ? [{ id: 'old', type: 'password', ph: 'Current password', ac: 'current-password' }] : []).concat([{ id: 'pass', type: 'password', ph: 'New password', ac: 'new-password' }]), 'Save', async v => {
      const r = await API.call('/api/auth/password', v); if (r.err) return r.msg || r.err; X.close(); toast('Password saved');
    });
    b.querySelector('#acPush').onclick = async () => { if (pushOn === null) return; const ok = pushOn ? await pushOff() : await pushOnFn(); if (ok !== false) X.account(); };
    b.querySelector('#acMusic').onclick = () => { S.music = !musicOn(); save(); MUSIC.sync(); X.account(); };
    b.querySelector('#acLim').onclick = () => { X.close(); openLimits(); };
    b.querySelector('#acTour').onclick = () => { X.close(); tour(true); };
    b.querySelector('#acDel').onclick = () => prompt2('Delete account', 'This permanently deletes your account, coins, levels and history. It cannot be undone.' + (u.hasPassword ? ' Enter your password to confirm.' : ' Type DELETE to confirm.'), [u.hasPassword ? { id: 'pass', type: 'password', ph: 'Password', ac: 'current-password' } : { id: 'confirm', ph: 'DELETE' }], 'Delete my account', async v => {
      if (!u.hasPassword && v.confirm !== 'DELETE') return 'Type DELETE to confirm';
      const r = await API.call('/api/account/delete', { pass: v.pass }); if (r.err) return r.msg || r.err;
      API.token = null; API.user = null; try { localStorage.removeItem('lv_token'); } catch (e) {} renderAuth(); X.close(); msg('Account deleted', 'Your account has been deleted. Thanks for playing.', [['OK', null]]);
    });
  };
  function verifyEmail(email, resend) {
    const ask = async v => {
      const r = await API.call('/api/auth/email', { email: v.email }); if (r.err) return r.msg || r.err; codeStep(v.email, r.msg);
    };
    const codeStep = (em, text) => prompt2('Verify email', esc(text), [{ id: 'code', ph: '6-digit code', mode: 'numeric', ac: 'one-time-code' }], 'Verify', async v => {
      const r = await API.call('/api/auth/email/verify', v); if (r.err) return r.msg || r.err; setUser(r); X.close(); toast(r.bonus ? 'Email verified! +' + num(r.bonus) + ' coins' : 'Email verified'); sfx.big && sfx.big();
    });
    if (resend) ask({ email }).then(e => { if (e) toast(e); });
    else prompt2('Email', 'We’ll send a code to confirm it’s yours.', [{ id: 'email', type: 'email', ph: 'you@example.com', ac: 'email' }], 'Send code', ask);
  }
  function verifyPhone() {
    prompt2('Phone number', 'Use international format with country code, e.g. +61 412 345 678.', [{ id: 'phone', type: 'tel', ph: '+61 412 345 678', ac: 'tel' }], 'Text me a code', async v => {
      const r = await API.call('/api/auth/phone', v); if (r.err) return r.msg || r.err;
      prompt2('Verify phone', esc(r.msg), [{ id: 'code', ph: '6-digit code', mode: 'numeric', ac: 'one-time-code' }], 'Verify', async w => {
        const x = await API.call('/api/auth/phone/verify', w); if (x.err) return x.msg || x.err; setUser(x); X.close(); toast('Phone verified');
      });
    });
  }

  // ---------------- missions / achievements / leaderboard / tournaments ----------------
  let qtab = 'missions';
  X.quests = async function (tab) {
    if (!srv() || !API.user) { openAuth(); return; } qtab = tab || qtab;
    const b = panel('Rewards', '<div class="xtabs">' + [['missions', 'Missions'], ['ach', 'Achievements'], ['lb', 'Leaderboard'], ['tour', 'Tournaments']].map(([k, n]) => '<button data-k="' + k + '" class="' + (k === qtab ? 'on' : '') + '">' + n + '</button>').join('') + '</div><div id="qb"><p class="xnote">Loading…</p></div>');
    b.querySelectorAll('.xtabs button').forEach(x => x.onclick = () => X.quests(x.dataset.k));
    const q = b.querySelector('#qb');
    if (qtab === 'missions' || qtab === 'ach') {
      const r = await API.call('/api/missions'); if (r.err) { q.innerHTML = '<p>' + esc(r.msg || r.err) + '</p>'; return; }
      if (qtab === 'missions') {
        const tomorrow = new Date(); tomorrow.setHours(24, 0, 0, 0);
        q.innerHTML = r.missions.map(m => { const p = Math.min(1, m.prog / m.target); return '<div class="xrow"><div class="grow"><b>' + esc(m.title) + '</b><small>' + fmtProg(m) + ' · Reward ' + num(m.reward) + ' coins</small><div class="xbar"><i style="width:' + (p * 100).toFixed(1) + '%"></i></div></div>' +
          (m.claimed ? '<button class="xbtn alt" disabled>Claimed ✓</button>' : '<button class="xbtn" data-id="' + m.id + '"' + (p < 1 ? ' disabled' : '') + '>Claim</button>') + '</div>'; }).join('') +
          '<p class="xnote">New missions in ' + left(tomorrow.getTime()) + '. Missions reset every day at midnight.</p>';
        q.querySelectorAll('button[data-id]').forEach(x => x.onclick = async () => { x.disabled = true; const c = await API.call('/api/missions/claim', { id: x.dataset.id }); if (c.err) { toast(c.msg || c.err); return; } setUser(c); sfx.big && sfx.big(); toast('+' + num(c.reward) + ' coins'); X.quests('missions'); });
      } else {
        const AC = r.achievements; const got = AC.filter(a => a.at).length;
        q.innerHTML = '<p class="xnote" style="margin:0 0 10px">' + got + ' of ' + AC.length + ' unlocked. Coins are added automatically when you unlock one.</p><div class="xach">' + AC.map(a => '<div class="' + (a.at ? '' : 'lock') + '"><span class="ic emo">' + (a.icon || '🏅') + '</span><b>' + esc(a.title) + '</b>' + esc(a.desc) + '<br><small style="color:#facc15">' + num(a.reward) + ' coins' + (a.at ? ' · ' + new Date(a.at).toLocaleDateString('en-US') : '') + '</small></div>').join('') + '</div>';
      }
    } else if (qtab === 'lb') {
      const board = X._board || 'won'; const r = await API.call('/api/leaderboard?board=' + board); if (r.err) { q.innerHTML = '<p>' + esc(r.msg || r.err) + '</p>'; return; }
      q.innerHTML = '<div class="xtabs"><button data-b="won" class="' + (board === 'won' ? 'on' : '') + '">Total won</button><button data-b="mult" class="' + (board === 'mult' ? 'on' : '') + '">Biggest multiplier</button></div>' +
        '<p class="xnote" style="margin:0 0 8px">This week · ends in ' + left(r.ends) + (board === 'won' ? ' · Top 10 win prizes: ' + r.prizes.slice(0, 3).map(num).join(' / ') + '…' : '') + '</p>' + lbTable(r.top, r.me, board === 'mult' ? 'x' : '') + (r.me ? '<p class="xnote">Your rank: #' + r.me.rank + ' · ' + (board === 'mult' ? r.me.score + 'x' : num(r.me.score)) + '</p>' : '<p class="xnote">Play any game this week to get on the board.</p>');
      q.querySelectorAll('[data-b]').forEach(x => x.onclick = () => { X._board = x.dataset.b; X.quests('lb'); });
    } else {
      const r = await API.call('/api/tournaments'); if (r.err) { q.innerHTML = '<p>' + esc(r.msg || r.err) + '</p>'; return; }
      if (!r.tournaments.length) { q.innerHTML = '<p class="xnote">No tournaments right now. Check back soon!</p>'; return; }
      const MET = { won: 'Most coins won', mult: 'Biggest win multiplier', rounds: 'Most rounds played' };
      const FIL = f => f === 'all' ? 'all games' : f === 'slots' ? 'slots' : f === 'tables' ? 'table games' : f.replace('engine:', '') + ' slots';
      q.innerHTML = r.tournaments.map(t => '<div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px"><b style="font-size:16px">' + esc(t.name) + '</b> ' + (t.live ? '<span style="color:#22c55e;font-weight:800">● LIVE</span>' : t.start > Date.now() ? '<span style="color:#8a9bb0">starts in ' + left(t.start) + '</span>' : '<span style="color:#8a9bb0">finished</span>') +
        '<small style="display:block;color:#8a9bb0;margin:4px 0 8px">' + MET[t.metric] + ' on ' + FIL(t.filter) + (t.minBet ? ' · min bet ' + t.minBet : '') + (t.live ? ' · ends in ' + left(t.end) : '') + ' · Prizes: ' + t.prizes.slice(0, 5).map(num).join(' / ') + (t.prizes.length > 5 ? '…' : '') + '</small>' +
        lbTable(t.top, t.me, t.metric === 'mult' ? 'x' : '') + (t.me ? '<p class="xnote">Your rank: #' + t.me.rank + '</p>' : '') + '</div>').join('');
    }
  };
  function fmtProg(m) { const f = v => m.money ? fmt(v) : num(v); return f(Math.min(m.prog, m.target)) + ' / ' + f(m.target); }
  function lbTable(top, me, suf) {
    if (!top.length) return '<p class="xnote">No scores yet — be the first!</p>';
    return '<table class="xlb">' + top.map((x, i) => '<tr class="' + (API.user && x.uid === API.user.id ? 'me' : '') + '"><td>' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : '#' + (i + 1)) + '</td><td>' + esc(x.name) + '</td><td>' + (suf ? x.score + suf : num(x.score)) + '</td></tr>').join('') + '</table>';
  }
  $('#questBtn').onclick = () => X.quests();

  // ---------------- notification center ----------------
  async function refreshBell() {
    if (!srv() || !API.user) return; const r = await API.call('/api/me'); if (!r.user) return;
    const n = r.unread || 0; const el = $('#bellN'); el.style.display = n ? '' : 'none'; el.textContent = n > 9 ? '9+' : n;
  }
  $('#bellBtn').onclick = async () => {
    const r = await API.call('/api/notes'); const notes = r.notes || [];
    panel('Notifications', notes.length ? notes.map(n => '<div class="xrow"><div class="grow"><b>' + esc(n.title) + '</b>' + (n.body ? '<small>' + esc(n.body) + '</small>' : '') + '<small>' + ago(n.t) + '</small></div>' + (n.seen ? '' : '<span style="color:#22c55e">●</span>') + '</div>').join('') : '<p class="xnote">Nothing new. Prizes, gifts and event news show up here.</p>');
    await API.call('/api/notes/seen', {}); $('#bellN').style.display = 'none';
  };
  setInterval(() => { if (document.visibilityState === 'visible') refreshBell(); }, 60000);

  // ---------------- popups after rounds (achievements, missions) ----------------
  let popQ = [], popping = false;
  function pop(icon, label, title) { popQ.push([icon, label, title]); if (!popping) nextPop(); }
  function nextPop() { try { if (popQ.length && window.sfx && sfx.success) sfx.success(); } catch (e) {}
    const p = popQ.shift(); if (!p) { popping = false; return; } popping = true;
    const el = document.createElement('div'); el.className = 'achpop'; el.innerHTML = '<span class="ic emo">' + p[0] + '</span><div><small>' + esc(p[1]) + '</small><b>' + esc(p[2]) + '</b></div>'; document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show')); setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.remove(); nextPop(); }, 400); }, 2600);
  }
  const call0 = API.call;
  API.call = async function (path, body) {
    const j = await call0.call(API, path, body);
    if (j && Array.isArray(j.ach)) j.ach.forEach(a => pop(a.icon || '🏅', 'ACHIEVEMENT +' + num(a.reward), a.title));
    if (j && Array.isArray(j.missionsDone)) j.missionsDone.forEach(m => pop('🎯', 'MISSION COMPLETE', m.title + ' — claim in Rewards'));
    if (j && Array.isArray(j.onb)) { j.onb.forEach(m => pop(m.fin ? '🏆' : '🎁', (m.fin ? '新手任务完成 JOURNEY COMPLETE +' : '新手任务 +') + num(m.reward), m.title)); if (window.LVOnb) LVOnb.refresh(); }
    return j;
  };

  // ---------------- show/hide header buttons ----------------
  const renderAuth0 = window.renderAuth;
  window.renderAuth = function () {
    renderAuth0(); const on = srv() && !!API.user;
    if (srv() && !API.user) { $('#bal').textContent = '—'; const lv = $('#lvl'); if (lv) lv.style.visibility = 'hidden'; } else { const lv = $('#lvl'); if (lv) lv.style.visibility = ''; }
    $('#questBtn').style.display = on ? '' : 'none'; $('#bellBtn').style.display = on ? '' : 'none';
    if (on) { refreshBell(); if (!API.user.tour && !S.tourDone) setTimeout(() => tour(false), 1200); }
  };
  const setUser0 = window.setUser;
  window.setUser = function (me) { setUser0(me); };

  // ---------------- onboarding tour ----------------
  const STEPS = [
    ['#tabs', 'Browse 100 games', 'Slots, jackpots, blackjack, roulette, poker and more. Use the tabs or search to find a game.'],
    ['#games .tile', 'Tap a game to play', 'Each game shows its features in the paytable (the ⓘ button). Tap and hold a symbol to see what it pays.'],
    ['.bal', 'Your coins', 'Coins are for fun only — they have no cash value. Tap STORE for free coins every few hours.'],
    ['#lvl', 'Level up', 'Every coin you play earns XP. Each new level pays a coin reward.'],
    ['#questBtn', 'Daily missions & prizes', 'Complete 3 missions a day, unlock achievements and climb the weekly leaderboard.'],
    ['#setBtn', 'Play responsibly', 'Set reminders and a monthly spending limit any time in Settings.']
  ];
  function tour(force) {
    if (document.querySelector('.tour-tip') || (!force && (S.tourDone || (API.user && API.user.tour)))) return;
    if ($('#game').classList.contains('show') || document.querySelector('.ov.show')) { if (!force) setTimeout(() => tour(false), 4000); return; }
    let i = 0; const dim = document.createElement('div'); dim.className = 'tour-dim'; const hole = document.createElement('div'); hole.className = 'tour-hole'; const tip = document.createElement('div'); tip.className = 'tour-tip';
    document.body.append(dim, hole, tip);
    const end = () => { dim.remove(); hole.remove(); tip.remove(); S.tourDone = true; save(); if (srv() && API.user) { API.user.tour = true; API.call('/api/tour/done', {}); } };
    const show = () => {
      while (i < STEPS.length) { const el = document.querySelector(STEPS[i][0]); if (el && el.offsetParent !== null) break; i++; }
      if (i >= STEPS.length) return end();
      const [sel, t, p] = STEPS[i]; const el = document.querySelector(sel); el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect(); const pad = 6;
      Object.assign(hole.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
      tip.innerHTML = '<b>' + t + '</b><p>' + p + '</p><div class="row"><span>' + (i + 1) + ' / ' + STEPS.length + '</span><button class="xbtn alt" id="tSkip">Skip</button><button class="xbtn" id="tNext">' + (i === STEPS.length - 1 ? 'Done' : 'Next') + '</button></div>';
      const tw = Math.min(300, innerWidth - 20); let x = Math.min(Math.max(10, r.left + r.width / 2 - tw / 2), innerWidth - tw - 10); let y = r.bottom + 14; if (y + 160 > innerHeight) y = Math.max(10, r.top - 170);
      Object.assign(tip.style, { left: x + 'px', top: y + 'px', width: tw + 'px' });
      tip.querySelector('#tNext').onclick = () => { i++; show(); }; tip.querySelector('#tSkip').onclick = end;
    };
    show();
  }
  X.tour = tour;

  // ---------------- web push ----------------
  const pushOK = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && API.cfg && API.cfg.vapid;
  async function pushState() { if (!pushOK()) return null; try { const reg = await navigator.serviceWorker.ready; const s = await reg.pushManager.getSubscription(); return !!s && Notification.permission === 'granted'; } catch (e) { return null; } }
  function keyBytes(b64) { const p = '='.repeat((4 - b64.length % 4) % 4); const s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); }
  async function pushOnFn() {
    if (!pushOK()) { toast('Notifications are not supported here. On iPhone, add Lucky Vault to your Home Screen first.'); return false; }
    const perm = await Notification.requestPermission(); if (perm !== 'granted') { toast('Notifications are blocked in your browser settings'); return false; }
    try {
      const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(API.cfg.vapid) });
      const r = await API.call('/api/push/subscribe', { sub: sub.toJSON() }); if (r.err) { toast(r.msg || r.err); return false; } toast('Notifications on');
    } catch (e) { toast('Could not turn on notifications'); return false; }
  }
  async function pushOff() { try { const reg = await navigator.serviceWorker.ready; const s = await reg.pushManager.getSubscription(); if (s) { await API.call('/api/push/unsubscribe', { endpoint: s.endpoint }); await s.unsubscribe(); } toast('Notifications off'); } catch (e) {} }

  // ---------------- playtime heartbeat ----------------
  let curTable = null; const openTable0 = window.openTable;
  if (openTable0) window.openTable = function (g) { curTable = g; return openTable0.apply(this, arguments); };
  X.sndFam = g => { const a = g && ASSETS.games[g.slug]; return (a && a.snd) || 'casino'; };
  function musicSrc() { if (!(ASSETS.audio && ASSETS.audio.music)) return null; const id = curGame(); const g = id != null && typeof GAMES !== 'undefined' ? GAMES[id] : null; if (g && !g.slot) return 'assets/audio/lounge/music.mp3'; // table games: CC0 lounge jazz loop
    return g ? 'assets/audio/' + X.sndFam(g) + '/music.mp3' : ASSETS.audio.music; }
  function curGame() { if (T.g && $('#game').classList.contains('show')) return T.g.id; const t = document.getElementById('table'); if (curTable && t && t.classList.contains('show')) return curTable.id; return null; }
  let hbLast = Date.now();
  setInterval(() => {
    const now = Date.now(), secs = Math.round((now - hbLast) / 1000); hbLast = now; const gid = curGame();
    if (gid == null || document.visibilityState !== 'visible' || !srv() || !API.user) return;
    API.call('/api/heartbeat', { gid, secs: Math.min(60, secs) });
  }, 30000);

  // ---------------- background music (procedural, no audio files needed) ----------------
  // Custom tracks: put assets/audio/music.mp3 (and list it in assets/manifest.json) to replace the generated music.
  const musicOn = () => S.music !== false; // on by default; the 🎵 button turns it off
  const MUSIC = X.music = (() => {
    // Procedural lounge-casino groove: kick, hats, bass, chord stabs and a pentatonic lead. 108 bpm, 4-chord loop.
    let amb2 = null, ac, bus, timer, step = 0, el = null, nb, nextT = 0; const SPB = 60 / 108 / 4; // 16th notes
    const PROG = [[45, [57, 60, 64, 67]], [41, [53, 57, 60, 64]], [43, [55, 59, 62, 65]], [40, [52, 55, 59, 64]]];
    const LEAD = [69, 72, 74, 76, 79, 81]; const f = n => 440 * Math.pow(2, (n - 69) / 12);
    function osc(n, t, d, type, v, cut) { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f(n); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      if (cut) { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; o.connect(lp).connect(g); } else o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + .05); }
    function kick(t) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.connect(g).connect(bus); o.start(t); o.stop(t + .3); }
    function hat(t, v) { const n = ac.createBufferSource(); n.buffer = nb; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8000; const g = ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); n.connect(hp).connect(g).connect(bus); n.start(t); n.stop(t + .06); }
    function sched() {
      while (nextT < ac.currentTime + .2) {
        const t = nextT, bar = Math.floor(step / 16), s16 = step % 16, [root, ch] = PROG[bar % 4];
        if (s16 % 4 === 0) kick(t);
        if (s16 % 2 === 1) hat(t, s16 % 4 === 3 ? .07 : .035);
        if ([0, 3, 6, 10, 12].includes(s16)) osc(root - 12 + (s16 === 6 || s16 === 12 ? 12 : 0), t, SPB * 2.2, 'triangle', .22, 900);
        if (s16 === 4 || s16 === 12) ch.forEach(n => osc(n, t, SPB * 3, 'sawtooth', .025, 2200));
        if (bar % 2 === 1 && [0, 2, 3, 6, 8, 11, 14].includes(s16)) { const n = LEAD[(s16 * 7 + bar * 3) % LEAD.length]; osc(n, t, SPB * 2.5, 'sine', .05); osc(n + 12, t, SPB * 1.5, 'sine', .015); }
        if (s16 === 0 && bar % 4 === 0) osc(ch[3] + 12, t, SPB * 8, 'sine', .03);
        step++; nextT += SPB;
      }
    }
    function start(level) {
      const custom = musicSrc();
      if (custom) { if (!el) { el = new Audio(); el.loop = true; } if (el.dataset.src !== custom) { el.dataset.src = custom; el.src = custom; } el.volume = level * .5; el.play().catch(() => {});
        // table games: quiet bar-crowd murmur under the lounge music (Sonniss GDC bundle)
        const amb = /lounge\//.test(custom); if (amb) { if (!amb2) { amb2 = new Audio('assets/audio/lounge/crowd.mp3'); amb2.loop = true; } amb2.volume = level * .35; amb2.play().catch(() => {}); } else if (amb2) amb2.pause();
        return; }
      if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); bus = ac.createGain(); bus.gain.value = 0; bus.connect(ac.destination); nb = ac.createBuffer(1, ac.sampleRate / 4, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } catch (e) { return; } }
      if (ac.state === 'suspended') ac.resume();
      bus.gain.setTargetAtTime(level, ac.currentTime, .4);
      if (!timer) { nextT = ac.currentTime + .05; timer = setInterval(sched, 50); }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } if (bus) bus.gain.setTargetAtTime(0, ac.currentTime, .1); if (el) el.pause(); if (amb2) amb2.pause(); }
    function sync() {
      const ok = musicOn() && S.snd !== false && document.visibilityState === 'visible' && (S.age18 || srv());
      if (!ok) return stop(); start(curGame() != null ? .55 : .3); // quieter in the lobby
    }
    document.addEventListener('visibilitychange', sync); document.addEventListener('pointerdown', () => setTimeout(sync, 30), true); document.addEventListener('keydown', () => setTimeout(sync, 30), true);
    setInterval(sync, 1500);
    return { sync };
  })();
  // A music button next to the sound button in every game
  const sb = $('#sndBtn'); if (sb) { const mb = document.createElement('button'); mb.className = 'ib emo'; mb.id = 'musBtn'; mb.title = 'Music'; mb.setAttribute('aria-label', 'Toggle music'); const paint = () => { mb.textContent = '🎵'; mb.style.opacity = musicOn() ? 1 : 0.4; }; paint(); mb.onclick = () => { S.music = !musicOn(); save(); paint(); MUSIC.sync(); toast('Music ' + (musicOn() ? 'on' : 'off')); }; sb.after(mb); }

  // ---------------- art: generated covers + designer overrides ----------------
  // Designers drop files into assets/games/<slug>/ and list them in assets/manifest.json (see ART-SPEC.md).
  let ASSETS = { games: {}, audio: {} }; X.assets = ASSETS;
  const MOTIF = { tumble: 'gems', cluster: 'dots', lines: 'rays', ways: 'waves', classic3: 'stripes', holdwin: 'coins' };
  function coverSVG(g) {
    const c1 = g.c1 || '#1e293b', c2 = g.c2 || '#334155', m = g.slot ? MOTIF[g.e] || 'rays' : 'felt'; let p = '';
    if (m === 'rays' || m === 'coins') for (let i = 0; i < 18; i++) p += '<path d="M150 170 L' + (150 + 400 * Math.cos(i / 9 * Math.PI)).toFixed(0) + ' ' + (170 + 400 * Math.sin(i / 9 * Math.PI)).toFixed(0) + ' L' + (150 + 400 * Math.cos((i + .5) / 9 * Math.PI)).toFixed(0) + ' ' + (170 + 400 * Math.sin((i + .5) / 9 * Math.PI)).toFixed(0) + 'Z" fill="#fff" opacity=".07"/>';
    if (m === 'coins') for (let i = 0; i < 7; i++) p += '<circle cx="' + (20 + i * 45) + '" cy="' + (330 + (i % 2) * 22) + '" r="26" fill="#facc15" opacity=".35" stroke="#fde68a" stroke-width="3"/>';
    if (m === 'gems') for (let i = 0; i < 9; i++) { const x = (i * 71) % 300, y = 40 + (i * 113) % 300; p += '<path d="M' + x + ' ' + (y - 16) + ' l14 12 -14 22 -14 -22Z" fill="#fff" opacity=".12"/>'; }
    if (m === 'dots') for (let x = 0; x < 6; x++) for (let y = 0; y < 8; y++) p += '<circle cx="' + (25 + x * 50) + '" cy="' + (25 + y * 50) + '" r="' + (6 + ((x * 7 + y * 3) % 5) * 2) + '" fill="#fff" opacity=".07"/>';
    if (m === 'waves') for (let i = 0; i < 8; i++) p += '<path d="M-10 ' + (40 + i * 48) + ' q40 -24 80 0 t80 0 t80 0 t80 0" stroke="#fff" stroke-width="5" fill="none" opacity=".08"/>';
    if (m === 'stripes') for (let i = -4; i < 10; i++) p += '<rect x="' + i * 44 + '" y="-40" width="18" height="500" transform="rotate(20 150 200)" fill="#fff" opacity=".06"/>';
    if (m === 'felt') p += '<ellipse cx="150" cy="210" rx="190" ry="120" fill="none" stroke="#fde68a" stroke-width="5" opacity=".25"/><ellipse cx="150" cy="210" rx="160" ry="96" fill="none" stroke="#fff" stroke-width="2" opacity=".12"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="a" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="' + c2 + '"/><stop offset="1" stop-color="' + c1 + '"/></radialGradient><radialGradient id="v" cx="50%" cy="45%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs><rect width="300" height="400" fill="url(#a)"/>' + p + '<circle cx="150" cy="150" r="95" fill="#fff" opacity=".08"/><rect width="300" height="400" fill="url(#v)"/><rect x="6" y="6" width="288" height="388" rx="14" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  const lazyIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; lazyIO.unobserve(el); const u = el.dataset.bg; if (!u) return; const im = new Image(); im.onload = () => { el.style.backgroundImage = 'url("' + u + '")'; el.classList.add('in'); }; im.src = u; delete el.dataset.bg; }), { rootMargin: '300px' }) : null;
  let lzT = 0; function lazyScan() { clearTimeout(lzT); lzT = setTimeout(() => document.querySelectorAll('.cov.lz[data-bg]').forEach(el => { if (el._lz) return; el._lz = 1; if (lazyIO) lazyIO.observe(el); else { el.style.backgroundImage = 'url("' + el.dataset.bg + '")'; } }), 30); }
  const tile0 = window.tileHTML;
  window.tileHTML = function (g) {
    // lobby tiles use the small thumbnail and load it only when the tile scrolls into view
    const h = tile0(g); const a = ASSETS.games[g.slug]; const img = a && (a.thumb || a.cover);
    const cov = img ? '<div class="cov lz" data-bg="assets/games/' + g.slug + '/' + img + '" style="background-image:' + coverSVG(g).replace(/"/g, '&quot;') + '"></div>' : '<div class="cov" style="background-image:' + coverSVG(g).replace(/"/g, '&quot;') + '"></div>';
    setTimeout(lazyScan, 0);
    return h.replace(/^<div class="tile/, '<div class="tile' + (img ? ' has-art' : '')).replace(/(data-id="\d+"[^>]*>)/, '$1' + cov);
  };
  fetch('assets/manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { if (j) { ASSETS = Object.assign(ASSETS, j); X.assets = ASSETS; if (typeof renderLobby === 'function' && !$('#game').classList.contains('show')) renderLobby(); } }).catch(() => {});
  X.assetFor = (g, kind) => { const a = ASSETS.games[g.slug]; return a && a[kind] ? 'assets/games/' + g.slug + '/' + a[kind] : null; };

  // ---------------- startup ----------------
  const waitServer = setInterval(() => { if (API.cfg) { clearInterval(waitServer); setupSocial(); renderAuth(); } }, 300);
  setTimeout(() => clearInterval(waitServer), 15000);
  if (API.mode !== 'server') setTimeout(() => { if (!srv() && !S.tourDone && S.age18) tour(false); }, 2500);
  renderLobby && setTimeout(() => { if (!$('#game').classList.contains('show')) renderLobby(); }, 0);
})();
