import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DashboardMapArch } from './MapSimulation';
import { JourneyCounterGauge, DIAGNOSTICS_GAUGE_SIZE } from './JourneyCounterGauge';
import acesOilImage from '../../assets/aces-oil.png?url';
import piesOilImage from '../../assets/pies-oil.png?url';
import completedTireCheckImage from '../../assets/completed-tire-check.png?url';

const DIAG_YEARS_TARGET = 46;
const DIAG_MEMBERS_TARGET = 5000;
const DIAG_COMMITTEE_CONTACT_TARGET = 1;
const BAR_FILL_MAX = 179;
const WEBINAR_TURN_PATH =
  'M3.26 11.93A1 1 0 0 0 4 13h6v7a1 1 0 0 0 2 0V6.41l4.29 4.3a1 1 0 1 0 1.42-1.42l-6-6a1 1 0 0 0-1.42 0L4.26 9.29a1 1 0 0 0 0 1.42l-1 1.22z';

const DIPSTICK_HIDDEN = '88%';
const DIPSTICK_RISE = '24%';

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
      initial={{ top: DIPSTICK_HIDDEN }}
      animate={{ top: risen ? DIPSTICK_RISE : DIPSTICK_HIDDEN }}
      transition={{ duration: 1.25, ease: [0.25, 0, 0.2, 1], delay: risen ? 0.1 : 0 }}
    >
      <img src={src} alt={alt} className="hood-dipstick-rise__img" draggable={false} />
    </motion.div>
  );
}

function DiagnosticsAcesPiesDipsticks() {
  const [acesRisen, setAcesRisen] = useState(false);
  const [piesRisen, setPiesRisen] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setAcesRisen(true), 1200);
    const t2 = setTimeout(() => setPiesRisen(true), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="full-diagnostics__dipsticks" aria-hidden={false}>
      <DiagnosticsDipstick
        src={acesOilImage}
        alt="ACES standard"
        risen={acesRisen}
        className="hood-dipstick-img--aces"
      />
      <DiagnosticsDipstick
        src={piesOilImage}
        alt="PIES standard"
        risen={piesRisen}
        className="hood-dipstick-img--pies"
      />
    </div>
  );
}

function WebinarTurnIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      className="gps-icon-turn"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#5eb8e8"
      aria-hidden
    >
      <path d={WEBINAR_TURN_PATH} />
    </svg>
  );
}

function DiagnosticsEventsPopup({ evtPct, barW }: { evtPct: number; barW: number }) {
  return (
    <motion.div
      className="gps-event-popup full-diagnostics__map-popup"
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="gps-event-popup__headline">
        <p className="gps-event-popup__title">{evtPct}%</p>
        <div className="gps-event-popup__bar-track">
          <div
            className="gps-event-popup__bar-fill"
            style={{ width: `${(barW / BAR_FILL_MAX) * 100}%` }}
          />
        </div>
      </div>
      <p className="gps-event-popup__subtitle">event attendance</p>
    </motion.div>
  );
}

function DiagnosticsWebinarsPopup() {
  return (
    <motion.div
      className="gps-event-popup full-diagnostics__map-popup"
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="gps-event-popup__row-icon">
        <WebinarTurnIcon size={28} />
        <p className="gps-event-popup__title" style={{ margin: 0 }}>
          54 Hours
        </p>
      </div>
      <p className="gps-event-popup__subtitle">of webinars attended</p>
    </motion.div>
  );
}

function DiagnosticsMapEngagement() {
  const [barW, setBarW] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 2000, 1);
      setBarW(Math.round((1 - (1 - p) ** 3) * BAR_FILL_MAX));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const evtPct = Math.round((barW / BAR_FILL_MAX) * 73);

  return (
    <div className="full-diagnostics__map-shell">
      <div className="full-diagnostics__map-bg">
        <DashboardMapArch showNavCursor={false} />
      </div>
      <div className="full-diagnostics__map-popup-wrap">
        <div className="full-diagnostics__map-popups-row">
          <DiagnosticsEventsPopup evtPct={evtPct} barW={barW} />
          <DiagnosticsWebinarsPopup />
        </div>
      </div>
    </div>
  );
}

export function FullDiagnosticsPanel() {
  return (
    <div className="full-diagnostics">
      <header className="full-diagnostics__header">
        <h2 className="full-diagnostics__title">Full Diagnostics</h2>
        <p className="full-diagnostics__subtitle">Your Complete Standards Profile</p>
      </header>

      <div className="full-diagnostics__top">
        <div className="full-diagnostics__gauges-cluster">
          <div className="full-diagnostics__gauges">
            <JourneyCounterGauge
              className="full-diagnostics__gauge full-diagnostics__gauge--years"
              target={DIAG_YEARS_TARGET}
              label="years"
              animationKey="diag-years"
              circleSize={DIAGNOSTICS_GAUGE_SIZE}
            />
            <JourneyCounterGauge
              className="full-diagnostics__gauge full-diagnostics__gauge--members"
              target={DIAG_MEMBERS_TARGET}
              label="members"
              animationKey="diag-members"
              delay={300}
              circleSize={DIAGNOSTICS_GAUGE_SIZE}
            />
            <JourneyCounterGauge
              className="full-diagnostics__gauge full-diagnostics__gauge--committee"
              target={DIAG_COMMITTEE_CONTACT_TARGET}
              label="Active Contacts"
              animationKey="diag-committee"
              delay={600}
              circleSize={DIAGNOSTICS_GAUGE_SIZE}
            />
          </div>
          <div className="full-diagnostics__tire-check" aria-hidden>
            <img
              src={completedTireCheckImage}
              alt=""
              className="full-diagnostics__tire-check-img"
              draggable={false}
            />
          </div>
        </div>
        <DiagnosticsAcesPiesDipsticks />
      </div>

      <div className="full-diagnostics__map">
        <DiagnosticsMapEngagement />
      </div>
    </div>
  );
}
