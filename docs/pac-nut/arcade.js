(()=>{
 document.querySelector('.map-picker').append(document.querySelector('.ghost-guide'));
 const $=id=>document.getElementById(id), initialsKey='pacnut-initials-v1';
 const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
 const clean=v=>String(v||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);
 let entries=[],pending=null,saved=false,inFlight=null,revision=0;
 function render(message){$('score-rows').replaceChildren();entries.forEach((e,i)=>{const row=document.createElement('tr');[String(i+1).padStart(2,'0'),e.name,String(e.score).padStart(6,'0')].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell)});$('score-rows').append(row)});if(!entries.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=3;cell.textContent=message||'BE THE FIRST ON THIS MAP';row.append(cell);$('score-rows').append(row)}}
 async function refresh(map,version){try{const rows=await PacnutScores.fetchBoard(map);if(version!==revision)return;entries=rows;render()}catch{if(version===revision){entries=[];render('ONLINE SCORES UNAVAILABLE · REOPEN TO RETRY')}}}
 async function save(){
  if(saved||!pending)return true;
  if(inFlight)return inFlight;
  if(pending.score===0){saved=true;return true}
  const name=clean($('initials').value);$('initials').value=name;
  if(name.length!==3){$('save-status').textContent='Enter three letters to save your score.';$('initials').focus();return false}
  const remembered=write(initialsKey,name);const run=pending,version=revision;run.entry??={id:run.map+'_'+crypto.randomUUID(),score:run.score,level:run.level,date:new Date().toISOString(),name};
  $('initials').disabled=true;$('initials-form').querySelector('button').disabled=true;$('save-status').textContent='Saving online…';
  inFlight=(async()=>{try{await PacnutScores.submit(run.entry,run.map);if(version!==revision)return false;saved=true;$('save-status').textContent=remembered?'SAVED ONLINE · Initials remembered on this device.':'SAVED ONLINE · Browser storage is unavailable.';await refresh(run.map,version);return true}catch{if(version===revision){$('save-status').textContent='Not saved online. Check your connection and retry.';$('initials-form').querySelector('button').disabled=false}return false}finally{inFlight=null}})();return inFlight;
 }
 $('initials').addEventListener('input',()=>{$('initials').value=clean($('initials').value);if($('initials').value.length===3)write(initialsKey,$('initials').value)});
 $('initials-form').addEventListener('submit',e=>{e.preventDefault();void save()});
 window.pacnutArcade={show(dead,score,map,level=1){$('arcade-scoreboard').hidden=!dead;if(!dead){pending=null;++revision;return}if(!pending){pending={score,map,level};saved=false;entries=[];++revision;$('initials').disabled=false;$('initials').value=clean(read(initialsKey,''));document.querySelector('.board-caption').textContent=PacnutScores.maps[map]+' · ONLINE TOP 10';$('save-status').textContent=score?'Enter three letters · shared online scores':'Score some points to join this map’s board.';$('initials-form').querySelector('button').disabled=!score;render('LOADING ONLINE SCORES…');void refresh(map,revision);requestAnimationFrame(()=>{$('initials').focus();$('initials').select()})}},finish:save};
 const hintKey='pacnut-fullscreen-hint-dismissed-v2';let dismissed=false;
 function restore(){try{dismissed=dismissed||localStorage.getItem(hintKey)==='1'}catch{}$('fullscreen-hint').hidden=dismissed}
 function dismiss(){dismissed=true;$('fullscreen-hint').hidden=true;try{localStorage.setItem(hintKey,'1')}catch{}}
 $('fullscreen').addEventListener('pointerenter',dismiss);
 window.addEventListener('pageshow',restore);
 window.addEventListener('storage',e=>{if(e.key===hintKey&&e.newValue==='1'){dismissed=true;restore()}});restore();
 function fullscreenUI(on){document.body.classList.toggle('fullscreen',on);$('fullscreen').setAttribute('aria-pressed',String(on));$('fullscreen').setAttribute('aria-label',on?'Exit fullscreen game':'Enter fullscreen game')}
 $('fullscreen').addEventListener('click',async()=>{dismiss();const on=!document.body.classList.contains('fullscreen');fullscreenUI(on);try{if(on)await document.documentElement.requestFullscreen?.();else if(document.fullscreenElement)await document.exitFullscreen()}catch{}});
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)fullscreenUI(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')fullscreenUI(false)});

})();
