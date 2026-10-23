/* Pac-Nut community leaderboard, stored in the AriaKawa games' shared Firebase Realtime Database. */
'use strict';
(()=>{
const DB='https://multiplayer-640ec-default-rtdb.firebaseio.com/pacnutLeaderboardV1',LIMIT=50,NAME_KEY='pacnut-name',MINE_KEY='pacnut-posted';
const FIREBASE={apiKey:'AIzaSyDRniZatGeylxphjHQadYjucOcirNBRIdk',authDomain:'multiplayer-640ec.firebaseapp.com',projectId:'multiplayer-640ec'};
const q=s=>document.querySelector(s),form=q('#post-score'),nameInput=q('#player-name'),board=q('#board'),list=q('#board-list');
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const valid=r=>!!r&&typeof r==='object'&&typeof r.id==='string'&&typeof r.name==='string'&&r.name.length>=1&&r.name.length<=16&&Number.isSafeInteger(r.score)&&r.score>0&&r.score<=9999999&&Number.isSafeInteger(r.level)&&r.level>=1&&r.level<=999&&typeof r.date==='string';
const ranked=rows=>rows.filter(valid).sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date)).slice(0,LIMIT);
const cleanName=s=>s.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,16);
let result=null,highlight=null,userPromise=null;

// Keys are zero-padded scores, so the top scores are the last keys without a custom index.
async function fetchBoard(){const res=await fetch(DB+'.json?orderBy=%22%24key%22&limitToLast='+LIMIT,{signal:AbortSignal.timeout(10000)});if(!res.ok)throw new Error('board');return ranked(Object.values(await res.json()??{}))}
function player(){return userPromise??=(async()=>{const v='12.7.0',[apps,auths]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`)]);const app=apps.getApps().find(a=>a.name==='pacnut')??apps.initializeApp(FIREBASE,'pacnut'),auth=auths.getAuth(app);await auth.authStateReady();return auth.currentUser??(await auths.signInAnonymously(auth)).user})().catch(e=>{userPromise=null;throw e})}
async function submit(entry){const user=await player(),token=await user.getIdToken(),key=String(entry.score).padStart(8,'0')+'_'+entry.id;const res=await fetch(DB+'/'+key+'.json?auth='+encodeURIComponent(token),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...entry,uid:user.uid}),signal:AbortSignal.timeout(10000)});if(!res.ok)throw new Error('post')}

function render(rows){const mine=new Set(read(MINE_KEY,[]));list.replaceChildren(...rows.map((r,i)=>{const li=document.createElement('li');if(mine.has(r.id))li.classList.add('mine');if(r.id===highlight)li.classList.add('fresh');for(const [cls,text] of [['rank',i+1],['name',r.name],['level','L'+r.level],['points',r.score.toLocaleString()]]){const span=document.createElement('span');span.className=cls;span.textContent=text;li.append(span)}return li}));q('#board-status').textContent=rows.length?'':'No scores yet. Be the first nut on the board.'}
async function openBoard(){if(mode==='playing')pause();board.hidden=false;q('#board-close').focus({preventScroll:true});q('#board-status').textContent='Loading…';try{const rows=await fetchBoard();render(rows);board.querySelector('.fresh')?.scrollIntoView({block:'center'})}catch{list.replaceChildren();q('#board-status').textContent='The board is offline right now. Try again in a bit.'}}
function closeBoard(){board.hidden=true;highlight=null;q('#board-open').focus({preventScroll:true})}

document.addEventListener('pacnut:overlay',e=>{const {mode:m,score:s,level:l}=e.detail,over=m==='over';q('#overlay').classList.toggle('over',over);form.hidden=!over;if(!over)return;result=s>0?{id:crypto.randomUUID(),score:s,level:l,date:new Date().toISOString()}:null;q('#final-score').textContent=s.toLocaleString()+' points · level '+l;q('#post-status').textContent=result?'':'Score some points to make the board.';form.querySelector('.post-row').hidden=!result;nameInput.value=read(NAME_KEY,'')});
form.addEventListener('submit',async e=>{e.preventDefault();if(!result)return;const name=cleanName(nameInput.value);if(!name){q('#post-status').textContent='Enter a name first.';nameInput.focus();return}const entry={...result,name},button=form.querySelector('button[type=submit]');button.disabled=true;q('#post-status').textContent='Posting…';try{await submit(entry);write(NAME_KEY,name);write(MINE_KEY,[...read(MINE_KEY,[]),entry.id].slice(-50));highlight=entry.id;result=null;form.querySelector('.post-row').hidden=true;q('#post-status').textContent='Posted!';openBoard()}catch{q('#post-status').textContent='Couldn’t post. Check your connection and try again.'}finally{button.disabled=false}});
q('#board-open').addEventListener('click',openBoard);q('#board-view').addEventListener('click',openBoard);q('#board-close').addEventListener('click',closeBoard);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!board.hidden){e.preventDefault();closeBoard()}});
})();
