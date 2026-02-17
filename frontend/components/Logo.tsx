import React from 'react';
import { FolderOpen } from 'lucide-react';

export interface OrganizationBranding {
  logoUrl?: string | null;
  name?: string | null;
  subtext?: string | null;
  themeColor?: string | null;
}

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  /** Use "neutral" for auth/onboarding/invite pages (white, gray, black only). */
  variant?: 'default' | 'neutral';
  /** When set, replaces default Pockett branding with org logo/name/theme. */
  branding?: OrganizationBranding | null;
}

export default function Logo({ className = '', size = 'md', showText = true, variant = 'default', branding }: LogoProps) {
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const useBranding = branding?.logoUrl ?? branding?.name ?? branding?.themeColor;
  const themeColorTrimmed = branding?.themeColor?.trim() || '';
  const themeHex = themeColorTrimmed.match(/^#[0-9A-Fa-f]{6}$/) ? themeColorTrimmed : '#6366f1';
  const isNeutral = variant === 'neutral' && !useBranding;
  const iconClass = useBranding
    ? `${iconSizes[size]}`
    : isNeutral ? `text-slate-700 ${iconSizes[size]}` : `${iconSizes[size]} text-purple-600`;
  const badgeWrapClass = useBranding
    ? `ml-3 px-1.5 py-0.5 rounded-md ${textSizes[size]} font-bold`
    : isNeutral
      ? `ml-3 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md ${textSizes[size]} font-bold`
      : `ml-3 px-1.5 py-0.5 bg-purple-50 border border-purple-100 rounded-md ${textSizes[size]} font-bold`;
  const badgeLetterClass = useBranding ? '' : isNeutral ? 'text-slate-700' : 'text-purple-600';
  const brandNameClass = useBranding
    ? `${textSizes[size]} font-semibold`
    : isNeutral
      ? `${textSizes[size]} font-semibold text-slate-900`
      : `${textSizes[size]} font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600`;

  const displayName = (useBranding && branding?.name) ? branding.name : 'Pockett Docs';
  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : 'P';

  const hasSubtextRow = useBranding && branding?.subtext;
  const logoContainerClass = useBranding && branding?.logoUrl
    ? `inline-flex shrink-0 items-center justify-center rounded-lg bg-white overflow-hidden ${iconSizes[size]}`
    : '';
  const bubbleClass = useBranding && !branding?.logoUrl
    ? `inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-black ${iconSizes[size]}`
    : '';

  return (
    <div
      className={hasSubtextRow ? `flex flex-col ${className}` : `inline-flex items-center ${className}`}
      style={useBranding && themeHex ? { ['--logo-theme' as string]: themeHex } : undefined}
    >
      <div className="inline-flex items-center">
        {useBranding && branding?.logoUrl ? (
          <span
            className={logoContainerClass}
            style={{ border: `1px solid ${themeHex}` }}
          >
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
            style={{ backgroundColor: themeHex, fontSize: size === 'lg' ? '1.25rem' : size === 'md' ? '1rem' : '0.875rem' }}
          >
            {initial}
          </span>
        ) : (
          <FolderOpen className={iconClass} style={useBranding && themeHex ? { color: themeHex } : undefined} />
        )}
        {showText && (
          <>
            <span
              className={`ml-2 ${brandNameClass}`}
              style={useBranding && themeHex ? { color: themeHex } : undefined}
            >
              {displayName}
            </span>
            {!useBranding && (
              <div className={badgeWrapClass}>
                <span className={badgeLetterClass}>P</span>
                <span className={`${isNeutral ? 'text-slate-400' : 'text-purple-400'} ml-0.5 inline-block`} style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>P</span>
              </div>
            )}
            {useBranding && branding?.subtext && !hasSubtextRow && (
              <span className="ml-2 text-gray-500 text-sm hidden sm:inline">{branding.subtext}</span>
            )}
          </>
        )}
      </div>
      {hasSubtextRow && (
        <span className="mt-0.5 text-xs text-gray-500">
          {branding!.subtext}
        </span>
      )}
    </div>
  );
}
