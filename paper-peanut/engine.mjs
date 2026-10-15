export const MOVES = {
  jump: { name: 'Jump', base: 3, cost: 0 },
  bonk: { name: 'Shell Slam', base: 4, cost: 0 },
  whirl: { name: 'Goop Burst', base: 3, cost: 2 },
  propeller: { name: 'Propeller Blitz', base: 5, cost: 2, pierce: true },
  siphon: { name: 'Do Not Come', base: 4, cost: 2 },
  quake: { name: 'Cannonball', base: 5, cost: 3, pierce: true },
};
export const CHAPTERS = [
  { title: 'The rats want your goop.', subtitle: 'THE GOOP DEPOT', enemies: [ ['scrapper', 7], ['slinger', 8] ] },
  { title: 'A little scrap trouble.', subtitle: 'RAT RUN ALLEY', enemies: [ ['slinger', 10], ['scrapper', 10], ['slinger', 9] ] },
  { title: 'The boss of the pipes.', subtitle: 'THE BARON’S STASH', enemies: [ ['slinger', 10], ['baron', 25] ] },
];
export const ENEMIES = {
  scrapper: { name: 'Scrapper', attack: 'Gutter Pounce', power: 3 },
  slinger: { name: 'Bolt Slinger', attack: 'Scrap Shot', power: 3 },
  baron: { name: 'Scrap Baron', attack: 'Barrel Roll', power: 5 },
};
export function makeEnemies(chapter) {
  return CHAPTERS[chapter].enemies.map(([kind, hp], id) => ({ id, kind, hp, maxHp: hp, armor: kind === 'baron', ...ENEMIES[kind] }));
}
export function attackDamage(move, grade, enemy, level = 0) {
  if (move === 'jump') return jumpHits(grade === 'success' || grade === 'perfect', enemy, level).reduce((sum, hit) => sum + hit, 0);
  const base = MOVES[move].base + level;
  const bonus = grade === 'perfect' ? 2 : grade === 'good' ? 1 : 0;
  const armor = enemy.armor && move !== 'bonk' && !MOVES[move].pierce ? 2 : 0;
  return Math.max(1, base + bonus - armor);
}
export function incomingDamage(enemy, grade) {
  const base = enemy.power ?? ENEMIES[enemy.kind]?.power ?? 3;
  return grade === 'perfect' ? 0 : Math.max(0, base - (grade === 'good' ? 2 : 0));
}
// TTYD-style ordinary Jump: one hit, or two equal hits on command success.
// Defense applies to each stomp separately. Three power fits this game's HP scale.
export function jumpHits(success, enemy, level = 0) {
  const damage = Math.max(0, MOVES.jump.base + level - (enemy.defense ?? (enemy.armor ? 2 : 0)));
  return success ? [damage, damage] : [damage];
}
// Every command is anchored to physical contact, never a moving meter.
// A small grace period accommodates a press on the rendered contact frame.
export const CONTACT_WINDOW_MS = 8 * 1000 / 60;
export const CONTACT_GRACE_MS = 65;
export const PACE = Object.freeze({ jumpWindup: 300 / 1.6, jumpFlight: 1250 / 1.6, jumpBounce: 360 / 1.6, jumpReturn: 420 / 1.6, slamWindup: 420, slamTravel: 1000, burstWindup: 450, burstFlight: 1000, enemyWindup: 500, enemyTravel: 1100 });
export function createContactCommand(contactAt, relaxed = false) {
  return { contactAt, windowMs: relaxed ? 220 : CONTACT_WINDOW_MS, inputAt: null };
}
export function pressContact(command, now) {
  if (command.inputAt === null) command.inputAt = now;
}
export function contactTiming(command) {
  if (command.inputAt === null) return 'miss';
  const remaining = command.contactAt - command.inputAt;
  if (remaining < -CONTACT_GRACE_MS) return 'late';
  return remaining <= command.windowMs ? 'success' : 'early';
}
export function jumpPose(p, startX, startY, landX, landY, apexY) {
  const across = Math.min(1, p / .76);
  const x = startX + (landX - startX) * across * across * (3 - 2 * across);
  const rise = Math.min(1, p / .48), fall = Math.max(0, (p - .48) / .52);
  const y = p <= .48 ? startY + (apexY - startY) * (1 - (1-rise)**2) : apexY + (landY-apexY) * fall * fall;
  return { x, y };
}
export function hitEnemy(enemy, damage, move) {
  enemy.hp = Math.max(0, enemy.hp - damage);
  if (move === 'bonk' || move === 'quake') enemy.armor = false;
}
export function freshRun(special = 'whirl') {
  if (!['whirl', 'propeller', 'siphon', 'quake'].includes(special)) special = 'whirl';
  return { hp: 20, maxHp: 20, sp: 4, maxSp: 4, cheese: 2, chapter: 0, round: 1, perfect: 0, blocks: 0, score: 0, special, upgrades: {jump:0, bonk:0, [special]:0}, rewarded: [], pendingUpgrade: false, enemies: makeEnemies(0) };
}
export function applyUpgrade(run, move) {
  if (!run.pendingUpgrade || !['jump', 'bonk', run.special].includes(move)) return false;
  run.upgrades[move] = (run.upgrades[move] || 0) + 1;
  run.pendingUpgrade = false;
  return true;
}
export function advanceChapter(run) {
  if (run.chapter >= CHAPTERS.length - 1) return false;
  run.chapter++;
  run.hp = Math.min(run.maxHp, run.hp + 7);
  run.sp = Math.min(run.maxSp, run.sp + 2);
  run.cheese = Math.min(3, run.cheese + 1);
  run.round = 1;
  run.enemies = makeEnemies(run.chapter);
  return true;
}
