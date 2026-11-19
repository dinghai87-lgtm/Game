// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// Slot math engine — shared by browser and server. Do not put UI code here.
/*ENGINE-START*/
var E=(function(){
const rnd=Math.random;
const SY=['h1','h2','h3','h4','l1','l2','l3','l4','l5'];
const LINES=[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[1,0,1,2,1],[1,2,1,0,1],[0,1,1,1,0],[2,1,1,1,2],[0,1,0,1,0],[2,1,2,1,2],[1,1,0,1,1],[1,1,2,1,1],[0,0,2,0,0],[2,2,0,2,2],[0,2,2,2,0]];
const MV=[[2,40],[3,25],[4,15],[5,12],[6,8],[8,6],[10,5],[12,3],[15,3],[20,2],[25,1.2],[50,.6],[100,.25]];
const CF={5:1,6:1.5,7:2,8:3,9:4,10:6,11:8,12:12,13:16,14:25,15:40};
const MAXWIN=5000;
const LINES3=[[1,1,1],[0,0,0],[2,2,2],[0,1,2],[2,1,0]];
const JP={MINI:10,MINOR:25,MAJOR:100,GRAND:1000};
const CV=[[1,30],[2,22],[3,14],[5,10],[8,6],[10,4],[15,2],[25,1],['MINI',1.2],['MINOR',.35],['MAJOR',.06]];
const MATH={
 classic3:{type:'reel',cols:3,rows:3,k:0.82,lines:LINES3,wildAll:true,
  w:{h1:1,h2:2,h3:3,h4:4,l1:5,l2:6,l3:6,W:1.1},
  pay:{h1:[0,0,100],h2:[0,0,50],h3:[0,0,25],h4:[0,0,15],l1:[0,0,10],l2:[0,0,8],l3:[0,2,5],W:[0,0,500]},
  label:'Classic 3-Reel',vol:'Low',rtp:96},
 holdwin:{type:'reel',cols:5,rows:3,k:2.58,
  w:{h1:2,h2:3,h3:4,h4:4,l1:6,l2:6,l3:7,l4:7,l5:8,W:2.5,C:6},
  pay:{h1:[50,250,1000],h2:[30,100,400],h3:[20,60,200],h4:[15,50,150],l1:[10,25,100],l2:[8,20,80],l3:[5,15,60],l4:[5,15,50],l5:[4,10,40]},
  holdTrig:6,respins:3,coinP:.1,label:'Hold & Win · Jackpots',vol:'Very High',rtp:96},
 lines:{type:'reel',cols:5,rows:3,k:2.33,
  w:{h1:2,h2:3,h3:4,h4:4,l1:6,l2:6,l3:7,l4:7,l5:8,W:3,S:1.4},
  pay:{h1:[50,250,1000],h2:[30,100,400],h3:[20,60,200],h4:[15,50,150],l1:[10,25,100],l2:[8,20,80],l3:[5,15,60],l4:[5,15,50],l5:[4,10,40]},
  scat:{3:2,4:10,5:50},fs:{3:10,4:15,5:20},fsMult:2,fsMultInit:2,label:'20 Lines',vol:'Low-Medium',rtp:96},
 ways:{type:'reel',cols:5,rows:3,k:1.17,
  w:{h1:2,h2:3,h3:4,h4:4,l1:6,l2:6,l3:7,l4:7,l5:8,W:3,S:1.4},
  pay:{h1:[1,5,20],h2:[.8,3,10],h3:[.6,2,6],h4:[.5,1.5,5],l1:[.3,.8,3],l2:[.25,.6,2.5],l3:[.2,.5,2],l4:[.2,.4,1.5],l5:[.15,.3,1]},
  scat:{3:2,4:10,5:50},fs:{3:10,4:15,5:20},fsMult:3,fsMultInit:3,label:'243 Ways',vol:'Medium',rtp:96},
 tumble:{type:'drop',cols:6,rows:5,k:2.56,
  w:{h1:4,h2:5,h3:6,h4:7,l1:9,l2:10,l3:11,l4:12,l5:13,S:1.2},mw:[.12,1.3],
  pay:{h1:[10,25,50],h2:[2.5,10,25],h3:[2,5,15],h4:[1.5,2,12],l1:[1,1.5,10],l2:[.8,1.2,8],l3:[.5,1,5],l4:[.4,.9,4],l5:[.25,.75,2]},
  scat:{4:3,5:5,6:100},fsTrig:4,fs:15,refsTrig:3,refs:5,fsMultInit:0,buy:100,ante:1.25,anteS:1.335,label:'Tumble · Multipliers',vol:'High',rtp:96},
 cluster:{type:'drop',cols:7,rows:7,k:10.6,
  w:{h1:6,h2:7,h3:8,h4:9,l1:10,l2:11,l3:12,l4:13,l5:14,S:.5},
  wfs:{h1:6,h2:7,h3:8,h4:9,l1:10,l2:11,l3:12,S:.5},
  base:{h1:1,h2:.8,h3:.6,h4:.5,l1:.4,l2:.3,l3:.25,l4:.2,l5:.15},
  scat:{3:1,4:5,5:20,6:100},fsTrig:3,fs:10,refsTrig:3,refs:5,fsMultInit:1,buy:80,ante:1.25,anteS:1.335,label:'Cluster Pays',vol:'Medium-High',rtp:96}
};
// Volatility variants: same reels and rules, different maths (rarer, bigger features). Games pick one in catalog.js (column 11).
MATH.lines_hi=Object.assign({},MATH.lines,{base:'lines',k:2.92,w:{h1:2,h2:3,h3:4,h4:4,l1:6,l2:6,l3:7,l4:7,l5:8,W:2.4,S:1.0},
  pay:{h1:[60,400,2500],h2:[30,150,600],h3:[20,60,250],h4:[15,50,150],l1:[8,20,80],l2:[6,15,60],l3:[4,12,50],l4:[4,10,40],l5:[3,8,30]},
  fs:{3:12,4:18,5:25},fsMult:5,fsMultInit:5,label:'20 Lines',vol:'High',rtp:96});
MATH.ways_hi=Object.assign({},MATH.ways,{base:'ways',k:1.39,w:{h1:2,h2:3,h3:4,h4:4,l1:6,l2:6,l3:7,l4:7,l5:8,W:2.4,S:1.0},
  pay:{h1:[1.5,8,40],h2:[1,4,15],h3:[.6,2.5,8],h4:[.5,1.5,6],l1:[.25,.6,2.5],l2:[.2,.5,2],l3:[.15,.4,1.5],l4:[.15,.3,1.2],l5:[.1,.25,1]},
  fs:{3:12,4:18,5:25},fsMult:8,fsMultInit:8,label:'243 Ways',vol:'Very High',rtp:96});
// Feature variants (see playFeat). k values are tuned by simulation to ~96% RTP.
function V(name,base,o){MATH[name]=Object.assign({},MATH[base],{base:base},o)}
const LW={h1:2,h2:3,h3:4,h4:4,l1:6,l2:6,l3:7,l4:7,l5:8};
V('lines_expand','lines',{k:1.99,w:Object.assign({},LW,{W:1.2,S:1.4}),feat:{expand:1},fsMult:2,fsMultInit:2,label:'20 Lines · Expanding Wilds',vol:'Medium',fdesc:'Every WILD expands to fill its whole reel.'});
V('lines_sticky','lines',{k:2.49,w:Object.assign({},LW,{W:2.2,S:1.4}),wfs:Object.assign({},LW,{W:1.6,S:1.4}),feat:{sticky:1},fsMult:1,fsMultInit:1,label:'20 Lines · Sticky Wilds',vol:'High',fdesc:'In free spins every WILD sticks in place until the feature ends.'});
V('lines_walk','lines',{k:1.181,w:Object.assign({},LW,{W:1.6,S:1.4}),feat:{walk:1},fsMult:2,fsMultInit:2,label:'20 Lines · Walking Wilds',vol:'Medium',fdesc:'A WILD steps one reel to the left and triggers a free respin, until it walks off the reels.'});
V('lines_wmult','lines',{k:0.848,w:Object.assign({},LW,{W:2.4,S:1.4}),feat:{wmult:[[2,60],[3,25],[5,12],[10,3]]},fsMult:2,fsMultInit:2,label:'20 Lines · Multiplier Wilds',vol:'High',fdesc:'Every WILD carries a x2, x3, x5 or x10 multiplier. Wilds on the same line multiply together.'});
V('lines_wildreel','lines',{k:1.705,w:Object.assign({},LW,{W:2,S:1.4}),feat:{wildReel:[.04,.12]},fsMult:2,fsMultInit:2,label:'20 Lines · Wild Reels',vol:'Medium-High',fdesc:'At random, one to three of the middle reels turn completely WILD.'});
V('lines_mystery','lines',{k:2.545,w:Object.assign({},LW,{W:2.2,S:1.4,Q:3}),feat:{mystery:[['h1',1],['h2',2],['h3',3],['h4',3],['l1',4],['l2',4],['W',.6]]},fsMult:2,fsMultInit:2,label:'20 Lines · Mystery Symbols',vol:'Medium-High',fdesc:'Mystery symbols all reveal the same symbol — sometimes a WILD.'});
V('lines_lightning','lines',{k:0.988,w:Object.assign({},LW,{W:2.2,S:1.4}),feat:{lightning:[.06,.18]},fsMult:2,fsMultInit:2,label:'20 Lines · Lightning Wilds',vol:'Medium',fdesc:'Lightning can strike on any spin and add 3 to 6 extra WILDS.'});
V('lines_colossal','lines',{k:1.551,w:Object.assign({},LW,{W:2.2,S:1.4}),feat:{colossal:[.035,.1]},fsMult:2,fsMultInit:2,label:'20 Lines · Colossal Symbols',vol:'High',fdesc:'A giant 3x3 symbol can land on reels 2, 3 and 4.'});
V('lines_collect','lines',{k:4.55,w:Object.assign({},LW,{C:2.2,S:1.4}),wfs:Object.assign({},LW,{W:1.2,C:3.2,S:1.2}),feat:{collect:1,collectK:3.5},fsMult:1,fsMultInit:1,fs:{3:10,4:15,5:20},label:'20 Lines · Cash Collect',vol:'High',fdesc:'Cash symbols show a prize. In free spins every collector WILD grabs every prize on screen. Every 4 wilds collected: +10 spins and x2, x3, then x10 prizes.'});
V('lines_pick','lines',{k:2.264,w:Object.assign({},LW,{W:2.6,S:1.5}),feat:{bonus:'pick'},label:'20 Lines · Pick Bonus',vol:'Medium',fdesc:'3+ BONUS symbols start the treasure pick: open chests until COLLECT. 4 and 5 BONUS multiply the prizes by x2 and x3.'});
V('lines_wheel','lines',{k:2.473,w:Object.assign({},LW,{W:2.6,S:1.5}),feat:{bonus:'wheel'},label:'20 Lines · Wheel Bonus',vol:'Medium-High',fdesc:'3+ BONUS symbols spin the prize wheel. Land UPGRADE to move to a bigger wheel — up to 1,000x. 5 BONUS doubles the prize.'});
V('lines_choose','lines',{k:2.564,w:Object.assign({},LW,{W:2.6,S:1.4}),feat:{},choose:null,fsMult:2,fsMultInit:2,label:'20 Lines · Choose Your Bonus',vol:'Medium-High',fdesc:'When free spins trigger, pick: 20 spins x1, 10 spins x2, 7 spins x3 or 4 spins x5.'});
MATH.lines_choose.feat={choose:[[20,1],[10,2],[7,3],[4,5]]};
const WW={h1:2,h2:3,h3:4,h4:4,l1:6,l2:6,l3:7,l4:7,l5:8};
// 4,096 Ways: 6 reels × 4 rows, matching symbols on adjacent reels from the left pay in any row (up to 4×4×4×4×4×4 ways). Free spins with a ×2 multiplier.
V('ways_4096','ways',{cols:6,rows:4,k:0.401,w:Object.assign({},WW,{W:2.2,S:1.3}),pay:{h1:[.5,2,6,20],h2:[.4,1.5,4,12],h3:[.3,1,3,8],h4:[.25,.8,2.5,6],l1:[.15,.4,1.2,3],l2:[.12,.3,1,2.5],l3:[.1,.25,.8,2],l4:[.1,.2,.6,1.5],l5:[.08,.15,.5,1]},fsMult:2,fsMultInit:2,label:'4,096 Ways',vol:'High',fdesc:'6 reels × 4 rows: matching symbols on adjacent reels from the leftmost reel pay in any row — up to 4,096 ways. Free spins pay ×2.'});
V('ways_expand','ways',{k:1.18,w:Object.assign({},WW,{W:1.0,S:1.4}),feat:{expand:1},fsMult:2,fsMultInit:2,label:'243 Ways · Expanding Wilds',vol:'Medium',fdesc:'Every WILD expands to fill its whole reel.'});
V('ways_sticky','ways',{k:1.392,w:Object.assign({},WW,{W:2.2,S:1.4}),wfs:Object.assign({},WW,{W:1.2,S:1.4}),feat:{sticky:1},fsMult:1,fsMultInit:1,label:'243 Ways · Sticky Wilds',vol:'High',fdesc:'In free spins every WILD sticks in place until the feature ends.'});
V('ways_walk','ways',{k:0.662,w:Object.assign({},WW,{W:1.4,S:1.4}),feat:{walk:1},fsMult:2,fsMultInit:2,label:'243 Ways · Walking Wilds',vol:'Medium',fdesc:'A WILD steps one reel to the left and triggers a free respin, until it walks off the reels.'});
V('ways_wildreel','ways',{k:0.86,w:Object.assign({},WW,{W:2,S:1.4}),feat:{wildReel:[.035,.1]},fsMult:2,fsMultInit:2,label:'243 Ways · Wild Reels',vol:'High',fdesc:'At random, one to three of the middle reels turn completely WILD.'});
V('ways_mystery','ways',{k:1.307,w:Object.assign({},WW,{W:2.2,S:1.4,Q:3}),feat:{mystery:[['h1',1],['h2',2],['h3',3],['h4',3],['l1',4],['l2',4],['W',.6]]},fsMult:2,fsMultInit:2,label:'243 Ways · Mystery Symbols',vol:'Medium-High',fdesc:'Mystery symbols all reveal the same symbol — sometimes a WILD.'});
V('ways_lightning','ways',{k:0.336,w:Object.assign({},WW,{W:2.2,S:1.4}),feat:{lightning:[.05,.15]},fsMult:2,fsMultInit:2,label:'243 Ways · Lightning Wilds',vol:'Medium',fdesc:'Lightning can strike on any spin and add 3 to 6 extra WILDS.'});
const CW={h1:1,h2:2,h3:3,h4:4,l1:5,l2:6,l3:6};
V('classic3_mw','classic3',{k:0.611,w:Object.assign({},CW,{W:1.1}),wv:[[2,60],[3,30],[5,10]],label:'Classic 3-Reel · 2x 3x 5x Wilds',vol:'Medium-High',fdesc:'WILDS carry x2, x3 or x5. Two or three wilds on a line multiply together — up to x125.'});
V('classic3_wheel','classic3',{k:0.624,w:Object.assign({},CW,{W:1.1,S:0.9}),sOnly:2,wheel:[[2,22],[3,18],[4,14],[5,12],[8,9],[10,8],[15,5],[20,4],[25,3],[50,1.5],[100,.6],[250,.15],[500,.05]],label:'Classic 3-Reel · Bonus Wheel',vol:'Medium',fdesc:'A WHEEL symbol on the centre of reel 3 spins the bonus wheel for up to 500x your bet.'});
// Volatility shown to players = measured swing per spin (standard deviation in bets, 3M+ spins each, tools/maths_audit.cjs):
// under 3.4 Low · 3.4–4.5 Low-Medium · 4.5–5.5 Medium · 5.5–6.5 Medium-High · 6.5–10 High · over 10 Very High
const VOL_MEASURED={classic3:'Low-Medium',holdwin:'Very High',lines:'Low',ways:'Low-Medium',tumble:'High',cluster:'Medium-High',lines_hi:'Medium',ways_hi:'Medium-High',
 lines_expand:'Medium',lines_sticky:'Medium-High',lines_walk:'Low',lines_wmult:'High',lines_wildreel:'Medium-High',lines_mystery:'Low',lines_lightning:'Medium-High',
 lines_colossal:'High',lines_collect:'Very High',lines_pick:'Low-Medium',lines_wheel:'Low-Medium',lines_choose:'Low',ways_4096:'Low-Medium',ways_expand:'Medium-High',
 ways_sticky:'Medium-High',ways_walk:'Low',ways_wildreel:'High',ways_mystery:'Low-Medium',ways_lightning:'Medium-High',classic3_mw:'Medium',classic3_wheel:'Low-Medium'};
for(const k in VOL_MEASURED)if(MATH[k])MATH[k].vol=VOL_MEASURED[k];
const VAR={};function setVariants(list){list.forEach((x,i)=>{const gid=Array.isArray(x[1])?x[0]:i,t=Array.isArray(x[1])?x[1]:x;if(t[10]&&MATH[t[1]+'_'+t[10]])VAR[gid]=t[1]+'_'+t[10]})}
function mathKey(gid,e){return VAR[gid]||e}
function table(p){return{a:p,tot:p.reduce((s,x)=>s+x[1],0)}}
const MT=table(MV);
function pick(t){let x=rnd()*t.tot;const a=t.a;for(let i=0;i<a.length;i++){x-=a[i][1];if(x<0)return a[i][0]}return a[a.length-1][0]}
const TB={};
function tables(e){if(TB[e])return TB[e];const m=MATH[e];const res=[[],[],[]];
 for(let f=0;f<3;f++)for(let c=0;c<m.cols;c++){const p=[];const W=(f===1&&m.wfs)?m.wfs:m.w;for(const s in W){let w=W[s];if(s==='W'&&!m.wildAll&&(c===0||c===m.cols-1))w=0;if(s==='S'&&m.sOnly!=null&&c!==m.sOnly)w=0;if(s==='S'&&f===2)w*=(m.anteS||1);if(w>0)p.push([s,w])}if(m.mw)p.push(['M',m.mw[f===1?1:0]]);res[f][c]=table(p)}
 return TB[e]=res}
const CT=table(CV);
function coin(){const v=pick(CT);return typeof v==='string'?{s:'C',j:v,v:JP[v]}:{s:'C',v:v}}
function gen(e,c,f){const s=pick(tables(e)[f|0][c]);return s==='M'?{s:'M',v:pick(MT)}:s==='C'?(MATH[e].feat&&MATH[e].feat.collect?{s:'C',v:pick(FVT)}:coin()):{s:s}}
function genGrid(e,f){const m=MATH[e];const g=[];for(let c=0;c<m.cols;c++){const col=[];for(let r=0;r<m.rows;r++){let o=gen(e,c,f);
  if(m.type==='reel'&&o.s==='S'&&col.some(x=>x.s==='S')){do{o=gen(e,c,f)}while(o.s==='S')}col.push(o)}g.push(col)}return g}
function clone(g){return g.map(col=>col.map(o=>Object.assign({},o)))}
function countS(g){let n=0;g.forEach(col=>col.forEach(o=>{if(o.s==='S')n++}));return n}
function force(e,g,n){const m=MATH[e];let tries=0;
 while(countS(g)<n&&tries++<500){const c=Math.floor(rnd()*m.cols),r=Math.floor(rnd()*m.rows);
  if(g[c][r].s==='S')continue;if(m.type==='reel'&&g[c].some(o=>o.s==='S'))continue;g[c][r]={s:'S'}}}
function evClassic(m,g,bet){const lb=bet/5,wins=[];
 LINES3.forEach((ln,li)=>{const ids=ln.map((r,c)=>g[c][r].s);const nw=ids.filter(x=>x==='W').length;
  const wvm=cs=>cs.reduce((p,[c,r])=>p*(g[c][r].s==='W'&&g[c][r].v?g[c][r].v:(g[c][r].s==='W'?2:1)),1);
  if(nw===3){const cl=ln.map((r,c)=>[c,r]);const pm=m.wv?wvm(cl)/8:1;wins.push({li:li,s:'W',n:3,wm:m.wv?wvm(cl):0,amt:m.pay.W[2]*pm*m.k*lb,cells:cl});return}
  const b=ids.find(x=>x!=='W');let n=0;while(n<3&&(ids[n]===b||ids[n]==='W'))n++;
  const p=(m.pay[b]||[])[n-1]||0;if(p){const cl=ln.slice(0,n).map((r,c)=>[c,r]);const w=ids.slice(0,n).filter(x=>x==='W').length;const mm=w?(m.wv?wvm(cl):Math.pow(2,w)):1;wins.push({li:li,s:b,n:n,wm:w?mm:0,amt:p*mm*m.k*lb,cells:cl})}});return wins}
function holdFeature(m,g,bet){// returns frames of the Hold & Win respin feature
 const C=m.cols,R=m.rows;let cur=g.map(col=>col.map(o=>o.s==='C'?Object.assign({},o):{s:'X'}));const frames=[{grid:cur.map(c=>c.map(o=>Object.assign({},o))),left:m.respins,added:[]}];let left=m.respins;
 while(left>0){left--;const added=[];for(let c=0;c<C;c++)for(let r=0;r<R;r++)if(cur[c][r].s==='X'&&rnd()<m.coinP){cur[c][r]=coin();added.push([c,r])}
  if(added.length)left=m.respins;frames.push({grid:cur.map(c=>c.map(o=>Object.assign({},o))),left:left,added:added});
  if(cur.every(col=>col.every(o=>o.s==='C')))break}
 const full=cur.every(col=>col.every(o=>o.s==='C'));let tot=0;cur.forEach(col=>col.forEach(o=>{if(o.s==='C')tot+=o.v}));if(full)tot+=JP.GRAND;
 return{frames:frames,mult:tot,win:tot*bet,grand:full}}
function evLines(m,g,bet,mult){const lb=bet/20,wins=[];
 LINES.forEach((ln,li)=>{const ids=ln.map((r,c)=>g[c][r].s);const b=ids[0];if(!m.pay[b])return;let n=1;while(n<5&&(ids[n]===b||ids[n]==='W'))n++;
  if(n>=3){const p=m.pay[b][n-3];wins.push({li:li,s:b,n:n,amt:p*m.k*lb*mult,cells:ln.slice(0,n).map((r,c)=>[c,r])})}});return wins}
function evWays(m,g,bet,mult){const wins=[];
 SY.forEach(s=>{let n=0,ways=1;const cells=[];for(let c=0;c<(m.cols||5);c++){const hit=[];g[c].forEach((o,r)=>{if(o.s===s||o.s==='W')hit.push([c,r])});
  if(!hit.length||(c===0&&!hit.some(([cc,r])=>g[cc][r].s===s)))break;ways*=hit.length;cells.push.apply(cells,hit);n++}
  if(n>=3)wins.push({s:s,n:n,ways:ways,amt:m.pay[s][n-3]*m.k*bet*ways*mult,cells:cells})});return wins}
function evTumble(m,g,bet){const pos={};g.forEach((col,c)=>col.forEach((o,r)=>{if(o.s!=='S'&&o.s!=='M')(pos[o.s]=pos[o.s]||[]).push([c,r])}));
 const wins=[],remove=[];let win=0;for(const s in pos){const n=pos[s].length;if(n>=8){const t=n>=12?2:n>=10?1:0;const a=m.pay[s][t]*m.k*bet;wins.push({s:s,n:n,amt:a,cells:pos[s]});remove.push.apply(remove,pos[s]);win+=a}}
 return{wins:wins,remove:remove,win:win}}
function evCluster(m,g,bet){const C=m.cols,R=m.rows,seen=new Uint8Array(C*R),wins=[],remove=[];let win=0;
 for(let c=0;c<C;c++)for(let r=0;r<R;r++){const id=c*R+r;if(seen[id])continue;const s=g[c][r].s;if(s==='S'||s==='M'){seen[id]=1;continue}
  const st=[[c,r]],cl=[];seen[id]=1;while(st.length){const p=st.pop();cl.push(p);const nb=[[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]];
   for(const q of nb){if(q[0]<0||q[1]<0||q[0]>=C||q[1]>=R)continue;const qi=q[0]*R+q[1];if(seen[qi]||g[q[0]][q[1]].s!==s)continue;seen[qi]=1;st.push(q)}}
  if(cl.length>=5){const a=m.base[s]*CF[Math.min(cl.length,15)]*m.k*bet;wins.push({s:s,n:cl.length,amt:a,cells:cl});remove.push.apply(remove,cl);win+=a}}
 return{wins:wins,remove:remove,win:win}}
function refill(e,m,g,remove,f){const rm=new Set(remove.map(p=>p[0]*100+p[1]));const ng=[],moves=[];
 for(let c=0;c<m.cols;c++){const keep=[];for(let r=m.rows-1;r>=0;r--)if(!rm.has(c*100+r))keep.push({o:g[c][r],from:r});
  const col=new Array(m.rows),mv=new Array(m.rows);let r=m.rows-1;for(const k of keep){col[r]=k.o;mv[r]=k.from;r--}
  let n=0;while(r>=0){col[r]=gen(e,c,f);mv[r]=-(++n);r--}ng.push(col);moves.push(mv)}
 return{grid:ng,moves:moves}}
const r2=x=>Math.round(x*100)/100;
function capW(x,bet){return r2(Math.min(x,bet*MAXWIN))}
// ===================== FEATURE SLOTS =====================
// Reel games with extra mechanics. A MATH entry with `feat` uses playFeat(). Every random choice happens here,
// so the server decides the whole outcome (incl. pick and wheel bonuses); the client only animates it.
const FV=[[1,30],[2,24],[3,16],[5,12],[10,7],[15,4],[20,3],[25,2],[50,.8],[100,.3],[250,.08]]; // cash-fish values (x bet)
const FVT={a:FV,tot:FV.reduce((s,x)=>s+x[1],0)};
function wpick(arr){const t=arr.reduce((s,x)=>s+x[1],0);let x=rnd()*t;for(const a of arr){x-=a[1];if(x<0)return a[0]}return arr[arr.length-1][0]}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function cellsOf(g,s){const o=[];g.forEach((col,c)=>col.forEach((x,r)=>{if(x.s===s)o.push([c,r])}));return o}
function evalFeat(m,B,g,bet,mult){const wins=(B==='ways'?evWays:evLines)(m,g,bet,mult);
 if(m.feat.wmult&&B!=='ways')wins.forEach(w=>{let p=1;w.cells.forEach(([c,r])=>{const o=g[c][r];if(o.s==='W'&&o.v)p*=o.v});if(p>1){w.amt*=p;w.wm=p}});
 wins.forEach(w=>w.amt=r2(w.amt));return wins}
function playFeat(e,m,B,bet,ctx,f){const F=m.feat,inF=f===1,x=ctx.ext||{};const mult=inF?(x.cmul||m.fsMult):1;
 const grid=genGrid(e,f);if(ctx.buy)force(e,grid,3);
 if(inF&&F.sticky&&x.sticky)x.sticky.forEach(([c,r])=>{grid[c][r]={s:'W'}});
 const steps=[];let total=0;const out={};
 const spinGrid=clone(grid);let g=grid;const fx=[];
 // --- transforms, in a fixed order ---
 if(F.mystery){const q=cellsOf(g,'Q');if(q.length){const to=wpick(F.mystery);q.forEach(([c,r])=>{g[c][r]={s:to}});fx.push({t:'mystery',cells:q,to:to})}}
 if(F.colossal&&rnd()<F.colossal[inF?1:0]){const to=wpick(F.colossalSym||[['h1',1],['h2',2],['h3',3],['h4',3]]);const c0=1;for(let c=c0;c<c0+3;c++)for(let r=0;r<3;r++)g[c][r]={s:to};fx.push({t:'colossal',c0:c0,to:to})}
 if(F.lightning&&rnd()<F.lightning[inF?1:0]){const n=3+Math.floor(rnd()*4),cells=[];let tries=0;while(cells.length<n&&tries++<60){const c=1+Math.floor(rnd()*(m.cols-1)),r=Math.floor(rnd()*m.rows);if(g[c][r].s==='S'||g[c][r].s==='W')continue;g[c][r]={s:'W'};cells.push([c,r])}fx.push({t:'lightning',cells:cells})}
 if(F.wildReel&&rnd()<F.wildReel[inF?1:0]){const k=1+(rnd()<.3?1:0)+(rnd()<.08?1:0);const reels=shuffle([1,2,3]).slice(0,k).sort();reels.forEach(c=>{for(let r=0;r<m.rows;r++)if(g[c][r].s!=='S')g[c][r]={s:'W'}});fx.push({t:'wildreel',reels:reels})}
 if(F.expand){const reels=[];for(let c=0;c<m.cols;c++)if(g[c].some(o=>o.s==='W')&&!g[c].every(o=>o.s==='W'||o.s==='S'))reels.push(c);reels.forEach(c=>{for(let r=0;r<m.rows;r++)if(g[c][r].s!=='S')g[c][r]={s:'W'}});if(reels.length)fx.push({t:'expand',reels:reels})}
 if(F.wmult){const cells=[];g.forEach((col,c)=>col.forEach((o,r)=>{if(o.s==='W'&&!o.v){o.v=wpick(F.wmult);cells.push([c,r,o.v])}}));if(cells.length)fx.push({t:'wmult',cells:cells})}
 let wins=evalFeat(m,B,g,bet,mult);let win=wins.reduce((s,w)=>s+w.amt,0);
 // cash collect: in free spins every wild collects every cash symbol on screen
 let collect=null;if(F.collect&&inF){const W=cellsOf(g,'W').length,C=[];g.forEach((col,c)=>col.forEach((o,r)=>{if(o.s==='C')C.push([c,r,o.v])}));
  if(W&&C.length){const sum=C.reduce((s,z)=>s+z[2],0);const amt=r2(sum*bet*W*(x.cmul||1)*(F.collectK||1));collect={wilds:W,cells:C,sum:sum,amt:amt,mult:x.cmul||1};win+=amt}
  if(W){out.ext=Object.assign({},x);out.ext.wc=(x.wc||0)+W}}
 steps.push({grid:spinGrid,final:g,fx:fx,wins:wins,win:r2(win),collect:collect,mult:inF?mult:null});total+=win;
 // walking wilds: every wild steps one reel left and the reels respin for free until the wilds walk off
 if(F.walk){let walkers=cellsOf(g,'W').filter(([c])=>c>0);let guard=0;while(walkers.length&&guard++<8){const ng=genGrid(e,f);for(let c=0;c<m.cols;c++)for(let r=0;r<m.rows;r++)if(ng[c][r].s==='S')ng[c][r]={s:'l5'};
   walkers.forEach(([c,r])=>{ng[c-1][r]={s:'W'}});const sg=clone(ng);const ws=evalFeat(m,B,ng,bet,mult);const w=ws.reduce((s,z)=>s+z.amt,0);
   steps.push({grid:sg,final:ng,fx:[{t:'walk',cells:walkers.map(([c,r])=>[c-1,r])}],wins:ws,win:r2(w),mult:inF?mult:null,respin:true});total+=w;walkers=cellsOf(ng,'W').filter(([c])=>c>0)}}
 // sticky wilds remember every wild seen during free spins
 if(F.sticky&&inF){const st=(x.sticky||[]).slice();cellsOf(g,'W').forEach(([c,r])=>{if(!st.some(p=>p[0]===c&&p[1]===r))st.push([c,r])});out.ext=Object.assign({},out.ext||x,{sticky:st})}
 // scatters
 const last=steps[0].final;const sc=cellsOf(last,'S');const n=Math.min(sc.length,5);let scPay=0,fsA=0,bonus=null;
 if(n>=3){scPay=r2(m.scat[n]*bet*(inF?mult:1));
  if(F.bonus==='pick'&&!inF){bonus=pickBonus(F,bet,n)}
  else if(F.bonus==='wheel'&&!inF){bonus=wheelBonus(F,bet,n)}
  else fsA=m.fs[n]}
 if(bonus){scPay=r2(scPay+bonus.win)}
 // collect retrigger: every 4 wilds collected → +10 spins and a bigger multiplier
 if(F.collect&&inF&&out.ext){const lv=Math.floor((out.ext.wc||0)/4),old=Math.floor((x.wc||0)/4);if(lv>old&&lv<=3){fsA+=10;out.ext.cmul=[1,2,3,10][lv];out.collectUp={level:lv,mult:out.ext.cmul}}}
 const res={steps:steps,total:capW(total+scPay,bet),lineWin:r2(total),mInfo:null,hold:null,scat:{cells:sc,pay:scPay,trig:n>=3&&!bonus},fsAward:fsA,fsMult:inF?mult:null,bonus:bonus,feat:true};
 if(out.ext)res.ext=out.ext;if(out.collectUp)res.collectUp=out.collectUp;
 if(fsA&&!inF&&F.choose)res.choose=F.choose;
 return res}
// Pick-a-chest: prizes are drawn here; the player opens chests until COLLECT appears (order of clicks doesn't matter).
function pickBonus(F,bet,n){const P=F.pickPrizes||[[2,30],[3,25],[5,20],[8,12],[10,8],[15,5],[25,3],[50,1.2],[100,.3]];const items=[];let tot=0;const picks=n+1+Math.floor(rnd()*3);
 for(let i=0;i<picks;i++){const v=wpick(P);items.push(v);tot+=v}items.push('COLLECT');const m=n===5?3:n===4?2:1;
 return{type:'pick',items:items,mult:m,win:r2(tot*m*bet*(F.pickK||1)),base:tot}}
// Wheel: a stop on UPGRADE moves to the next, richer wheel.
function wheelBonus(F,bet,n){const W=F.wheels||[[[5,1],[10,1],[15,1],[20,1],[25,1],[8,1],[12,1],['UP',1]],[[25,1],[40,1],[50,1],[75,1],[30,1],[60,1],['UP',1],[35,1]],[[100,1],[150,1],[200,1],[250,1],[500,1],[120,1],[300,1],[1000,.4]]];
 let lvl=0;const stops=[];let win=0;while(lvl<W.length){const segs=W[lvl];const t=segs.reduce((s,x)=>s+x[1],0);let x=rnd()*t,i=0;for(;i<segs.length;i++){x-=segs[i][1];if(x<0)break}if(i>=segs.length)i=segs.length-1;
  stops.push({wheel:lvl,i:i,v:segs[i][0]});if(segs[i][0]==='UP'&&lvl<W.length-1){lvl++;continue}win=segs[i][0]==='UP'?segs[0][0]:segs[i][0];break}
 const k=F.wheelK||1;return{type:'wheel',wheels:W.map(s=>s.map(z=>z[0])),stops:stops,mult:win,win:r2(win*bet*k*(n===5?2:1)),x5:n===5}}

function play(e,bet,ctx){ctx=ctx||{};const m=MATH[e],B=m.base||e,f=ctx.inFS?1:(ctx.ante&&m.ante?2:0);
 if(m.type==='reel'&&m.feat)return playFeat(e,m,B,bet,ctx,f);
 if(m.type==='reel'){const grid=genGrid(e,f);if(ctx.buy)force(e,grid,3);const mult=f===1?m.fsMult:1;if(m.wv)grid.forEach(col=>col.forEach(o=>{if(o.s==='W')o.v=wpick(m.wv)}));
  const wins=(B==='classic3'?evClassic:B==='ways'?evWays:evLines)(m,grid,bet,mult);wins.forEach(w=>w.amt=r2(w.amt));let win=wins.reduce((s,w)=>s+w.amt,0);
  let hold=null;if(e==='holdwin'){const nc=grid.flat().filter(o=>o.s==='C').length;if(nc>=m.holdTrig){hold=holdFeature(m,grid,bet);hold.win=r2(hold.win)}}
  const sc=[];grid.forEach((col,c)=>col.forEach((o,r)=>{if(o.s==='S')sc.push([c,r])}));const n=Math.min(sc.length,5);let scPay=0,fsA=0;
  if(n>=3&&m.scat){scPay=r2(m.scat[n]*bet*mult);fsA=m.fs[n]}if(hold)scPay=r2(scPay+hold.win);
  let bonus=null;if(m.wheel&&grid[m.sOnly][1].s==='S'){const segs=m.wheel;const v=wpick(segs);const i=segs.findIndex(z=>z[0]===v);bonus={type:'wheel',wheels:[segs.map(z=>z[0])],stops:[{wheel:0,i:i,v:v}],mult:v,win:r2(v*bet),x5:false};scPay=r2(scPay+bonus.win)}
  const fxw=m.wv?[{t:'wmult',cells:cellsOf(grid,'W').map(([c,r])=>[c,r,grid[c][r].v])}]:[];
  return{steps:[{grid:m.wv?grid.map(col=>col.map(o=>o.s==='W'?{s:'W'}:o)):grid,final:grid,fx:fxw.length&&fxw[0].cells.length?fxw:[],wins:wins,win:r2(win),remove:null,moves:null,mult:f===1?mult:null}],total:capW(win+scPay,bet),lineWin:r2(win),mInfo:null,hold:hold,scat:{cells:sc,pay:scPay,trig:n>=3},fsAward:fsA,fsMult:ctx.fsMult,bonus:bonus,feat:(m.wv||m.wheel)?true:undefined}}
 let grid=genGrid(e,f);if(ctx.buy)force(e,grid,m.fsTrig);const inF=f===1;
 const steps=[];let tw=0,moves=null,mult=e==='cluster'?(inF?(ctx.fsMult||1):1):1;
 for(let i=0;i<80;i++){const ev=(e==='tumble'?evTumble:evCluster)(m,grid,bet);ev.wins.forEach(w=>w.amt=r2(w.amt*(e==='cluster'?mult:1)));
  const st={grid:clone(grid),moves:moves,wins:ev.wins,remove:ev.remove,win:0,mult:null};
  if(ev.win>0){if(e==='cluster'){st.mult=mult;st.win=r2(ev.win*mult);mult++}else st.win=r2(ev.win);tw+=st.win}
  steps.push(st);if(!ev.win)break;const rf=refill(e,m,grid,ev.remove,f);grid=rf.grid;moves=rf.moves}
 let total=tw,mInfo=null,fsMult=ctx.fsMult;
 if(e==='tumble'){const ms=[];grid.forEach((col,c)=>col.forEach((o,r)=>{if(o.s==='M')ms.push([c,r,o.v])}));const sum=ms.reduce((s,x)=>s+x[2],0);
  if(inF){if(tw>0){fsMult=(fsMult||0)+sum;if(fsMult>0){total=tw*fsMult;mInfo={cells:ms,sum:sum,applied:fsMult}}}}
  else if(tw>0&&sum>0){total=tw*sum;mInfo={cells:ms,sum:sum,applied:sum}}}
 else if(inF)fsMult=mult;
 const sc=[];grid.forEach((col,c)=>col.forEach((o,r)=>{if(o.s==='S')sc.push([c,r])}));const n=sc.length;let scPay=0,fsA=0;
 if(!inF&&n>=m.fsTrig){scPay=r2((m.scat[Math.min(n,6)]||0)*bet);fsA=m.fs}else if(inF&&n>=m.refsTrig){fsA=m.refs}
 return{steps:steps,total:capW(total+scPay,bet),lineWin:r2(tw),mInfo:mInfo,scat:{cells:sc,pay:scPay,trig:fsA>0},fsAward:fsA,fsMult:fsMult}}
// One full round incl. balance + free-spin state. Shared by browser (demo mode) and server (authoritative).
function round(st,gid,e,bet,buy,ante,opt){e=VAR[gid]||e;const m=MATH[e];if(!m)return{err:'bad_game'};opt=opt||{};
 if(st.fs&&st.fs.gid===gid&&st.fs.choose){const ch=st.fs.choose[+opt.choice];if(!ch)return{err:'choose',msg:'Choose your free spins',options:st.fs.choose};st.fs.left=ch[0];st.fs.mult=ch[1];st.fs.ext=Object.assign({},st.fs.ext||{},{cmul:ch[1]});delete st.fs.choose;return{chosen:true,fs:Object.assign({},st.fs),bal:st.bal,win:0,cost:0,inFS:false,ev:'chosen'}}
 if(st.fs&&st.fs.gid!==gid)return{err:'fs_pending',gid:st.fs.gid,msg:'Finish your free spins first'};
 const inFS=!!(st.fs&&st.fs.left>0);let cost=0;
 if(inFS){bet=st.fs.bet;buy=false;st.fs.left--}
 else{if(!(bet>0))return{err:'bad_bet'};if(buy&&!m.buy)return{err:'no_buy'};ante=!!(ante&&m.ante&&!buy);cost=r2(buy?bet*m.buy:ante?bet*m.ante:bet);if(st.bal<cost-1e-9)return{err:'funds',msg:'Not enough coins'};st.bal=r2(st.bal-cost)}
 const res=play(e,bet,{inFS:inFS,fsMult:inFS?st.fs.mult:0,buy:!!buy,ante:!inFS&&ante,ext:inFS?(st.fs.ext||{}):null});let capHit=false;
 if(inFS&&st.fs.total+res.total>bet*MAXWIN){res.total=r2(Math.max(0,bet*MAXWIN-st.fs.total));capHit=true}
 st.bal=r2(st.bal+res.total);
 let ev=null,fsTotal=0;
 st.gamble=(!inFS&&!res.fsAward&&res.total>0)?{gid:gid,amt:res.total,bet:bet,n:0}:null;
 if(inFS){st.fs.total=r2(st.fs.total+res.total);if(res.fsMult!=null)st.fs.mult=res.fsMult;if(res.ext)st.fs.ext=res.ext;if(res.fsAward){st.fs.left+=res.fsAward;ev='retrigger'}
  if(capHit){st.fs.left=0;res.fsAward=0;ev=null}if(st.fs.left<=0){fsTotal=st.fs.total;ev='end';st.fs=null}}
 else if(res.fsAward){st.fs={gid:gid,left:res.fsAward,mult:m.fsMultInit,bet:bet,total:0,ext:{}};if(res.choose){st.fs.choose=res.choose;st.fs.left=0}ev='start'}
 return{res:res,bet:bet,cost:cost,win:res.total,bal:st.bal,fs:st.fs?Object.assign({},st.fs):null,ev:ev,fsTotal:fsTotal,inFS:inFS,buy:!!buy,ante:!inFS&&!!ante,capHit:capHit}}

// Double-up gamble after a base-game win: guess the card colour (2x) or suit (4x). Fair odds: 100% return on the gambled amount.
function gamble(st,gid,pick){const gm=st.gamble;if(!gm||gm.gid!==gid)return{err:'no_gamble',msg:'Nothing to gamble'};
 if(gm.n>=5)return{err:'gamble_max',msg:'Gamble limit reached'};const suit=Math.floor(rnd()*4);const red=suit<2;
 const amt=gm.amt;let ok,mult;if(pick==='red'||pick==='black'){ok=(pick==='red')===red;mult=2}else if(['h','d','c','s'].includes(pick)){ok=['h','d','c','s'][suit]===pick;mult=4}else return{err:'bad_pick'};
 if(amt*mult>gm.bet*MAXWIN)return{err:'gamble_cap',msg:'Win too large to gamble'};
 st.bal=r2(st.bal-amt);const win=ok?r2(amt*mult):0;st.bal=r2(st.bal+win);
 if(ok){gm.amt=win;gm.n++}else st.gamble=null;
 return{ok:ok,card:{suit:['h','d','c','s'][suit],rank:['A','2','3','4','5','6','7','8','9','10','J','Q','K'][Math.floor(rnd()*13)]},stake:amt,win:win,amt:ok?win:0,bal:st.bal,left:ok?5-gm.n:0}}
// Player levels: XP = coins played. Level n needs need(n) XP in total.
function need(n){return Math.round(300*Math.pow(n-1,1.6))}
function levelOf(xp){let n=1;while(xp>=need(n+1))n++;return n}
function levelReward(n){return Math.round(50+0.03*(need(n)-need(n-1)))}
function addXp(st,amount){const before=levelOf(st.xp||0);st.xp=r2((st.xp||0)+amount);const after=levelOf(st.xp);let reward=0;for(let l=before+1;l<=after;l++)reward+=levelReward(l);if(reward)st.bal=r2(st.bal+reward);return after>before?{level:after,reward:reward}:null}
function levelInfo(xp){const n=levelOf(xp||0),a=need(n),b=need(n+1);return{level:n,xp:xp||0,cur:(xp||0)-a,span:b-a,next:levelReward(n+1)}}
return{gamble:gamble,FV:FV,setVariants:setVariants,mathKey:mathKey,need:need,levelOf:levelOf,addXp:addXp,levelInfo:levelInfo,MATH:MATH,LINES:LINES,LINES3:LINES3,JP:JP,CF:CF,SY:SY,MAXWIN:MAXWIN,play:play,gen:gen,genGrid:genGrid,round:round};
})();
if(typeof module!=='undefined')module.exports=E;
/*ENGINE-END*/
