import { requireUser } from '../../../../lib/server/auth';
import { setEnrollment } from '../../../../lib/server/enrollment';
import { ApiError,assertSameOrigin,handleError,json,readJson } from '../../../../lib/server/http';
import { convexEnabled,convexMutation } from '../../../../lib/server/convex-client';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function PATCH(request:Request,{params}:{params:Promise<{studentId:string}>}){try{
 assertSameOrigin(request);const{studentId}=await params;const body=await readJson(request);
 if(body.status!=='approved'&&body.status!=='revoked')throw new ApiError(400,'Choose approved or revoked enrollment status.');
 return json(convexEnabled()?await convexMutation('enrollment:setEnrollment',{studentId,status:body.status},request):{enrollment:await setEnrollment(await requireUser(request),studentId,body.status)});
}catch(error){return handleError(error);}}
