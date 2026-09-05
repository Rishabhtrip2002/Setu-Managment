import React from 'react';

const Logo = ({ className = 'h-8', showText = true }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Setu Gold Bridge Logo */}
      <div className="relative flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden bg-white/5 p-0.5">
        <img 
          src="/SETULOGO.png" 
          alt="SETU SOLUTION" 
          className="w-full h-full object-contain filter drop-shadow" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/src/assets/SETULOGO.png';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-wider text-slate-100 font-sans">
            SETU <span className="text-brand-500">SOLUTION</span>
          </span>
          <span className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase -mt-1">
            Custom Software
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
