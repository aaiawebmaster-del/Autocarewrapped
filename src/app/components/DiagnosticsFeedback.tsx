import { FormEvent, useState } from 'react';
import { submitExperienceFeedback, submitFeedbackComment } from '@/lib/api/feedback';
import type { FeedbackRating } from '@/types/feedback';
import type { WrappedReport } from '@/types/wrappedReport';

const MAX_COMMENT_LENGTH = 2000;

function ThumbsUpIcon() {
  return (
    <svg
      className="full-diagnostics__feedback-icon"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg
      className="full-diagnostics__feedback-icon"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
    </svg>
  );
}

type DiagnosticsFeedbackProps = {
  report: WrappedReport;
};

export function DiagnosticsFeedback({ report }: DiagnosticsFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState<FeedbackRating | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [commentPending, setCommentPending] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleRate = (rating: FeedbackRating) => {
    if (submitted || pending) return;

    setSubmitted(true);
    setPending(rating);
    void submitExperienceFeedback({
      companyId: report.company.id,
      companyName: report.company.name,
      recordNumber: report.company.recordNumber,
      reportYear: report.reportYear,
      rating,
    })
      .then((result) => {
        if (result.id) setEntryId(result.id);
      })
      .finally(() => {
        setPending(null);
      });
  };

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed || commentPending || commentSubmitted || !entryId) return;

    setCommentPending(true);
    setCommentError(null);
    void submitFeedbackComment({ id: entryId, comment: trimmed })
      .then(() => {
        setCommentSubmitted(true);
      })
      .catch(() => {
        setCommentError('Unable to send your feedback. Please try again.');
      })
      .finally(() => {
        setCommentPending(false);
      });
  };

  return (
    <section className="full-diagnostics__feedback" aria-label="Experience feedback">
      {submitted ? (
        <div className="full-diagnostics__feedback-thanks-wrap">
          <p className="full-diagnostics__feedback-thanks">Thank you for your feedback!</p>
          {commentSubmitted ? (
            <p className="full-diagnostics__feedback-comment-thanks">
              Thanks — we received your message.
            </p>
          ) : (
            <form className="full-diagnostics__feedback-comment" onSubmit={handleCommentSubmit}>
              <label className="full-diagnostics__feedback-comment-label" htmlFor="feedback-comment">
                Tell us more!
              </label>
              <textarea
                id="feedback-comment"
                className="full-diagnostics__feedback-comment-input"
                rows={3}
                maxLength={MAX_COMMENT_LENGTH}
                placeholder="Share any thoughts about your experience…"
                value={comment}
                disabled={commentPending || !entryId}
                onChange={(event) => setComment(event.target.value)}
              />
              {commentError ? (
                <p className="full-diagnostics__feedback-comment-error">{commentError}</p>
              ) : null}
              <button
                type="submit"
                className="full-diagnostics__feedback-comment-submit"
                disabled={commentPending || !entryId || !comment.trim()}
              >
                {commentPending ? 'Sending…' : 'Send feedback'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          <h2 className="full-diagnostics__feedback-title">We&apos;d love your feedback</h2>
          <div className="full-diagnostics__feedback-actions">
            <button
              type="button"
              className="full-diagnostics__feedback-btn full-diagnostics__feedback-btn--positive"
              aria-label="Thumbs up"
              disabled={pending !== null}
              onClick={() => void handleRate('positive')}
            >
              <ThumbsUpIcon />
            </button>
            <button
              type="button"
              className="full-diagnostics__feedback-btn full-diagnostics__feedback-btn--negative"
              aria-label="Thumbs down"
              disabled={pending !== null}
              onClick={() => void handleRate('negative')}
            >
              <ThumbsDownIcon />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
