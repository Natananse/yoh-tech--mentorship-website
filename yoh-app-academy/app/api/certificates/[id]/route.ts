import { readPublicCertificate } from '../../../../lib/server/certificates';
import { ApiError,handleError,json } from '../../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const{id}=await params;const certificate=await readPublicCertificate(id);if(!certificate)throw new ApiError(404,'Certificate not found.');return json({certificate});}catch(error){return handleError(error);}}
