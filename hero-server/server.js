// Hero Defense 最小后端：账号、存档同步、元宝余额（服务器为准）、订单校验入口、每日挑战排行榜
// 运行：node server.js   （Node 18+，无第三方依赖；数据存在 ./data/db.json）
// 上线前必须：换成正式数据库、开 HTTPS、在 verifyOrder() 里接入真实支付校验。
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||8787;const DB_FILE=path.join(__dirname,'data','db.json');
const SKUS={yb_60:{yb:60},yb_300:{yb:330},yb_680:{yb:768},yb_1280:{yb:1500},yb_newbie:{yb:680,hero:'mage',once:true},month:{yb:300,month:30},pass:{pass:true}};
let db={users:{},tokens:{},orders:{},board:{}};
try{db=JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}catch(e){}
let dirty=false;setInterval(()=>{if(!dirty)return;dirty=false;fs.mkdirSync(path.dirname(DB_FILE),{recursive:true});fs.writeFileSync(DB_FILE+'.tmp',JSON.stringify(db));fs.renameSync(DB_FILE+'.tmp',DB_FILE)},2000);
const touch=()=>{dirty=true};
function send(res,code,obj){res.writeHead(code,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS'});res.end(JSON.stringify(obj))}
function body(req){return new Promise((ok,bad)=>{let s='';req.on('data',c=>{s+=c;if(s.length>2e6){bad(new Error('too big'));req.destroy()}});req.on('end',()=>{try{ok(s?JSON.parse(s):{})}catch(e){bad(e)}})})}
function auth(req){const t=(req.headers.authorization||'').replace(/^Bearer /,'');const uid=db.tokens[t];return uid&&db.users[uid]}
const today=()=>new Date().toISOString().slice(0,10);

// 真实支付校验放在这里：Stripe（webhook / PaymentIntent 查询）、Apple App Store Server API、Google Play Developer API。
// 现在只在 ALLOW_TEST_ORDERS=1 时接受测试订单，正式环境必须实现校验并关掉测试开关。
async function verifyOrder(provider,receipt,sku){
  if(process.env.ALLOW_TEST_ORDERS==='1'&&provider==='test')return {ok:true,orderId:'test_'+crypto.randomUUID()};
  return {ok:false,error:'payment verification not implemented for provider '+provider};
}

const ADMIN_KEY=process.env.ADMIN_KEY||'';
function codeOf(uid){return uid.slice(-6).toUpperCase()}
const routes={
  'GET /api/me':async(req,res)=>{const u=auth(req);if(!u)return send(res,401,{error:'auth'});send(res,200,{uid:u.uid,code:codeOf(u.uid),invited:u.invited||0,yb:u.yb})},
  'POST /api/invite':async(req,res)=>{const u=auth(req);if(!u)return send(res,401,{error:'auth'});const b=await body(req);const code=String(b.code||'').toUpperCase().trim();
    if(u.invitedBy)return send(res,409,{error:'already used'});const host=Object.values(db.users).find(x=>codeOf(x.uid)===code);if(!host||host.uid===u.uid)return send(res,404,{error:'invalid code'});
    if((host.invited||0)>=50)return send(res,409,{error:'host limit'});u.invitedBy=host.uid;u.yb+=100;host.yb+=100;host.invited=(host.invited||0)+1;touch();send(res,200,{ok:true,yb:u.yb})},
  'POST /api/events':async(req,res)=>{const u=auth(req);if(!u)return send(res,401,{error:'auth'});const b=await body(req);const evs=(b.events||[]).slice(0,500);db.stats=db.stats||{};
    for(const e of evs){const d=new Date(e.t||Date.now()).toISOString().slice(0,10);const S=db.stats[d]=db.stats[d]||{events:{},levels:{},users:{}};S.users[u.uid]=1;S.events[e.e]=(S.events[e.e]||0)+1;
      if(e.e==='level_end'&&e.d&&e.d.li!=null&&!e.d.endless){const L=S.levels[e.d.li]=S.levels[e.d.li]||{plays:0,wins:0};L.plays++;if(e.d.win)L.wins++}}touch();send(res,200,{ok:true})},
  'GET /admin/stats':async(req,res)=>{const k=new URL(req.url,'http://x').searchParams.get('key');if(!ADMIN_KEY||k!==ADMIN_KEY)return send(res,403,{error:'forbidden'});
    const out={users:Object.keys(db.users).length,orders:Object.keys(db.orders).length,days:{}};for(const d in (db.stats||{})){const S=db.stats[d];out.days[d]={dau:Object.keys(S.users).length,events:S.events,levels:S.levels}}send(res,200,out)},
  'POST /api/login':async(req,res)=>{const b=await body(req);const dev=String(b.deviceId||'').slice(0,64);if(!dev)return send(res,400,{error:'deviceId required'});
    let uid=Object.keys(db.users).find(u=>db.users[u].deviceId===dev);if(!uid){uid='u'+crypto.randomBytes(6).toString('hex');db.users[uid]={uid,deviceId:dev,yb:0,save:null,ver:0,created:Date.now(),newbie:false}}
    const token=crypto.randomBytes(24).toString('hex');db.tokens[token]=uid;touch();send(res,200,{token,uid,yb:db.users[uid].yb})},
  'GET /api/save':async(req,res)=>{const u=auth(req);if(!u)return send(res,401,{error:'auth'});send(res,200,{save:u.save,ver:u.ver,yb:u.yb})},
  'POST /api/save':async(req,res)=>{const u=auth(req);if(!u)return send(res,401,{error:'auth'});const b=await body(req);
    if(typeof b.ver==='number'&&b.ver<u.ver)return send(res,409,{error:'stale',ver:u.ver,save:u.save,yb:u.yb});
    const s=b.save||{};s.yb=u.yb;/* 元宝以服务器为准，客户端改不了 */u.save=s;u.ver++;touch();send(res,200,{ver:u.ver,yb:u.yb})},
  'POST /api/spend':async(req,res)=>{const u=auth(req);if(!u)return send(res,401,{error:'auth'});const b=await body(req);const n=Math.floor(+b.amount||0);
    if(n<=0||n>100000)return send(res,400,{error:'amount'});if(u.yb<n)return send(res,402,{error:'insufficient',yb:u.yb});u.yb-=n;touch();send(res,200,{yb:u.yb})},
  'POST /api/order/verify':async(req,res)=>{const u=auth(req);if(!u)return send(res,401,{error:'auth'});const b=await body(req);const sku=SKUS[b.sku];if(!sku)return send(res,400,{error:'sku'});
    if(sku.once&&u.newbie)return send(res,409,{error:'already purchased'});
    const v=await verifyOrder(b.provider,b.receipt,b.sku);if(!v.ok)return send(res,402,{error:v.error});if(db.orders[v.orderId])return send(res,409,{error:'duplicate order'});
    db.orders[v.orderId]={uid:u.uid,sku:b.sku,at:Date.now()};u.yb+=sku.yb||0;if(sku.once)u.newbie=true;touch();send(res,200,{yb:u.yb,grant:sku})},
  'GET /api/board':async(req,res)=>{const d=today();const list=Object.entries(db.board[d]||{}).map(([uid,w])=>({uid:uid.slice(-4),waves:w})).sort((a,b)=>b.waves-a.waves).slice(0,50);send(res,200,{date:d,list})},
  'POST /api/board':async(req,res)=>{const u=auth(req);if(!u)return send(res,401,{error:'auth'});const b=await body(req);const w=Math.max(0,Math.min(99,Math.floor(+b.waves||0)));const d=today();db.board[d]=db.board[d]||{};db.board[d][u.uid]=Math.max(db.board[d][u.uid]||0,w);touch();send(res,200,{ok:true})},
};
// ====================== Stripe 支付（网页版） ======================
// 环境变量：STRIPE_SECRET_KEY（sk_live_… / sk_test_…）、STRIPE_WEBHOOK_SECRET（whsec_…）、PAY_ALLOWED_ORIGINS（可选，逗号分隔，限制 return_url 域名）
// 流程：游戏 POST /api/pay/checkout → 返回 Stripe Checkout 链接 → 玩家付款 → Stripe 回调 /api/pay/webhook 标记已付
//      → 玩家回到游戏，游戏轮询 GET /api/pay/status?sid=… 看到 paid 后发货（同一 sid 只发一次）。
const PAY_ITEMS={yb_60:{c:99,n:'60 Gems'},yb_300:{c:499,n:'300 Gems'},yb_680:{c:999,n:'680 Gems'},yb_1280:{c:1999,n:'1280 Gems'},yb_newbie:{c:299,n:'Starter Pack'},
  newbie7:{c:199,n:'Starter Bundle'},limit:{c:499,n:'Limited Value Pack'},month:{c:499,n:'Monthly Card'},pass:{c:999,n:'Premium Pass'},prep:{c:99,n:'Battle Pack'}};
const SK=process.env.STRIPE_SECRET_KEY||'',WHSEC=process.env.STRIPE_WEBHOOK_SECRET||'';
const ORIGINS=(process.env.PAY_ALLOWED_ORIGINS||'https://eleronzentechnology.com,https://www.eleronzentechnology.com').split(',').map(x=>x.trim()).filter(Boolean);
function form(o,pre,out){out=out||[];for(const k in o){const v=o[k];const key=pre?pre+'['+k+']':k;if(v&&typeof v==='object')form(v,key,out);else if(v!=null)out.push(encodeURIComponent(key)+'='+encodeURIComponent(v))}return out.join('&')}
async function stripe(method,path,params){const r=await fetch('https://api.stripe.com/v1'+path,{method,headers:{Authorization:'Bearer '+SK,'Content-Type':'application/x-www-form-urlencoded'},body:params?form(params):undefined});const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||('stripe '+r.status));return j}
function rawBody(req){return new Promise((ok,bad)=>{const a=[];let n=0;req.on('data',c=>{n+=c.length;if(n>1e6){bad(new Error('too big'));req.destroy()}else a.push(c)});req.on('end',()=>ok(Buffer.concat(a)));req.on('error',bad)})}
function checkSig(raw,hdr){if(!WHSEC||!hdr)return false;const parts=Object.fromEntries(hdr.split(',').map(x=>x.split('=')).filter(x=>x.length===2&&x[0]==='t'));const t=parts.t;
  const v1=hdr.split(',').filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));if(!t||!v1.length||Math.abs(Date.now()/1000-Number(t))>300)return false;
  const exp=crypto.createHmac('sha256',WHSEC).update(t+'.'+raw.toString('utf8')).digest('hex');return v1.some(s=>s.length===exp.length&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(exp)))}
function payOrder(sid){db.pay=db.pay||{};return db.pay[sid]}
function markPaid(sess){db.pay=db.pay||{};const o=db.pay[sess.id]||(db.pay[sess.id]={sid:sess.id,sku:(sess.metadata||{}).sku,uid:(sess.metadata||{}).uid,created:Date.now()});
  if(o.status!=='paid'){o.status='paid';o.paidAt=Date.now();o.amount=sess.amount_total;o.currency=sess.currency;o.pi=sess.payment_intent;
    const u=o.uid&&db.users[o.uid];const it=SKUS[o.sku];if(u&&it&&it.yb){u.yb+=it.yb}touch()}return o}
Object.assign(routes,{
  'POST /api/pay/checkout':async(req,res)=>{if(!SK)return send(res,503,{error:'payments not configured'});const b=await body(req);const it=PAY_ITEMS[b.sku];if(!it)return send(res,400,{error:'sku'});
    let ret;try{ret=new URL(String(b.return_url||''))}catch(e){return send(res,400,{error:'return_url'})}if(!ORIGINS.includes(ret.origin))return send(res,400,{error:'return_url not allowed'});
    const base=ret.origin+ret.pathname;const uid=String(b.uid||'').slice(0,64);
    const sess=await stripe('POST','/checkout/sessions',{mode:'payment',
      line_items:{0:{quantity:1,price_data:{currency:'usd',unit_amount:it.c,product_data:{name:'Hero Defense · '+it.n}}}},
      success_url:base+'?pay=success&sid={CHECKOUT_SESSION_ID}',cancel_url:base+'?pay=cancel',client_reference_id:uid||undefined,
      metadata:{sku:b.sku,uid},payment_intent_data:{metadata:{sku:b.sku,uid}},locale:'auto'});
    db.pay=db.pay||{};db.pay[sess.id]={sid:sess.id,sku:b.sku,uid,status:'pending',created:Date.now()};touch();send(res,200,{id:sess.id,url:sess.url})},
  'POST /api/pay/webhook':async(req,res)=>{const raw=await rawBody(req);if(!checkSig(raw,req.headers['stripe-signature']))return send(res,400,{error:'bad signature'});
    const ev=JSON.parse(raw.toString('utf8'));const o=ev.data&&ev.data.object;
    if((ev.type==='checkout.session.completed'||ev.type==='checkout.session.async_payment_succeeded')&&o&&o.payment_status==='paid')markPaid(o);
    else if((ev.type==='checkout.session.expired'||ev.type==='checkout.session.async_payment_failed')&&o){db.pay=db.pay||{};const r=db.pay[o.id];if(r&&r.status!=='paid'){r.status=ev.type.endsWith('expired')?'expired':'failed';touch()}}
    else if(ev.type==='charge.refunded'&&o){db.pay=db.pay||{};for(const k in db.pay)if(db.pay[k].pi===o.payment_intent){db.pay[k].status='refunded';touch()}}
    send(res,200,{received:true})},
  'GET /api/pay/status':async(req,res)=>{const sid=new URL(req.url,'http://x').searchParams.get('sid')||'';if(!/^cs_[A-Za-z0-9_]+$/.test(sid))return send(res,400,{error:'sid'});
    let o=payOrder(sid);
    if((!o||o.status==='pending')&&SK){try{const s=await stripe('GET','/checkout/sessions/'+sid);if(s.payment_status==='paid')o=markPaid(s);else if(s.status==='expired'){o=o||{};o.status='expired'}}catch(e){}}
    if(!o)return send(res,404,{status:'unknown'});send(res,200,{status:o.status,sku:o.sku})}
});

http.createServer(async(req,res)=>{if(req.method==='OPTIONS')return send(res,204,{});const key=req.method+' '+req.url.split('?')[0];
  if(req.method==='GET'&&key==='GET /admin'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(ADMIN_HTML)}const fn=routes[key];if(!fn)return send(res,404,{error:'not found'});
  try{await fn(req,res)}catch(e){send(res,500,{error:String(e.message||e)})}}).listen(PORT,()=>console.log('Hero server on :'+PORT));

const ADMIN_HTML=`<!doctype html><meta charset=utf-8><title>Hero Defense 运营后台</title><style>body{font:14px system-ui;margin:24px;background:#16110c;color:#f3e6cf}table{border-collapse:collapse;margin:12px 0}td,th{border:1px solid #5a4630;padding:6px 10px}th{background:#2a2016}input,button{padding:6px 10px}</style>
<h2>英雄守关 · 运营数据</h2><input id=k placeholder="ADMIN_KEY" type=password> <button onclick=go()>查看</button><div id=o></div>
<script>async function go(){const r=await fetch('/admin/stats?key='+encodeURIComponent(k.value));const d=await r.json();if(d.error){o.textContent=d.error;return}
let h='<p>总玩家 '+d.users+' · 总订单 '+d.orders+'</p><table><tr><th>日期</th><th>日活</th><th>开局</th><th>结束</th><th>广告</th><th>抽卡</th><th>充值尝试</th></tr>';
for(const [day,s] of Object.entries(d.days).sort().reverse()){const e=s.events;h+='<tr><td>'+day+'</td><td>'+s.dau+'</td><td>'+(e.level_start||0)+'</td><td>'+(e.level_end||0)+'</td><td>'+(e.ad||0)+'</td><td>'+(e.gacha||0)+'</td><td>'+(e.purchase_try||0)+'</td></tr>'}h+='</table><h3>关卡通过率（最近一天）</h3><table><tr><th>关卡</th><th>局数</th><th>通过率</th></tr>';
const last=Object.keys(d.days).sort().pop();if(last){for(const [li,L] of Object.entries(d.days[last].levels).sort((a,b)=>a[0]-b[0]))h+='<tr><td>第 '+(+li+1)+' 关</td><td>'+L.plays+'</td><td>'+Math.round(L.wins/L.plays*100)+'%</td></tr>'}o.innerHTML=h+'</table>'}</script>`;
