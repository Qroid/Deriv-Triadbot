import React from "react";
import { motion } from "framer-motion";

export default function DigitBoard({ digitCounts, lastDigit, totalTicks }) {
  if (!digitCounts) return null;

  // Find max frequency for relative sizing
  const maxFreq = Math.max(...digitCounts, 1);

  return (
    <div className="py-2 space-y-2">
      <div className="flex justify-between items-end h-8 gap-0.5 px-1">
        {digitCounts.map((count, digit) => {
          const isLast = digit === lastDigit;
          const height = (count / maxFreq) * 100;
          
          return (
            <div key={digit} className="flex-1 flex flex-col items-center group relative">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                className={`w-full rounded-t-[2px] transition-colors duration-300 ${
                  isLast ? 'bg-primary shadow-[0_0_8px_rgba(227,28,75,0.4)]' : 'bg-slate-200 group-hover:bg-slate-300'
                }`}
              />
              <span className={`text-[7px] font-black mt-1 ${isLast ? 'text-primary' : 'text-slate-400'}`}>
                {digit}
              </span>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block z-30">
                <div className="bg-black text-white text-[8px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                  {((count / totalTicks) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center px-1">
        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Digit Frequency</span>
        <div className="flex items-center gap-1">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Last:</span>
          <span className="text-[9px] font-black text-primary font-mono">{lastDigit ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
