import { useEffect } from 'react';
import { resolveCtaKeyFromHref } from '@/lib/analytics/ctaLabels';
import {
  getSessionDurationMs,
  markSessionStartedAtNow,
} from '@/lib/analytics/session';
import {
  reportToAnalyticsContext,
  trackAnalyticsEvent,
  trackAnalyticsEventOnce,
} from '@/lib/analytics/trackEvent';
import { useWrappedReport } from '@/context/WrappedReportContext';

/** Passive analytics — report views, external CTA clicks, and session duration. */
export function AnalyticsTracker() {
  const { status, report } = useWrappedReport();

  useEffect(() => {
    if (status !== 'ready' || !report) return;
    markSessionStartedAtNow();
    trackAnalyticsEventOnce('report_view', reportToAnalyticsContext(report));
  }, [status, report]);

  useEffect(() => {
    if (status !== 'ready' || !report) return;

    const company = reportToAnalyticsContext(report);

    const handleExternalCtaClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href^="http"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.href;
      if (!href) return;
      const ctaKey = resolveCtaKeyFromHref(href);
      trackAnalyticsEvent('cta_clicked', company, {
        ctaKey,
        ctaLabel: anchor.textContent?.trim().slice(0, 120) || ctaKey,
        href,
      });
    };

    document.addEventListener('click', handleExternalCtaClick, true);
    return () => document.removeEventListener('click', handleExternalCtaClick, true);
  }, [status, report]);

  useEffect(() => {
    if (status !== 'ready' || !report) return;
    const company = reportToAnalyticsContext(report);

    const sendEngagement = () => {
      trackAnalyticsEvent('session_engagement', company, {
        durationMs: getSessionDurationMs(),
      });
    };

    window.addEventListener('pagehide', sendEngagement);
    window.addEventListener('beforeunload', sendEngagement);
    return () => {
      window.removeEventListener('pagehide', sendEngagement);
      window.removeEventListener('beforeunload', sendEngagement);
    };
  }, [status, report]);

  return null;
}
