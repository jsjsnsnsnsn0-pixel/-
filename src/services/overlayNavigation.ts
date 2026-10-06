const layers = new Map<symbol, () => void>();

export function registerOverlay(onClose: () => void) {
  const token = Symbol('overlay');
  layers.set(token,onClose);
  return {token,remove:()=>{layers.delete(token);}};
}
export function isTopOverlay(token:symbol) { return [...layers.keys()].at(-1)===token; }
export function dismissTopOverlay() {
  const close=[...layers.values()].at(-1);
  if(!close)return false;
  close();return true;
}

export function backDestination(state:{subScreen:string|null;tab:string;inRoom:boolean}) {
  if(state.subScreen)return 'screen';
  if(state.inRoom)return 'room-options';
  if(state.tab!=='home')return 'home';
  return 'minimize-app';
}
