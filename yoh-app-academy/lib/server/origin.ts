function configuredOrigin(value:string|undefined,hostname=false):string|undefined{
 if(!value)return undefined;
 const url=new URL(hostname?`https://${value}`:value);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Configure an HTTP or HTTPS application origin.');
 return url.origin;
}
function origins(){
 const vercel=process.env.VERCEL==='1';
 const canonical=configuredOrigin(process.env.YOH_APP_URL)||
  (vercel?configuredOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL,true):undefined);
 const deployment=vercel?configuredOrigin(process.env.VERCEL_URL,true):undefined;
 return{vercel,canonical,deployment};
}

/** Only deployment configuration supplies public Vercel URLs; forwarded headers are never trusted. */
export function applicationOrigin(request?:Request):string|undefined{
 const{vercel,canonical,deployment}=origins();
 if(vercel&&process.env.VERCEL_ENV==='preview')return deployment||canonical;
 return canonical||deployment||(request&&!vercel?new URL(request.url).origin:undefined);
}
export function acceptedRequestOrigins(request:Request):string[]{
 const{canonical,deployment}=origins();
 const configured=[canonical,deployment].filter((value):value is string=>Boolean(value));
 return configured.length?Array.from(new Set(configured)):[applicationOrigin(request)].filter((value):value is string=>Boolean(value));
}
