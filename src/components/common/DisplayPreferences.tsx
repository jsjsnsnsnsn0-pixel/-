import {useEffect} from 'react';
import {getReducedMotion} from '../../services/displayPreferences';
export function DisplayPreferences(){useEffect(()=>{document.documentElement.dataset.reduceMotion=String(getReducedMotion())},[]);return null}
