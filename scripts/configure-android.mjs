import {readFile,writeFile,cp,rm} from 'node:fs/promises';
const path='android/app/src/main/AndroidManifest.xml';
let xml=await readFile(path,'utf8');
for (const permission of ['RECORD_AUDIO','MODIFY_AUDIO_SETTINGS']) {
  if (!xml.includes(`android.permission.${permission}`)) xml=xml.replace('<application',`<uses-permission android:name="android.permission.${permission}" />\n    <application`);
}
if (!xml.includes('android:windowSoftInputMode=')) xml=xml.replace('android:launchMode="singleTask"', 'android:launchMode="singleTask"\n            android:windowSoftInputMode="adjustResize"');
if (!xml.includes('android:scheme="com.totichat.app"')) xml=xml.replace('</activity>',`<intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.totichat.app" android:host="auth" android:pathPrefix="/callback" />
            </intent-filter>
        </activity>`);
await writeFile(path,xml);
for (const permission of ['INTERNET','RECORD_AUDIO','MODIFY_AUDIO_SETTINGS']) if(!xml.includes(`android.permission.${permission}`)) throw new Error(`Android permission missing: ${permission}`);
console.log('Android microphone, audio routing, Internet, keyboard resize and OAuth callback configured.');
await rm('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml', {force:true});
await cp('resources/android-launcher','android/app/src/main/res',{recursive:true});
for (const attribute of ['icon','roundIcon']) {
  const target = attribute === 'icon' ? 'ic_launcher' : 'ic_launcher_round';
  const expression = new RegExp(`android:${attribute}="[^"]*"`);
  if (expression.test(xml)) xml=xml.replace(expression,`android:${attribute}="@mipmap/${target}"`);
  else xml=xml.replace('<application',`<application android:${attribute}="@mipmap/${target}"`);
}
await writeFile(path,xml);
console.log('Official falcon launcher and adaptive icons installed; application ID preserved.');

if (process.env.TOTICHAT_BETA === '1') {
  const gradlePath='android/app/build.gradle';
  let gradle=await readFile(gradlePath,'utf8');
  if (!/versionCode\s+\d+/.test(gradle) || !/versionName\s+["'][^"']+["']/.test(gradle)) {
    throw new Error('Android beta version markers missing');
  }
  gradle=gradle.replace(/versionCode\s+\d+/,'versionCode 900008')
    .replace(/versionName\s+["'][^"']+["']/,'versionName "0.9.0-beta.8"');
  await writeFile(gradlePath,gradle);
  const stringsPath='android/app/src/main/res/values/strings.xml';
  let strings=await readFile(stringsPath,'utf8');
  if(!strings.includes('name="app_name"'))throw new Error('Android app name resource missing');
  strings=strings.replace(/(<string name="app_name">)[^<]*(<\/string>)/,'$1TotiChat Beta$2');
  await writeFile(stringsPath,strings);
  console.log('TotiChat Beta 0.9.0-beta.8 is configured; package ID kept for existing OAuth.');
}
