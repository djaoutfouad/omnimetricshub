import React from 'react';

interface LogoProps {
  variant?: 'icon' | 'full' | 'horizontal';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showSubtitle?: boolean;
  className?: string;
  idPrefix?: string;
}

export const OmEmblem: React.FC<{ size?: number; className?: string; idPrefix?: string }> = ({
  size = 36,
  className = '',
  idPrefix = 'om-',
}) => {
  const oGradId = `${idPrefix}omOThemeGrad`;
  const mFacet1Id = `${idPrefix}omMFacet1`;
  const mFoldShadowId = `${idPrefix}omMFoldShadow`;
  const mFacet2Id = `${idPrefix}omMFacet2`;
  const mStemId = `${idPrefix}omMStem`;
  const barGradId = `${idPrefix}omBarGrad`;
  const arrowGradId = `${idPrefix}omArrowGrad`;
  const shadowFilterId = `${idPrefix}omLogoShadow`;

  return (
    <svg
      viewBox="0 0 800 600"
      width={size}
      height={size * 0.75}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="OmniMetrics Hub Logo"
    >
      <defs>
        {/* O Sheen Gradient */}
        <linearGradient id={oGradId} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="35%" stopColor="#0d9488" />
          <stop offset="80%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>

        {/* M Left Diagonal Facet */}
        <linearGradient id={mFacet1Id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#097a61" />
          <stop offset="60%" stopColor="#045844" />
          <stop offset="100%" stopColor="#02382b" />
        </linearGradient>

        {/* M 3D Fold Crease Shadow */}
        <linearGradient id={mFoldShadowId} x1="0%" y1="0%" x2="100%" y2="60%">
          <stop offset="0%" stopColor="#01241b" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#044334" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
        </linearGradient>

        {/* M Right Upward Facet (Highlight) */}
        <linearGradient id={mFacet2Id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#04634d" />
          <stop offset="50%" stopColor="#088c6e" />
          <stop offset="100%" stopColor="#0eab87" />
        </linearGradient>

        {/* M Right Vertical Stem */}
        <linearGradient id={mStemId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#065b47" />
          <stop offset="50%" stopColor="#044d3b" />
          <stop offset="100%" stopColor="#02382b" />
        </linearGradient>

        {/* Chart Bars Gradient */}
        <linearGradient id={barGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Arrow Gradient */}
        <linearGradient id={arrowGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="60%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        {/* Soft Drop Shadow for Emblem */}
        <filter id={shadowFilterId} x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#022c22" floodOpacity="0.2" />
        </filter>
      </defs>

      <g filter={`url(#${shadowFilterId})`} transform="translate(10, -20)">
        {/* O CIRCLE RING */}
        <path
          d="M 275 165
             A 155 155 0 1 0 405 408
             L 364 380
             A 98 98 0 1 1 275 222
             A 98 98 0 0 1 372 322
             C 372 334 369 346 364 356
             L 406 385
             C 421 361 430 332 430 301
             A 155 155 0 0 0 275 165 Z"
          fill={`url(#${oGradId})`}
        />

        {/* FINANCIAL GROWTH CHART BARS INSIDE O */}
        <g>
          {/* Bar 1: Short Left */}
          <rect x="220" y="340" width="24" height="42" rx="5" fill={`url(#${barGradId})`} />
          {/* Bar 2: Medium Center */}
          <rect x="254" y="312" width="24" height="70" rx="5" fill={`url(#${barGradId})`} />
          {/* Bar 3: Tall Right */}
          <rect x="288" y="274" width="24" height="108" rx="5" fill={`url(#${barGradId})`} />
        </g>

        {/* UPWARD TRENDLINE ARROW */}
        <g>
          <path
            d="M 188 344 C 224 344, 258 316, 328 238"
            fill="none"
            stroke={`url(#${arrowGradId})`}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path d="M 314 224 L 352 234 L 340 272 L 330 248 Z" fill={`url(#${arrowGradId})`} />
        </g>

        {/* M 3D FOLDED RIBBON */}
        <g>
          {/* Left diagonal of M */}
          <path
            d="M 410 185
               L 535 365
               L 578 322
               L 472 170
               Z"
            fill={`url(#${mFacet1Id})`}
          />

          {/* 3D Fold Crease Shadow */}
          <polygon points="522,352 578,322 546,386" fill={`url(#${mFoldShadowId})`} />

          {/* Right upward diagonal facet of M */}
          <path
            d="M 535 365
               L 630 185
               L 686 185
               L 578 386
               Z"
            fill={`url(#${mFacet2Id})`}
          />

          {/* Right vertical stem of M */}
          <path
            d="M 630 185
               L 686 185
               L 686 468
               C 686 484 673 496 657 496
               L 635 496
               C 624 496 618 488 618 478
               L 618 226
               Z"
            fill={`url(#${mStemId})`}
          />
        </g>
      </g>
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  showSubtitle = true,
  className = '',
  idPrefix = 'om-',
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 34
      : size === 'md'
      ? 42
      : size === 'lg'
      ? 56
      : 72;

  const isDark = theme === 'dark';

  if (variant === 'icon') {
    return <OmEmblem size={pixelSize} className={className} idPrefix={idPrefix} />;
  }

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      <OmEmblem size={pixelSize} className="group-hover:scale-105 transition-transform" idPrefix={idPrefix} />

      <div>
        <div
          className={`font-black tracking-tight leading-none flex items-center gap-1 ${
            isDark ? 'text-white' : 'text-slate-900'
          } ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-[16px]'}`}
        >
          <span>OmniMetrics</span>
          <span className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>Hub</span>
        </div>
        {showSubtitle && (
          <div
            className={`text-[11px] font-medium leading-tight mt-0.5 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Finance & Decision Tools
          </div>
        )}
      </div>
    </div>
  );
};

export default Logo;
