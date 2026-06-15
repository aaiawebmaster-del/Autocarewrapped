import { VehicleVent } from './VehicleVent';

/** Decorative dashboard HVAC vents — left/right of the 900px content shell. */
export function DashboardWideDecor() {
  return (
    <>
      <div className="dashboard-vent-mount dashboard-vent-mount--left">
        <VehicleVent side="left" />
      </div>
      <div className="dashboard-vent-mount dashboard-vent-mount--right">
        <VehicleVent side="right" />
      </div>
    </>
  );
}
