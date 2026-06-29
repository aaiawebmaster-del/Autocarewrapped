import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { motion } from 'motion/react';
import {
  HoodStandardsSummaryDevice,
  HoodTireCheckBadge,
  TIRE_PHASE_ORDER,
  type TirePhase,
} from './MapSimulation';
import { JourneyCounterGauge } from './JourneyCounterGauge';
import { CommunityLogoGauge } from './CommunityLogoGauge';
import { JourneyNavMapAnimation } from './JourneyNavMapAnimation';
import { JourneyNavDriverMarker } from './JourneyNavDriverMarker';
import { GpsPopupContent, GpsAttendanceRoutePanel } from './GpsNavPopupContent';
import { buildDiagnosticsCounterStats } from '@/lib/buildJourneySections';
import { resolveCommunityLogos } from '@/lib/communityLogos';
import { fitDiagnosticsCommunityDialSize } from '@/lib/fitDiagnosticsCommunityDialSize';
import { getHoodStandardsMessages, isTirePhaseEmpty } from '@/lib/contentVariants';
import type { EventsMetrics, WrappedReport } from '@/types/wrappedReport';
import { buildShareMailtoUrl, companyReportPageUrl } from '@/lib/embedConfig';
import {
  reportToAnalyticsContext,
  trackAnalyticsEvent,
} from '@/lib/analytics/trackEvent';
import { DiagnosticsFeedback } from './DiagnosticsFeedback';
import tireTrendlensImage from '../../assets/tire-trendlens.svg?url';
import tireDemandindexImage from '../../assets/tire-demandindex.svg?url';
import tireFactbookImage from '../../assets/tire-factbook.svg?url';
import tireAcademyImage from '../../assets/tire-academy.svg?url';

const TOP_STEP_MAX = 2;
/** Map arch + dashboard band exit before share scene (matches CSS 0.85s). */
const DASHBOARD_EXIT_MS = 900;
const SHARE_REVEAL_BUFFER_MS = 120;

const DIAGNOSTICS_SHARE_MESSAGE = `Every mile counts.

This year, you navigated industry challenges, accelerated professional growth, and connected with fellow leaders across the auto care community.

The road you traveled — and the momentum you helped build for the year ahead is no small feat.

Buckle up. There's much more to come!`;

/** First four Your Journey counter slides — same gauge variants as the journey panel. */
const TIRE_ROLL_IMAGES: Record<TirePhase, string> = {
  trendlens: tireTrendlensImage,
  demandindex: tireDemandindexImage,
  factbook: tireFactbookImage,
  academy: tireAcademyImage,
};

/** Rise into the same vertical band as the top stats / tires carousel */
const DIAG_STANDARDS_RISE_OFFSET = 36;

function DiagnosticsStatGauge({
  stat,
  counterOnly,
}: {
  stat: ReturnType<typeof buildDiagnosticsCounterStats>[number];
  counterOnly: boolean;
}) {
  return (
    <section
      className={[
        'journey-counter-panel__gauge',
        'full-diagnostics__stat-gauge',
        counterOnly ? 'full-diagnostics__stat-gauge--counter-only' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={stat.label}
    >
      <JourneyCounterGauge
        target={stat.target}
        label={stat.label}
        animationKey={stat.animationKey}
        delay={stat.delay}
        readoutMode="below"
        circleSize="100%"
        counterDialBox
        variant={stat.gaugeVariant}
      />
    </section>
  );
}

function DiagnosticsJourneyStatsRow({
  report,
  counterOnly = false,
  bandRootRef,
}: {
  report: WrappedReport;
  counterOnly?: boolean;
  bandRootRef?: RefObject<HTMLDivElement | null>;
}) {
  const journeyCounterStats = buildDiagnosticsCounterStats(report);
  const numericStats = journeyCounterStats.filter(
    (stat) => stat.gaugeVariant !== 'community-logo',
  );
  const splitRef = useRef<HTMLDivElement>(null);
  const gaugesRef = useRef<HTMLDivElement>(null);
  const communityGaugeRef = useRef<HTMLElement>(null);
  const logos = resolveCommunityLogos(report.journey.communities);
  const logoCount = logos.length;
  const useLogoGrid = logoCount === 4;

  useLayoutEffect(() => {
    if (!counterOnly || !bandRootRef?.current) return;
    const bandRootEl = bandRootRef.current;
    const communityGaugeEl = communityGaugeRef.current;
    if (!communityGaugeEl) return;

    let syncAttempts = 0;

    const syncLogoDialSize = () => {
      const useSingleSlot = !useLogoGrid && logoCount <= 1;

      const logoGaugeEl = communityGaugeEl.querySelector<HTMLElement>('.community-logo-gauge');
      const dialSlotEl = communityGaugeEl.querySelector<HTMLElement>(
        useLogoGrid
          ? '.journey-counter-gauge__dial-slot--community-grid'
          : useSingleSlot
            ? '.journey-counter-gauge__dial-slot--community-logo'
            : '.journey-counter-gauge__dial-slot--community-stack',
      );
      const stackScalerEl = communityGaugeEl.querySelector<HTMLElement>(
        '.community-logo-gauge__stack-scaler',
      );
      const stackEl = communityGaugeEl.querySelector<HTMLElement>('.community-logo-gauge__stack');
      if (!logoGaugeEl || !dialSlotEl) return;
      if (!useLogoGrid && logoCount > 1 && !stackEl) return;

      const fitContainerEl = stackScalerEl ?? dialSlotEl;
      const columnWidth = Math.max(
        logoGaugeEl.clientWidth,
        dialSlotEl.clientWidth,
        communityGaugeEl.clientWidth,
        1,
      );
      const containerHeight = Math.max(
        48,
        fitContainerEl.clientHeight,
        communityGaugeEl.clientHeight > 0 ? communityGaugeEl.clientHeight - 28 : 0,
        bandRootEl.clientHeight > 0 ? bandRootEl.clientHeight * 0.45 : 0,
      );

      if (columnWidth < 48 || containerHeight < 48) {
        if (syncAttempts < 12) {
          syncAttempts += 1;
          requestAnimationFrame(syncLogoDialSize);
        }
        return;
      }

      syncAttempts = 0;

      const applyDialVars = (size: number, mode: 'stack' | 'grid' | 'single' = 'stack') => {
        const markWidth = Math.min(size * (mode === 'single' ? 1.47 : 0.84), columnWidth);
        const markHeight = Math.min(
          markWidth * (126 / 300),
          size * (mode === 'single' ? 0.84 : 0.48),
        );
        const dialVars = {
          '--journey-counter-dial-size': `${size}px`,
          '--journey-counter-dial-height': `${size}px`,
          '--community-logo-mark-width': `${markWidth}px`,
          '--community-logo-mark-height': `${markHeight}px`,
        } as const;
        for (const el of [
          communityGaugeEl,
          logoGaugeEl,
          dialSlotEl,
          ...(stackEl ? [stackEl] : []),
        ]) {
          for (const [key, value] of Object.entries(dialVars)) {
            el.style.setProperty(key, value);
          }
        }
        logoGaugeEl
          .querySelectorAll<HTMLElement>('.community-logo-gauge__button, .community-logo-gauge__button--empty')
          .forEach((button) => {
            if (useLogoGrid) return;
            if (markWidth >= 48) {
              button.style.width = `${markWidth}px`;
              button.style.maxWidth = `${markWidth}px`;
            } else {
              button.style.removeProperty('width');
              button.style.removeProperty('max-width');
            }
          });
      };

      if (useSingleSlot) {
        const sampleButton = logoGaugeEl.querySelector<HTMLElement>(
          '.community-logo-gauge__button, .community-logo-gauge__button--empty',
        );
        const buttonPaddingY = sampleButton
          ? Number.parseFloat(getComputedStyle(sampleButton).paddingTop) +
            Number.parseFloat(getComputedStyle(sampleButton).paddingBottom)
          : undefined;

        const dialSize = fitDiagnosticsCommunityDialSize({
          bandHeight: containerHeight,
          columnWidth,
          logoCount: 1,
          gap: 0,
          layout: 'single',
          buttonPaddingY,
        });

        applyDialVars(dialSize, 'single');
        return;
      }

      if (!useLogoGrid && stackEl) {
        stackEl.style.zoom = '1';
        stackEl.style.removeProperty('zoom');
        stackEl.style.setProperty('--community-stack-scale', '1');

        const logoContainer = stackEl;
        const gap =
          Number.parseFloat(getComputedStyle(logoContainer).rowGap) ||
          Number.parseFloat(getComputedStyle(logoContainer).gap) ||
          6;
        const sampleButton = stackEl.querySelector<HTMLElement>('.community-logo-gauge__button');
        const buttonPaddingY = sampleButton
          ? Number.parseFloat(getComputedStyle(sampleButton).paddingTop) +
            Number.parseFloat(getComputedStyle(sampleButton).paddingBottom)
          : undefined;

        const dialSize = fitDiagnosticsCommunityDialSize({
          bandHeight: containerHeight,
          columnWidth,
          logoCount,
          gap,
          layout: 'stack',
          buttonPaddingY,
        });

        applyDialVars(dialSize, 'stack');

        const buttons = stackEl.querySelectorAll<HTMLElement>('.community-logo-gauge__button');
        let renderedHeight = 0;
        buttons.forEach((button, index) => {
          renderedHeight += button.offsetHeight;
          if (index > 0) renderedHeight += gap;
        });

        if (renderedHeight > containerHeight && renderedHeight > 0) {
          const zoom = containerHeight / renderedHeight;
          stackEl.style.zoom = String(zoom);
          stackEl.style.setProperty('--community-stack-scale', String(zoom));
        }

        return;
      }

      const sampleButton = communityGaugeEl.querySelector<HTMLElement>('.community-logo-gauge__button');
      const buttonPaddingY = sampleButton
        ? Number.parseFloat(getComputedStyle(sampleButton).paddingTop) +
          Number.parseFloat(getComputedStyle(sampleButton).paddingBottom)
        : undefined;

      const logoContainer = communityGaugeEl.querySelector(
        useLogoGrid ? '.community-logo-gauge__grid' : '.community-logo-gauge__stack',
      );
      const gap = logoContainer
        ? Number.parseFloat(getComputedStyle(logoContainer).rowGap) ||
          Number.parseFloat(getComputedStyle(logoContainer).gap) ||
          6
        : 6;

      const dialSize = fitDiagnosticsCommunityDialSize({
        bandHeight: containerHeight,
        columnWidth,
        logoCount,
        gap,
        layout: 'grid',
        buttonPaddingY,
      });

      applyDialVars(dialSize);
    };

    syncLogoDialSize();
    requestAnimationFrame(syncLogoDialSize);
    const observer = new ResizeObserver(syncLogoDialSize);
    observer.observe(bandRootEl);
    observer.observe(communityGaugeEl);
    const logoGaugeEl = communityGaugeEl.querySelector('.community-logo-gauge');
    if (logoGaugeEl) observer.observe(logoGaugeEl);
    const stackScalerEl = communityGaugeEl.querySelector('.community-logo-gauge__stack-scaler');
    if (stackScalerEl) observer.observe(stackScalerEl);
    const dialSlotEl = communityGaugeEl.querySelector('.journey-counter-gauge__dial-slot');
    if (dialSlotEl) observer.observe(dialSlotEl);
    return () => observer.disconnect();
  }, [bandRootRef, counterOnly, logoCount, useLogoGrid]);

  if (counterOnly) {
    return (
      <div
        ref={splitRef}
        className="full-diagnostics__stats-row full-diagnostics__stats-row--counter-only full-diagnostics__stats-row--split"
      >
        <div
          ref={gaugesRef}
          className="full-diagnostics__stats-column full-diagnostics__stats-column--gauges"
        >
          {numericStats.map((stat) => (
            <DiagnosticsStatGauge key={stat.animationKey} stat={stat} counterOnly />
          ))}
        </div>
        <aside
          className="full-diagnostics__stats-column full-diagnostics__stats-column--communities"
          aria-label="Communities"
        >
          <section
            ref={communityGaugeRef}
            className="journey-counter-panel__gauge full-diagnostics__stat-gauge full-diagnostics__stat-gauge--counter-only full-diagnostics__stat-gauge--community-logos"
          >
            <h3 className="full-diagnostics__communities-heading">Community Membership</h3>
            <CommunityLogoGauge
              communities={report.journey.communities}
              counterDialBox
              bandConstrained
              logoLayout={useLogoGrid ? 'grid' : 'stack'}
            />
          </section>
        </aside>
      </div>
    );
  }

  return (
    <div className="full-diagnostics__stats-row">
      {journeyCounterStats.map((stat) =>
        stat.gaugeVariant === 'community-logo' ? (
          <section
            key={stat.animationKey}
            className="journey-counter-panel__gauge full-diagnostics__stat-gauge full-diagnostics__stat-gauge--community-logos"
            aria-label={stat.label}
          >
            <CommunityLogoGauge communities={report.journey.communities} counterDialBox />
          </section>
        ) : (
          <DiagnosticsStatGauge key={stat.animationKey} stat={stat} counterOnly={false} />
        ),
      )}
    </div>
  );
}

function DiagnosticsTiresRoll({ report }: { report: WrappedReport }) {
  return (
    <div className="full-diagnostics__tires-roll">
      {TIRE_PHASE_ORDER.map((phase, i) => (
        <motion.div
          key={phase}
          className="full-diagnostics__tire-roll-slot"
          initial={{ opacity: 0, x: 120 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.9,
            delay: 0.1 + i * 0.12,
            ease: [0.22, 0.55, 0.25, 1],
          }}
        >
          <img
            src={TIRE_ROLL_IMAGES[phase]}
            alt=""
            className={`full-diagnostics__tire-roll-img full-diagnostics__tire-roll-img--${phase}`}
            draggable={false}
          />
          <HoodTireCheckBadge
            className="full-diagnostics__tire-check"
            delay={0.55 + i * 0.12}
            variant={isTirePhaseEmpty(report, phase) ? 'fail' : 'success'}
          />
        </motion.div>
      ))}
    </div>
  );
}

function DiagnosticsStandardsColumn({ report }: { report: WrappedReport }) {
  const hoodMessages = useMemo(() => getHoodStandardsMessages(report), [report]);
  const [risen, setRisen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRisen(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="full-diagnostics__standards-column" aria-hidden={false}>
      <motion.div
        className="full-diagnostics__standards-tablet-wrap"
        initial={{ opacity: 0, y: DIAG_STANDARDS_RISE_OFFSET }}
        animate={{
          opacity: risen ? 1 : 0,
          y: risen ? 0 : DIAG_STANDARDS_RISE_OFFSET,
        }}
        transition={{ duration: 1.1, ease: [0.25, 0, 0.2, 1], delay: risen ? 0.1 : 0 }}
      >
        <HoodStandardsSummaryDevice
          className="full-diagnostics__standards-tablet"
          subscribedPct={hoodMessages.subscribedPct}
          databaseAccessIcons={hoodMessages.databaseAccessIcons}
          protocolLogos={hoodMessages.protocolLogos}
        />
      </motion.div>
    </div>
  );
}

function DiagnosticsShareSlide({
  onBackToStart,
  report,
}: {
  onBackToStart: () => void;
  report: WrappedReport;
}) {
  const handleShare = () => {
    trackAnalyticsEvent('share_clicked', reportToAnalyticsContext(report));
    const reportPageUrl = companyReportPageUrl(
      report.company.recordNumber ?? report.company.id,
    );
    window.location.href = buildShareMailtoUrl(reportPageUrl);
  };

  return (
    <motion.div
      className="full-diagnostics__share-slide"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      <p className="full-diagnostics__share-message">{DIAGNOSTICS_SHARE_MESSAGE}</p>
      <div className="full-diagnostics__share-side">
        <div className="full-diagnostics__share-actions">
          <button type="button" className="full-diagnostics__share-btn" onClick={handleShare}>
            Share with your team
          </button>
          <button
            type="button"
            className="full-diagnostics__share-btn full-diagnostics__share-btn--back"
            onClick={onBackToStart}
          >
            Back to the start
          </button>
        </div>
        <DiagnosticsFeedback report={report} />
      </div>
    </motion.div>
  );
}

function DiagnosticsCompleteButton({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="full-diagnostics__complete-wrap">
      <button type="button" className="full-diagnostics__complete-btn" onClick={onComplete}>
        Complete
      </button>
    </div>
  );
}

const EVENT_BAR_FILL_MS = 2000;

function DiagnosticsMapEngagement({
  archHidden,
  showPopups,
  eventsMetrics,
}: {
  archHidden: boolean;
  showPopups: boolean;
  eventsMetrics: EventsMetrics;
}) {
  const attendanceTarget = eventsMetrics.attendancePct;
  const webinarTarget = eventsMetrics.webinarCount;
  const [barW, setBarW] = useState(0);
  const [webinarHours, setWebinarHours] = useState(0);

  useEffect(() => {
    setBarW(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / EVENT_BAR_FILL_MS, 1);
      setBarW(Math.round((1 - (1 - p) ** 3) * attendanceTarget));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [attendanceTarget]);

  useEffect(() => {
    setWebinarHours(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / EVENT_BAR_FILL_MS, 1);
      setWebinarHours(Math.round((1 - (1 - p) ** 3) * webinarTarget));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [webinarTarget]);

  const evtPct = Math.round(barW);

  return (
    <div className="full-diagnostics__map-shell">
      <motion.div
        className="full-diagnostics__map-stage"
        animate={{ y: archHidden ? '115%' : '0%' }}
        transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="journey-nav-stage-inner full-diagnostics__map-stage-inner">
          <div className="journey-nav-slide-bg" aria-hidden>
            <JourneyNavMapAnimation />
          </div>
          <JourneyNavDriverMarker />
          {showPopups ? (
            <div className="full-diagnostics__map-ui">
              <div className="full-diagnostics__map-webinar-wrap">
                <motion.div
                  className="full-diagnostics__map-webinar-slot"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                >
                  <GpsPopupContent
                    phase={3}
                    isActive
                    dotCount={1}
                    evtPct={evtPct}
                    barW={barW}
                    webinarHours={webinarHours}
                    detailsReady={false}
                    eventsMetrics={eventsMetrics}
                  />
                </motion.div>
              </div>
              <motion.div
                className="full-diagnostics__map-attendance-wrap"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
              >
                <GpsAttendanceRoutePanel
                  evtPct={evtPct}
                  barW={barW}
                  eventsMetrics={eventsMetrics}
                />
              </motion.div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

export function FullDiagnosticsPanel({
  onBackToStart,
  report,
}: {
  onBackToStart: () => void;
  report: WrappedReport;
}) {
  const [topStep, setTopStep] = useState(0);
  const [shareReveal, setShareReveal] = useState(false);

  useEffect(() => {
    if (topStep !== TOP_STEP_MAX) {
      setShareReveal(false);
      return;
    }
    setShareReveal(false);
    const timer = window.setTimeout(
      () => setShareReveal(true),
      DASHBOARD_EXIT_MS + SHARE_REVEAL_BUFFER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [topStep]);

  const dashboardExiting = topStep === TOP_STEP_MAX && !shareReveal;
  const shareFocus = shareReveal;
  const archHidden = topStep === TOP_STEP_MAX;
  const showMapPopups = topStep < TOP_STEP_MAX;
  const showDashboard = topStep < TOP_STEP_MAX || dashboardExiting;

  const panelClassName = [
    'full-diagnostics',
    shareFocus ? 'full-diagnostics--share-focus' : '',
    dashboardExiting ? 'full-diagnostics--dashboard-exiting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleComplete = () => {
    trackAnalyticsEvent('diagnostics_completed', reportToAnalyticsContext(report));
    setTopStep(TOP_STEP_MAX);
  };

  const journeyBandRef = useRef<HTMLDivElement>(null);

  return (
    <div className={panelClassName}>
      <header className="full-diagnostics__header">
        <h2 className="full-diagnostics__title">Full Diagnostics</h2>
        <p className="full-diagnostics__subtitle">Your Complete Auto Care Profile</p>
      </header>

      {showDashboard ? (
        <div className="full-diagnostics__body">
          <div className="full-diagnostics__upper-band">
            <div ref={journeyBandRef} className="full-diagnostics__upper-left">
              <DiagnosticsJourneyStatsRow
                report={report}
                counterOnly
                bandRootRef={journeyBandRef}
              />
            </div>
            <div className="full-diagnostics__upper-right">
              <DiagnosticsTiresRoll report={report} />
            </div>
          </div>

          <div className="full-diagnostics__split">
            <DiagnosticsStandardsColumn report={report} />
            <div className="full-diagnostics__map">
              <DiagnosticsMapEngagement
                archHidden={archHidden}
                showPopups={showMapPopups}
                eventsMetrics={report.events}
              />
            </div>
          </div>

          <DiagnosticsCompleteButton onComplete={handleComplete} />
        </div>
      ) : null}

      <div
        className={`full-diagnostics__top${shareFocus ? ' full-diagnostics__top--share-focus' : ''}`}
        aria-hidden={!shareFocus}
      >
        <div className="full-diagnostics__top-carousel full-diagnostics__top-carousel--share-only">
          <div className="full-diagnostics__top-carousel-stage">
            {shareFocus ? (
              <DiagnosticsShareSlide onBackToStart={onBackToStart} report={report} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
