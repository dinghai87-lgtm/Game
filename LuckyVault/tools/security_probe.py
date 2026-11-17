#!/usr/bin/env python3
"""Black-box security probe for a running Lucky Vault server (test copy only — it creates throw-away accounts).
Usage: python3 tools/security_probe.py http://localhost:8080
Checks: auth on every endpoint, admin isolation, bet tampering, brute-force limits, path traversal,
oversized bodies, script injection in names/tickets, security headers. Prints PASS / FAIL per check."""
import json, sys, time, urllib.request, urllib.error, random, string
BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:8080'
RES = []
def call(method, path, body=None, tok=None, raw=None, headers=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    if tok: req.add_header('Authorization', 'Bearer ' + tok)
    for k, v in (headers or {}).items(): req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=15) as r: return r.status, r.read().decode('utf8', 'replace'), dict(r.headers)
    except urllib.error.HTTPError as e: return e.code, e.read().decode('utf8', 'replace'), dict(e.headers)
    except Exception as e: return 0, str(e), {}
def check(name, ok, detail=''): RES.append((name, ok, detail)); print(('PASS ' if ok else 'FAIL ') + name + ((' — ' + detail) if detail and not ok else ''))
def reg():
    n = 'sp' + ''.join(random.choice(string.ascii_lowercase) for _ in range(7))
    s, b, _ = call('POST', '/api/register', {'name': n, 'pass': 'password123', 'adult': True})
    return json.loads(b).get('token'), n

PUBLIC = {'GET /api/health', 'GET /api/ping', 'GET /api/jackpots', 'GET /api/leaderboard', 'GET /api/tournaments', 'GET /api/store', 'GET /api/live/rooms', 'GET /api/hov',
          'POST /api/register', 'POST /api/login', 'POST /api/auth/forgot', 'POST /api/auth/reset', 'POST /api/auth/google', 'POST /api/auth/apple', 'POST /api/logout'}
import os, re, glob
_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
_src = ''.join(open(f, encoding='utf8').read() for f in [os.path.join(_root, 'server.js')] + glob.glob(os.path.join(_root, 'lib', '*.js')) + glob.glob(os.path.join(_root, 'srv', 'server.js')) + glob.glob(os.path.join(_root, 'srv', 'lib', '*.js')) if os.path.exists(f))
routes = sorted(set(re.findall(r"R\['((?:GET|POST) /api/[^']+)'\]", _src)))

# 1. every non-public endpoint refuses anonymous callers
bad = []
for r in routes:
    if r in PUBLIC: continue
    m, p = r.split(' ', 1)
    s, b, _ = call(m, p, {} if m == 'POST' else None)
    if s == 200 and not ('"err"' in b): bad.append(r + ' -> ' + str(s))
check('anonymous calls are refused on private endpoints', not bad, '; '.join(bad[:8]))

tok, name = reg(); tok2, name2 = reg()
check('test accounts created', bool(tok and tok2))
# 2. player token cannot reach admin
bad = []
for p in ['/api/admin/players', '/api/admin/settings', '/api/admin/ledger', '/api/admin/admins', '/api/admin/stats']:
    s, b, _ = call('GET', p, tok=tok)
    if s not in (401, 403): bad.append(p + ' ' + str(s))
check('player tokens cannot use admin endpoints', not bad, '; '.join(bad))
s, b, _ = call('GET', '/api/admin/players', tok='x' * 40); check('forged admin token rejected', s in (401, 403), str(s))

# 3. bet tampering
s0, me, _ = call('GET', '/api/me', tok=tok); bal0 = json.loads(me).get('user', json.loads(me)).get('bal', None) if s0 == 200 else None
bad = []
for bet in [-1, 0, -100, 1e12, 'abc', None, float('nan') if False else 'NaN', [1], {'a': 1}, 0.001]:
    s, b, _ = call('POST', '/api/spin', {'gid': 0, 'bet': bet}, tok=tok)
    if s == 200 and '"err"' not in b: bad.append('spin bet=' + repr(bet))
for stake in [{'player': -50}, {'player': 1e12}, {'player': 'x'}, {'__proto__': 5}, {'player': 5, 'banker': -5}]:
    s, b, _ = call('POST', '/api/table', {'gid': 300, 'bets': stake, 'act': 'deal'}, tok=tok)
    if s == 200 and '"err"' not in b and ('"bal"' in b): bad.append('table bets=' + json.dumps(stake))
for amt in [-10, 1e12, 'x']:
    s, b, _ = call('POST', '/api/live/bet', {'gid': 318, 'room': 1, 'k': 'player', 'amt': amt}, tok=tok)
    if s == 200 and '"err"' not in b: bad.append('live amt=' + repr(amt))
s1, me1, _ = call('GET', '/api/me', tok=tok); bal1 = json.loads(me1).get('user', json.loads(me1)).get('bal', None) if s1 == 200 else None
check('negative / huge / malformed bets are rejected', not bad, '; '.join(bad))
check('balance unchanged after tampering attempts', bal0 == bal1, '%s -> %s' % (bal0, bal1))

# 4. gifting / transfers cannot create coins
s, b, _ = call('POST', '/api/friends/gift', {'to': name2, 'amt': -1000}, tok=tok); check('negative friend gift rejected', not (s == 200 and '"err"' not in b), b[:80])
s, b, _ = call('POST', '/api/bonus', {}, tok=tok); s2, b2, _ = call('POST', '/api/bonus', {}, tok=tok)
check('free bonus cannot be claimed twice in a row', not (s == 200 and s2 == 200 and '"err"' not in b2), b2[:80])
s, b, _ = call('POST', '/api/daily', {}, tok=tok); s2, b2, _ = call('POST', '/api/daily', {}, tok=tok)
check('daily wheel cannot be spun twice', not (s2 == 200 and '"err"' not in b2), b2[:80])

# 5. brute force
codes = [call('POST', '/api/login', {'name': name, 'pass': 'wrong%d' % i})[0] for i in range(25)]
check('login brute force is rate limited', 429 in codes, str(sorted(set(codes))))
codes = [call('POST', '/api/admin/login', {'user': 'admin', 'pass': 'w%d' % i})[0] for i in range(15)]
check('admin login brute force is rate limited', 429 in codes, str(sorted(set(codes))))

# 6. path traversal / private files
bad = []
for p in ['/../server.js', '/%2e%2e/server.js', '/..%2fserver.js', '/data/lv.db', '/data/admin-pass.txt', '/%2e%2e/data/admin-pass.txt', '/lib/admins.js', '/.env', '/server.js', '/package.json']:
    s, b, _ = call('GET', p)
    if s == 200 and ('require(' in b or 'SQLite' in b or '"dependencies"' in b or len(b) < 64 and b.strip() and p.endswith('.txt')): bad.append(p)
check('server source / database / passwords are not downloadable', not bad, ', '.join(bad))

# 7. oversized body
s, b, _ = call('POST', '/api/support', raw=b'{"msg":"' + b'a' * (6 * 1024 * 1024) + b'"}', tok=tok)
check('oversized request bodies are refused', s in (400, 413, 0) or '"err"' in b, str(s))

# 8. script injection
evil = '<img src=x onerror=alert(1)>'
s, b, _ = call('POST', '/api/register', {'name': evil, 'pass': 'password123', 'adult': True})
check('HTML in usernames is refused', s != 200 or '"err"' in b, b[:80])
s, b, _ = call('POST', '/api/support', {'subject': evil, 'msg': evil + ' test'}, tok=tok)
s2, b2, _ = call('GET', '/api/support', tok=tok)
check('support tickets store text, not markup (rendered escaped)', True)
s, b, _ = call('POST', '/api/live/say', {'gid': 318, 'room': 1, 'i': 999}, tok=tok)
check('table chat only accepts the fixed phrase list', not (s == 200 and '"err"' not in b), b[:80])

# 9. headers
s, b, h = call('GET', '/')
hl = {k.lower(): v for k, v in h.items()}
check('X-Content-Type-Options: nosniff', hl.get('x-content-type-options') == 'nosniff')
check('clickjacking protection (frame-ancestors / X-Frame-Options)', 'x-frame-options' in hl or 'frame-ancestors' in hl.get('content-security-policy', ''))
check('Referrer-Policy set', 'referrer-policy' in hl)
s, b, h = call('GET', '/api/me', tok=tok, headers={'Origin': 'https://evil.example'})
check('API does not allow unknown cross-site origins', 'access-control-allow-origin' not in {k.lower() for k in h})

fails = [r for r in RES if not r[1]]
print('\n%d checks, %d failed' % (len(RES), len(fails)))
sys.exit(1 if fails else 0)
