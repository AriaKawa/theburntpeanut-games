export const PROFILE_KEY = 'paper-peanut-profile-v1';
export const ARSENAL = {
  whirl: {name:'Goop Burst', icon:'✺', cost:0, clears:0, detail:'Hits all enemies.', short:'Hit all · 2 ✦'},
  propeller: {name:'Propeller Blitz', icon:'✣', cost:3, clears:1, detail:'Hits one enemy. Ignores armor.', short:'Pierce armor · 2 ✦'},
  siphon: {name:'Do Not Come', icon:'❧', cost:6, clears:3, detail:'Hits one enemy. Heals 2 HP; 4 with perfect timing.', short:'Drain + heal · 2 ✦'},
  quake: {name:'Cannonball', icon:'ϟ', cost:9, clears:6, detail:'Throw mini HutchMF. Hits all; breaks armor.', short:'Hit all + crack · 3 ✦'},
};
export function freshProfile() {return {version:1, scrap:0, clears:0, runs:0, best:0, unlocked:['whirl'], equipped:'whirl'};}
export function readProfile(raw) {
  let input; try {input=JSON.parse(raw);} catch {return freshProfile();}
  if (!input || input.version!==1) return freshProfile();
  const profile=freshProfile();
  for(const key of ['scrap','clears','runs','best']) profile[key]=Number.isSafeInteger(input[key])&&input[key]>=0 ? Math.min(input[key],1000000) : 0;
  profile.unlocked=['whirl', ...Object.keys(ARSENAL).filter(key=>key!=='whirl'&&Array.isArray(input.unlocked)&&input.unlocked.includes(key))];
  if(profile.unlocked.includes(input.equipped))profile.equipped=input.equipped;
  return profile;
}
export function rankFor(clears) {
  const ranks=['Pipe Rookie','Scrap Scout','Goop Runner','Depot Legend'];
  const level=Math.min(4,Math.floor(clears/3)+1);
  return {level,name:ranks[level-1],progress:level===4?3:clears%3,next:level===4?null:level*3};
}
export function unlockAbility(profile, key) {
  const ability=ARSENAL[key];
  if(!ability||profile.unlocked.includes(key)||profile.scrap<ability.cost||profile.clears<ability.clears)return false;
  profile.scrap-=ability.cost;profile.unlocked.push(key);profile.equipped=key;return true;
}
export function equipAbility(profile,key) {
  if(!profile.unlocked.includes(key)||!ARSENAL[key])return false;
  profile.equipped=key;return true;
}
export function rewardEncounter(profile,run) {
  if(run.rewarded.includes(run.chapter)||run.enemies.some(enemy=>enemy.hp>0))return 0;
  run.rewarded.push(run.chapter);
  const final=run.chapter===2, scrap=final?4:2;
  profile.scrap+=scrap;profile.clears++;
  if(final){profile.runs++;profile.best=Math.max(profile.best,run.score+run.hp*5);}
  run.pendingUpgrade=!final;
  return scrap;
}
