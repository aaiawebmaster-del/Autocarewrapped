export default function Frame() {
  return (
    <div className="relative size-full">
      <div className="absolute left-0 size-[340px] top-0">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 340 340">
          <circle cx="170" cy="170" id="Ellipse 62" r="163.5" stroke="var(--stroke-0, #F3901D)" strokeWidth="13" />
        </svg>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Instrument_Sans:Regular',sans-serif] font-normal h-[132px] justify-center leading-[0] left-[164.5px] text-[140px] text-center text-white top-[131px] w-[189px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[normal]">46</p>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Instrument_Sans:Regular',sans-serif] font-normal h-[69px] justify-center leading-[0] left-[164.5px] text-[40px] text-center text-white top-[242.5px] w-[189px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[normal]">years</p>
      </div>
    </div>
  );
}