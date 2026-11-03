import { clearSession,sessionCookie } from '../../../../lib/server/auth';
import { assertSameOrigin,handleError,json } from '../../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){try{assertSameOrigin(request);await clearSession(request);const response=json({ok:true});response.headers.set('Set-Cookie',sessionCookie(request,'',true));return response;}catch(error){return handleError(error);}}
