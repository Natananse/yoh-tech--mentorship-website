import { requireUser } from '../../../lib/server/auth';
import { certificateEligibility,certificateLinks,issueCertificate,listCertificates } from '../../../lib/server/certificates';
import { assertSameOrigin,handleError,json,readJson,text } from '../../../lib/server/http';
import { convexEnabled,convexMutation,convexQuery } from '../../../lib/server/convex-client';
import { randomUUID } from 'node:crypto';
import type { Certificate,CertificateEligibility } from '../../../lib/platform-types';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await requireUser(request);if(convexEnabled()){const result=await convexQuery<{certificates:Certificate[];eligibleCourses:CertificateEligibility[]}>('academy:certificates',{},request);return json({...result,certificates:result.certificates.map(certificateLinks)});}return json({certificates:await listCertificates(user.id),eligibleCourses:user.role==='student'?await certificateEligibility(user.id):[]});}catch(error){return handleError(error);}}
export async function POST(request:Request){try{assertSameOrigin(request);const user=await requireUser(request);const payload=await readJson(request);const courseId=text(payload.courseId,'Course',1,80);const result=convexEnabled()?await convexMutation<{certificate:Certificate;created:boolean}>('academy:issueCertificate',{id:randomUUID(),courseId},request):await issueCertificate(user,courseId);return json({certificate:certificateLinks(result.certificate)},result.created?201:200);}catch(error){return handleError(error);}}
