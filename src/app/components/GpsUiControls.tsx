import type { ReactNode } from 'react';
import iconPlus from '../../assets/map-controls/plus-solid-full.png';
import iconMinus from '../../assets/map-controls/minus-solid-full.png';

type GpsUiControlDecorProps = {
  className?: string;
  children: ReactNode;
};

function GpsUiControlDecor({ className, children }: GpsUiControlDecorProps) {
  return (
    <div className={['gps-ui-controls__btn', className].filter(Boolean).join(' ')} aria-hidden>
      <span className="gps-ui-controls__btn-glyph" aria-hidden>
        {children}
      </span>
    </div>
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

type GpsUiControlsProps = {
  className?: string;
};

/** In-car GPS control overlay — layered above map animation, below popups/modals. */
export function GpsUiControls({ className }: GpsUiControlsProps) {
  return (
    <div
      className={['gps-ui-controls', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      <div className="gps-ui-controls__cluster gps-ui-controls__cluster--top-left">
        <GpsUiControlDecor className="gps-ui-controls__btn--search">
          <GpsUiSearchIcon />
        </GpsUiControlDecor>
      </div>

      <div className="gps-ui-controls__cluster gps-ui-controls__cluster--zoom">
        <GpsUiControlDecor className="gps-ui-controls__btn--zoom-in">
          <GpsUiControlIcon src={iconPlus} />
        </GpsUiControlDecor>
        <GpsUiControlDecor className="gps-ui-controls__btn--zoom-out">
          <GpsUiControlIcon src={iconMinus} />
        </GpsUiControlDecor>
      </div>
    </div>
  );
}
