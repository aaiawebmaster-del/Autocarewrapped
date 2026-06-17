import type { CSSProperties } from 'react';

type MetallicPanel = {
  id: string;
  width: number;
  inset: string;
  top: string;
  layer: 'near' | 'mid' | 'far';
  opacity?: number;
};

const LEFT_PANELS: MetallicPanel[] = [
  { id: 'l1', width: 280, inset: '-18%', top: '-28%', layer: 'far', opacity: 0.4 },
  { id: 'l2', width: 200, inset: '2%', top: '-14%', layer: 'mid', opacity: 0.56 },
  { id: 'l3', width: 260, inset: '-10%', top: '2%', layer: 'near', opacity: 0.74 },
  { id: 'l4', width: 150, inset: '14%', top: '14%', layer: 'far', opacity: 0.36 },
  { id: 'l5', width: 220, inset: '-4%', top: '28%', layer: 'mid', opacity: 0.62 },
  { id: 'l6', width: 130, inset: '20%', top: '42%', layer: 'near', opacity: 0.76 },
];

const RIGHT_PANELS: MetallicPanel[] = [
  { id: 'r1', width: 280, inset: '-18%', top: '-28%', layer: 'far', opacity: 0.4 },
  { id: 'r2', width: 200, inset: '2%', top: '-14%', layer: 'mid', opacity: 0.56 },
  { id: 'r3', width: 260, inset: '-10%', top: '2%', layer: 'near', opacity: 0.74 },
  { id: 'r4', width: 150, inset: '14%', top: '14%', layer: 'far', opacity: 0.36 },
  { id: 'r5', width: 220, inset: '-4%', top: '28%', layer: 'mid', opacity: 0.62 },
  { id: 'r6', width: 130, inset: '20%', top: '42%', layer: 'near', opacity: 0.76 },
];

function MetallicPanelStrip({
  panel,
  side,
}: {
  panel: MetallicPanel;
  side: 'left' | 'right';
}) {
  return (
    <div
      className={`hood-standards-metallic-bg__panel hood-standards-metallic-bg__panel--${panel.layer} hood-standards-metallic-bg__panel--${side}`}
      style={
        {
          '--panel-width': `${panel.width}px`,
          '--panel-inset': panel.inset,
          '--panel-top': panel.top,
          '--panel-opacity': panel.opacity ?? 0.55,
        } as CSSProperties
      }
    />
  );
}

/** Side-framed metallic trim — center stays open black for battery + device */
export function HoodStandardsMetallicBackground() {
  return (
    <div className="hood-standards-metallic-bg" aria-hidden>
      <div className="hood-standards-metallic-bg__base" />
      <div className="hood-standards-metallic-bg__side hood-standards-metallic-bg__side--left">
        <div className="hood-standards-metallic-bg__blooms">
          <span className="hood-standards-metallic-bg__bloom hood-standards-metallic-bg__bloom--left" />
        </div>
        <div className="hood-standards-metallic-bg__panels">
          {LEFT_PANELS.map((panel) => (
            <MetallicPanelStrip key={panel.id} panel={panel} side="left" />
          ))}
        </div>
        <div className="hood-standards-metallic-bg__noise" />
      </div>
      <div className="hood-standards-metallic-bg__side hood-standards-metallic-bg__side--right">
        <div className="hood-standards-metallic-bg__blooms">
          <span className="hood-standards-metallic-bg__bloom hood-standards-metallic-bg__bloom--right" />
        </div>
        <div className="hood-standards-metallic-bg__panels">
          {RIGHT_PANELS.map((panel) => (
            <MetallicPanelStrip key={panel.id} panel={panel} side="right" />
          ))}
        </div>
        <div className="hood-standards-metallic-bg__noise" />
      </div>
    </div>
  );
}
