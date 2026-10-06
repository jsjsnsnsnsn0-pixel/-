import {useEffect,useRef} from 'react';
import {Capacitor} from '@capacitor/core';
import {useApp} from '../../context/AppContext';
import {backDestination,dismissTopOverlay} from '../../services/overlayNavigation';

export function NativeBackNavigation() {
  const context=useApp();const current=useRef(context);current.current=context;
  useEffect(()=>{
    if(!Capacitor.isNativePlatform())return;
    let disposed=false;
    const listener=import('@capacitor/app').then(({App})=>App.addListener('backButton',()=>{
      if(disposed||dismissTopOverlay())return;
      const state=current.current;
      switch(backDestination({subScreen:state.activeSubScreen,tab:state.activeTab,inRoom:Boolean(state.activeRoom)})){
        case 'screen':state.setActiveSubScreen(null);break;
        case 'home':state.setActiveTab('home');break;
        case 'room-options':window.dispatchEvent(new Event('toti:room-options'));break;
        case 'minimize-app':void App.minimizeApp();break;
      }
    }));
    return()=>{disposed=true;void listener.then(handle=>handle.remove());};
  },[]);
  return null;
}
