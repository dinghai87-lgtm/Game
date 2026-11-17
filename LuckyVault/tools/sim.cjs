const E=require(process.env.ENG||__dirname+'/../public/js/slots-engine.js');
const e=process.argv[2],N=+process.argv[3]||200000,mode=process.argv[4]||'base';const m=E.MATH[e];
// mode: base | ante | buy  — uses E.round so it measures exactly what players get
let st={bal:1e12,fs:null},cost=0,ret=0,hits=0,trig=0,maxX=0,rounds=0,sq=0,big=0;let cur=0;
for(let i=0;i<N;i++){
 const r=E.round(st,0,e,1,mode==='buy',mode==='ante');if(r.err){console.log(r);break}
 cost+=r.cost;ret+=r.win;cur+=r.win;if(!r.inFS&&r.win>0)hits++;if(r.ev==='start'||r.res.hold)trig++;
 while(st.fs){const x=E.round(st,0,e,1,false,false);ret+=x.win;cur+=x.win}
 maxX=Math.max(maxX,cur);sq+=cur*cur;if(cur>=100)big++;cur=0;rounds++}
console.log(e.padEnd(8),mode.padEnd(5),'RTP',(ret/cost*100).toFixed(2)+'%','hit',(hits/rounds*100).toFixed(1)+'%','FS 1 in',(rounds/Math.max(1,trig)).toFixed(0),'max',maxX.toFixed(0)+'x','SD',Math.sqrt(sq/rounds-(ret/rounds)**2).toFixed(2),'100x+ 1 in',(rounds/Math.max(1,big)).toFixed(0),'N',rounds);
