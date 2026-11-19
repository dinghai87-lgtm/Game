#!/usr/bin/env python3
"""Front-end performance audit (static/demo mode like the live site).
Usage: python3 tools/perf_audit.py http://localhost:8085 [out.json]
Measures: first load (requests, bytes by type, DOMContentLoaded/load), memory and DOM growth while opening and closing
games, script time per spin in each language mode (cost of the translation observer), console errors."""
import sys, json, os, time
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8085'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'perf.json'
CHROME = next((p for p in ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'] if os.path.exists(p)), None)
R = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox', '--enable-precise-memory-info']) if CHROME else p.chromium.launch(args=['--enable-precise-memory-info'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); cdp = ctx.new_cdp_session(pg); cdp.send('Performance.enable')
    reqs = []; errs = []
    pg.on('requestfinished', lambda r: reqs.append(r))
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)[:200]))
    pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text[:200]) if m.type in ('error', 'warning') else None)
    t0 = time.time(); pg.goto(URL + '/index.html', wait_until='load'); pg.wait_for_timeout(2500)
    nav = pg.evaluate("(()=>{const n=performance.getEntriesByType('navigation')[0];return {dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)}})()")
    by = {}
    for r in reqs:
        try: sz = r.sizes()['responseBodySize']
        except Exception: sz = 0
        ext = r.url.split('?')[0].rsplit('.', 1)[-1].lower() if '.' in r.url.rsplit('/', 1)[-1] else 'html'
        k = {'js': 'js', 'html': 'html', 'webp': 'images', 'png': 'images', 'jpg': 'images', 'svg': 'images', 'woff2': 'fonts', 'mp3': 'audio', 'ogg': 'audio', 'm4a': 'audio', 'json': 'json', 'css': 'css'}.get(ext, ext)
        by.setdefault(k, [0, 0]); by[k][0] += 1; by[k][1] += sz
    R['firstLoad'] = {'requests': len(reqs), 'kb': round(sum(v[1] for v in by.values()) / 1024), 'byType': {k: {'n': v[0], 'kb': round(v[1] / 1024)} for k, v in by.items()}, 'domContentLoadedMs': nav['dcl'], 'loadMs': nav['load']}
    pg.evaluate("S.age18=true;S.tourDone=true;save()")
    def mem():
        cdp.send('HeapProfiler.collectGarbage'); pg.wait_for_timeout(300)
        m = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
        return {'heapMB': round(m['JSHeapUsedSize'] / 1048576, 1), 'nodes': int(m['Nodes']), 'listeners': int(m['JSEventListeners']), 'docs': int(m['Documents'])}
    R['lobby'] = mem()
    ids = pg.evaluate("GAMES.filter(g=>g&&g.slot&&!g.off).slice(0,24).map(g=>g.id)")
    samples = []
    for i, gid in enumerate(ids):
        pg.evaluate("openGame(%d)" % gid); pg.wait_for_timeout(700)
        pg.evaluate("(()=>{if(window.closeGame)closeGame();else document.getElementById('back').click()})()"); pg.wait_for_timeout(400)
        if i in (0, 7, 15, 23): samples.append(dict(mem(), after=i + 1))
    R['openClose24'] = samples
    # spin cost per language mode: script / layout / style time per spin (each mode needs a reload)
    gid = ids[0]; spin_cost = {}
    for lang in ['en', 'zh', 'bi']:
        pg.evaluate("localStorage.setItem('lv_lang','%s')" % lang); pg.reload(wait_until='load'); pg.wait_for_timeout(1500)
        pg.evaluate("S.age18=true;S.tourDone=true;S.turbo=true;S.bal=Math.max(S.bal,1e6);save()"); pg.evaluate("openGame(%d)" % gid); pg.wait_for_timeout(1000)
        m0 = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
        n = 0
        for _ in range(12):
            pg.evaluate("doSpin()")
            for _ in range(80):
                pg.wait_for_timeout(100)
                if not pg.evaluate("T.busy"): break
            n += 1
        m1 = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
        spin_cost[lang] = {k: round((m1[k] - m0[k]) * 1000 / n, 1) for k in ['ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'TaskDuration']}
    R['perSpinMs'] = spin_cost
    R['errors'] = errs[:30]
    R['assetsTotalMB'] = None
    b.close()
json.dump(R, open(OUT, 'w'), indent=1); print(json.dumps(R, indent=1))
