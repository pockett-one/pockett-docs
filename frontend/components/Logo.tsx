import React from 'react';
import { FolderOpen } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
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

  return (
    <div className={`inline-flex items-center ${className}`}>
      <FolderOpen className={`${iconSizes[size]} text-purple-600`} />
      {showText && (
        <>
          <span className={`ml-2 ${textSizes[size]} font-semibold`}>
            <span className="text-slate-900">Pockett</span>
            <span className="text-slate-500"> Docs</span>
          </span>
          <div className={`ml-3 px-1.5 py-0.5 bg-purple-50 border border-purple-100 rounded-md ${textSizes[size]} font-bold`}>
            <span className="text-purple-600">P</span>
            <span className="text-slate-400 ml-0.5 inline-block" style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>P</span>
          </div>
        </>
      )}
    </div>
  );
}
