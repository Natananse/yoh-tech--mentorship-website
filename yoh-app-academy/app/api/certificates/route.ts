import { requireUser } from '../../../lib/server/auth';
import { certificateEligibility,issueCertificate,listCertificates } from '../../../lib/server/certificates';
import { assertSameOrigin,handleError,json,readJson,text } from '../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(request:Request){try{const user=requireUser(request);return json({certificates:listCertificates(user.id),eligibleCourses:user.role==='student'?certificateEligibility(user.id):[]});}catch(error){return handleError(error);}}
export async function POST(request:Request){try{assertSameOrigin(request);const user=requireUser(request);const payload=await readJson(request);const result=issueCertificate(user,text(payload.courseId,'Course',1,80));return json({certificate:result.certificate},result.created?201:200);}catch(error){return handleError(error);}}
