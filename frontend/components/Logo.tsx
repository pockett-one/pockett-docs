import React from 'react';
import { FolderOpen } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  /** Use "neutral" for auth/onboarding/invite pages (white, gray, black only). */
  variant?: 'default' | 'neutral';
}

export default function Logo({ className = '', size = 'md', showText = true, variant = 'default' }: LogoProps) {
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

  const isNeutral = variant === 'neutral';
  const iconClass = isNeutral ? `text-slate-700 ${iconSizes[size]}` : `${iconSizes[size]} text-purple-600`;
  const badgeWrapClass = isNeutral
    ? `ml-3 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md ${textSizes[size]} font-bold`
    : `ml-3 px-1.5 py-0.5 bg-purple-50 border border-purple-100 rounded-md ${textSizes[size]} font-bold`;
  const badgeLetterClass = isNeutral ? 'text-slate-700' : 'text-purple-600';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <FolderOpen className={iconClass} />
      {showText && (
        <>
          <span className={`ml-2 ${textSizes[size]} font-semibold`}>
            <span className="text-slate-900">Pockett</span>
            <span className="text-slate-500"> Docs</span>
          </span>
          <div className={badgeWrapClass}>
            <span className={badgeLetterClass}>P</span>
            <span className="text-slate-400 ml-0.5 inline-block" style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>P</span>
          </div>
        </>
      )}
    </div>
  );
}
