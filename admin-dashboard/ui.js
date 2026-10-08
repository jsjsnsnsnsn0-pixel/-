export function el(tag,props={},...children){
 const n=document.createElement(tag);
 for(const [key,value] of Object.entries(props)){
  if(value==null||value===false)continue;
  if(key==='class')n.className=value;
  else if(key==='value')n.value=value;
  else if(key==='checked')n.checked=!!value;
  else if(key==='disabled')n.disabled=!!value;
  else if(key.startsWith('on')&&typeof value==='function')n.addEventListener(key.slice(2),value);
  else n.setAttribute(key,value===true?'':String(value));
 }
 for(const item of children.flat(8)){
  if(item==null||item===false)continue;
  n.append(item instanceof Node?item:document.createTextNode(String(item)));
 }
 return n;
}
export const box=(cls,...children)=>el('div',{class:cls},...children);
export const title=s=>el('h2',{},s);
export const note=s=>el('p',{class:'muted'},s);
export const panel=(...children)=>box('panel',...children);
export const btn=(label,callback,cls='btn',disabled=false)=>el('button',{type:'button',class:cls,disabled,onclick:callback},label);
export const field=(label,type='text',value='')=>{
 const input=el('input',{type,value,autocomplete:type==='password'?'current-password':'off'});
 return {input,label:el('label',{class:'field'},el('span',{},label),input)};
};
export const list=()=>box('list');
export const money=value=>Number(value||0).toLocaleString('ar-IQ');
export const date=value=>value?new Date(value).toLocaleString('ar-IQ'):'—';
export const metric=(name,n)=>box('metric',note(name),el('b',{},money(n)));
export function rows(container,records,render,none='لا توجد بيانات مسجلة.'){
 const outer=list();for(const r of records||[])outer.append(render(r));
 container.append(outer.childNodes.length?outer:note(none));
}
export function toNumber(value){const n=Number(value);return Number.isSafeInteger(n)?n:NaN}
