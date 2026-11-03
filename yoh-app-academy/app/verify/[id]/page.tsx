import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Code2, ShieldCheck } from 'lucide-react';
import { readPublicCertificate } from '../../../lib/server/certificates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Verify course completion | YO Tech Academy', robots: { index: false, follow: false } };

export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificate = await readPublicCertificate(id);
  if (!certificate) notFound();
  const issued = new Date(certificate.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Addis_Ababa' });
  return <div className="ac-verify-site"><header className="ac-verify-header"><a className="ac-brand" href="/" aria-label="YO Tech Academy home"><span><Code2 size={25} /></span><b>yo<em>.</em><small>APP ACADEMY</small></b></a><a className="ac-text-button" href="/">Visit the academy <ArrowUpRight size={17} /></a></header>
    <main className="ac-verify-main"><div className="ac-verify-intro"><span className="ac-verify-seal"><ShieldCheck size={34} /></span><span className="ac-label">YO Tech LLC / Completion record</span><h1>Course completion,<br /><mark>verified.</mark></h1><p>This record was issued by YO Tech Academy after the student completed the course’s published lessons.</p></div>
      <article className="ac-verify-card" aria-labelledby="certificate-recipient"><div className="ac-verify-status"><CheckCircle2 size={21} /><span>Verified completion</span></div><span className="ac-label">Awarded to</span><h2 id="certificate-recipient">{certificate.recipientName}</h2><span className="ac-label">For completing</span><h3>{certificate.courseTitle}</h3><dl><div><dt>Published lessons completed</dt><dd>{certificate.completedLessonCount}</dd></div><div><dt>Date issued</dt><dd>{issued}</dd></div><div className="ac-verify-id"><dt>Verification ID</dt><dd>{certificate.id}</dd></div></dl><p className="ac-verify-record-note">This record covers the {certificate.completedLessonCount} published {certificate.completedLessonCount === 1 ? 'lesson available' : 'lessons available'} when it was issued.</p></article>
      <a className="ac-text-button ac-verify-back" href="/"><ArrowLeft size={17} />Back to YO Tech Academy</a>
    </main><footer className="ac-verify-footer"><span>YO Tech LLC</span><span>YO Tech Academy · Course completion verification</span></footer>
  </div>;
}
