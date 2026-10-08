import React,{useEffect,useState} from 'react';
import {ProfileRelationship,RoomPublicProfile} from '../../services/roomPublicProfile';
import {defaultAvatar} from '../../services/profile';
import {setImageFallback} from '../../utils/imageFallback';
import './relationship.css';
export function relationshipDays(relation:ProfileRelationship,now=Date.now()):number|undefined {
 const start=Date.parse(relation.startedAt);
 if(!Number.isFinite(start))return undefined;
 return Math.max(0,Math.floor((now-start)/86400000));
}
export function RelationshipCard({subject,relation,onPartner,onDetails,compact=false}:{subject:RoomPublicProfile;relation:ProfileRelationship;onPartner?:(partner:RoomPublicProfile)=>void;onDetails?:()=>void;compact?:boolean}){
 const [elapsed,setElapsed]=useState(0);
 useEffect(()=>{setElapsed(0);const started=Date.now();const t=setInterval(()=>setElapsed(Date.now()-started),60000);return()=>clearInterval(t)},[relation.id,relation.serverNow]);
 const days=relation.serverNow?relationshipDays(relation,Date.parse(relation.serverNow)+elapsed):relation.days;
 const rank=relation.experience!==undefined&&relation.thresholds.length?relation.thresholds.filter(t=>t<=relation.experience!).length-1:undefined;
 const next=rank!==undefined?relation.thresholds[rank+1]:undefined;
 const person=(p:RoomPublicProfile)=> <><img src={p.avatar} alt={p.avatar===defaultAvatar?'صورة افتراضية':p.name} onError={e=>setImageFallback(e,defaultAvatar)}/><span title={p.name}>{p.name}</span>{p.level!==undefined&&<small>LV.{p.level}</small>}</>;
 return <section data-testid="profile-couple" className={`relationship-card ${compact?'relationship-compact':''}`} style={{'--relationship-accent':relation.presentation.accent||'#fb7185','--relationship-bg':relation.presentation.background||'#581c40'} as React.CSSProperties} data-frame={relation.presentation.frame} aria-label={`علاقة ${relation.label}`}>
 <div className="relationship-person">{person(subject)}</div>
 <div className="relationship-center"><button type="button" disabled={!onDetails} onClick={onDetails} aria-label={`تفاصيل علاقة ${relation.label}`}><span className="relationship-symbol" aria-hidden="true">{relation.presentation.icon||'♡'}</span><strong>{days!==undefined?`${days} يوم`:''}</strong><span>{relation.label}</span></button>{rank!==undefined&&rank>=0&&<small>مستوى العلاقة {rank}</small>}{relation.experience!==undefined&&next!==undefined&&<><progress aria-label="خبرة العلاقة" value={relation.experience} max={next}/><small>{relation.experience} / {next} EXP</small></>}</div>
 {onPartner?<button type="button" className="relationship-person" aria-label={`زيارة ملف ${relation.partner.name}`} onClick={()=>onPartner(relation.partner)}>{person(relation.partner)}</button>:<div className="relationship-person">{person(relation.partner)}</div>}
 </section>;
}
export function RelationshipDetails({relation}:{relation:ProfileRelationship}){
 return <div className="rounded-2xl p-4 mt-2 bg-white/5 text-sm space-y-2" aria-label="تفاصيل العلاقة"><p>{relation.label} · منذ {new Date(relation.startedAt).toLocaleDateString('ar-IQ')}</p>{relation.experience!==undefined&&<p>EXP: {relation.experience}</p>}</div>;
}
