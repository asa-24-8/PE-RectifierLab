import React from 'react';
import { MetricValues } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface MetricsBarProps {
  metrics: MetricValues;
  darkMode?: boolean;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, darkMode = true }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Avg DC Voltage */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
        darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Avg DC Voltage</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            darkMode ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
          }`}>
            V_dc
          </span>
        </div>
        <div className="my-2">
          <div className={`text-2xl font-bold font-mono tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {metrics.vDcAvg.toFixed(1)} <span className={`text-sm font-normal ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>V</span>
          </div>
        </div>
        <div className={`text-[11px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
          V_rms = {metrics.vRmsOut.toFixed(1)} V
        </div>
      </div>

      {/* 2. Avg DC Current */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
        darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Avg DC Current</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            darkMode ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            I_dc
          </span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-emerald-500 tracking-tight">
            {metrics.iDcAvg.toFixed(2)} <span className="text-sm font-normal text-emerald-600">A</span>
          </div>
        </div>
        <div className={`text-[11px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
          I_rms = {metrics.iRmsOut.toFixed(2)} A
        </div>
      </div>

      {/* 3. Output Power */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
        darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Output Power</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            darkMode ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            P_load
          </span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-amber-500 tracking-tight">
            {metrics.pLoad.toFixed(1)} <span className="text-sm font-normal text-amber-600">W</span>
          </div>
        </div>
        <div className={`text-[11px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
          S_in = {metrics.sIn.toFixed(0)} VA
        </div>
      </div>

      {/* 4. Power Factor */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
        darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Power Factor</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            darkMode ? 'bg-purple-950 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}>
            PF
          </span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-purple-500 tracking-tight">
            {metrics.powerFactor.toFixed(3)}
          </div>
        </div>
        <div className={`text-[11px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
          cos(φ1) = {metrics.displacementFactor.toFixed(3)}
        </div>
      </div>

      {/* 5. Ripple Factor */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
        darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Ripple Factor</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            darkMode ? 'bg-rose-950 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            RF
          </span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-rose-500 tracking-tight">
            {metrics.rippleFactor.toFixed(3)}
          </div>
        </div>
        <div className={`text-[11px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
          Form Factor FF = {metrics.formFactor.toFixed(2)}
        </div>
      </div>

      {/* 6. Source THD_i */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
        darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Source THD_i</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            darkMode ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
          }`}>
            THD
          </span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-cyan-500 tracking-tight">
            {metrics.thdCurrent.toFixed(1)} <span className="text-sm font-normal text-cyan-600">%</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-500 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{metrics.isContinuous ? 'CCM Continuous' : 'DCM Discontinuous'}</span>
        </div>
      </div>
    </div>
  );
};
