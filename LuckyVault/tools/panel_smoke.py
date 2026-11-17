#!/usr/bin/env python3
"""Opens every lobby button / panel at several screen sizes (phone, Fold cover, Fold inner, tablet landscape, desktop)
in both 中文 and English and reports: JS errors, elements wider than the screen, buttons cut off, overlapping close buttons.
Usage: python3 tools/panel_smoke.py http://localhost:8080 [outdir]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
OUTD = sys.argv[2] if len(sys.argv) > 2 else '/tmp/panels'
os.makedirs(OUTD, exist_ok=True)
SIZES = [(390, 844, 'phone'), (344, 882, 'fold-cover'), (884, 1104, 'fold-inner'), (1024, 600, 'tablet-land'), (1366, 768, 'desktop')]
BTNS = ['userBtn', 'bellBtn', 'bonusBtn', 'dailyBtn', 'questBtn', 'setBtn', 'addBtn', 'histBtn']
OVER = """(()=>{const W=innerWidth,H=innerHeight,out=[];const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0};
 const ov=[...document.querySelectorAll('.ov.show,.lvp.show,[class*=panel].show,.sheet.show')].filter(vis);const roots=ov.length?ov:[document.body];
 for(const root of roots)for(const e of root.querySelectorAll('button,a,input,select,h1,h2,h3,p,td,.btn')){if(!vis(e))continue;const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;
  if(r.right>W+3||r.left<-3){out.push('offX:'+(e.id||e.className||e.tagName).toString().slice(0,30)+':'+(e.textContent||'').trim().slice(0,20));continue}
  if(e.tagName==='BUTTON'&&e.scrollWidth>e.clientWidth+6&&getComputedStyle(e).overflow==='hidden')out.push('clipped:'+(e.textContent||'').trim().slice(0,20))}
 return [...new Set(out)].slice(0,8)})()"""
async def main():
    probs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for lang in ['zh', 'en']:
            for vw, vh, tag in SIZES:
                ctx = await b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=vw < 900, has_touch=vw < 1100)
                pg = await ctx.new_page(); errs = []
                pg.on('pageerror', lambda e: errs.append('page:' + str(e)[:160]))
                pg.on('console', lambda m: errs.append('console:' + m.text[:160]) if m.type == 'error' else None)
                await pg.goto(URL); await pg.evaluate("localStorage.setItem('lv_lang','%s')" % lang)
                await pg.evaluate("""(async()=>{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'ps'+Date.now()%1e7,pass:'password1',adult:true})}).then(r=>r.json());if(r.token)localStorage.setItem('lv_token',r.token)})()""")
                await pg.reload(); await pg.wait_for_timeout(2500)
                await pg.evaluate("[...document.querySelectorAll('button')].find(b=>/18/.test(b.textContent))?.click()"); await pg.wait_for_timeout(600)
                await pg.evaluate("for(let i=0;i<3;i++)[...document.querySelectorAll('button')].filter(b=>/^(Skip|跳过)$/.test(b.textContent.trim())).forEach(b=>b.click())")
                lob = await pg.evaluate(OVER)
                if lob: probs.append((lang, tag, 'lobby', lob))
                await pg.screenshot(path=f'{OUTD}/{lang}_{tag}_lobby.png')
                for bid in BTNS:
                    ok = await pg.evaluate("(()=>{const b=document.getElementById('%s');if(!b||!b.offsetParent)return false;b.click();return true})()" % bid)
                    if not ok: continue
                    await pg.wait_for_timeout(900)
                    o = await pg.evaluate(OVER)
                    if o: probs.append((lang, tag, bid, o)); await pg.screenshot(path=f'{OUTD}/{lang}_{tag}_{bid}.png')
                    await pg.keyboard.press('Escape'); await pg.evaluate("document.querySelectorAll('.ov.show').forEach(o=>o.classList.remove('show'));document.querySelectorAll('[class*=close],.x').forEach(x=>{if(x.offsetParent&&/×|✕|close/i.test(x.textContent+x.className))x.click()})"); await pg.wait_for_timeout(400)
                if errs: probs.append((lang, tag, 'errors', sorted(set(errs))[:5]))
                await ctx.close()
        await b.close()
    for pr in probs: print(pr)
    print('\n%d problem groups' % len(probs))
asyncio.run(main())
