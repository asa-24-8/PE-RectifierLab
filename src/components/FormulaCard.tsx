import React from 'react';
import { BookOpen } from 'lucide-react';
import { SimulationParams, MetricValues } from '../types';

interface FormulaCardProps {
  params: SimulationParams;
  metrics: MetricValues;
  darkMode?: boolean;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({ params, metrics, darkMode = true }) => {
  const { phase, bridge, deviceSetup, fwdConnected } = params;

  let title = '';
  let subtitle = '';

  if (phase === '1ph') {
    if (bridge === 'full') {
      if (deviceSetup === 'semi_conv' || fwdConnected) {
        title = '1-Phase Semi-Converter (Half-Controlled Bridge / with FWD) — Analytical DC Voltage Equation';
        subtitle = 'One quadrant operation with freewheeling action clamping negative voltage spikes.';
      } else if (deviceSetup === 'all_diodes') {
        title = '1-Phase Full-Bridge Uncontrolled Diode Rectifier — Analytical DC Voltage Equation';
        subtitle = 'Uncontrolled two-quadrant rectification with continuous conduction.';
      } else {
        title = '1-Phase Fully-Controlled Converter (Dual-Quadrant) — Analytical DC Voltage Equation';
        subtitle = 'Two quadrant operation allowing inversion when firing angle α > 90° with active RLE load.';
      }
    } else {
      title = '1-Phase Half-Wave Controlled Converter — Analytical DC Voltage Equation';
      subtitle = 'Single quadrant pulse operation.';
    }
  } else {
    title = '3-Phase 6-Pulse Converter — Analytical DC Voltage Equation';
    subtitle = 'Six pulse output with low ripple factor and high fundamental frequency.';
  }

  // Render actual mathematical typography with clean symbols and fraction layout
  const renderFormulaSymbols = () => {
    if (phase === '1ph') {
      if (bridge === 'full') {
        if (deviceSetup === 'semi_conv' || fwdConnected) {
          return (
            <div className="inline-flex items-center gap-1.5 font-serif text-sm sm:text-base tracking-wide select-none">
              <span className="font-semibold italic">V<sub className="font-sans not-italic text-[10px]">dc</sub></span>
              <span className="text-slate-400 font-sans">=</span>
              <span className="inline-flex flex-col items-center justify-center text-xs leading-tight mx-0.5">
                <span className="font-semibold italic pb-0.5">V<sub className="font-sans not-italic text-[9px]">m</sub></span>
                <span className={`w-full border-t ${darkMode ? 'border-cyan-400' : 'border-cyan-600'}`}></span>
                <span className="pt-0.5 font-sans font-medium">π</span>
              </span>
              <span className="font-sans text-xs sm:text-sm font-medium">· (1 + cos α)</span>
            </div>
          );
        } else if (deviceSetup === 'all_diodes') {
          return (
            <div className="inline-flex items-center gap-1.5 font-serif text-sm sm:text-base tracking-wide select-none">
              <span className="font-semibold italic">V<sub className="font-sans not-italic text-[10px]">dc</sub></span>
              <span className="text-slate-400 font-sans">=</span>
              <span className="inline-flex flex-col items-center justify-center text-xs leading-tight mx-0.5">
                <span className="font-semibold pb-0.5">2 · <span className="italic">V<sub className="font-sans not-italic text-[9px]">m</sub></span></span>
                <span className={`w-full border-t ${darkMode ? 'border-cyan-400' : 'border-cyan-600'}`}></span>
                <span className="pt-0.5 font-sans font-medium">π</span>
              </span>
            </div>
          );
        } else {
          return (
            <div className="inline-flex items-center gap-1.5 font-serif text-sm sm:text-base tracking-wide select-none">
              <span className="font-semibold italic">V<sub className="font-sans not-italic text-[10px]">dc</sub></span>
              <span className="text-slate-400 font-sans">=</span>
              <span className="inline-flex flex-col items-center justify-center text-xs leading-tight mx-0.5">
                <span className="font-semibold pb-0.5">2 · <span className="italic">V<sub className="font-sans not-italic text-[9px]">m</sub></span></span>
                <span className={`w-full border-t ${darkMode ? 'border-cyan-400' : 'border-cyan-600'}`}></span>
                <span className="pt-0.5 font-sans font-medium">π</span>
              </span>
              <span className="font-sans text-xs sm:text-sm font-medium">· cos α</span>
            </div>
          );
        }
      } else {
        // Half-wave
        return (
          <div className="inline-flex items-center gap-1.5 font-serif text-sm sm:text-base tracking-wide select-none">
            <span className="font-semibold italic">V<sub className="font-sans not-italic text-[10px]">dc</sub></span>
            <span className="text-slate-400 font-sans">=</span>
            <span className="inline-flex flex-col items-center justify-center text-xs leading-tight mx-0.5">
              <span className="font-semibold italic pb-0.5">V<sub className="font-sans not-italic text-[9px]">m</sub></span>
              <span className={`w-full border-t ${darkMode ? 'border-cyan-400' : 'border-cyan-600'}`}></span>
              <span className="pt-0.5 font-sans font-medium">2π</span>
            </span>
            <span className="font-sans text-xs sm:text-sm font-medium">· (1 + cos α)</span>
          </div>
        );
      }
    } else {
      // 3-Phase 6-Pulse
      return (
        <div className="inline-flex items-center gap-1.5 font-serif text-sm sm:text-base tracking-wide select-none">
          <span className="font-semibold italic">V<sub className="font-sans not-italic text-[10px]">dc</sub></span>
          <span className="text-slate-400 font-sans">=</span>
          <span className="inline-flex flex-col items-center justify-center text-xs leading-tight mx-0.5">
            <span className="font-semibold pb-0.5">3 · <span className="italic">V<sub className="font-sans not-italic text-[9px]">ml</sub></span></span>
            <span className={`w-full border-t ${darkMode ? 'border-cyan-400' : 'border-cyan-600'}`}></span>
            <span className="pt-0.5 font-sans font-medium">π</span>
          </span>
          <span className="font-sans text-xs sm:text-sm font-medium">· cos α</span>
        </div>
      );
    }
  };

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
      darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Left side: Description */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
          darkMode ? 'bg-cyan-950/80 border-cyan-800/60 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
        }`}>
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-sm font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
        </div>
      </div>

      {/* Right side: Theoretical Equation and Ideal Vdc */}
      <div className={`flex items-center gap-6 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-6 shrink-0 w-full md:w-auto justify-between md:justify-end ${
        darkMode ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className={`text-[10px] font-mono uppercase tracking-wider ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            THEORETICAL FORMULA
          </div>
          <div className={`text-sm font-bold mt-1 px-3 py-1.5 rounded-xl border ${
            darkMode
              ? 'bg-slate-900/90 text-cyan-300 border-slate-800'
              : 'bg-slate-50 text-cyan-800 border-slate-200 shadow-sm'
          }`}>
            {renderFormulaSymbols()}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-[10px] font-mono uppercase tracking-wider ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            IDEAL THEORETICAL V_DC
          </div>
          <div className="text-xl font-mono font-extrabold text-emerald-500 mt-1">
            {metrics.idealVdcVal.toFixed(1)} V
          </div>
        </div>
      </div>
    </div>
  );
};
