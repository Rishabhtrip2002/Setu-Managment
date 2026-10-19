import React from 'react';

const Logo = ({ className = 'h-8', showText = true, isDark = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl bg-white shadow-md shadow-orange-500/10 border border-slate-200/90 p-1 ring-2 ring-orange-500/15">
        <img
          src="/SETULOGO.png"
          alt="SETU SOLUTION"
          className="relative w-full h-full object-contain drop-shadow-[0_1px_3px_rgba(249,115,22,0.35)]"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/SETULOGO_WHITE.png';
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
