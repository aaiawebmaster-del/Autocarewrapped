/** Premium circular HVAC vent — decorative only, matches HMI chrome bezel system. */
export function VehicleVent({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`vehicle-vent vehicle-vent--${side}`} aria-hidden>
      <div className="vehicle-vent__surround">
        <div className="vehicle-vent__bezel">
          <div className="vehicle-vent__cavity">
            <div className="vehicle-vent__slats" />
            <span className="vehicle-vent__tab" />
          </div>
        </div>
      </div>
    </div>
  );
}
