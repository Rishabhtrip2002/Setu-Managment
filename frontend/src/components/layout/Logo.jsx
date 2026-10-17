import React from 'react';

const Logo = ({ className = 'h-8', showText = true, isDark = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-lg shadow-orange-400/25 border border-orange-300/60 p-1.5 ring-2 ring-orange-400/20">
        <div className="absolute inset-0 rounded-xl bg-orange-400/10 blur-md animate-pulse pointer-events-none" />
        <img
          src="/SETULOGO.png"
          alt="SETU SOLUTION"
          className="relative w-full h-full object-contain drop-shadow-[0_2px_12px_rgba(249,115,22,0.45)]"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/src/assets/SETULOGO.png';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`text-base font-extrabold tracking-wider font-sans leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            SETU <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent font-black drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]">SOLUTION</span>
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
