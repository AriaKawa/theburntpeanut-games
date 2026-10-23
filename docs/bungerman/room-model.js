export const SKINS=['peanut','hutch','ninja','tpain'];
export function members(room){return Object.entries(room?.players||{}).filter(([,p])=>p?.uid).map(([slot,p])=>({...p,slot:Number(slot)})).sort((a,b)=>a.slot-b.slot);}
export function allReady(room){const list=members(room);return list.length>=2&&list.length<=4&&list.every(p=>p.ready===true);}
export function nextPhase(room,now){if(room?.closed)return null;if(room.phase?.name==='lobby'&&allReady(room))return {name:'countdown',startAt:now+3000};if(room.phase?.name==='countdown'){if(!allReady(room))return {name:'lobby',startAt:0};if(now>=room.phase.startAt)return {name:'playing',startAt:room.phase.startAt};}return null;}
export function cleanCode(value){return String(value).trim().toUpperCase().replace(/[^A-Z2-9]/g,'');}
