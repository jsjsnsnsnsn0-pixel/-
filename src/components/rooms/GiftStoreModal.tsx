import React,{useRef,useState} from 'react';
import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import {Room,User} from '../../types';
import {GiftBoxContent} from '../screens/GiftBoxScreen';
interface GiftStoreModalProps{isOpen:boolean;initialRecipient?:User|null;onClose:()=>void;room?:Room|null;onRechargeClick:()=>void}
export const GiftStoreModal:React.FC<GiftStoreModalProps>=({isOpen,initialRecipient,onClose,room,onRechargeClick})=>{
 const layerRef=useDismissableLayer(isOpen,onClose),drag=useRef<number|null>(null),[offset,setOffset]=useState(0);
 if(!isOpen)return null;
 return <div ref={layerRef} className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl"><div className="absolute inset-0 bg-purple-950/15" onClick={onClose}/><section role="dialog" aria-modal="true" aria-label="صندوق الهدايا" className="gift-box-room relative z-10" style={{transform:`translateY(${offset}px)`}}><div role="button" tabIndex={0} aria-label="اسحب للأسفل لإغلاق صندوق الهدايا" className="gift-sheet-handle" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClose()}}} onPointerDown={e=>{drag.current=e.clientY;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current!==null)setOffset(Math.max(0,e.clientY-drag.current))}} onPointerUp={()=>{const close=offset>65;drag.current=null;setOffset(0);if(close)onClose()}} onPointerCancel={()=>{drag.current=null;setOffset(0)}}><span/></div><GiftBoxContent compact initialRecipient={initialRecipient} room={room} onClose={onClose} onRecharge={onRechargeClick}/></section></div>;
};
