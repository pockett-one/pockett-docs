import React from 'react';
import { FolderOpen } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
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
      <FolderOpen className={`${iconSizes[size]} text-blue-600`} />
      <span className={`ml-2 ${textSizes[size]} font-semibold`}>
        <span className="text-blue-600">Pockett</span>
        <span className="text-gray-700"> Docs</span>
      </span>
      <div className={`ml-3 px-1.5 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md ${textSizes[size]} font-bold`}>
        <span className="text-blue-600">P</span>
        <span className="text-gray-700 ml-0.5 inline-block" style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>P</span>
      </div>
    </div>
  );
}
