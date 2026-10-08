import test from 'node:test';
import assert from 'node:assert/strict';
import {adminOAuthRedirect} from '../oauth-url.js';

test('Vercel admin login returns to the dashboard host',()=>{
 assert.equal(adminOAuthRedirect({origin:'https://totichat-admin.vercel.app',pathname:'/'}),
  'https://totichat-admin.vercel.app/');
});
test('Supabase Edge admin login returns to the nested function URL',()=>{
 assert.equal(adminOAuthRedirect({origin:'https://bfadhdnudmsggylunhlh.supabase.co',pathname:'/functions/v1/totichat-admin'}),
  'https://bfadhdnudmsggylunhlh.supabase.co/functions/v1/totichat-admin');
});
test('Localhost testing remains supported',()=>{
 assert.equal(adminOAuthRedirect({origin:'http://localhost:5173',pathname:'/admin/'}),
  'http://localhost:5173/admin/');
});
test('Missing location and host-changing paths are rejected',()=>{
 assert.throws(()=>adminOAuthRedirect(null),/Missing admin URL/);
 assert.throws(()=>adminOAuthRedirect({origin:'https://admin.example',pathname:'//untrusted.example/path'}),/Invalid admin OAuth redirect URL/);
});
