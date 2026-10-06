import {useEffect,useRef} from 'react';
import {isTopOverlay,registerOverlay} from '../services/overlayNavigation';

let scrollLocks=0;
let previousOverflow='';
export function useDismissableLayer(open:boolean,onClose:()=>void) {
  const layerRef=useRef<HTMLDivElement>(null);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    if(!open)return;
    const layer=registerOverlay(()=>closeRef.current());
    const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    if(scrollLocks++===0){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    const focusable=()=>[...(layerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')||[])].filter(el=>!el.closest('[hidden],[aria-hidden="true"]'));
    const frame=requestAnimationFrame(()=>{if(isTopOverlay(layer.token))focusable()[0]?.focus({preventScroll:true});});
    const onKey=(event:KeyboardEvent)=>{
      if(!isTopOverlay(layer.token)||event.defaultPrevented)return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeRef.current();}
      if(event.key==='Tab'){
        const elements=focusable();const first=elements[0],last=elements.at(-1);
        if(!first){event.preventDefault();return;}
        if(event.shiftKey&&(document.activeElement===first||!layerRef.current?.contains(document.activeElement))){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||!layerRef.current?.contains(document.activeElement))){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',onKey,true);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',onKey,true);layer.remove();if(--scrollLocks===0)document.body.style.overflow=previousOverflow;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});};
  },[open]);
  return layerRef;
}
