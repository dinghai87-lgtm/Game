#!/usr/bin/env python3
# Store screenshots (App Store 6.7" 1290x2796 + Google Play 1080x1920, zh + en). Needs: pip install playwright && playwright install chromium
# Usage: python3 tools/store_shots.py http://localhost:8080
import asyncio
from playwright.async_api import async_playwright
import sys,os
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8080'
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','store','screens')+'/'
SETUP="""(async()=>{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Lucky'+Date.now()%1e5,pass:'password1',adult:true})}).then(r=>r.json());if(r.token)localStorage.setItem('lv_token',r.token)})()"""
CLEAN="""(()=>{[...document.querySelectorAll('button')].find(b=>/18/.test(b.textContent))?.click();for(let i=0;i<3;i++)[...document.querySelectorAll('button')].filter(b=>/^(Skip|跳过)$/.test(b.textContent.trim())).forEach(b=>b.click());document.querySelectorAll('.ob-tip,.tour,.coach').forEach(e=>e.remove())})()"""
async def shoot(b, lang, vw, vh, tag):
    ctx=await b.new_context(viewport={'width':vw,'height':vh}, device_scale_factor=3, is_mobile=True, has_touch=True)
    pg=await ctx.new_page(); await pg.goto(BASE+'/')
    await pg.evaluate("localStorage.setItem('lv_lang','%s')"%lang); await pg.evaluate(SETUP); await pg.reload(); await pg.wait_for_timeout(3000)
    await pg.evaluate(CLEAN); await pg.wait_for_timeout(800); await pg.evaluate(CLEAN); await pg.wait_for_timeout(500)
    await pg.screenshot(path=OUT+f'{tag}_{lang}_1_lobby.png')
    async def game(q, n, after=None, wait=3000):
        await pg.evaluate("(()=>{const g=Object.values(GAMES).find(x=>%s);if(g)openGame(g.id)})()"%q); await pg.wait_for_timeout(wait); await pg.evaluate(CLEAN)
        if after: await pg.evaluate(after); await pg.wait_for_timeout(4500)
        await pg.screenshot(path=OUT+f'{tag}_{lang}_{n}.png')
        await pg.evaluate("try{closeTable()}catch(e){};try{closeGame()}catch(e){}"); await pg.wait_for_timeout(600)
    await game("/4096/.test(x.name)", "2_slot", "$('#spin').click()")
    await game("!x.slot&&/no-commission-baccarat/.test(x.slug)", "3_baccarat")
    await game("x.slot&&/thunder-temple/.test(x.slug)", "4_bigwin", "window._p=bigWin(820,5)", 2500)
    await game("!x.slot&&/classic-blackjack/.test(x.slug)", "5_blackjack")
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for lang in ['zh','en']:
            await shoot(b, lang, 430, 932, 'iphone67')   # 1290×2796 App Store 6.7"
            await shoot(b, lang, 360, 640, 'android')    # 1080×1920 Google Play
        await b.close()
asyncio.run(main())
