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
  const themeHex = (branding?.themeColor?.trim() || '').match(/^#[0-9A-Fa-f]{6}$/) ? branding.themeColor! : '#6366f1';
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

  return (
    <div className={`inline-flex items-center ${className}`} style={useBranding && themeHex ? { ['--logo-theme' as string]: themeHex } : undefined}>
      {useBranding && branding?.logoUrl ? (
        <img
          src={branding.logoUrl}
          alt=""
          className={`${iconSizes[size]} object-contain`}
          style={{ color: themeHex }}
        />
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
          {useBranding && branding?.subtext && (
            <span className="ml-2 text-gray-500 text-sm hidden sm:inline">{branding.subtext}</span>
          )}
        </>
      )}
    </div>
  );
}
