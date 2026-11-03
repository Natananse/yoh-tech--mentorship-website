import { ArrowRight, Phone } from 'lucide-react';
import { academyTeacher } from '../lib/academy-profile';
import { formatFee, mentorshipPackage, mentorshipTotal } from '../lib/academy-offer';

export function AcademyPackage() {
  return <section className="academy-package" id="mentorship-package" aria-labelledby="academy-package-title">
    <div className="academy-package-intro"><span className="academy-kicker">The mentorship package</span><h2 id="academy-package-title">Two semesters.<br />One mentorship.</h2><p>One program, split into {mentorshipPackage.semesterCount} semesters. The fee is {formatFee(mentorshipPackage.feePerSemester)} for each semester.</p><a className="academy-button academy-button-primary" href={academyTeacher.phoneHref}><Phone size={18} />Ask about enrollment</a><a className="academy-text-link" href="#sample-lesson">Try a free lesson <ArrowRight size={18} /></a></div>
    <div className="academy-package-breakdown"><ol aria-label="Semester fees">{Array.from({ length: mentorshipPackage.semesterCount }, (_, index) => <li key={index}><span>Semester {index + 1}</span><strong>{formatFee(mentorshipPackage.feePerSemester)}</strong></li>)}</ol><dl><div><dt>Full program total</dt><dd>{formatFee(mentorshipTotal)}</dd></div></dl><p>Semester dates and the topic plan will be confirmed before enrollment.</p></div>
  </section>;
}
