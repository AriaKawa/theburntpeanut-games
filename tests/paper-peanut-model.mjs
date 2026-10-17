import assert from 'node:assert/strict';
import {CAMPAIGNS,CHAPTERS,freshRun,advanceChapter,applyUpgrade,createContactCommand,pressContact,contactTiming} from '../paper-peanut/engine.mjs';
import {readProfile,freshProfile,rewardEncounter,ARSENAL,unlockAbility,upgradeAbility} from '../paper-peanut/progression.mjs';
const old={version:1,scrap:17,clears:9,runs:3,best:920,unlocked:['whirl','quake'],equipped:'quake'};
const migrated=readProfile(JSON.stringify(old));
for(const key of ['scrap','clears','runs','best','equipped'])assert.equal(migrated[key],old[key]);
assert.deepEqual(migrated.unlocked,old.unlocked);assert.equal(migrated.chapters,2);assert.equal(migrated.chapterBest[0],920);
assert.deepEqual(readProfile(JSON.stringify(migrated)),migrated);assert.equal(readProfile('{').version,2);
const profile=freshProfile();
for(let campaign=0;campaign<3;campaign++){
 const r=freshRun('whirl',campaign);let earned=0;
 do{r.enemies.forEach(e=>e.hp=0);r.score+=100;earned+=rewardEncounter(profile,r);assert.equal(rewardEncounter(profile,r),0);if(r.pendingUpgrade)assert(applyUpgrade(r,'jump'));}while(advanceChapter(r));
 assert.equal(earned,8);assert(profile.chapterBest[campaign]>0);assert.equal(profile.chapters,Math.min(3,campaign+2));
}
assert.equal(CHAPTERS.length,11);assert.equal(CAMPAIGNS.length,3);
const shopper=freshProfile();shopper.scrap=78;shopper.clears=30;
for(const key of Object.keys(ARSENAL)){if(key!=='whirl')assert(unlockAbility(shopper,key));assert(upgradeAbility(shopper,key));assert(upgradeAbility(shopper,key));assert(!upgradeAbility(shopper,key));}
assert.equal(shopper.scrap,0);assert.equal(freshRun('quake',2,shopper.tiers).upgrades.quake,2);
for(const [offset,result] of [[-70,'success'],[-100,'early'],[65,'success'],[66,'late']]){const c=createContactCommand(1000);pressContact(c,1000+offset);assert.equal(contactTiming(c),result);}
console.log('PASS migration, 11 encounters, chapter unlocks/bests, reward idempotence, 78-scrap Arsenal, timing boundaries');
