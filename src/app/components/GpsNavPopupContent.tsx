import { type ReactNode } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import hourglassIcon from '../../assets/hourglass-duotone-solid-full.png';
import type { EventsMetrics } from '@/types/wrappedReport';
import type { WebinarCopy } from '@/lib/contentVariants';
import {
  getAttendanceCopy,
  getWebinarCopy,
  attendedCountFromPct,
} from '@/lib/contentVariants';
import { prefersReducedMotion } from '@/lib/browserCompat';

export const TURN_RIGHT_PATH =
  'M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C429.4 160.1 415.7 157.4 403.7 162.4C391.7 167.4 384 179.1 384 192L384 256L224 256C135.6 256 64 327.6 64 416L64 480C64 497.7 78.3 512 96 512L160 512C177.7 512 192 497.7 192 480L192 416C192 398.3 206.3 384 224 384L384 384L384 448C384 460.9 391.8 472.6 403.8 477.6C415.8 482.6 429.5 479.8 438.7 470.7L566.7 342.7z';

/** Intro-sequence turn arrow — right matches next slide, up rotates for browse CTA. */
export function GpsIntroTurnArrowIcon({
  direction = 'right',
  className,
  size = 20,
}: {
  direction?: 'right' | 'left' | 'up';
  className?: string;
  size?: number;
}) {
  const rotation =
    direction === 'left' ? 'scaleX(-1)' : direction === 'up' ? 'rotate(-90deg)' : 'none';

  return (
    <svg
      viewBox="0 0 640 640"
      width={size}
      height={size}
      className={['gps-nav-direction__cta-icon', className].filter(Boolean).join(' ')}
      style={{ transform: rotation, transformOrigin: 'center center' }}
      fill="currentColor"
      aria-hidden
    >
      <path d={TURN_RIGHT_PATH} />
    </svg>
  );
}

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
  /** Swap the default webinar route icon with a custom asset. */
  webinarIcon?: ReactNode;
  onWebinarNext?: () => void;
  webinarNextDisabled?: boolean;
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

function GpsRouteVehicleChevronIcon() {
  return (
    <svg viewBox="0 0 10 14" aria-hidden focusable="false">
      <path d="M1 1 L9 7 L1 13 Z" fill="currentColor" />
    </svg>
  );
}

export function GpsEventRouteTrack({
  barW,
  eventsMetrics,
  showCount = true,
  loading = false,
}: {
  barW: number;
  eventsMetrics: EventsMetrics;
  showCount?: boolean;
  loading?: boolean;
}) {
  const { inPersonTotal, attendancePct } = eventsMetrics;
  const attendedCount = attendedCountFromPct(barW, inPersonTotal);
  const sectionCount = inPersonTotal;
  const destinationReached = barW >= attendancePct;

  return (
    <div
      className="journey-nav-attendance-bar__route"
      aria-label={
        loading
          ? 'Calculating in-person event attendance'
          : `${attendedCount} of ${inPersonTotal} in-person events attended`
      }
    >
      <div className="journey-nav-attendance-bar__route-upper">
        {showCount && inPersonTotal > 0 ? (
          <p
            className={[
              'journey-nav-attendance-bar__route-count',
              loading ? 'journey-nav-attendance-bar__route-count--calculating' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {loading ? 'Calculating' : `${attendedCount} of ${inPersonTotal}`}
          </p>
        ) : null}
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
      </div>
      <div className="journey-nav-attendance-bar__route-track">
        <div
          className="journey-nav-attendance-bar__route-fill"
          style={{ width: `${barW}%` }}
        >
          {barW > 0 ? (
            <span className="journey-nav-attendance-bar__route-fill-tip" aria-hidden>
              <GpsRouteVehicleChevronIcon />
            </span>
          ) : null}
        </div>
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

function GpsAttendanceRouteSlot({
  eyebrow,
  eyebrowClassName = '',
  barW,
  eventsMetrics,
  showCount = true,
  loading = false,
}: {
  eyebrow: string;
  eyebrowClassName?: string;
  barW: number;
  eventsMetrics: EventsMetrics;
  showCount?: boolean;
  loading?: boolean;
}) {
  return (
    <>
      <p
        className={['journey-nav-attendance-bar__eyebrow', eyebrowClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {eyebrow}
      </p>
      <GpsEventRouteTrack
        barW={barW}
        eventsMetrics={eventsMetrics}
        showCount={showCount}
        loading={loading}
      />
    </>
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

function GpsWebinarHoursBadge({ hours }: { hours: number }) {
  return (
    <>
      <span className="gps-nav-direction__hours-value">{hours}</span>
      <span className="gps-nav-direction__hours-label">HOURS</span>
    </>
  );
}

/** Default direction icon for the webinar nav card — up arrow (swap via `webinarIcon` prop). */
export function GpsWebinarRouteIcon({
  size = 40,
  className,
  title = 'Up',
  'aria-hidden': ariaHidden,
}: {
  size?: number;
  className?: string;
  title?: string;
  'aria-hidden'?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 640 640"
      width={size}
      height={size}
      className={['gps-nav-direction__icon-svg', className].filter(Boolean).join(' ')}
      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center' }}
      role={ariaHidden ? undefined : 'img'}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : title}
      fill="currentColor"
    >
      <path d={TURN_RIGHT_PATH} />
    </svg>
  );
}

function GpsNavDirectionCard({
  primaryText,
  secondaryText,
  message,
  showMessage = true,
  icon,
  stackedClass = '',
  showActionBand = false,
  showPrimaryStat = true,
  ctaLink,
  onNext,
  nextDisabled = false,
  nextLabel = 'next',
  ariaLabel,
}: {
  primaryText?: string;
  secondaryText: string;
  message?: string;
  showMessage?: boolean;
  icon?: ReactNode;
  stackedClass?: string;
  showActionBand?: boolean;
  showPrimaryStat?: boolean;
  ctaLink?: { label: string; href: string };
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  ariaLabel: string;
}) {
  const resolvedIcon = icon ?? <GpsWebinarRouteIcon title="" aria-hidden />;
  const hasCtaTab = showActionBand && Boolean(ctaLink);

  return (
    <div
      className={[
        'gps-nav-direction-stack',
        hasCtaTab ? 'gps-nav-direction-stack--cta-tab' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'gps-event-popup',
          'gps-event-popup--nav',
          'gps-event-popup--hours',
          'gps-nav-direction',
          'gps-nav-direction--webinar',
          stackedClass,
          showActionBand ? 'gps-event-popup--nav-expanded gps-nav-direction--expanded' : '',
          hasCtaTab ? 'gps-nav-direction--card' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={ariaLabel}
      >
        <div className="gps-nav-direction__instruction">
          <div className="gps-nav-direction__icon" aria-hidden>
            {resolvedIcon}
          </div>
          <div className="gps-nav-direction__copy">
            {showPrimaryStat && primaryText ? (
              <p className="gps-nav-direction__stat">{primaryText}</p>
            ) : null}
            <p className="gps-nav-direction__label">{secondaryText}</p>
            {showMessage && message && (
              <motion.p
                className="gps-nav-direction__message"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {message}
              </motion.p>
            )}
          </div>
        </div>

        {showActionBand && ctaLink && onNext && !hasCtaTab && (
          <motion.div
            className="gps-nav-direction__action-band"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="gps-nav-direction__action-row">
              <a
                href={ctaLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="gps-nav-direction__cta gps-nav-direction__cta--link"
              >
                <GpsIntroTurnArrowIcon direction="up" />
                <span className="gps-nav-direction__cta-label">{ctaLink.label}</span>
              </a>
              <button
                type="button"
                className="gps-nav-direction__cta gps-nav-direction__cta--next"
                onClick={onNext}
                disabled={nextDisabled}
              >
                <GpsIntroTurnArrowIcon direction="right" />
                <span className="gps-nav-direction__cta-text">{nextLabel}</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {hasCtaTab && ctaLink && (
        <motion.a
          href={ctaLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="gps-nav-direction__cta gps-nav-direction__cta--link gps-nav-direction__cta-tag"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="gps-nav-direction__cta-label">{ctaLink.label}</span>
          <GpsIntroTurnArrowIcon direction="right" />
        </motion.a>
      )}
    </div>
  );
}

function GpsWebinarDirectionCard({
  hours,
  copy,
  showDetails,
  stackedClass,
  icon,
  onNext,
  nextDisabled = false,
  nextLabel = 'next',
}: {
  hours: number;
  copy: WebinarCopy;
  showDetails: boolean;
  stackedClass: string;
  icon?: ReactNode;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <GpsNavDirectionCard
      secondaryText={copy.subtitle}
      message={copy.body}
      showMessage={showDetails}
      icon={icon ?? <GpsWebinarHoursBadge hours={hours} />}
      stackedClass={stackedClass}
      showActionBand={showDetails}
      showPrimaryStat={false}
      ctaLink={copy.cta}
      onNext={onNext}
      nextDisabled={nextDisabled}
      nextLabel={nextLabel}
      ariaLabel={`${hours} hours, webinar attendance`}
    />
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

      <div className="gps-attendance-stat__route-block">
        <GpsAttendanceRouteSlot
          eyebrow={attendanceCopy.eyebrow}
          eyebrowClassName="gps-attendance-stat__route-eyebrow"
          barW={barW}
          eventsMetrics={eventsMetrics}
        />
      </div>

      <p className="gps-attendance-stat__events-total">{attendanceCopy.eventsTotalLabel}</p>

      {showDetails && (
        <GpsNavPopupDetails body={attendanceCopy.body} cta={attendanceCopy.cta} />
      )}
    </div>
  );
}

/** Read-only compact attendance row — value, eyebrow, and route track (no nav buttons). */
export function GpsAttendanceRoutePanel({
  evtPct,
  barW,
  eventsMetrics,
  className,
}: {
  evtPct: number;
  barW: number;
  eventsMetrics: EventsMetrics;
  className?: string;
}) {
  const attendanceCopy = getAttendanceCopy(eventsMetrics);

  return (
    <div
      className={[
        'journey-nav-attendance-bar',
        'journey-nav-attendance-bar--compact',
        'journey-nav-attendance-bar--readout',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${evtPct}% in-person event attendance`}
    >
      <div className="journey-nav-attendance-bar__screen journey-nav-attendance-bar__screen--compact">
        <div className="journey-nav-attendance-bar__main journey-nav-attendance-bar__main--compact journey-nav-attendance-bar__main--readout">
          <p className="journey-nav-attendance-bar__value">{evtPct}%</p>
          <div className="journey-nav-attendance-bar__route-slot">
            <GpsAttendanceRouteSlot
              eyebrow={attendanceCopy.eyebrow}
              barW={barW}
              eventsMetrics={eventsMetrics}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const ATTENDANCE_BAR_COMPACT_EASE = [0.22, 1, 0.36, 1] as const;

const ATTENDANCE_BAR_COMPACT_TRANSITION = {
  duration: 0.6,
  ease: ATTENDANCE_BAR_COMPACT_EASE,
};

const ATTENDANCE_BAR_HEADLINE_TRANSITION = {
  duration: 0.52,
  ease: ATTENDANCE_BAR_COMPACT_EASE,
};

const ATTENDANCE_SCREEN_ENTER_TRANSITION = {
  opacity: { duration: 0.35, ease: ATTENDANCE_BAR_COMPACT_EASE },
  y: { duration: 0.58, ease: ATTENDANCE_BAR_COMPACT_EASE },
};

const ATTENDANCE_CALCULATING_COPY = 'Calculating In-Person Event Attendance';

export function GpsMapControlTray({
  eventsMetrics,
  onBack,
  onNext,
  nextLabel = 'next',
  nextDisabled = false,
}: {
  eventsMetrics: EventsMetrics;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  const attendanceCopy = getAttendanceCopy(eventsMetrics);

  return (
    <div className="journey-nav-control-tray" aria-label="Map navigation">
      <button
        type="button"
        className="infotainment-headunit__softkey infotainment-headunit__nav-btn infotainment-headunit__nav-btn--left journey-nav-control-tray__back"
        onClick={onBack}
      >
        back
      </button>
      <a
        href={attendanceCopy.cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className="infotainment-headunit__softkey infotainment-headunit__nav-btn journey-nav-control-tray__cta"
      >
        {attendanceCopy.cta.label}
      </a>
      <button
        type="button"
        className="infotainment-headunit__softkey infotainment-headunit__nav-btn infotainment-headunit__nav-btn--right journey-nav-control-tray__next"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </button>
    </div>
  );
}

export function GpsAttendanceBottomBar({
  evtPct,
  barW,
  detailsReady,
  eventsMetrics,
  compact = false,
  calculating = false,
  showScreen = true,
}: {
  evtPct: number;
  barW: number;
  detailsReady: boolean;
  eventsMetrics: EventsMetrics;
  compact?: boolean;
  calculating?: boolean;
  showScreen?: boolean;
}) {
  const attendanceCopy = getAttendanceCopy(eventsMetrics);
  const reduceMotion = prefersReducedMotion();
  const isLoading = calculating || !detailsReady;

  return (
    <LayoutGroup id="journey-nav-attendance-bar">
      <motion.div
        className={[
          'journey-nav-attendance-bar',
          'journey-nav-attendance-bar--screen-panel',
          compact ? 'journey-nav-attendance-bar--compact' : '',
          calculating ? 'journey-nav-attendance-bar--calculating' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={
          calculating
            ? ATTENDANCE_CALCULATING_COPY
            : `${evtPct}% in-person event attendance`
        }
        aria-busy={calculating}
        initial={{ opacity: reduceMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{
          opacity: {
            duration: reduceMotion ? 0 : 0.35,
            ease: ATTENDANCE_BAR_COMPACT_EASE,
          },
        }}
      >
        {showScreen ? (
          <motion.div
            className={[
              'journey-nav-attendance-bar__screen',
              compact ? 'journey-nav-attendance-bar__screen--compact' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : '100%' }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : ATTENDANCE_SCREEN_ENTER_TRANSITION
            }
          >
          <div
            className={[
              'journey-nav-attendance-bar__main',
              compact ? 'journey-nav-attendance-bar__main--compact' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div
              className={[
                'journey-nav-attendance-bar__value',
                isLoading ? 'journey-nav-attendance-bar__value--calculating' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {isLoading ? (
                <img
                  src={hourglassIcon}
                  alt=""
                  className="journey-nav-attendance-bar__hourglass gps-icon-turn gps-icon-hourglass--loading"
                  width={40}
                  height={40}
                />
              ) : (
                `${evtPct}%`
              )}
            </div>

            <div className="journey-nav-attendance-bar__route-slot">
              <GpsAttendanceRouteSlot
                eyebrow={attendanceCopy.eyebrow}
                barW={barW}
                eventsMetrics={eventsMetrics}
                loading={isLoading}
              />
            </div>

            <motion.div
              className="journey-nav-attendance-bar__headline"
              initial={false}
              animate={
                compact
                  ? {
                      height: 0,
                      opacity: 0,
                      marginTop: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                    }
                  : {
                      height: 'auto',
                      opacity: 1,
                      marginTop: 0,
                      paddingTop: undefined,
                      paddingBottom: undefined,
                    }
              }
              transition={{
                ...ATTENDANCE_BAR_HEADLINE_TRANSITION,
                opacity: { duration: 0.34, ease: 'easeOut' },
                height: ATTENDANCE_BAR_HEADLINE_TRANSITION,
              }}
              style={{ overflow: 'hidden' }}
              aria-hidden={compact}
            >
              <div className="journey-nav-attendance-bar__copy-slot">
                {calculating ? (
                  <p className="journey-nav-attendance-bar__calculating">{ATTENDANCE_CALCULATING_COPY}</p>
                ) : (
                  <p className="journey-nav-attendance-bar__support">{attendanceCopy.asideMessage}</p>
                )}
              </div>
            </motion.div>
          </div>
          </motion.div>
        ) : null}
      </motion.div>
    </LayoutGroup>
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
  webinarIcon,
  onWebinarNext,
  webinarNextDisabled = false,
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
      <GpsWebinarDirectionCard
        hours={resolvedWebinarHours}
        copy={webinarCopy}
        showDetails={showDetails}
        stackedClass={stackedClass}
        icon={webinarIcon}
        onNext={onWebinarNext}
        nextDisabled={webinarNextDisabled}
      />
    );
  }

  return null;
}
