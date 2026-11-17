#!/usr/bin/env python3
"""Every-slot smoke test: opens each slot on phone + desktop sizes, spins N times (turbo), and reports
page errors, console errors, stuck spins and reel/DOM mismatches.
Usage: python3 tools/slot_smoke.py http://localhost:8080 [spins] [outfile.json] [filter-regex]"""
import asyncio, json, sys, re
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
SPINS = int(sys.argv[2]) if len(sys.argv) > 2 else 3
OUT = sys.argv[3] if len(sys.argv) > 3 else 'slot_smoke.json'
FILT = sys.argv[4] if len(sys.argv) > 4 else ''
CHECK = """(()=>{const v=T.view;if(!v)return 'noview';const bad=[];if(v.reels&&v.cells){v.reels.forEach((r,c)=>{const n=r.st.children.length,m=(v.cells[c]||[]).length;if(n!==m||m!==v.m.rows)bad.push('reel'+c+':'+n+'/'+m)})}
 if(T.grid&&T.grid.length!==v.m.cols)bad.push('gridcols'+T.grid.length);
 const b=document.getElementById('board').getBoundingClientRect();if(b.right>innerWidth+2||b.left<-2)bad.push('board-offscreen');
 const sp=document.getElementById('spin').getBoundingClientRect();if(sp.bottom>innerHeight+2||sp.width<10)bad.push('spin-offscreen');
 return bad.join(',')||'ok'})()"""
async def main():
    res = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vw, vh, tag in [(390, 844, 'phone'), (1366, 768, 'desktop')]:
            ctx = await b.new_context(viewport={'width': vw, 'height': vh}, is_mobile=(tag == 'phone'), has_touch=(tag == 'phone'))
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append('page: ' + str(e)[:200]))
            pg.on('console', lambda m: errs.append('console: ' + m.text[:200]) if m.type == 'error' and 'favicon' not in m.text else None)
            await pg.goto(URL); await pg.wait_for_timeout(800)
            await pg.evaluate("""(async()=>{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'ss'+Date.now()%1e7,pass:'password1',adult:true})}).then(r=>r.json());if(r.token)localStorage.setItem('lv_token',r.token)})()""")
            await pg.reload(); await pg.wait_for_timeout(2500)
            ids = await pg.evaluate("Object.values(GAMES).filter(g=>g&&g.slot&&vis(g)&&!g.off).map(g=>[g.id,g.name])")
            if FILT: ids = [x for x in ids if re.search(FILT, x[1], re.I)]
            await pg.evaluate("S.age18=true;S.turbo=true;save()")
            for gid, name in ids:
                errs.clear(); probs = []
                try:
                    await pg.evaluate("openGame(%d)" % gid); await pg.wait_for_timeout(1200)
                    await pg.evaluate("document.querySelectorAll('.ov.show').forEach(o=>{if(o.id!=='game')o.classList.remove('show')})")
                    for i in range(SPINS):
                        b0 = await pg.evaluate("S.bal")
                        await pg.evaluate("$('#spin').click()")
                        try: await pg.wait_for_function("!T.busy&&!(T.fs&&T.fs.left>0&&false)", timeout=25000)
                        except Exception: probs.append('stuck-busy')
                        await pg.wait_for_timeout(250)
                        # finish any feature screens (free spins / bonus picks) quickly
                        for k in range(40):
                            st = await pg.evaluate("(()=>{const o=[...document.querySelectorAll('.ov.show')].filter(o=>o.id!=='game');if(o.length){const b=o[0].querySelector('button');if(b)b.click();else o[0].classList.remove('show');return 1}if(T.fs&&T.fs.left>0&&!T.busy){$('#spin').click();return 2}return T.busy?3:0})()")
                            if not st: break
                            await pg.wait_for_timeout(700)
                        c = await pg.evaluate(CHECK)
                        if c != 'ok': probs.append(c)
                    await pg.evaluate("closeGame()"); await pg.wait_for_timeout(300)
                except Exception as e:
                    probs.append('exception: ' + str(e)[:160])
                    try: await pg.evaluate("closeGame()")
                    except Exception: pass
                probs += sorted(set(errs))
                res.append({'view': tag, 'game': name, 'id': gid, 'problems': sorted(set(probs))})
                if probs: print(tag, name, probs[:4], flush=True)
            await ctx.close()
        await b.close()
    json.dump(res, open(OUT, 'w'), indent=1, ensure_ascii=False)
    bad = [r for r in res if r['problems']]
    print('\n%d game×view runs, %d with problems' % (len(res), len(bad)))
asyncio.run(main())
