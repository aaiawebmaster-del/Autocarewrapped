import { motion } from 'motion/react';
import type { EventsMetrics } from '@/types/wrappedReport';
import {
  getAttendanceCopy,
  getWebinarCopy,
  attendedCountFromPct,
} from '@/lib/contentVariants';

export const TURN_RIGHT_PATH =
  'M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C429.4 160.1 415.7 157.4 403.7 162.4C391.7 167.4 384 179.1 384 192L384 256L224 256C135.6 256 64 327.6 64 416L64 480C64 497.7 78.3 512 96 512L160 512C177.7 512 192 497.7 192 480L192 416C192 398.3 206.3 384 224 384L384 384L384 448C384 460.9 391.8 472.6 403.8 477.6C415.8 482.6 429.5 479.8 438.7 470.7L566.7 342.7z';

export type GpsPopupProps = {
  phase: number;
  isActive?: boolean;
  dotCount: number;
  evtPct: number;
  barW: number;
  webinarHours: number;
  detailsReady: boolean;
  eventsMetrics: EventsMetrics;
  onSeeWhatsNext?: () => void;
};

function GpsNavPopupDetails({
  body,
  cta,
  centered = false,
}: {
  body: string;
  cta: { label: string; href: string };
  centered?: boolean;
}) {
  return (
    <motion.div
      className="gps-event-popup__nav-details"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="gps-event-popup__nav-body">{body}</p>
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`gps-event-popup__cta gps-event-popup__cta--nav${centered ? ' gps-event-popup__cta--center' : ' gps-event-popup__cta--full'}`}
      >
        {cta.label}
      </a>
    </motion.div>
  );
}

function GpsLocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d="M12 21 C12 21 18 14.5 18 10.5 C18 7.08 15.42 4.5 12 4.5 C8.58 4.5 6 7.08 6 10.5 C6 14.5 12 21 12 21 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2" fill="rgba(16, 18, 22, 0.95)" />
    </svg>
  );
}

function GpsEventRouteTrack({
  barW,
  eventsMetrics,
}: {
  barW: number;
  eventsMetrics: EventsMetrics;
}) {
  const { inPersonTotal, attendancePct } = eventsMetrics;
  const attendedCount = attendedCountFromPct(barW, inPersonTotal);
  const sectionCount = inPersonTotal;
  const destinationReached = barW >= attendancePct;

  return (
    <div
      className="journey-nav-attendance-bar__route"
      aria-label={`${attendedCount} of ${inPersonTotal} in-person events attended`}
    >
      <div className="journey-nav-attendance-bar__route-pins">
        <span
          className={[
            'journey-nav-attendance-bar__route-pin',
            destinationReached ? 'journey-nav-attendance-bar__route-pin--attended' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ left: '100%' }}
        >
          <GpsLocationPinIcon />
        </span>
      </div>
      <div className="journey-nav-attendance-bar__route-track">
        <div
          className="journey-nav-attendance-bar__route-fill"
          style={{ width: `${barW}%` }}
        />
        {Array.from({ length: Math.max(0, sectionCount - 1) }, (_, index) => (
          <span
            key={index}
            className="journey-nav-attendance-bar__route-divider"
            style={{ left: `${((index + 1) / sectionCount) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function GpsNavTurnIcon({
  variant,
  size = 32,
}: {
  variant: 'attendance' | 'hours';
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 640 640"
      width={size}
      height={size}
      className={`gps-icon-turn gps-icon-turn--${variant}`}
      aria-hidden
    >
      <path d={TURN_RIGHT_PATH} fill="currentColor" />
    </svg>
  );
}

function GpsAttendanceStatCard({
  evtPct,
  barW,
  detailsReady,
  stackedClass,
  eventsMetrics,
}: {
  evtPct: number;
  barW: number;
  detailsReady: boolean;
  stackedClass: string;
  eventsMetrics: EventsMetrics;
}) {
  const attendanceCopy = getAttendanceCopy(eventsMetrics);
  const showDetails = detailsReady;

  return (
    <div
      className={`gps-event-popup gps-event-popup--nav gps-event-popup--attendance gps-attendance-stat${stackedClass}${showDetails ? ' gps-event-popup--nav-expanded gps-attendance-stat--expanded' : ''}`}
      aria-label={`${evtPct}% in-person event attendance`}
    >
      <div className="gps-attendance-stat__metric">
        <p className="gps-attendance-stat__value">{evtPct}%</p>
        <p className="gps-attendance-stat__label">{attendanceCopy.metricLabel}</p>
      </div>

      <div className="gps-attendance-stat__bar-track" aria-hidden>
        <div className="gps-attendance-stat__bar-fill" style={{ width: `${barW}%` }} />
      </div>

      <p className="gps-attendance-stat__events-total">{attendanceCopy.eventsTotalLabel}</p>

      {showDetails && (
        <GpsNavPopupDetails body={attendanceCopy.body} cta={attendanceCopy.cta} />
      )}
    </div>
  );
}

export function GpsAttendanceBottomBar({
  evtPct,
  barW,
  detailsReady,
  eventsMetrics,
  onBack,
  onNext,
  nextLabel = 'next',
  nextDisabled = false,
}: {
  evtPct: number;
  barW: number;
  detailsReady: boolean;
  eventsMetrics: EventsMetrics;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  const attendanceCopy = getAttendanceCopy(eventsMetrics);
  const attendedCount = attendedCountFromPct(evtPct, eventsMetrics.inPersonTotal);

  return (
    <motion.div
      className="journey-nav-attendance-bar"
      aria-label={`${evtPct}% in-person event attendance`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="journey-nav-attendance-bar__content">
        <div className="journey-nav-attendance-bar__header">
          <div className="journey-nav-attendance-bar__headline">
            <p className="journey-nav-attendance-bar__eyebrow">{attendanceCopy.eyebrow}</p>
            <p className="journey-nav-attendance-bar__label">
              {detailsReady
                ? attendanceCopy.detailLabel(attendedCount, eventsMetrics.inPersonTotal)
                : attendanceCopy.eventsTotalLabel}
            </p>
          </div>
          <div className="journey-nav-attendance-bar__stat">
            <p className="journey-nav-attendance-bar__value">{evtPct}%</p>
          </div>
        </div>

        {detailsReady && (
          <motion.div
            className="journey-nav-attendance-bar__details"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="journey-nav-attendance-bar__body">{attendanceCopy.body}</p>
          </motion.div>
        )}
      </div>

      <div className="journey-nav-attendance-bar__route-wrap">
        <GpsEventRouteTrack barW={barW} eventsMetrics={eventsMetrics} />
      </div>

      <div
        className={[
          'journey-nav-attendance-bar__nav',
          detailsReady ? 'journey-nav-attendance-bar__nav--with-cta' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          className="journey-nav-corner-nav__btn journey-nav-corner-nav__btn--back"
          onClick={onBack}
        >
          back
        </button>
        {detailsReady && (
          <a
            href={attendanceCopy.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="journey-nav-corner-nav__btn journey-nav-corner-nav__btn--cta"
          >
            {attendanceCopy.cta.label}
          </a>
        )}
        <button
          type="button"
          className="journey-nav-corner-nav__btn journey-nav-corner-nav__btn--next"
          onClick={onNext}
          disabled={nextDisabled}
        >
          {nextLabel}
        </button>
      </div>
    </motion.div>
  );
}

export function GpsPopupContent({
  phase,
  isActive = true,
  dotCount: _dotCount,
  evtPct,
  barW,
  webinarHours,
  detailsReady,
  eventsMetrics,
}: GpsPopupProps) {
  const { attendancePct, webinarCount: targetWebinarHours } = eventsMetrics;
  const resolvedBarW = phase === 2 && !isActive ? attendancePct : barW;
  const resolvedEvtPct = phase === 2 && !isActive ? attendancePct : evtPct;
  const resolvedWebinarHours =
    phase === 3 && !isActive ? targetWebinarHours : webinarHours;
  const stackedClass = isActive ? '' : ' gps-event-popup--nav-stacked';
  const showDetails = detailsReady && isActive;
  const webinarCopy = getWebinarCopy(targetWebinarHours);

  if (phase === 2) {
    return (
      <GpsAttendanceStatCard
        evtPct={resolvedEvtPct}
        barW={resolvedBarW}
        detailsReady={showDetails}
        stackedClass={stackedClass}
        eventsMetrics={eventsMetrics}
      />
    );
  }

  if (phase === 3) {
    return (
      <div
        className={`gps-event-popup gps-event-popup--nav gps-event-popup--hours${stackedClass}${showDetails ? ' gps-event-popup--nav-expanded' : ''}`}
      >
        <div className="gps-event-popup__nav-icon" aria-hidden>
          <GpsNavTurnIcon variant="hours" size={32} />
        </div>
        <div
          className={`gps-event-popup__nav-text${showDetails ? ' gps-event-popup__nav-text--center' : ''}`}
        >
          <p className="gps-event-popup__title">{resolvedWebinarHours} Hours</p>
          <p className="gps-event-popup__subtitle">{webinarCopy.subtitle}</p>
          {showDetails && (
            <GpsNavPopupDetails
              body={webinarCopy.body}
              cta={webinarCopy.cta}
              centered
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
