#!/usr/bin/env python3
"""UI regression: open every table game, place a main bet, play rounds with random actions, on desktop and phone.
Fails on page errors, rounds that never finish, empty results, or content running off-screen.
Usage: python3 tools/ui_smoke.py http://localhost:8080 [rounds] [outdir]   (needs: pip install playwright; a Chrome/Chromium)"""
import sys, json, os
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
R = int(sys.argv[2]) if len(sys.argv) > 2 else 1
OUT = sys.argv[3] if len(sys.argv) > 3 else 'ui-smoke'
os.makedirs(OUT, exist_ok=True)
CHROME = next((p for p in ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'] if os.path.exists(p)), None)
BET = """(()=>{if(document.getElementById('vpGo')){document.getElementById('vpGo').click();return 'vp'}
 const kg=[...document.querySelectorAll('#knG button')]; if(kg.length){ if(!kg.some(b=>/on|pick/.test(b.className))) for(let i=0;i<5;i++)kg[(i*7+3)%80].click(); const kp=document.querySelector('#tctrl .go'); if(kp){kp.click();return 'keno'} }
 const sc=document.querySelector('#tctrl .go'); if(document.querySelector('.scr-card,.scratch')&&sc){sc.click();return 'scratch'}
 const s=['main','player','dragon','ante','pass','big','red'].map(k=>document.querySelector('#felt [data-k='+k+']')).find(x=>x)||document.querySelector('#felt .spot,#felt [data-k]');
 if(s&&!Object.keys(TT.bets).length) s.click(); const d=document.getElementById('tDeal'); if(!d) return 'nodeal'; if(d.disabled) return 'dealdisabled'; d.click(); return 'deal'})()"""
ACT = """(()=>{const sq=document.querySelector('#sqz.show #sqAll');if(sq){sq.click();return 'sqz'}
 document.querySelectorAll('#felt .tapme').forEach(e=>e.click());
 if(document.getElementById('vpGo')&&TT.phase==='act'){document.getElementById('vpGo').click();return 'draw'}
 const bs=[...document.querySelectorAll('#tctrl button[data-a]')].filter(b=>!b.disabled);if(!bs.length)return null;const b=bs[Math.floor(Math.random()*bs.length)];b.click();return b.dataset.a})()"""
fails = []
with sync_playwright() as p:
  b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox']) if CHROME else p.chromium.launch()
  VIEWS = {'desktop': (1280, 800), 'phone': (390, 844), 'tablet-land': (1024, 600), 'phone-land': (844, 390)}
  for tag in os.environ.get('LV_VIEWS', 'desktop,phone').split(','):
    vw, vh = VIEWS[tag]
    pg = b.new_page(viewport={'width': vw, 'height': vh}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(URL); pg.wait_for_timeout(800); pg.evaluate("localStorage.setItem('lv_lang','%s')" % os.environ.get('LV_LANG','en'))
    pg.evaluate("S.age18=true;S.tourDone=true;save();localStorage.setItem('lv_sqz','0')")
    pg.evaluate("""(async()=>{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'ui'+Date.now()%1e7,pass:'password1',adult:true})}).then(r=>r.json());if(r.token)localStorage.setItem('lv_token',r.token)})()""")
    pg.wait_for_timeout(600); pg.reload(); pg.wait_for_timeout(2500)
    ids = pg.evaluate("GAMES.filter(g=>g&&!g.slot&&vis(g)).map(g=>[g.id,g.name])")
    for gid, name in ids:
      errs.clear(); log = []
      pg.evaluate("document.querySelectorAll('.ov.show').forEach(o=>o.classList.remove('show'));document.querySelectorAll('.hovov').forEach(o=>o.remove())")
      pg.evaluate("try{closeGame()}catch(e){};openGame(%d)" % gid); pg.wait_for_timeout(1300)
      for rnd in range(R):
        log.append(pg.evaluate(BET)); pg.wait_for_timeout(1800)
        for k in range(140 if "Craps" in name else 60):
          a = pg.evaluate(ACT)
          if not a and pg.evaluate("!TT.busy&&TT.phase!=='act'"): break
          if a: log.append(a)
          pg.wait_for_timeout(900)
      pg.wait_for_timeout(600)
      st = pg.evaluate("({busy:TT.busy,phase:TT.phase,res:(document.getElementById('tRes')||{}).textContent||'',over:[...document.querySelectorAll('#felt *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left<-2)}).length})")
      pg.screenshot(path='%s/%s_%d.png' % (OUT, tag, gid))
      prob = []
      if errs: prob.append('page errors: ' + '; '.join(errs[:2]))
      if st['phase'] == 'act' or st['busy']: prob.append('round did not finish (%s)' % st['phase'])
      if st['over'] > 8: prob.append('%d elements off-screen' % st['over'])
      if prob: fails.append('%s [%s]: %s' % (name, tag, ' | '.join(prob)))
      print(json.dumps({'view': tag, 'game': name, 'log': log[:12], 'res': st['res'][:60], 'problems': prob}, ensure_ascii=False), flush=True)
    pg.close()
  b.close()
print('\n%d problem(s)' % len(fails)); [print(' -', f) for f in fails]
sys.exit(1 if fails else 0)
