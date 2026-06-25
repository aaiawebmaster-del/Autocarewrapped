import { AutoCareHeaderLogo } from './AutoCareHeaderLogo';

function getPlateStickerDate(reportYear: number) {
  const month = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return { month, year: String(reportYear) };
}

type LicensePlateProps = {
  reportYear: number;
};

export function LicensePlate({ reportYear }: LicensePlateProps) {
  const { month, year } = getPlateStickerDate(reportYear);

  return (
    <div
      className="license-plate"
      role="img"
      aria-label={`DRIVEN-BY-YOU, Your Year in Review, ${month} ${year}`}
    >
      <div className="license-plate__shadow" aria-hidden />
      <div className="license-plate__shell">
        <div className="license-plate__face">
          <header className="license-plate__header">
            <div className="license-plate__sticker license-plate__sticker--month">
              <span className="license-plate__sticker-text">{month}</span>
            </div>
            <div className="license-plate__logo-wrap">
              <AutoCareHeaderLogo className="license-plate__logo" />
            </div>
            <div className="license-plate__sticker license-plate__sticker--year">
              <span className="license-plate__sticker-text">{year}</span>
            </div>
          </header>

          <div className="license-plate__band">
            <p className="license-plate__registration">DRIVEN-BY-YOU</p>
          </div>

          <footer className="license-plate__caption">
            <p className="license-plate__caption-text">Your Year in Review</p>
          </footer>
        </div>

        <div className="license-plate__chrome" aria-hidden />
      </div>

      <span className="license-plate__mount license-plate__mount--tl" aria-hidden />
      <span className="license-plate__mount license-plate__mount--tr" aria-hidden />
      <span className="license-plate__mount license-plate__mount--bl" aria-hidden />
      <span className="license-plate__mount license-plate__mount--br" aria-hidden />
    </div>
  );
}
