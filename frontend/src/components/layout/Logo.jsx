import React from 'react';

const Logo = ({ className = 'h-8', showText = true, isDark = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Setu Gold Bridge Logo */}
      <div className="relative shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-orange-200 p-1">
        <img 
          src="/SETULOGO.png" 
          alt="SETU SOLUTION" 
          className="w-full h-full object-contain filter brightness-110 contrast-115 drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)]" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/src/assets/SETULOGO.png';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`text-base font-extrabold tracking-wider font-sans leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            SETU <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent font-black">SOLUTION</span>
          </span>
          <span className={`text-[9px] font-semibold tracking-widest uppercase -mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Custom Software
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
