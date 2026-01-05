'use client';

import { Menu } from 'lucide-react';

interface LogoHeaderProps {
  onMenuClick: () => void;
  onGoHome: () => void;
}

export function LogoHeader({ onMenuClick, onGoHome }: LogoHeaderProps) {
  return (
    <div className="w-full lg:w-64 flex items-center gap-2 lg:gap-4 px-2 lg:px-2 border-r border-gray-200 fixed left-0 top-0 h-16 lg:h-20 bg-white z-50">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      <div className="flex items-center flex-1 justify-center h-full min-w-0">
        <a 
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onGoHome();
          }}
          className="w-full h-full flex items-center justify-center p-1 lg:p-2 hover:bg-gray-50 transition-colors rounded-lg"
        >
          <img 
            src="/logo.svg" 
            alt="DevForum Logo" 
            className="max-w-full max-h-full object-contain"
          />
        </a>
      </div>
    </div>
  );
}
