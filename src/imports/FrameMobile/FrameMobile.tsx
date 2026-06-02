import svgPaths from "./svg-xfzln3z2sh";

function Group3() {
  return (
    <div className="absolute h-[42.661px] left-[76.91%] right-[8.38%] top-[1102px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 125.522 42.6612">
        <g id="Group 118">
          <path d={svgPaths.p3f6e2800} fill="var(--fill-0, #737373)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="-translate-y-1/2 absolute h-[42.62px] left-[3.99%] right-[89.76%] top-[calc(50%+525.31px)]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 53.3783 42.6199">
        <g id="Group 115">
          <path d={svgPaths.p1d2c9100} fill="var(--fill-0, #F3901D)" fillOpacity="0.5" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="[word-break:break-word] absolute contents font-['Inter:Bold',sans-serif] font-bold leading-[0] left-[138px] not-italic text-[25px] text-white top-[741px]">
      <div className="-translate-y-1/2 absolute flex flex-col h-[42px] justify-center left-[138px] top-[762px] w-[105px]">
        <p className="leading-[normal]">5:55 PM</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col h-[42px] justify-center left-[280px] top-[762px] w-[71px]">
        <p className="leading-[normal]">53° F</p>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[34px] top-[834px]">
      <div className="absolute inset-[71.7%_84.05%_22.54%_3.99%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 102.092 69">
          <path d={svgPaths.p3d084200} fill="var(--fill-0, #F3901D)" id="Vector" />
        </svg>
      </div>
      <div className="[word-break:break-word] absolute font-['Instrument_Sans:Regular',sans-serif] font-normal h-[188px] leading-[0] left-[185.62px] text-[35px] text-white top-[834px] w-[596.378px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[normal] mb-0">Because of members like you,</p>
        <p className="leading-[normal]">{`the auto care industry continues to grow stronger, smarter, and more connected. `}</p>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-[34px] top-[734px]">
      <Group3 />
      <Group />
      <Group1 />
      <div className="absolute inset-[61.27%_87.69%_34.14%_3.99%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 71 55">
          <path d={svgPaths.p3b012430} fill="var(--fill-0, black)" id="Vector" stroke="var(--stroke-0, #F3901D)" strokeWidth="4" />
        </svg>
      </div>
      <div className="absolute flex inset-[61.27%_8.32%_34.14%_83.35%] items-center justify-center" style={{ containerType: "size" }}>
        <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
          <div className="relative size-full" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 71 55">
              <path d={svgPaths.p3b012430} fill="var(--fill-0, black)" id="Vector" stroke="var(--stroke-0, #F3901D)" strokeWidth="4" />
            </svg>
          </div>
        </div>
      </div>
      <Group2 />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents left-[-494px] top-[658px]">
      <div className="absolute h-[540px] left-[-494px] top-[658px] w-[1889px]">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1889 540">
          <path d={svgPaths.p33654d00} fill="var(--fill-0, black)" id="Rectangle 136" />
        </svg>
      </div>
      <Group4 />
    </div>
  );
}

export default function FrameMobile() {
  return (
    <div className="bg-white relative size-full" data-name="frame - mobile">
      <Group5 />
    </div>
  );
}