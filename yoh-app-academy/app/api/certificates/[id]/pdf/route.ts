import { requireUser } from '../../../../../lib/server/auth';
import { certificateOwner,readPublicCertificate } from '../../../../../lib/server/certificates';
import { createCertificatePdf } from '../../../../../lib/server/certificate-pdf';
import { ApiError,handleError } from '../../../../../lib/server/http';
import { applicationOrigin } from '../../../../../lib/server/origin';
import { convexEnabled,convexQuery } from '../../../../../lib/server/convex-client';
import type { Certificate } from '../../../../../lib/platform-types';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const{id}=await params;const user=await requireUser(request);const remote=convexEnabled();const certificate=remote?await convexQuery<Certificate>('academy:downloadCertificate',{id},request):await readPublicCertificate(id);if(!certificate)throw new ApiError(404,'Certificate not found.');
 if(!remote&&user.role!=='admin'&&await certificateOwner(certificate.id)!==user.id)throw new ApiError(403,'Only the recipient or an admin can download this certificate.');
 const bytes=await createCertificatePdf(certificate,applicationOrigin(request)||new URL(request.url).origin);
 return new Response(bytes as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="yo-tech-completion-${certificate.id}.pdf"`,'Content-Length':String(bytes.byteLength),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}catch(error){return handleError(error);}}
