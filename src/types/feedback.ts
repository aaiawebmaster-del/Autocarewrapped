export type FeedbackRating = 'positive' | 'negative';

export type FeedbackSubmission = {
  companyId: string;
  companyName: string;
  recordNumber?: number;
  reportYear?: number;
  rating: FeedbackRating;
};

export type StoredFeedbackEntry = FeedbackSubmission & {
  id: string;
  submittedAt: string;
};

export type FeedbackReportSummary = {
  total: number;
  positive: number;
  negative: number;
};

export type FeedbackReportResponse = {
  entries: StoredFeedbackEntry[];
  summary: FeedbackReportSummary;
};
