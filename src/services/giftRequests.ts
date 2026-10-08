// Retain uncertain requests across sheet close/reopen. Retrying the same intent
// uses the server's idempotency UUID; concurrent taps cannot create new sends.
const attempts=new Map<string,{id:string;busy:boolean}>();
export function beginGiftRequest(key:string){const previous=attempts.get(key);if(previous?.busy)return null;const entry=previous||{id:crypto.randomUUID(),busy:false};entry.busy=true;attempts.set(key,entry);return entry.id}
export function finishGiftRequest(key:string,confirmed:boolean){if(confirmed)attempts.delete(key);else{const entry=attempts.get(key);if(entry)entry.busy=false}}

export function hasGiftRequest(key:string){return attempts.has(key)}
