import {readFile,writeFile} from 'node:fs/promises';
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
