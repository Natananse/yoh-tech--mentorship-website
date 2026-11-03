import { ArrowLeft, Code2, Search } from 'lucide-react';

export default function CertificateNotFound() {
  return <div className="ac-verify-site"><header className="ac-verify-header"><a className="ac-brand" href="/" aria-label="YOH App Academy home"><span><Code2 size={25} /></span><b>yoh<em>.</em><small>APP ACADEMY</small></b></a></header><main className="ac-verify-main ac-verify-not-found"><span className="ac-verify-seal"><Search size={31} /></span><span className="ac-label">Completion verification</span><h1>We couldn’t find<br />that certificate.</h1><p>Check the full verification ID or ask the certificate holder for their original link.</p><a className="ac-button ac-button-primary" href="/"><ArrowLeft size={17} />Back to the academy</a></main><footer className="ac-verify-footer"><span>YOH Tech LLC</span><span>YOH App Academy</span></footer></div>;
}
