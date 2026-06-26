import { appConfig } from '@/lib/config';
import type { FeedbackCommentSubmission, FeedbackSubmission } from '@/types/feedback';

export class FeedbackError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'FeedbackError';
  }
}

async function parseFeedbackError(response: Response): Promise<never> {
  let message = 'Unable to submit feedback';
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) message = body.error;
  } catch {
    // ignore parse errors
  }
  throw new FeedbackError(message, response.status);
}

export async function submitExperienceFeedback(
  submission: FeedbackSubmission,
): Promise<{ id: string }> {
  const url = new URL(appConfig.feedbackEndpoint, window.location.origin);

  const response = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    return parseFeedbackError(response);
  }

  const body = (await response.json()) as { id?: string };
  return { id: body.id ?? '' };
}

export async function submitFeedbackComment(submission: FeedbackCommentSubmission): Promise<void> {
  const url = new URL(appConfig.feedbackEndpoint, window.location.origin);

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    return parseFeedbackError(response);
  }
}
