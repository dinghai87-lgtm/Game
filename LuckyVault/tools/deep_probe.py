#!/usr/bin/env python3
"""Deep attack probe for a running Lucky Vault TEST server (creates throw-away accounts; never run against production data).
Usage: python3 tools/deep_probe.py http://localhost:8083 <admin-pass>
Goes beyond security_probe.py: concurrency / double-spend races, reward double-claims, purchase races, free-spin and
choice tampering, session handling, admin 2FA, account-deletion scrubbing, push-endpoint SSRF, SSE flooding,
order spam, and finally the ledger audit (every balance must match its transactions).
Each line prints PASS / FAIL / INFO."""
import json, sys, time, random, string, threading, urllib.request, urllib.error, hmac, hashlib, struct, base64, socket
from concurrent.futures import ThreadPoolExecutor

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:8083'
ADMIN_PASS = sys.argv[2] if len(sys.argv) > 2 else 'x'
RES = []

def call(method, path, body=None, tok=None, ip=None, raw=None, timeout=20):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    if tok: req.add_header('Authorization', 'Bearer ' + tok)
    req.add_header('X-Forwarded-For', ip or '10.%d.%d.%d' % (random.randint(0, 255), random.randint(0, 255), random.randint(1, 254)))
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            t = r.read().decode('utf8', 'replace'); return r.status, t
    except urllib.error.HTTPError as e: return e.code, e.read().decode('utf8', 'replace')
    except Exception as e: return 0, str(e)

def J(s):
    try: return json.loads(s)
    except Exception: return {}

def check(name, ok, detail=''):
    RES.append((name, ok)); print(('PASS ' if ok else 'FAIL ') + name + ((' — ' + str(detail)) if detail else ''), flush=True)

def info(name, detail=''): print('INFO ' + name + ((' — ' + str(detail)) if detail else ''), flush=True)

def reg(prefix='dp'):
    n = prefix + ''.join(random.choice(string.ascii_lowercase) for _ in range(8))
    s, b = call('POST', '/api/register', {'name': n, 'pass': 'password123', 'adult': True, 'fp': 'fp' + n})
    j = J(b); return j.get('token'), n, (j.get('user') or {}).get('id')

def bal(tok): return J(call('GET', '/api/me', tok=tok)[1]).get('user', {}).get('bal')

def par(n, fn):
    with ThreadPoolExecutor(max_workers=n) as ex: return list(ex.map(lambda i: fn(i), range(n)))

def totp(secret, t=None):
    key = base64.b32decode(secret + '=' * (-len(secret) % 8)); c = int((t or time.time()) // 30)
    h = hmac.new(key, struct.pack('>Q', c), hashlib.sha1).digest(); o = h[19] & 15
    return '%06d' % ((struct.unpack('>I', h[o:o + 4])[0] & 0x7fffffff) % 1000000)

# ---------- admin session (for the ledger audit and outbox codes) ----------
s, b = call('POST', '/api/admin/login', {'user': 'admin', 'pass': ADMIN_PASS}, ip='10.200.0.1')
ADM = J(b).get('token'); check('admin login for audit tools', bool(ADM), s)

# ---------- 1. concurrent spins: no double spend; every accepted round is in the history and the balance matches the ledger ----------
tok, name, uid = reg()
out = par(40, lambda i: call('POST', '/api/spin', {'gid': 26, 'bet': 1}, tok=tok))
ok = [J(x[1]) for x in out if x[0] == 200 and 'err' not in J(x[1])]
codes = sorted(set(x[0] for x in out))
b1 = bal(tok)
if ADM:
    rounds = J(call('GET', '/api/admin/rounds?uid=%s' % uid, tok=ADM)[1]).get('rounds', [])
    txs = J(call('GET', '/api/admin/tx?uid=%s' % uid, tok=ADM)[1]).get('tx', [])
    ledger = round(sum(t['amount'] for t in txs) + sum(r['win'] - r['cost'] for r in rounds), 2)
    check('40 parallel spins: each accepted spin recorded once, balance = ledger', len(rounds) == len(ok) and abs(ledger - b1) < 0.011,
          'accepted %d, recorded %d, codes %s, balance %s, ledger %s' % (len(ok), len(rounds), codes, b1, ledger))

# ---------- 2. reward double-claims under concurrency ----------
def once(path, body=None, n=20, t=None):
    r = par(n, lambda i: call('POST', path, body or {}, tok=t))
    return sum(1 for x in r if x[0] == 200 and 'err' not in J(x[1]))
tok2, _, _ = reg()
check('free bonus: 20 parallel claims -> 1 paid', once('/api/bonus', t=tok2) == 1)
check('daily reward: 20 parallel claims -> 1 paid', once('/api/daily', t=tok2) <= 1)
# pass tier 0 needs 100 points = 1,000 coins wagered
for _ in range(10): call('POST', '/api/spin', {'gid': 26, 'bet': 100}, tok=tok2)
check('weekly pass tier: 20 parallel claims -> 1 paid', once('/api/pass/claim', {'i': 0}, t=tok2) == 1)

# ---------- 3. purchases ----------
s, b = call('POST', '/api/orders', {'pkg': 'p1'}, tok=tok2); oid = J(b).get('order', {}).get('id')
if oid:
    bb = bal(tok2); n = once('/api/orders/%s/sandbox-pay' % oid, t=tok2); ba = bal(tok2)
    info('sandbox payments are ON on this server (PAY_SANDBOX not 0) — must be 0 in production')
    check('sandbox order: 20 parallel pays -> credited once', n == 1 and abs(ba - bb - 5000) < 0.011, 'paid %d, %s -> %s' % (n, bb, ba))
codes = [call('POST', '/api/orders', {'pkg': 'p1'}, tok=tok2)[0] for _ in range(60)]
check('order creation is rate limited (pending-order spam)', 429 in codes, 'status codes ' + str(sorted(set(codes))))

# ---------- 4. free spins / choice / gamble tampering ----------
tok3, _, _ = reg()
s, b = call('POST', '/api/spin', {'gid': 0, 'bet': 1, 'buy': True}, tok=tok3); j = J(b)
if j.get('fs'):
    s2, b2 = call('POST', '/api/spin', {'gid': 1, 'bet': 5000}, tok=tok3)
    check('free spins cannot be moved to another game', s2 != 200 or 'err' in J(b2), b2[:90])
tok3b, _, _ = reg()
chosen = None
for _ in range(400):   # the choose games have no buy: spin until the free-spin choice comes up
    s, b = call('POST', '/api/spin', {'gid': 122, 'bet': 1}, tok=tok3b); j = J(b); time.sleep(0.07)
    if (j.get('fs') or {}).get('choose'): chosen = j; break
if chosen:
    bad = []
    for ch in [99, -1, 'x', '__proto__', 1.5, None, [0]]:
        s2, b2 = call('POST', '/api/spin', {'gid': 122, 'bet': 1, 'choice': ch}, tok=tok3b); time.sleep(0.08)
        if s2 == 200 and 'err' not in J(b2): bad.append(repr(ch))
    check('free-spin choice accepts only listed options', not bad, ', '.join(bad))
else: info('free-spin choice not reached in 400 spins (rare feature) — choice check skipped')
s, b = call('POST', '/api/gamble', {'gid': 26, 'pick': 'red'}, tok=tok3)
check('gamble without a pending win is refused', s != 200 or 'err' in J(b), b[:80])
bad = []
for pk in ['RED', 'x', 'hd', '', None, ['red']]:
    s, b = call('POST', '/api/gamble', {'gid': 26, 'pick': pk}, tok=tok3)
    if s == 200 and 'err' not in J(b): bad.append(repr(pk))
check('gamble pick must be red/black/suit', not bad, ', '.join(bad))

# ---------- 5. table-game tampering ----------
bad = []
for bets in [{'player': -5}, {'player': 'NaN'}, {'player': 1e15}, {'nope': 5}, {'player': 0.001}, {'constructor': 5}]:
    s, b = call('POST', '/api/table', {'gid': 77, 'a': 'deal', 'bets': bets}, tok=tok3)
    if s == 200 and 'err' not in J(b): bad.append(json.dumps(bets))
check('table bets: negative / NaN / huge / unknown keys refused', not bad, '; '.join(bad))
time.sleep(1.1); s, b = call('POST', '/api/table', {'gid': 70, 'a': 'hit'}, tok=tok3)
check('blackjack action without a hand is refused', s != 200 or 'err' in J(b), b[:80])

# ---------- 6. sessions ----------
tok4, n4, _ = reg()
s, b = call('POST', '/api/login', {'name': n4, 'pass': 'password123'}); tokB = J(b).get('token')
call('POST', '/api/auth/password', {'old': 'password123', 'pass': 'password456'}, tok=tok4)
s, b = call('GET', '/api/me', tok=tokB)
check('changing the password signs out the other sessions', s == 401, 'other session status %d' % s)
s, b = call('POST', '/api/logout', {}, tok=tok4); s, b = call('GET', '/api/me', tok=tok4)
check('token is dead after logout', s == 401)

# ---------- 7. account deletion scrubs personal data ----------
tok5, n5, uid5 = reg('del')
for _ in range(3): call('POST', '/api/spin', {'gid': 26, 'bet': 1}, tok=tok5)
call('POST', '/api/push/subscribe', {'sub': {'endpoint': 'https://fcm.googleapis.com/fcm/send/dp' + n5, 'keys': {'p256dh': 'x', 'auth': 'y'}}}, tok=tok5)
s, b = call('POST', '/api/account/delete', {'pass': 'password123'}, tok=tok5)
check('account deletion works', s == 200, b[:80])
if ADM:
    s, b = call('GET', '/api/admin/players/%s' % uid5, tok=ADM); j = J(b)
    devs = j.get('devices') or []
    check('deleted account keeps no network addresses (device id kept for bonus limits)', not [d for d in devs if d.get('ip')], '%d device rows with an IP' % len([d for d in devs if d.get('ip')]))
    s, b = call('GET', '/api/admin/rounds?uid=%s' % uid5, tok=ADM)
    left = [r for r in J(b).get('rounds', []) if r.get('name') == n5]
    check('deleted account name is scrubbed from round history', not left, '%d rounds still carry the old name' % len(left))

# ---------- 8. admin 2FA cannot be switched off with only a token ----------
if ADM:
    s, b = call('POST', '/api/admin/me/2fa', {}, tok=ADM); sec = J(b).get('secret')
    if sec:
        s, b = call('POST', '/api/admin/me/2fa', {'secret': sec, 'code': totp(sec)}, tok=ADM)
        s, b = call('POST', '/api/admin/me/2fa', {'off': True}, tok=ADM)
        check('turning admin 2FA off needs a current 2FA code', s != 200, 'off without code -> %d' % s)
        call('POST', '/api/admin/me/2fa', {'off': True, 'code': totp(sec)}, tok=ADM)

# ---------- 9. push endpoints: no internal addresses (SSRF) ----------
bad = []
for ep in ['https://127.0.0.1:8083/api/ping', 'https://169.254.169.254/latest', 'https://localhost/x', 'https://10.0.0.5/x', 'https://evil.example/x']:
    s, b = call('POST', '/api/push/subscribe', {'sub': {'endpoint': ep, 'keys': {'p256dh': 'x', 'auth': 'y'}}}, tok=tok3)
    if s == 200 and 'err' not in J(b): bad.append(ep)
check('push subscriptions only accept real push services', not bad, ', '.join(bad))

# ---------- 10. SSE flood: one account cannot hold unlimited live streams ----------
socks = []; opened = 0
host, port = BASE.split('//')[1].split(':')[0], int(BASE.rsplit(':', 1)[1]) if BASE.count(':') > 1 else 80
for i in range(60):
    try:
        sk = socket.create_connection((host, port), timeout=3)
        sk.sendall(('GET /api/live/stream?gid=318&t=%s HTTP/1.1\r\nHost: x\r\n\r\n' % tok3).encode())
        head = sk.recv(200).decode('latin1')
        if ' 200 ' in head.split('\r\n')[0]: opened += 1
        socks.append(sk)
    except Exception: break
for sk in socks:
    try: sk.close()
    except Exception: pass
check('live stream connections per player are capped', opened <= 10, '%d of 60 opened' % opened)

# ---------- 11. responsible-play break also blocks the gamble ----------
tok6, _, _ = reg()
won = None
for _ in range(40):
    s, b = call('POST', '/api/spin', {'gid': 26, 'bet': 1}, tok=tok6); j = J(b)
    if j.get('win', 0) > 0 and not j.get('fs'): won = j; break
if won:
    call('POST', '/api/rg', {'pause': 1}, tok=tok6)
    s, b = call('POST', '/api/gamble', {'gid': 26, 'pick': 'red'}, tok=tok6)
    check('self-exclusion break blocks the double-up gamble', s != 200 or 'err' in J(b), 'gamble during break -> %d %s' % (s, b[:60]))

# ---------- 12. ledger: every balance matches its transactions ----------
if ADM:
    time.sleep(1)
    s, b = call('GET', '/api/admin/ledger?limit=5000', tok=ADM); j = J(b)
    check('ledger audit: no balance mismatches', j.get('mismatched') == 0, 'checked %s, mismatched %s %s' % (j.get('checked'), j.get('mismatched'), json.dumps(j.get('list', [])[:3])))

fails = [r for r in RES if not r[1]]
print('\n%d checks, %d failed' % (len(RES), len(fails)))
sys.exit(1 if fails else 0)
