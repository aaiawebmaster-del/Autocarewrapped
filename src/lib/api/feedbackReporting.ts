import { appConfig } from '@/lib/config';
import type { FeedbackReportResponse } from '@/types/feedback';

export class FeedbackReportingError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'FeedbackReportingError';
  }
}

export async function fetchFeedbackReport(
  password: string,
  options?: { fromDate?: string; toDate?: string },
): Promise<FeedbackReportResponse> {
  const url = new URL(appConfig.reportingFeedbackEndpoint, window.location.origin);
  if (options?.fromDate) url.searchParams.set('fromDate', options.fromDate);
  if (options?.toDate) url.searchParams.set('toDate', options.toDate);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Reporting-Password': password,
    },
  });

  if (!response.ok) {
    let message = 'Unable to load feedback report';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new FeedbackReportingError(message, response.status);
  }

  return (await response.json()) as FeedbackReportResponse;
}
