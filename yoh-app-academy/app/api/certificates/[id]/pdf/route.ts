import { requireUser } from '../../../../../lib/server/auth';
import { certificateOwner,readPublicCertificate } from '../../../../../lib/server/certificates';
import { createCertificatePdf } from '../../../../../lib/server/certificate-pdf';
import { ApiError,handleError } from '../../../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:{id:string}}){try{
 const user=requireUser(request);const certificate=readPublicCertificate(params.id);if(!certificate)throw new ApiError(404,'Certificate not found.');
 if(user.role!=='admin'&&certificateOwner(certificate.id)!==user.id)throw new ApiError(403,'Only the recipient or an admin can download this certificate.');
 const bytes=await createCertificatePdf(certificate,process.env.YOH_APP_URL||new URL(request.url).origin);
 return new Response(bytes as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="yoh-completion-${certificate.id}.pdf"`,'Content-Length':String(bytes.byteLength),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}catch(error){return handleError(error);}}
