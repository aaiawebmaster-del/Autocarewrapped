export const ENGAGEMENT_REPORT_FEEDBACK_EMAIL = 'kyle.hardy@autocare.org';
export const ENGAGEMENT_REPORT_FEEDBACK_SUBJECT = 'Engagement Report Feedback';

export function buildEngagementReportFeedbackMailto(): string {
  const params = new URLSearchParams({ subject: ENGAGEMENT_REPORT_FEEDBACK_SUBJECT });
  return `mailto:${ENGAGEMENT_REPORT_FEEDBACK_EMAIL}?${params.toString()}`;
}
