import React from 'react';
import { BRAND_NAME, BRAND_PRIMARY_COLOR } from '@/config/brand';
import { BrandName } from '@/components/brand/BrandName';

const DEFAULT_BRAND_COLOR = BRAND_PRIMARY_COLOR;

/** 3x3 grid: squares 1,2,4,5,7 filled (P shape); 3,6,8,9 outline only, like Material widget icon. */
function PIcon({ className, sizeClass, color = DEFAULT_BRAND_COLOR }: { className?: string; sizeClass: string; color?: string }) {
  const strokeColor = color;
  const view = 12;
  const gap = 0.72; // spacing between rects
  const cell = (view - 2 * gap) / 3; // 3 cells + 2 gaps = view
  const strokeWidth = 0.22;

  const cellAt = (col: number, row: number) => ({
    x: col * (cell + gap),
    y: row * (cell + gap),
  });

  const filled = [
    [0, 0], [1, 0], [0, 1], [1, 1], [0, 2], // 1,2,4,5,7 = P
  ] as const;
  const outline = [
    [2, 0], [2, 1], [1, 2], [2, 2], // 3,6,8,9 = empty with border
  ] as const;

  return (
    <svg
      className={`${sizeClass} ${className ?? ''}`}
      viewBox={`0 0 ${view} ${view}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {filled.map(([col, row]) => {
        const { x, y } = cellAt(col, row);
        return <rect key={`f-${col}-${row}`} x={x} y={y} width={cell} height={cell} fill={color} />;
      })}
      {outline.map(([col, row]) => {
        const { x, y } = cellAt(col, row);
        return (
          <rect
            key={`o-${col}-${row}`}
            x={x + strokeWidth / 2}
            y={y + strokeWidth / 2}
            width={cell - strokeWidth}
            height={cell - strokeWidth}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      })}
    </svg>
  );
}

export interface OrganizationBranding {
  logoUrl?: string | null;
  name?: string | null;
  subtext?: string | null;
  themeColor?: string | null;
}

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  /** When set, replaces default platform branding with org logo/name/theme. */
  branding?: OrganizationBranding | null;
}

const DEFAULT_DISPLAY_NAME = BRAND_NAME;

function BrandNameOrCustom({
  displayName,
  className,
  style,
}: {
  displayName: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (displayName === BRAND_NAME) {
    return <BrandName className={className} style={style} />;
  }
  return (
    <span className={className} style={style}>
      {displayName}
    </span>
  );
}

export default function Logo({ className = '', size = 'md', showText = true, branding }: LogoProps) {
  const iconSizes: Record<string, string> = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-[50px] w-[50px]',
  };

  const iconHeights: Record<string, string> = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-[50px]',
  };

  const textSizes: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-xl',
  };

  const useBranding = branding?.logoUrl ?? branding?.name ?? branding?.themeColor;
  const themeColorTrimmed = branding?.themeColor?.trim() || '';
  const themeHex = themeColorTrimmed.match(/^#[0-9A-Fa-f]{6}$/) ? themeColorTrimmed : DEFAULT_BRAND_COLOR;

  const iconClass = `${iconSizes[size]} shrink-0`;
  const iconColor = useBranding && themeHex ? themeHex : DEFAULT_BRAND_COLOR;

  const brandNameClass = useBranding
    ? `${textSizes[size]} font-semibold`
    : `${textSizes[size]} font-semibold`;

  const brandNameColor = useBranding ? '#1C1918' : (themeHex || DEFAULT_BRAND_COLOR);

  const displayName = (useBranding && branding?.name) ? branding.name : DEFAULT_DISPLAY_NAME;
  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : 'P';

  const hasSubtextRow = useBranding && branding?.subtext;
  const logoContainerClass = useBranding && branding?.logoUrl
    ? `inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-50 border-2 border-slate-100 overflow-hidden ${iconSizes[size]}`
    : '';
  const bubbleClass = useBranding && !branding?.logoUrl
    ? `inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-black bg-slate-50 border-2 border-slate-100 ${iconSizes[size]}`
    : '';

  const isDefaultPlatformBrand = !useBranding && displayName === DEFAULT_DISPLAY_NAME;

  // Default platform brand: one container (height = icon). Grid enforces row height; brand top, subtext bottom.
  if (showText && isDefaultPlatformBrand) {
    const gridHeight = iconHeights[size];
    const brandTextSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg';
    return (
      <div
        className={`inline-grid grid-cols-[auto_1fr] grid-rows-1 items-stretch gap-2 ${gridHeight} ${className}`}
        style={useBranding && themeHex ? { ['--logo-theme' as string]: themeHex } : undefined}
      >
        <div className="flex items-center justify-center">
          <PIcon sizeClass={iconClass} color={iconColor} />
        </div>
        <div className="flex min-h-0 flex-col justify-between overflow-hidden">
          <span className="inline-flex shrink-0 items-baseline leading-none">
            <BrandName className={brandTextSize} />
          </span>
          <span className="shrink-0 text-[10px] leading-tight text-gray-500 tracking-wide">
            Organize. Protect. Deliver.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={hasSubtextRow ? `flex items-center gap-3 ${className}` : `inline-flex items-center ${className}`}
      style={useBranding && themeHex ? { ['--logo-theme' as string]: themeHex } : undefined}
    >
      <div className="inline-flex items-center shrink-0">
        {useBranding && branding?.logoUrl ? (
          <span className={logoContainerClass}>
            <img
              src={branding.logoUrl}
              alt=""
              className="w-full h-full object-contain"
              style={{ color: themeHex }}
            />
          </span>
        ) : useBranding ? (
          <span
            className={bubbleClass}
            style={{ fontSize: size === 'xl' ? '1.5rem' : size === 'lg' ? '1.25rem' : size === 'md' ? '1rem' : '0.875rem', color: themeHex }}
          >
            {initial}
          </span>
        ) : (
          <PIcon sizeClass={iconClass} color={iconColor} />
        )}
      </div>
      {showText && (
        hasSubtextRow ? (
          <div className="flex flex-col justify-center min-w-0">
            <BrandNameOrCustom
              displayName={displayName}
              className={`${brandNameClass} leading-tight`}
              style={useBranding ? { color: brandNameColor } : (themeHex ? { color: themeHex } : undefined)}
            />
            <span className="mt-0.5 text-[11px] text-gray-500 leading-tight">
              {branding!.subtext}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center ml-2">
            <BrandNameOrCustom
              displayName={displayName}
              className={brandNameClass}
              style={useBranding ? { color: brandNameColor } : (themeHex ? { color: themeHex } : undefined)}
            />
            {useBranding && branding?.subtext && (
              <span className="ml-2 text-gray-500 text-sm hidden sm:inline">{branding.subtext}</span>
            )}
          </div>
        )
      )}
    </div>
  );
}
