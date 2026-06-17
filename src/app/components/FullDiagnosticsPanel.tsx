import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HoodStandardsSummaryDevice,
  HoodTireCheckBadge,
  TIRE_PHASE_ORDER,
  type TirePhase,
} from './MapSimulation';
import {
  JourneyCounterGauge,
  DIAGNOSTICS_GAUGE_VALUE_FONT,
  DIAGNOSTICS_GAUGE_LABEL_FONT,
} from './JourneyCounterGauge';
import { CommunityLogoGauge } from './CommunityLogoGauge';
import { JourneyNavMapAnimation } from './JourneyNavMapAnimation';
import { GpsUiControls } from './GpsUiControls';
import { GpsPopupContent, GpsAttendanceRoutePanel } from './GpsNavPopupContent';
import { buildDiagnosticsCounterStats } from '@/lib/buildJourneySections';
import { getHoodStandardsMessages, isTirePhaseEmpty } from '@/lib/contentVariants';
import type { EventsMetrics, WrappedReport } from '@/types/wrappedReport';
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
function DiagnosticsCarouselChevron({
  direction,
  onClick,
  disabled,
  label,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`full-diagnostics__chevron full-diagnostics__chevron--${direction}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F3901D"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="full-diagnostics__chevron-icon"
        aria-hidden
      >
        <path d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

function DiagnosticsJourneyStatsRow({ report }: { report: WrappedReport }) {
  const journeyCounterStats = buildDiagnosticsCounterStats(report);

  return (
    <motion.div
      className="full-diagnostics__stats-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {journeyCounterStats.map((stat) => (
        <section
          key={stat.animationKey}
          className="journey-counter-panel__gauge full-diagnostics__stat-gauge"
          aria-label={stat.label}
        >
          {stat.gaugeVariant === 'community-logo' ? (
            <CommunityLogoGauge
              target={stat.target}
              label={stat.label}
              communities={report.journey.communities}
              animationKey={stat.animationKey}
              delay={stat.delay}
              readoutMode="below"
              circleSize="100%"
              counterDialBox
              valueFontSize={DIAGNOSTICS_GAUGE_VALUE_FONT}
              labelFontSize={DIAGNOSTICS_GAUGE_LABEL_FONT}
            />
          ) : (
            <JourneyCounterGauge
              target={stat.target}
              label={stat.label}
              animationKey={stat.animationKey}
              delay={stat.delay}
              readoutMode="below"
              circleSize="100%"
              counterDialBox
              variant={stat.gaugeVariant}
              valueFontSize={DIAGNOSTICS_GAUGE_VALUE_FONT}
              labelFontSize={DIAGNOSTICS_GAUGE_LABEL_FONT}
            />
          )}
        </section>
      ))}
    </motion.div>
  );
}

function DiagnosticsTiresRoll({ report }: { report: WrappedReport }) {
  return (
    <motion.div
      className="full-diagnostics__tires-roll"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
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
    </motion.div>
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
function DiagnosticsShareSlide({ onBackToStart }: { onBackToStart: () => void }) {
  const handleShare = async () => {
    const shareData = {
      title: 'My Auto Care Wrapped',
      text: DIAGNOSTICS_SHARE_MESSAGE,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* user cancelled or share unavailable */
    }
    try {
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`.trim(),
      );
    } catch {
      /* clipboard unavailable */
    }
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
    </motion.div>
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
          <GpsUiControls />
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

function DiagnosticsTopCarousel({
  step,
  onStepChange,
  shareFocus,
  onBackToStart,
  report,
}: {
  step: number;
  onStepChange: (next: number) => void;
  shareFocus: boolean;
  onBackToStart: () => void;
  report: WrappedReport;
}) {
  const canGoBack = step > 0;
  const canGoForward = step < TOP_STEP_MAX;

  return (
    <div
      className={`full-diagnostics__top${shareFocus ? ' full-diagnostics__top--share-focus' : ''}`}
    >
      <div className="full-diagnostics__top-carousel">
        <DiagnosticsCarouselChevron
          direction="left"
          onClick={() => onStepChange(step - 1)}
          disabled={!canGoBack}
          label="Previous diagnostics view"
        />
        <div className="full-diagnostics__top-carousel-stage">
          <AnimatePresence mode="wait">
            {step === 0 && <DiagnosticsJourneyStatsRow key="stats" report={report} />}
            {step === 1 && <DiagnosticsTiresRoll key="tires" report={report} />}
            {shareFocus && step === TOP_STEP_MAX && (
              <DiagnosticsShareSlide key="share" onBackToStart={onBackToStart} />
            )}
          </AnimatePresence>
        </div>
        <DiagnosticsCarouselChevron
          direction="right"
          onClick={() => onStepChange(step + 1)}
          disabled={!canGoForward}
          label={
            step === 0
              ? 'Show Kick the Tires wheels'
              : step === 1
                ? 'Show year in review and share'
                : 'Continue'
          }
        />
      </div>
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

  const panelClassName = [
    'full-diagnostics',
    shareFocus ? 'full-diagnostics--share-focus' : '',
    dashboardExiting ? 'full-diagnostics--dashboard-exiting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={panelClassName}>
      <header className="full-diagnostics__header">
        <h2 className="full-diagnostics__title">Full Diagnostics</h2>
        <p className="full-diagnostics__subtitle">Your Complete Auto Care Profile</p>
      </header>

      <DiagnosticsTopCarousel
        step={topStep}
        onStepChange={setTopStep}
        shareFocus={shareFocus}
        onBackToStart={onBackToStart}
        report={report}
      />

      <div className="full-diagnostics__split">
        <DiagnosticsStandardsColumn report={report} />

        <div
          className={`full-diagnostics__map${shareFocus ? ' full-diagnostics__map--share-focus' : ''}`}
        >
          <DiagnosticsMapEngagement
            archHidden={archHidden}
            showPopups={showMapPopups}
            eventsMetrics={report.events}
          />
        </div>
      </div>
    </div>
  );
}
