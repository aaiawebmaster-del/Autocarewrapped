/** Refined vector engine bay — back layer (full bay) and front frame (center opening for dipsticks). */

const VB = '0 0 1024 348';

function HoodEngineBayBackSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={VB}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="hood-bay-metal" x1="512" y1="40" x2="512" y2="320" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8f949c" />
          <stop offset="45%" stopColor="#c8ccd2" />
          <stop offset="100%" stopColor="#6d7178" />
        </linearGradient>
        <linearGradient id="hood-bay-cover" x1="512" y1="150" x2="512" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#dfe2e8" />
          <stop offset="55%" stopColor="#aeb4bd" />
          <stop offset="100%" stopColor="#7d828a" />
        </linearGradient>
        <linearGradient id="hood-bay-bay" x1="512" y1="80" x2="512" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#121418" />
          <stop offset="100%" stopColor="#060708" />
        </linearGradient>
      </defs>

      {/* Bay floor + side walls */}
      <path
        d="M72 118 L952 118 L952 332 L72 332 Z"
        fill="url(#hood-bay-bay)"
      />
      <path d="M72 118 L952 118 L920 92 L104 92 Z" fill="#181b20" />
      <path d="M104 92 L920 92 L884 72 L140 72 Z" fill="#22262d" opacity="0.9" />

      {/* Strut towers */}
      <rect x="118" y="128" width="88" height="118" rx="6" fill="#2a2e35" stroke="#3a4048" strokeWidth="2" />
      <rect x="818" y="128" width="88" height="118" rx="6" fill="#2a2e35" stroke="#3a4048" strokeWidth="2" />

      {/* Battery box — left */}
      <rect x="148" y="198" width="72" height="54" rx="4" fill="#1a1d22" stroke="#343942" strokeWidth="1.5" />
      <rect x="156" y="206" width="56" height="10" rx="2" fill="#2f343c" />
      <rect x="156" y="222" width="56" height="10" rx="2" fill="#2f343c" />
      <circle cx="188" cy="244" r="4" fill="#4a5058" />

      {/* Washer reservoir — left */}
      <path
        d="M228 176 L268 176 L278 228 L218 228 Z"
        fill="rgba(230,235,240,0.22)"
        stroke="#5a6068"
        strokeWidth="1.5"
      />
      <circle cx="248" cy="168" r="11" fill="#1f6fd4" stroke="#0d4f9c" strokeWidth="2" />
      <circle cx="232" cy="164" r="9" fill="#1f6fd4" stroke="#0d4f9c" strokeWidth="1.5" />

      {/* Coolant reservoir — right */}
      <path
        d="M756 182 L796 182 L806 236 L746 236 Z"
        fill="rgba(240,210,60,0.18)"
        stroke="#6a6030"
        strokeWidth="1.5"
      />
      <rect x="772" y="168" width="18" height="12" rx="3" fill="#d4b820" stroke="#9a8610" strokeWidth="1.5" />

      {/* Intake / plumbing — defined hose runs */}
      <path
        d="M310 210 C360 190 420 188 470 198"
        stroke="#3a4048"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M554 198 C604 188 664 190 714 210"
        stroke="#3a4048"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M286 248 C360 268 664 268 738 248"
        stroke="#2f343c"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Main engine cover */}
      <path
        d="M332 168 L692 168 L712 248 L312 248 Z"
        fill="url(#hood-bay-cover)"
        stroke="#5a6068"
        strokeWidth="2"
      />
      <path d="M472 168 L552 168 L562 248 L462 248 Z" fill="#101215" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={348 + i * 22}
          y={182}
          width="14"
          height="52"
          rx="2"
          fill="rgba(255,255,255,0.08)"
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={`r-${i}`}
          x={588 + i * 22}
          y={182}
          width="14"
          height="52"
          rx="2"
          fill="rgba(255,255,255,0.08)"
        />
      ))}

      {/* Oil fill / dipstick guide — center recess (dipsticks emerge here) */}
      <ellipse cx="512" cy="214" rx="118" ry="34" fill="#08090c" stroke="#2a2e35" strokeWidth="2" />
      <ellipse cx="512" cy="214" rx="88" ry="22" fill="#030304" />

      {/* Radiator support + grille */}
      <path d="M96 292 L928 292 L928 332 L96 332 Z" fill="#15181d" />
      <path d="M128 300 L896 300 L896 328 L128 328 Z" fill="#0a0b0d" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
        <rect key={`g-${i}`} x={148 + i * 46} y="304" width="24" height="20" rx="2" fill="#23262c" />
      ))}

      {/* Headlight pockets */}
      <path d="M72 292 L148 292 L132 332 L72 332 Z" fill="#101215" stroke="#2a2e35" strokeWidth="1.5" />
      <path d="M952 292 L876 292 L892 332 L952 332 Z" fill="#101215" stroke="#2a2e35" strokeWidth="1.5" />
      <ellipse cx="108" cy="314" rx="22" ry="12" fill="#eef1f5" opacity="0.85" />
      <ellipse cx="916" cy="314" rx="22" ry="12" fill="#eef1f5" opacity="0.85" />
    </svg>
  );
}

function HoodEngineBayFrameSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={VB}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <mask id="hood-bay-hole-mask">
          <rect width="1024" height="348" fill="white" />
          <ellipse cx="512" cy="214" rx="132" ry="72" fill="black" />
        </mask>
        <linearGradient id="hood-frame-metal" x1="512" y1="40" x2="512" y2="320" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8f949c" />
          <stop offset="100%" stopColor="#5a6068" />
        </linearGradient>
      </defs>

      {/* Outer frame + cover ring — center punched out for dipsticks */}
      <g mask="url(#hood-bay-hole-mask)">
        <path d="M72 118 L952 118 L952 332 L72 332 Z" fill="#060708" />
        <path d="M104 92 L920 92 L884 72 L140 72 Z" fill="#181b20" />
        <rect x="118" y="128" width="88" height="118" rx="6" fill="#2a2e35" stroke="#3a4048" strokeWidth="2" />
        <rect x="818" y="128" width="88" height="118" rx="6" fill="#2a2e35" stroke="#3a4048" strokeWidth="2" />
        <path
          d="M332 168 L692 168 L712 248 L312 248 Z"
          fill="url(#hood-frame-metal)"
          stroke="#5a6068"
          strokeWidth="2"
        />
        <path d="M472 168 L552 168 L562 248 L462 248 Z" fill="#101215" />
        <path d="M96 292 L928 292 L928 332 L96 332 Z" fill="#15181d" />
        <path d="M128 300 L896 300 L896 328 L128 328 Z" fill="#0a0b0d" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
          <rect key={`fg-${i}`} x={148 + i * 46} y="304" width="24" height="20" rx="2" fill="#23262c" />
        ))}
        <path d="M72 292 L148 292 L132 332 L72 332 Z" fill="#101215" />
        <path d="M952 292 L876 292 L892 332 L952 332 Z" fill="#101215" />
      </g>
    </svg>
  );
}

export function HoodEngineBayBack(props: { className?: string }) {
  return <HoodEngineBayBackSvg {...props} />;
}

export function HoodEngineBayFrame(props: { className?: string }) {
  return <HoodEngineBayFrameSvg {...props} />;
}
