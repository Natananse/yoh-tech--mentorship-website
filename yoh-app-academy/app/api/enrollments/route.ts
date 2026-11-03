import { requireUser } from '../../../lib/server/auth';
import { listEnrollments } from '../../../lib/server/enrollment';
import { handleError,json } from '../../../lib/server/http';
import { convexEnabled,convexQuery } from '../../../lib/server/convex-client';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{return json(convexEnabled()?await convexQuery('enrollment:listEnrollments',{},request):{enrollments:await listEnrollments(await requireUser(request))});}catch(error){return handleError(error);}}
