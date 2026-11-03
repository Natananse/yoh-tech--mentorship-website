import { getUser } from '../../../../lib/server/auth';
import { json, handleError } from '../../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(request:Request){try{return json({user:getUser(request)});}catch(error){return handleError(error);}}
