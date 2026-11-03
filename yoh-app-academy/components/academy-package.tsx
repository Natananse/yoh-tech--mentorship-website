import { ArrowRight, Phone } from 'lucide-react';
import { academyTeacher } from '../lib/academy-profile';
import { formatFee, mentorshipPackage, mentorshipTotal } from '../lib/academy-offer';
import styles from './academy-package.module.css';

export function AcademyPackage() {
  return (
    <section className={styles.package} id="mentorship-package" aria-labelledby="academy-package-title">
      <div className={styles.intro}>
        <span className="academy-kicker">THE MENTORSHIP PACKAGE</span>
        <h2 className={styles.title} id="academy-package-title">Two semesters.<br />One mentorship.</h2>
        <p className={styles.description}>One program, split into {mentorshipPackage.semesterCount} semesters. The fee is {formatFee(mentorshipPackage.feePerSemester)} for each semester.</p>
      </div>

      <dl className={styles.pricing} aria-label="Mentorship package fees">
        {Array.from({ length: mentorshipPackage.semesterCount }, (_, index) => (
          <div className={styles.card} key={index}>
            <dt className={styles.cardLabel}>Semester {index + 1}</dt>
            <dd className={styles.amount}>{formatFee(mentorshipPackage.feePerSemester)}</dd>
          </div>
        ))}
        <div className={`${styles.card} ${styles.totalCard}`}>
          <dt className={styles.cardLabel}>Full program total</dt>
          <dd className={styles.amount}>{formatFee(mentorshipTotal)}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <a className={`academy-button academy-button-primary ${styles.action}`} href={academyTeacher.phoneHref}>
          <Phone size={18} aria-hidden="true" />Ask about enrollment
        </a>
        <a className={`academy-button ${styles.action}`} href="#sample-lesson">
          Try a free lesson <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
      <p className={styles.note}>Semester dates and the topic plan will be confirmed before enrollment.</p>
    </section>
  );
}
