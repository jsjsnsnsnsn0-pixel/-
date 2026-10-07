import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const url=process.env.VITE_SUPABASE_URL?.trim();
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
if(!url||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('Missing valid VITE_SUPABASE_URL');
if(!key||!(key.startsWith('sb_publishable_')||key.startsWith('eyJ')))throw Error('Missing PUBLIC VITE_SUPABASE_PUBLISHABLE_KEY. Never use service_role or secret keys.');
await mkdir('dist',{recursive:true});
await Promise.all(['index.html','app.js','styles.css'].map(f=>copyFile(f,'dist/'+f)));
await writeFile('dist/config.js','window.TOTICHAT_ADMIN_CONFIG='+JSON.stringify({url,key})+';\n');
console.log('Standalone dashboard built. Public keys only.');
