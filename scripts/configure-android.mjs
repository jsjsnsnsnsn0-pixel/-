import {readFile,writeFile,cp,rm} from 'node:fs/promises';
const path='android/app/src/main/AndroidManifest.xml';
let xml=await readFile(path,'utf8');
if (!xml.includes('android.permission.RECORD_AUDIO')) xml=xml.replace('<application','<uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <application');
if (!xml.includes('android:windowSoftInputMode=')) xml=xml.replace('android:launchMode="singleTask"', 'android:launchMode="singleTask"\n            android:windowSoftInputMode="adjustResize"');
if (!xml.includes('android:scheme="com.totichat.app"')) xml=xml.replace('</activity>',`<intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.totichat.app" android:host="auth" android:pathPrefix="/callback" />
            </intent-filter>
        </activity>`);
await writeFile(path,xml);
for (const permission of ['INTERNET','RECORD_AUDIO']) if(!xml.includes(`android.permission.${permission}`)) throw new Error(`Android permission missing: ${permission}`);
console.log('Android microphone, Internet, keyboard resize and OAuth callback configured.');

// Capacitor generates android/ locally. Copy the versioned launcher resources.
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
