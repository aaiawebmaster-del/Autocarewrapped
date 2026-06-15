import type { ReactNode } from 'react';
import iconPlus from '../../assets/map-controls/plus-solid-full.png';
import iconMinus from '../../assets/map-controls/minus-solid-full.png';
import iconVolume from '../../assets/map-controls/volume-low-solid-full.png';

type GpsUiControlButtonProps = {
  label: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

function GpsUiControlButton({ label, className, onClick, children }: GpsUiControlButtonProps) {
  return (
    <button
      type="button"
      className={['gps-ui-controls__btn', className].filter(Boolean).join(' ')}
      aria-label={label}
      onClick={onClick}
    >
      <span className="gps-ui-controls__btn-glyph" aria-hidden>
        {children}
      </span>
    </button>
  );
}

function GpsUiControlIcon({ src, className }: { src: string; className?: string }) {
  return (
    <img src={src} alt="" className={['gps-ui-controls__btn-icon', className].filter(Boolean).join(' ')} draggable={false} />
  );
}

function GpsUiSearchIcon() {
  return (
    <svg className="gps-ui-controls__btn-svg" viewBox="0 0 24 24" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.25" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.2 15.2 L20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GpsUiLocationIcon() {
  return (
    <svg className="gps-ui-controls__btn-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21 C12 21 18 14.5 18 10.5 C18 7.08 15.42 4.5 12 4.5 C8.58 4.5 6 7.08 6 10.5 C6 14.5 12 21 12 21 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2.25" fill="currentColor" />
    </svg>
  );
}

type GpsUiControlsProps = {
  className?: string;
};

/** In-car GPS control overlay — layered above map animation, below popups/modals. */
export function GpsUiControls({ className }: GpsUiControlsProps) {
  return (
    <div
      className={['gps-ui-controls', className].filter(Boolean).join(' ')}
      aria-label="GPS map controls"
    >
      <div className="gps-ui-controls__cluster gps-ui-controls__cluster--top-left">
        <GpsUiControlButton label="Search map" className="gps-ui-controls__btn--search">
          <GpsUiSearchIcon />
        </GpsUiControlButton>
      </div>

      <div className="gps-ui-controls__cluster gps-ui-controls__cluster--zoom">
        <GpsUiControlButton label="Zoom in" className="gps-ui-controls__btn--zoom-in">
          <GpsUiControlIcon src={iconPlus} />
        </GpsUiControlButton>
        <GpsUiControlButton label="Zoom out" className="gps-ui-controls__btn--zoom-out">
          <GpsUiControlIcon src={iconMinus} />
        </GpsUiControlButton>
      </div>

      <div className="gps-ui-controls__cluster gps-ui-controls__cluster--bottom-left">
        <GpsUiControlButton label="Toggle map sound" className="gps-ui-controls__btn--volume">
          <GpsUiControlIcon src={iconVolume} />
        </GpsUiControlButton>
      </div>

      <div className="gps-ui-controls__cluster gps-ui-controls__cluster--bottom-right">
        <GpsUiControlButton label="Recenter map" className="gps-ui-controls__btn--recenter">
          <GpsUiLocationIcon />
        </GpsUiControlButton>
      </div>
    </div>
  );
}
