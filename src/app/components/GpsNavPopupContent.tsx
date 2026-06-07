import { motion } from 'motion/react';

/** In-person event attendance target (percent). */
export const BAR_FILL_MAX = 25;
export const WEBINAR_HOURS_MAX = 38;

export const ATTENDANCE_NAV_BODY =
  'Our Events are the easiest way to get fresh education, make new connections, and reinforce business relationships.';
export const ATTENDANCE_NAV_CTA = {
  label: 'see upcoming events',
  href: 'https://autocare.org/events',
};
export const WEBINAR_NAV_BODY = 'See what you missed and view our webinars on-demand.';
export const WEBINAR_NAV_CTA = {
  label: 'browse webinar library',
  href: 'https://autocare.org/education',
};

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

export function GpsPopupContent({
  phase,
  isActive = true,
  dotCount: _dotCount,
  evtPct,
  barW,
  webinarHours,
  detailsReady,
}: GpsPopupProps) {
  const resolvedBarW = phase === 2 && !isActive ? BAR_FILL_MAX : barW;
  const resolvedEvtPct = phase === 2 && !isActive ? BAR_FILL_MAX : evtPct;
  const resolvedWebinarHours =
    phase === 3 && !isActive ? WEBINAR_HOURS_MAX : webinarHours;
  const stackedClass = isActive ? '' : ' gps-event-popup--nav-stacked';
  const showDetails = detailsReady && isActive;

  if (phase === 2) {
    return (
      <div
        className={`gps-event-popup gps-event-popup--nav gps-event-popup--attendance${stackedClass}${showDetails ? ' gps-event-popup--nav-expanded' : ''}`}
      >
        <div className="gps-event-popup__nav-icon" aria-hidden>
          <GpsNavTurnIcon variant="attendance" size={32} />
        </div>
        <div className="gps-event-popup__nav-text">
          <p className="gps-event-popup__title">{resolvedEvtPct}%</p>
          <p className="gps-event-popup__subtitle">in-person event attendance</p>
          {!showDetails && (
            <div className="gps-event-popup__bar-track">
              <div
                className="gps-event-popup__bar-fill"
                style={{ width: `${resolvedBarW}%` }}
              />
            </div>
          )}
          {showDetails && (
            <GpsNavPopupDetails body={ATTENDANCE_NAV_BODY} cta={ATTENDANCE_NAV_CTA} />
          )}
        </div>
      </div>
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
          <p className="gps-event-popup__subtitle">webinars attended this year</p>
          {showDetails && (
            <GpsNavPopupDetails
              body={WEBINAR_NAV_BODY}
              cta={WEBINAR_NAV_CTA}
              centered
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
