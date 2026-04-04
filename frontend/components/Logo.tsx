import React from 'react';
import { BRAND_NAME, BRAND_LOGO_COLOR } from '@/config/brand';
import { BrandName } from '@/components/brand/BrandName';
import { cn } from '@/lib/utils';

const DEFAULT_BRAND_COLOR = BRAND_LOGO_COLOR;

/** Neon CTA green — prominent circular separators in the default tagline. */
const TAGLINE_DOT_CLASS =
  'inline-block h-1 w-1 shrink-0 rounded-full bg-[#72ff70]';

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
  /** Merged onto `BrandName` for the default platform lockup (e.g. `text-2xl` in the global header). */
  wordmarkClassName?: string;
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

function DefaultTagline() {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-medium leading-tight tracking-wide text-[#45474c] sm:text-[11px] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
    >
      <span>Organize</span>
      <span aria-hidden className={TAGLINE_DOT_CLASS} />
      <span>Protect</span>
      <span aria-hidden className={TAGLINE_DOT_CLASS} />
      <span>Deliver</span>
    </span>
  );
}

export default function Logo({
  className = '',
  size = 'md',
  showText = true,
  wordmarkClassName,
  branding,
}: LogoProps) {
  const iconSizes: Record<string, string> = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-[50px] w-[50px]',
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

  const brandTextSize =
    size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg';

  // Default platform brand: wordmark + tagline (no grid icon).
  // `group` lets `BrandName` use `group-hover:` for the full lockup (wordmark + tagline) without each `Link` adding `group`.
  if (showText && isDefaultPlatformBrand) {
    return (
      <div
        className={cn('group inline-flex min-w-0 flex-col justify-center gap-0.5', className)}
        style={useBranding && themeHex ? { ['--logo-theme' as string]: themeHex } : undefined}
      >
        <span className="inline-flex min-w-0 shrink-0 items-baseline leading-none">
          <BrandName className={cn(wordmarkClassName ?? brandTextSize)} />
        </span>
        <DefaultTagline />
      </div>
    );
  }

  return (
    <div
      className={hasSubtextRow ? `flex items-center gap-3 ${className}` : `inline-flex items-center ${className}`}
      style={useBranding && themeHex ? { ['--logo-theme' as string]: themeHex } : undefined}
    >
      <div className="inline-flex shrink-0 items-center">
        {useBranding && branding?.logoUrl ? (
          <span className={logoContainerClass}>
            <img
              src={branding.logoUrl}
              alt=""
              className="h-full w-full object-contain"
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
          <BrandName className={cn(textSizes[size], wordmarkClassName)} />
        )}
      </div>
      {showText && (
        hasSubtextRow ? (
          <div className="flex min-w-0 flex-col justify-center">
            <BrandNameOrCustom
              displayName={displayName}
              className={`${brandNameClass} leading-tight`}
              style={useBranding ? { color: brandNameColor } : (themeHex ? { color: themeHex } : undefined)}
            />
            <span className="mt-0.5 text-[11px] leading-tight text-gray-500">
              {branding!.subtext}
            </span>
          </div>
        ) : (
          <div className="ml-2 inline-flex items-center">
            <BrandNameOrCustom
              displayName={displayName}
              className={brandNameClass}
              style={useBranding ? { color: brandNameColor } : (themeHex ? { color: themeHex } : undefined)}
            />
            {useBranding && branding?.subtext && (
              <span className="ml-2 hidden text-sm text-gray-500 sm:inline">{branding.subtext}</span>
            )}
          </div>
        )
      )}
    </div>
  );
}
