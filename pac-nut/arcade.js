(()=>{
 document.querySelector('.map-picker').append(document.querySelector('.ghost-guide'));
 const $=id=>document.getElementById(id), key='pacnut-leaderboard-v1', initialsKey='pacnut-initials-v1';
 const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
 const clean=v=>String(v||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);
 let entries=read(key,[]);if(!Array.isArray(entries))entries=[];
 entries=entries.filter(e=>e&&/^[A-Z]{3}$/.test(e.name)&&Number.isFinite(e.score)&&e.score>=0).sort((a,b)=>b.score-a.score).slice(0,10);
 let pending=null, saved=false;
 function render(){
  $('score-rows').replaceChildren();
  entries.forEach((e,i)=>{const row=document.createElement('tr');[String(i+1).padStart(2,'0'),e.name,String(e.score).padStart(6,'0'),({classic:'Original',neighborhood:'Neighborhood',scifi:'Sci-fi',fantasy:'Fantasy'})[e.map]||'Original'].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell)});$('score-rows').append(row)});
  if(!entries.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.textContent='BE THE FIRST ON THE BOARD';row.append(cell);$('score-rows').append(row)}
 }
 function save(){
  if(saved||!pending)return true;
  const name=clean($('initials').value);$('initials').value=name;
  if(name.length!==3){$('save-status').textContent='Enter three letters to save your score.';$('initials').focus();return false}
  entries.push({...pending,name});entries.sort((a,b)=>b.score-a.score);entries=entries.slice(0,10);
  const stored=write(key,entries), remembered=write(initialsKey,name);saved=true;
  $('save-status').textContent=stored&&remembered?'SAVED · Initials remembered for next time.':'Saved for this session. Browser storage is unavailable.';
  $('initials-form').querySelector('button').disabled=true;render();return true;
 }
 $('initials').addEventListener('input',()=>{$('initials').value=clean($('initials').value)});
 $('initials-form').addEventListener('submit',e=>{e.preventDefault();save()});
 window.pacnutArcade={show(dead,score,map){$('arcade-scoreboard').hidden=!dead;if(!dead){pending=null;return}if(!pending){pending={score,map};saved=false;$('initials').value=clean(read(initialsKey,''));$('save-status').textContent='Enter three letters · saved on this device';$('initials-form').querySelector('button').disabled=false;render();requestAnimationFrame(()=>{$('initials').focus();$('initials').select()})}},finish:save};
 const hintKey='pacnut-fullscreen-hint-dismissed-v1';let dismissed=false;
 function restore(){try{dismissed=dismissed||localStorage.getItem(hintKey)==='1'}catch{}$('fullscreen-hint').hidden=dismissed}
 function dismiss(){dismissed=true;$('fullscreen-hint').hidden=true;try{localStorage.setItem(hintKey,'1')}catch{}}
 function fullscreenUI(on){document.body.classList.toggle('fullscreen',on);$('fullscreen').setAttribute('aria-pressed',String(on));$('fullscreen').setAttribute('aria-label',on?'Exit fullscreen game':'Enter fullscreen game')}
 $('fullscreen').addEventListener('pointerenter',dismiss);
 $('fullscreen').addEventListener('click',async()=>{dismiss();const on=!document.body.classList.contains('fullscreen');fullscreenUI(on);try{if(on)await document.documentElement.requestFullscreen?.();else if(document.fullscreenElement)await document.exitFullscreen()}catch{}});
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)fullscreenUI(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')fullscreenUI(false)});
 window.addEventListener('pageshow',restore);window.addEventListener('storage',e=>{if(e.key===hintKey&&e.newValue==='1'){dismissed=true;restore()}});restore();
})();
