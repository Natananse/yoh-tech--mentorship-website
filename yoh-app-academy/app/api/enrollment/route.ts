import { getUser,requireUser } from '../../../lib/server/auth';
import { getEnrollment,requestEnrollment } from '../../../lib/server/enrollment';
import { assertSameOrigin,handleError,json } from '../../../lib/server/http';
import { convexEnabled,convexMutation,convexQuery } from '../../../lib/server/convex-client';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{return json(convexEnabled()?await convexQuery('enrollment:getEnrollment',{},request):await getEnrollment(await getUser(request)));}catch(error){return handleError(error);}}
export async function POST(request:Request){try{assertSameOrigin(request);return json(convexEnabled()?await convexMutation('enrollment:requestEnrollment',{},request):await requestEnrollment(await requireUser(request)));}catch(error){return handleError(error);}}
