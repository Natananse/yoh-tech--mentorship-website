function configuredOrigin(value:string|undefined,hostname=false):string|undefined{
 if(!value)return undefined;
 const url=new URL(hostname?`https://${value}`:value);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Configure an HTTP or HTTPS application origin.');
 return url.origin;
}
function origins(){
 const vercel=process.env.VERCEL==='1';
 const netlify=process.env.NETLIFY==='true'||Boolean(process.env.SITE_ID);
 const canonical=configuredOrigin(process.env.YOH_APP_URL)||
  (vercel?configuredOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL,true):netlify?configuredOrigin(process.env.URL):undefined);
 const deployment=vercel?configuredOrigin(process.env.VERCEL_URL,true):netlify?configuredOrigin(process.env.URL):undefined;
 return{vercel,hosted:vercel||netlify,canonical,deployment};
}

/** Netlify documents SITE_ID and URL at function runtime; preview URL variables are build-only. */
export function isHostedEnvironment():boolean{return process.env.VERCEL==='1'||process.env.NETLIFY==='true'||Boolean(process.env.SITE_ID);}

/** Only deployment configuration supplies public hosted URLs; forwarded headers are never trusted. */
export function applicationOrigin(request?:Request):string|undefined{
 const{vercel,hosted,canonical,deployment}=origins();
 if(vercel&&process.env.VERCEL_ENV==='preview')return deployment||canonical;
 return canonical||deployment||(request&&!hosted?new URL(request.url).origin:undefined);
}
export function acceptedRequestOrigins(request:Request):string[]{
 const{canonical,deployment}=origins();
 const configured=[canonical,deployment].filter((value):value is string=>Boolean(value));
 return configured.length?Array.from(new Set(configured)):[applicationOrigin(request)].filter((value):value is string=>Boolean(value));
}
