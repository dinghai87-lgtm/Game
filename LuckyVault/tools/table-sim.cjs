const TE=require('../public/js/tables-engine.js');
const games=[['blackjack','classic',{main:10}],['blackjack','euro',{main:10}],['blackjack','single',{main:10}],['roulette','eu',{red:10}],['roulette','fr',{red:10}],['roulette','us',{n17:1,d2:5}],
['baccarat','std',{banker:10}],['baccarat','std',{player:10}],['baccarat','nc',{banker:10}],['baccarat','std',{tie:10}],['dragontiger','',{dragon:10}],['sicbo','',{small:10,t10:1,s3:1}],['craps','',{pass:10}],['craps','',{dontpass:10,field:2}],
['videopoker','job',{coins:5,denom:1}],['videopoker','dw',{coins:5,denom:1}],['videopoker','jk',{coins:5,denom:1}],['tcp','',{ante:10,pairplus:5}],['holdem','',{ante:10}],['caribbean','',{ante:10}],['war','',{main:10}],['reddog','',{main:10}],['wheel','',{'1':5,'L':1}],
['keno','classic',{main:1}],['keno','power',{main:1}],['scratch','cash',{main:1}]];
const N=+process.argv[2]||100000;
// simple strategies
function decide(kind,v){
 if(kind==='blackjack'){const h=v.hands[v.cur];const up=v.dealer[0][0];const uv='TJQK'.includes(up)?10:up==='A'?11:+up;const t=h.total;
  if(v.actions.includes('split')&&(h.cards[0][0]==='A'||h.cards[0][0]==='8'))return 'split';
  if(v.actions.includes('double')&&(t===11||(t===10&&uv<10)||(t===9&&uv>=3&&uv<=6))&&!h.soft)return 'double';
  if(h.soft)return t>=19||(t===18&&uv<9)?'stand':'hit';
  if(t>=17)return 'stand';if(t>=13&&uv<=6)return 'stand';if(t===12&&uv>=4&&uv<=6)return 'stand';return 'hit'}
 if(kind==='tcp'){return 'play'} if(kind==='holdem')return 'call'; if(kind==='caribbean')return v.ph!=='High Card'?'raise':'fold';
 if(kind==='war')return 'war'; if(kind==='reddog')return v.spread>=7?'raise':'call'; if(kind==='craps')return 'roll'; if(kind==='videopoker')return 'draw';}
function vpHold(hand){ // naive: hold pairs+ / 4 to flush / high cards
 const r=hand.map(c=>c[0]);const cnt={};r.forEach(x=>cnt[x]=(cnt[x]||0)+1);const h=hand.map(c=>cnt[c[0]]>=2||c[0]==='2'||c==='JK');
 if(h.some(Boolean))return h;const su={};hand.forEach(c=>su[c[1]]=(su[c[1]]||0)+1);const fs=Object.keys(su).find(k=>su[k]>=4);if(fs)return hand.map(c=>c[1]===fs);
 return hand.map(c=>'JQKA'.includes(c[0]))}
for(const [kind,v,b] of games){const st={bal:1e12,tg:null};let cost=0,ret=0,err=0;
 for(let i=0;i<N;i++){let r=TE.round(st,1,kind,v,{a:'deal',bets:b,picks:[3,11,25,40,62]},{min:.1,max:1e6});if(r.err){err++;console.log(kind,r);break}cost+=r.cost;
  let g=0;while(!r.done&&g++<20){const a=decide(kind,r.view);const inp={a};if(kind==='videopoker')inp.hold=vpHold(r.view.hand);r=TE.round(st,1,kind,v,inp);if(r.err){console.log(kind,a,r,JSON.stringify(st.tg&&TE.resume(st,1,kind,v)));err++;break}cost+=r.cost}
  ret+=r.win}
 console.log((kind+' '+v).padEnd(18),JSON.stringify(b).padEnd(26),'RTP',(ret/cost*100).toFixed(2)+'%',err?'ERR':'')}
