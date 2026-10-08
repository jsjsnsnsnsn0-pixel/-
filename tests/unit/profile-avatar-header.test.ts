import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
test('owner, moderator and member use the same transparent PNG header without account branches',async()=>{
 const temp=await mkdtemp(join(process.cwd(),'.avatar-test-'));
 try{
  await build({stdin:{contents:"export {ProfileAvatarHeader} from './src/components/common/ProfileAvatarHeader';",resolveDir:process.cwd(),loader:'tsx'},outfile:join(temp,'bundle.mjs'),loader:{'.png':'dataurl'},bundle:true,packages:'external',platform:'node',format:'esm'});
  const {ProfileAvatarHeader}=await import(pathToFileURL(join(temp,'bundle.mjs')).href);
  const sources=new Set<string>();
  for(const name of ['دولة العراق','أحمد','ليلى']){
   const dom=new JSDOM(renderToStaticMarkup(React.createElement(ProfileAvatarHeader,{name,avatar:`/${name}.jpg`})));
   const header=dom.window.document.querySelector<HTMLElement>('[data-testid=profile-avatar-header]')!;
   assert.equal(header.style.backgroundColor,'transparent');
   const frame=header.querySelector<HTMLImageElement>('[data-testid=profile-avatar-frame]')!;
   assert.ok(frame.src.startsWith('data:image/png;base64,'));sources.add(frame.src);
   assert.equal(header.querySelector('img:last-child')?.getAttribute('alt'),name);
   assert.equal(header.querySelector('.bg-white'),null);dom.window.close();
  }
  assert.equal(sources.size,1);
  const bytes=await readFile('src/assets/profile-ruby-wings.png');assert.equal(bytes[25],6); // PNG RGBA, not opaque JPEG.
 }finally{await rm(temp,{recursive:true,force:true})}
});
