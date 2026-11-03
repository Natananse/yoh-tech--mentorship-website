import { readPublicCertificate } from '../../../../lib/server/certificates';
import { ApiError,handleError,json } from '../../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(_request:Request,{params}:{params:{id:string}}){try{const certificate=readPublicCertificate(params.id);if(!certificate)throw new ApiError(404,'Certificate not found.');return json({certificate});}catch(error){return handleError(error);}}
