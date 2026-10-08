const key='toti:reduce-motion';
export function getReducedMotion(){try{const value=localStorage.getItem(key);return value===null?Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches):value==='true'}catch{return false}}
export function setReducedMotion(value:boolean){document.documentElement.dataset.reduceMotion=String(value);window.dispatchEvent(new Event('toti:display-preferences'));try{localStorage.setItem(key,String(value));return true}catch{return false}}
