import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const url=process.env.VITE_SUPABASE_URL?.trim();
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
if(!url||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)){
 throw Error('Set VITE_SUPABASE_URL to the existing TotiChat Supabase project URL.');
}
if(url!=='https://bfadhdnudmsggylunhlh.supabase.co'){
 throw Error('Refusing to connect this dashboard to any database other than TotiChat.');
}
if(!key||!key.startsWith('sb_publishable_')){
 throw Error('Only the sb_publishable_ public key is allowed. Never use service_role, anon JWT, or secret keys.');
}
const files=[
 'index.html','app.js','oauth-url.js','styles.css','context.js','ui.js',
 'pages-core.js','pages-wallet.js','pages-monitoring.js',
 'pages-admin.js','pages-roles.js','pages-agencies.js',
 'pages-catalog.js','pages-moderation.js','pages-finance.js'
];
await mkdir('dist',{recursive:true});
await Promise.all(files.map(f=>copyFile(f,'dist/'+f)));
await writeFile('dist/config.js','window.TOTICHAT_ADMIN_CONFIG='+JSON.stringify({url,key})+';\n');
console.log('Standalone dashboard built; only the public Supabase key is embedded.');
