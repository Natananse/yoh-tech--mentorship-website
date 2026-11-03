import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { acceptedRequestOrigins,applicationOrigin,isHostedEnvironment } from '../lib/server/origin';
import { convexEnabled } from '../lib/server/convex-client';
import { assertSameOrigin } from '../lib/server/http';
const keys=['YOH_APP_URL','VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_PROJECT_PRODUCTION_URL','NETLIFY','SITE_ID','URL','DEPLOY_URL','DEPLOY_PRIME_URL','CONTEXT','CONVEX_URL','NEXT_PUBLIC_CONVEX_URL','YOH_CONVEX_SERVER_SECRET'];
beforeEach(()=>{for(const key of keys)vi.stubEnv(key,'');});
afterEach(()=>vi.unstubAllEnvs());
const request=(url:string,origin?:string)=>new Request(url,{headers:{'x-forwarded-host':'attacker.example','x-forwarded-proto':'https',...(origin?{origin}:{})}});
describe('hosted academy configuration and trusted origins',()=>{
 it('preserves local SQLite mode and ignores unrelated URL or forwarded headers',()=>{
  vi.stubEnv('URL','https://untrusted.example');vi.stubEnv('YOH_CONVEX_SERVER_SECRET','private-local-secret-prepared-in-advance');
  expect(isHostedEnvironment()).toBe(false);expect(convexEnabled()).toBe(false);expect(applicationOrigin(request('http://localhost:3002/'))).toBe('http://localhost:3002');
 });
 it.each(['SITE_ID','NETLIFY','VERCEL'])('fails closed with missing remote configuration on %s',key=>{
  vi.stubEnv(key,key==='NETLIFY'?'true':key==='VERCEL'?'1':'site-test-id');
  expect(isHostedEnvironment()).toBe(true);expect(()=>convexEnabled()).toThrow(expect.objectContaining({status:503}));expect(applicationOrigin(request('https://attacker.example/'))).toBeUndefined();expect(acceptedRequestOrigins(request('https://attacker.example/'))).toEqual([]);
 });
 it('uses documented Netlify function URL without relying on build-only flags',()=>{
  vi.stubEnv('SITE_ID','site-test-id');vi.stubEnv('URL','https://yo-tech.netlify.app');
  expect(applicationOrigin()).toBe('https://yo-tech.netlify.app');expect(acceptedRequestOrigins(request('https://attacker.example/'))).toEqual(['https://yo-tech.netlify.app']);
  expect(()=>assertSameOrigin(request('https://yo-tech.netlify.app/api/auth/login','https://attacker.example'))).toThrow(expect.objectContaining({status:403}));expect(()=>assertSameOrigin(request('https://yo-tech.netlify.app/api/auth/login','https://yo-tech.netlify.app'))).not.toThrow();
 });
 it('prefers configured canonical origin and never trusts undocumented preview runtime variables',()=>{
  vi.stubEnv('SITE_ID','site-test-id');vi.stubEnv('URL','https://yo-tech.netlify.app');vi.stubEnv('YOH_APP_URL','https://academy.example.test');vi.stubEnv('CONTEXT','deploy-preview');vi.stubEnv('DEPLOY_PRIME_URL','https://deploy-preview-1--yo-tech.netlify.app');
  expect(applicationOrigin()).toBe('https://academy.example.test');expect(acceptedRequestOrigins(request('https://attacker.example/'))).toEqual(['https://academy.example.test','https://yo-tech.netlify.app']);expect(()=>assertSameOrigin(request('https://deploy-preview-1--yo-tech.netlify.app/api/auth/login','https://deploy-preview-1--yo-tech.netlify.app'))).toThrow(expect.objectContaining({status:403}));
 });
 it('preserves Vercel production and preview origin behavior',()=>{
  vi.stubEnv('VERCEL','1');vi.stubEnv('YOH_APP_URL','https://academy.example.test');vi.stubEnv('VERCEL_URL','yo-tech-preview.vercel.app');
  expect(applicationOrigin()).toBe('https://academy.example.test');vi.stubEnv('VERCEL_ENV','preview');expect(applicationOrigin()).toBe('https://yo-tech-preview.vercel.app');expect(acceptedRequestOrigins(request('https://attacker.example/'))).toEqual(['https://academy.example.test','https://yo-tech-preview.vercel.app']);
 });
 it('requires a complete remote configuration and rejects credential-bearing origins',()=>{
  vi.stubEnv('SITE_ID','site-test-id');vi.stubEnv('CONVEX_URL','https://deployment.convex.cloud');vi.stubEnv('YOH_CONVEX_SERVER_SECRET','short');expect(()=>convexEnabled()).toThrow(expect.objectContaining({status:503}));vi.stubEnv('YOH_CONVEX_SERVER_SECRET','a'.repeat(32));expect(convexEnabled()).toBe(true);
  vi.stubEnv('YOH_APP_URL','https://user:password@example.test');expect(()=>applicationOrigin()).toThrow('Configure an HTTP or HTTPS application origin.');
 });
});
