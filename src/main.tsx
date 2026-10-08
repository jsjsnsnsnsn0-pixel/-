import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import StandalonePreview from './ui-preview/StandalonePreview.tsx';
import './index.css';
import './modern.css';
createRoot(document.getElementById('root')!).render(<StrictMode><StandalonePreview/></StrictMode>);
