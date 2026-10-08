import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,cp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

test('official launcher PNG dimensions match all five Android densities',async()=>{
 for(const [density,scale] of [['mdpi',1],['hdpi',1.5],['xhdpi',2],['xxhdpi',3],['xxxhdpi',4]] as const){
  for(const name of ['ic_launcher','ic_launcher_round','ic_launcher_foreground']){
   const data=await readFile(`resources/android-launcher/mipmap-${density}/${name}.png`);
   assert.equal(data.subarray(1,4).toString(),'PNG');
   const size=(name.endsWith('foreground')?108:48)*scale;
   assert.equal(data.readUInt32BE(16),size);assert.equal(data.readUInt32BE(20),size);
   assert.ok(data.length<200000,'Do not ship a huge original at each density');
  }
 }
});
test('adaptive and round icons reference the official foreground and background',async()=>{
 for(const name of ['ic_launcher','ic_launcher_round']){
  const xml=await readFile(`resources/android-launcher/mipmap-anydpi-v26/${name}.xml`,'utf8');
  assert.match(xml,/@mipmap\/ic_launcher_foreground/);assert.match(xml,/@color\/toti_launcher_background/);
 }
});
test('Android configuration installs official assets repeatedly and preserves application identity and OAuth',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'totichat-icons-'));
 try{
  await mkdir(join(dir,'android/app/src/main/res/drawable-v24'),{recursive:true});
  await writeFile(join(dir,'android/app/src/main/AndroidManifest.xml'),'<manifest package="com.totichat.app"><uses-permission android:name="android.permission.INTERNET"/><application android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"><activity android:launchMode="singleTask"></activity></application></manifest>');
  await cp('resources',join(dir,'resources'),{recursive:true});
  await mkdir(join(dir,'android/app/src/main/res/values'),{recursive:true});
  await writeFile(join(dir,'android/app/build.gradle'),'defaultConfig { versionCode 1; versionName "1.0" }');
  await writeFile(join(dir,'android/app/src/main/res/values/strings.xml'),'<resources><string name="app_name">TotiChat</string></resources>');
  const script=join(process.cwd(),'scripts/configure-android.mjs');
  execFileSync(process.execPath,[script],{cwd:dir,env:{...process.env,TOTICHAT_BETA:'1'}});
  execFileSync(process.execPath,[script],{cwd:dir,env:{...process.env,TOTICHAT_BETA:'1'}});
  const gradle=await readFile(join(dir,'android/app/build.gradle'),'utf8');
  // Read the release identity from the Android configurator so each beta bump
  // is tested against its actual source of truth rather than an old hardcoded beta.
  const config=await readFile(script,'utf8');
  const expectedCode=config.match(/versionCode (\\d+)/)?.[1];
  const expectedName=config.match(/versionName "([^"]+)"/)?.[1];
  assert.ok(expectedCode,'Android versionCode must be defined by the configuration script');
  assert.ok(expectedName,'Android versionName must be defined by the configuration script');
  assert.ok(gradle.includes(`versionCode ${expectedCode}`));
  assert.ok(gradle.includes(`versionName "${expectedName}"`));
  const manifest=await readFile(join(dir,'android/app/src/main/AndroidManifest.xml'),'utf8');
  assert.match(manifest,/package="com.totichat.app"/);assert.match(manifest,/android:scheme="com.totichat.app"/);
  assert.match(manifest,/android:icon="@mipmap\/ic_launcher"/);assert.match(manifest,/android:roundIcon="@mipmap\/ic_launcher_round"/);
  assert.equal((manifest.match(/android.permission.RECORD_AUDIO/g)||[]).length,1);
  assert.deepEqual(await readFile(join(dir,'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png')),await readFile('resources/android-launcher/mipmap-xxxhdpi/ic_launcher_foreground.png'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
