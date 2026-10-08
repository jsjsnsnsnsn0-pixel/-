import React,{type ReactNode,useState} from 'react';
import {RealtimeRankingsContext} from './RealtimeRankingsContext';
export function RealtimeRankingsProvider({children}:{children:ReactNode}){
 const [period,setPeriod]=useState<'daily'|'weekly'|'monthly'>('daily');
 const mock={wealthRankings:[],charmRankings:[],roomRankings:[],period,setPeriod,recordGiftSupport:()=>{},resetRankings:()=>{}} as any;
 return <RealtimeRankingsContext.Provider value={mock}>{children}</RealtimeRankingsContext.Provider>;
}
