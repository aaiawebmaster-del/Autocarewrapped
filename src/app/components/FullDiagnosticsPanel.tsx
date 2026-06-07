import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HoodTireCheckBadge, TIRE_PHASE_ORDER, type TirePhase } from './MapSimulation';
import {
  JourneyCounterGauge,
  DIAGNOSTICS_GAUGE_VALUE_FONT,
  DIAGNOSTICS_GAUGE_LABEL_FONT,
} from './JourneyCounterGauge';
import { CommunityLogoGauge } from './CommunityLogoGauge';
import { JourneyNavMapAnimation } from './JourneyNavMapAnimation';
import { GpsPopupContent, BAR_FILL_MAX, WEBINAR_HOURS_MAX } from './GpsNavPopupContent';
import acesDipstickImage from '../../assets/dipstick-aces.svg?url';
import piesDipstickImage from '../../assets/dipstick-pies.svg?url';
import tireTrendlensImage from '../../assets/tire-trendlens.svg?url';
import tireDemandindexImage from '../../assets/tire-demandindex.svg?url';
import tireFactbookImage from '../../assets/tire-factbook.svg?url';
import tireAcademyImage from '../../assets/tire-academy.svg?url';

const TOP_STEP_MAX = 3;
/** Map arch + dashboard band exit before share scene (matches CSS 0.85s). */
const DASHBOARD_EXIT_MS = 900;
const SHARE_REVEAL_BUFFER_MS = 120;

const DIAGNOSTICS_SHARE_MESSAGE = `Every mile counts.

This year, you navigated industry challenges, accelerated professional growth, and connected with fellow leaders across the auto care community.

The road you traveled — and the momentum you helped build for the year ahead is no small feat.

Buckle up. There's much more to come!`;

/** First four Your Journey counter slides — same gauge variants as the journey panel. */
const JOURNEY_COUNTER_STATS = [
  { target: 56, label: 'years', animationKey: 'diag-years', delay: 0, gaugeVariant: 'speedometer' as const },
  { target: 87, label: 'active contacts', animationKey: 'diag-contacts', delay: 200, gaugeVariant: 'fuel' as const },
  { target: 88, label: 'community members', animationKey: 'diag-community', delay: 400, gaugeVariant: 'community-logo' as const },
  { target: 1, label: 'committee members', animationKey: 'diag-committee', delay: 600, gaugeVariant: 'battery' as const },
] as const;

const TIRE_ROLL_IMAGES: Record<TirePhase, string> = {
  trendlens: tireTrendlensImage,
  demandindex: tireDemandindexImage,
  factbook: tireFactbookImage,
  academy: tireAcademyImage,
};

/** Rise into the same vertical band as the top stats / tires carousel */
const DIAG_DIPSTICK_HIDDEN = '92%';
const DIAG_DIPSTICK_RISE = '4%';

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

function DiagnosticsJourneyStatsRow() {
  return (
    <motion.div
      className="full-diagnostics__stats-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {JOURNEY_COUNTER_STATS.map((stat) => (
        <section
          key={stat.animationKey}
          className="journey-counter-panel__gauge full-diagnostics__stat-gauge"
          aria-label={stat.label}
        >
          {stat.gaugeVariant === 'community-logo' ? (
            <CommunityLogoGauge
              target={stat.target}
              label={stat.label}
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

function DiagnosticsTiresRoll() {
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
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function DiagnosticsDipstick({
  src,
  alt,
  risen,
  className,
}: {
  src: string;
  alt: string;
  risen: boolean;
  className: string;
}) {
  return (
    <motion.div
      className={`hood-dipstick-rise full-diagnostics__dipstick ${className}`}
      initial={{ top: DIAG_DIPSTICK_HIDDEN }}
      animate={{ top: risen ? DIAG_DIPSTICK_RISE : DIAG_DIPSTICK_HIDDEN }}
      transition={{ duration: 1.25, ease: [0.25, 0, 0.2, 1], delay: risen ? 0.1 : 0 }}
    >
      <img src={src} alt={alt} className="hood-dipstick-rise__img" draggable={false} />
    </motion.div>
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

function DiagnosticsAcesPiesBehindArch() {
  const [risen, setRisen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRisen(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="full-diagnostics__dipsticks-overlay" aria-hidden={false}>
      <div className="full-diagnostics__dipsticks full-diagnostics__dipsticks--pair-art">
        <DiagnosticsDipstick
          src={acesDipstickImage}
          alt="ACES standard"
          risen={risen}
          className="full-diagnostics__dipstick hood-dipstick-img--aces"
        />
        <DiagnosticsDipstick
          src={piesDipstickImage}
          alt="PIES standard"
          risen={risen}
          className="full-diagnostics__dipstick hood-dipstick-img--pies"
        />
      </div>
    </div>
  );
}

const EVENT_BAR_FILL_MS = 2000;

function DiagnosticsMapEngagement({
  archHidden,
  showPopups,
}: {
  archHidden: boolean;
  showPopups: boolean;
}) {
  const [barW, setBarW] = useState(0);
  const [webinarHours, setWebinarHours] = useState(0);

  useEffect(() => {
    setBarW(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / EVENT_BAR_FILL_MS, 1);
      setBarW(Math.round((1 - (1 - p) ** 3) * BAR_FILL_MAX));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    setWebinarHours(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / EVENT_BAR_FILL_MS, 1);
      setWebinarHours(Math.round((1 - (1 - p) ** 3) * WEBINAR_HOURS_MAX));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
          {showPopups ? (
            <div className="full-diagnostics__map-ui">
              <div className="full-diagnostics__map-popup-wrap">
                <div className="journey-nav-popup-overlay full-diagnostics__map-popups-row">
                  <motion.div
                    className="full-diagnostics__map-popup-slot"
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <GpsPopupContent
                      phase={2}
                      isActive
                      dotCount={1}
                      evtPct={evtPct}
                      barW={barW}
                      webinarHours={webinarHours}
                      detailsReady={false}
                    />
                  </motion.div>
                  <motion.div
                    className="full-diagnostics__map-popup-slot"
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <GpsPopupContent
                      phase={3}
                      isActive
                      dotCount={1}
                      evtPct={evtPct}
                      barW={barW}
                      webinarHours={webinarHours}
                      detailsReady={false}
                    />
                  </motion.div>
                </div>
              </div>
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
}: {
  step: number;
  onStepChange: (next: number) => void;
  shareFocus: boolean;
  onBackToStart: () => void;
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
            {step === 0 && <DiagnosticsJourneyStatsRow key="stats" />}
            {step === 1 && <DiagnosticsTiresRoll key="tires" />}
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
                ? 'Show standards dipsticks on map'
                : step === 2
                  ? 'Show year in review and share'
                  : 'Continue'
          }
        />
      </div>
    </div>
  );
}

export function FullDiagnosticsPanel({ onBackToStart }: { onBackToStart: () => void }) {
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
  const showDipsticksOverlay = topStep === 2 || dashboardExiting;
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
      />

      {showDipsticksOverlay ? <DiagnosticsAcesPiesBehindArch /> : null}

      <div
        className={`full-diagnostics__map${topStep === 2 && !dashboardExiting ? ' full-diagnostics__map--arch-front' : ''}${shareFocus ? ' full-diagnostics__map--share-focus' : ''}`}
      >
        <DiagnosticsMapEngagement archHidden={archHidden} showPopups={showMapPopups} />
      </div>
    </div>
  );
}
