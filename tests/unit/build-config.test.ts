import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateFrontendConfig} from '../../scripts/frontend-config.mjs';
const config = {VITE_SUPABASE_URL:'https://project.supabase.co',VITE_AUTH_REDIRECT_URL:'com.totichat.app://auth/callback',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_abcdefghijklmnopqrstuvwxyz'};
test('APK preflight accepts public configuration and native callback',()=>assert.doesNotThrow(()=>validateFrontendConfig(config)));
test('APK preflight rejects placeholders, server keys and invalid callbacks',()=>{
  for(const key of ['test-publishable-key','sb_secret_abcdefghijklmnopqrstuvwxyz','service_role','']) assert.throws(()=>validateFrontendConfig({...config,VITE_SUPABASE_PUBLISHABLE_KEY:key}));
  for(const redirect of ['', 'http://example.com','com.totichat.app://wrong/callback']) assert.throws(()=>validateFrontendConfig({...config,VITE_AUTH_REDIRECT_URL:redirect}));
});
test('APK preflight rejects a privileged JWT even when shaped like an anon key',()=>{
  const jwt = ['header',Buffer.from(JSON.stringify({iss:'supabase',role:'service_role'})).toString('base64url'),'signature'].join('.');
  assert.throws(()=>validateFrontendConfig({...config,VITE_SUPABASE_PUBLISHABLE_KEY:jwt}));
});
