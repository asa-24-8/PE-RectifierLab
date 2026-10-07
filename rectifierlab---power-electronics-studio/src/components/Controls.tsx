import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Layers,
  Zap,
  Sliders,
  Check,
  Ban
} from 'lucide-react';
import { SimulationParams, DeviceSetup, LoadType } from '../types';

interface ControlsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
  speed: number;
  setSpeed: (val: number) => void;
  stepAngle: (delta: number) => void;
  resetAngle: () => void;
  darkMode?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  params,
  setParams,
  isRunning,
  setIsRunning,
  speed,
  setSpeed,
  stepAngle,
  resetAngle,
  darkMode = true
}) => {
  const {
    phase,
    bridge,
    deviceSetup,
    alphaDeg,
    fwdConnected,
    loadType,
    R,
    L_mH,
    vRms
  } = params;

  const setDeviceSetup = (setup: DeviceSetup) => {
    let newSwitches = { ...params.switches };
    if (setup === 'all_diodes') {
      newSwitches = { T1: 'diode', T2: 'diode', T3: 'diode', T4: 'diode' };
    } else if (setup === 'all_thyristors') {
      newSwitches = { T1: 'thyristor', T2: 'thyristor', T3: 'thyristor', T4: 'thyristor' };
    } else if (setup === 'semi_conv') {
      newSwitches = { T1: 'thyristor', T2: 'diode', T3: 'thyristor', T4: 'diode' };
    }
    setParams((p) => ({
      ...p,
      deviceSetup: setup,
      switches: newSwitches
    }));
  };

  const anglePresets = [0, 30, 45, 60, 90, 120, 150];
  const speedPresets = [0.1, 0.2, 0.5, 1, 2];

  return (
    <div className="space-y-4">
      {/* REAL-TIME PLAYBACK BAR */}
      <div className={`border rounded-2xl p-3 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 transition-colors ${
        darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Play / Step Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isRunning ? 'Pause Simulation' : 'Run Real-Time'}
          </button>

          <button
            onClick={() => stepAngle(-5)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Step Back 5°"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => stepAngle(5)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Step Forward 5°"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetAngle}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Reset Angle to 0°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <span className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Speed:</span>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className={`w-24 sm:w-32 accent-cyan-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
              darkMode ? 'bg-slate-800' : 'bg-slate-300'
            }`}
          />
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
            darkMode
              ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
              : 'bg-cyan-100 text-cyan-800 border-cyan-300'
          }`}>
            {speed.toFixed(1)}x
          </span>

          <div className={`hidden sm:flex items-center gap-1 border-l pl-2 ${
            darkMode ? 'border-slate-800' : 'border-slate-300'
          }`}>
            {speedPresets.map((sp) => (
              <button
                key={sp}
                onClick={() => setSpeed(sp)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                  Math.abs(speed - sp) < 0.05
                    ? 'bg-cyan-600 text-white font-semibold'
                    : darkMode
                      ? 'text-slate-400 hover:text-white bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-200'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* THREE CONTROL CARDS IN A ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: CONVERTER TOPOLOGY */}
        <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
          darkMode ? 'bg-[#0b1329] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 ${
              darkMode ? 'text-white' : 'text-slate-800'
            }`}>
              <Layers className="w-4 h-4 text-cyan-500" />
              Converter Topology
            </div>

            {/* Phase Selection */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => setParams((p) => ({ ...p, phase: '1ph' }))}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  phase === '1ph'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Single-Phase (1Φ)
              </button>
              <button
                onClick={() => setParams((p) => ({ ...p, phase: '3ph' }))}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  phase === '3ph'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Three-Phase (3Φ)
              </button>
            </div>

            {/* Bridge Selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setParams((p) => ({ ...p, bridge: 'full' }))}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  bridge === 'full'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Full-Bridge
              </button>
              <button
                onClick={() => setParams((p) => ({ ...p, bridge: 'half' }))}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  bridge === 'half'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Half-Wave
              </button>
            </div>
          </div>

          {/* Quick Device Setup */}
          <div>
            <div className={`text-[10px] uppercase font-mono mb-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Quick Device Setup:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setDeviceSetup('all_diodes')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  deviceSetup === 'all_diodes'
                    ? darkMode
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : 'bg-cyan-100 text-cyan-800 border border-cyan-300 font-semibold'
                    : darkMode
                      ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                All Diodes
              </button>
              <button
                onClick={() => setDeviceSetup('all_thyristors')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  deviceSetup === 'all_thyristors'
                    ? darkMode
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold'
                    : darkMode
                      ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                All Thyristors
              </button>
              <button
                onClick={() => setDeviceSetup('semi_conv')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  deviceSetup === 'semi_conv'
                    ? darkMode
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-semibold'
                    : darkMode
                      ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Semi-Conv
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: FIRING ANGLE α & COMPANION FWD TOGGLE */}
        <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
          darkMode ? 'bg-[#0b1329] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                <Zap className="w-4 h-4 text-amber-500" />
                Firing Angle α & FWD
              </div>
              <span className="font-mono font-bold text-sm text-amber-500">{alphaDeg}°</span>
            </div>

            <div className={`text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Firing Angle (α):
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={alphaDeg}
              onChange={(e) => setParams((p) => ({ ...p, alphaDeg: Number(e.target.value) }))}
              className={`w-full accent-amber-500 h-1.5 rounded-lg appearance-none cursor-pointer mb-3 ${
                darkMode ? 'bg-slate-800' : 'bg-slate-300'
              }`}
            />

            {/* Angle Preset Buttons */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {anglePresets.map((ang) => (
                <button
                  key={ang}
                  onClick={() => setParams((p) => ({ ...p, alphaDeg: ang }))}
                  className={`py-1 rounded text-[10px] font-mono transition cursor-pointer ${
                    alphaDeg === ang
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : darkMode
                        ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {ang}°
                </button>
              ))}
            </div>
          </div>

          {/* COMPANION TOGGLE: ACTIVE VS DISABLED / BYPASS */}
          <div className={`pt-2.5 border-t space-y-1.5 ${
            darkMode ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}>
                Freewheeling Diode (D_FW):
              </span>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                fwdConnected
                  ? darkMode
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : darkMode
                    ? 'bg-amber-950 text-amber-400 border-amber-800'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {fwdConnected ? 'Active (Conducting)' : 'Disabled / Bypass'}
              </span>
            </div>

            <div className={`grid grid-cols-2 p-1 rounded-xl border gap-1 ${
              darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setParams((p) => ({ ...p, fwdConnected: true }))}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  fwdConnected
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                    : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Active (Conducting)
              </button>

              <button
                type="button"
                onClick={() => setParams((p) => ({ ...p, fwdConnected: false }))}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  !fwdConnected
                    ? darkMode
                      ? 'bg-slate-800 text-amber-300 border border-amber-500/50 shadow-sm ring-1 ring-amber-400/30'
                      : 'bg-white text-amber-800 border border-amber-300 shadow-sm ring-1 ring-amber-300'
                    : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                Disabled / Bypass
              </button>
            </div>
          </div>
        </div>

        {/* CARD 3: LOAD & SOURCE PARAMETERS */}
        <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
          darkMode ? 'bg-[#0b1329] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 ${
              darkMode ? 'text-white' : 'text-slate-800'
            }`}>
              <Sliders className="w-4 h-4 text-emerald-500" />
              Load & Source Parameters
            </div>

            {/* Load Type Tabs */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {(['R', 'RL', 'RLE'] as LoadType[]).map((lt) => (
                <button
                  key={lt}
                  onClick={() => setParams((p) => ({ ...p, loadType: lt }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    loadType === lt
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : darkMode
                        ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {lt} Load
                </button>
              ))}
            </div>

            {/* Resistance Slider */}
            <div className="space-y-2.5 text-xs">
              <div>
                <div className={`flex justify-between mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>R (Resistance):</span>
                  <span className="font-mono text-emerald-500 font-bold">{R} Ω</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  step="1"
                  value={R}
                  onChange={(e) => setParams((p) => ({ ...p, R: Number(e.target.value) }))}
                  className={`w-full accent-emerald-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                    darkMode ? 'bg-slate-800' : 'bg-slate-300'
                  }`}
                />
              </div>

              {/* Inductance Slider */}
              <div>
                <div className={`flex justify-between mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>L (Inductance):</span>
                  <span className="font-mono text-amber-500 font-bold">{L_mH} mH</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={L_mH}
                  onChange={(e) => setParams((p) => ({ ...p, L_mH: Number(e.target.value) }))}
                  className={`w-full accent-amber-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                    darkMode ? 'bg-slate-800' : 'bg-slate-300'
                  }`}
                />
              </div>

              {/* Source RMS */}
              <div>
                <div className={`flex justify-between mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Source RMS:</span>
                  <span className="font-mono text-cyan-500 font-bold">{vRms}V</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={vRms}
                  onChange={(e) => setParams((p) => ({ ...p, vRms: Number(e.target.value) }))}
                  className={`w-full accent-cyan-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                    darkMode ? 'bg-slate-800' : 'bg-slate-300'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
