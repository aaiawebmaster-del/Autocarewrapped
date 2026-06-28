import type { UsageReportResponse } from '@/types/analytics';

export type FeedbackRating = 'positive' | 'negative';

export type FeedbackSubmission = {
  companyId: string;
  companyName: string;
  recordNumber?: number;
  reportYear?: number;
  rating: FeedbackRating;
};

export type FeedbackCommentSubmission = {
  id: string;
  comment: string;
};

export type StoredFeedbackEntry = FeedbackSubmission & {
  id: string;
  submittedAt: string;
  comment?: string;
  commentSubmittedAt?: string;
};

export type FeedbackReportSummary = {
  total: number;
  positive: number;
  negative: number;
};

export type FeedbackReportResponse = {
  entries: StoredFeedbackEntry[];
  summary: FeedbackReportSummary;
  usage?: UsageReportResponse;
};
