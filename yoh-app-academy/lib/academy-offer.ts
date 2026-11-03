export const mentorshipPackage = {
  semesterCount: 2,
  feePerSemester: 3000,
  currency: 'ETB',
} as const;

export const mentorshipTotal = mentorshipPackage.semesterCount * mentorshipPackage.feePerSemester;
export const formatFee = (amount: number) => `${amount.toLocaleString('en-US')} ${mentorshipPackage.currency}`;
