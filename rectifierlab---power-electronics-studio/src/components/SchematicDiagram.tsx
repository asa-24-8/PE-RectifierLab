import React from 'react';
import { Activity, Maximize2 } from 'lucide-react';
import { SimulationParams } from '../types';

interface SchematicDiagramProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  instantState: {
    vs: number;
    vo: number;
    io: number;
    is: number;
    activePair: string;
    loopDescription: string;
    switches: {
      T1: boolean;
      T2: boolean;
      T3: boolean;
      T4: boolean;
    };
  };
  angleDeg: number;
  darkMode?: boolean;
}

export const SchematicDiagram: React.FC<SchematicDiagramProps> = ({
  params,
  setParams,
  instantState,
  angleDeg,
  darkMode = true
}) => {
  const { switches, loadType, R, L_mH, E_emf, fwdConnected, phase, bridge } = params;

  // Toggle individual switch between Diode and Thyristor with synchronized deviceSetup
  const toggleSwitch = (key: 'T1' | 'T2' | 'T3' | 'T4') => {
    setParams((prev) => {
      const nextType = prev.switches[key] === 'diode' ? 'thyristor' : 'diode';
      const updatedSwitches = {
        ...prev.switches,
        [key]: nextType
      };

      // Synchronize deviceSetup
      let newSetup = prev.deviceSetup;
      const allD = Object.values(updatedSwitches).every((v) => v === 'diode');
      const allT = Object.values(updatedSwitches).every((v) => v === 'thyristor');
      if (allD) newSetup = 'all_diodes';
      else if (allT) newSetup = 'all_thyristors';
      else newSetup = 'semi_conv';

      return {
        ...prev,
        deviceSetup: newSetup,
        switches: updatedSwitches
      };
    });
  };

  // Toggle Freewheeling Diode
  const toggleFWD = () => {
    setParams((prev) => ({
      ...prev,
      fwdConnected: !prev.fwdConnected
    }));
  };

  // Cycle Load type: R -> RL -> RLE -> R
  const cycleLoadType = () => {
    setParams((prev) => {
      const types: ('R' | 'RL' | 'RLE')[] = ['R', 'RL', 'RLE'];
      const nextIdx = (types.indexOf(prev.loadType) + 1) % types.length;
      return {
        ...prev,
        loadType: types[nextIdx]
      };
    });
  };

  // Cycle AC Source Voltage: 230V -> 120V -> 400V -> 230V
  const cycleSourceVoltage = () => {
    setParams((prev) => {
      const voltages = [230, 120, 400];
      const curIdx = voltages.indexOf(prev.vRms);
      const nextVal = curIdx === -1 ? 230 : voltages[(curIdx + 1) % voltages.length];
      return {
        ...prev,
        vRms: nextVal
      };
    });
  };

  // Conduction state classifications
  const isFreewheel =
    instantState.activePair.includes('T1 D4') ||
    instantState.activePair.includes('D2 T3') ||
    instantState.activePair.includes('D_FW');
  const isPos = instantState.activePair.includes('T1') || instantState.activePair.includes('D1');
  const isNeg = instantState.activePair.includes('T3') || instantState.activePair.includes('D3');

  // SVG Dot Offset for animated dash
  const animTime = (angleDeg % 360) / 360;
  const strokeDashoffset = -(animTime * 120);

  // Geometric coordinates for clean professional layout
  const topRailY = 44;
  const botRailY = 356;
  const leg1X = 220; // Phase A leg
  const leg2X = 360; // Neutral leg
  const fwdX = 490; // Freewheeling diode leg
  const loadX = 630; // Load block
  const phaseAY = 160; // Midpoint Phase A
  const neutralY = 240; // Midpoint Neutral
  const acSourceX = 75; // AC source center X
  const acSourceY = 200; // AC source center Y
  const acRadius = 32;

  // Discrete glowing nodal beads along top and bottom rails
  const topRailBeads = [220, 255, 290, 325, 360, 395, 430, 460, 490, 525, 560, 595, 630];
  const botRailBeads = [220, 255, 290, 325, 360, 395, 430, 460, 490, 525, 560, 595, 630];

  const wireColor = darkMode ? '#1e293b' : '#64748b';

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col h-full transition-colors ${
      darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      {/* Header Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3 ${
        darkMode ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className={`p-1.5 rounded-lg border ${
            darkMode ? 'bg-cyan-950/80 border-cyan-800/60 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Circuit Schematic Diagram
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
            darkMode ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
          }`}>
            {phase === '1ph' ? '1-PHASE' : '3-PHASE'} {bridge === 'full' ? 'FULL-BRIDGE' : 'HALF-WAVE'}
          </span>
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono ${
            darkMode ? 'bg-slate-900 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
          }`}>
            <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ACTIVE CURRENT LOOP:</span>
            <span className={`font-bold truncate max-w-[280px] ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {instantState.loopDescription}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            const elem = document.getElementById('schematic-container');
            if (elem) {
              if (!document.fullscreenElement) elem.requestFullscreen?.();
              else document.exitFullscreen?.();
            }
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition cursor-pointer ${
            darkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Full Screen
        </button>
      </div>

      <div className={`text-[11px] mb-2 flex items-center justify-between flex-wrap gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        <div>
          <span className="font-semibold text-cyan-400">Interactive:</span> Click any switch{' '}
          <span className="text-cyan-400 font-semibold">(T ↔ D)</span>,{' '}
          <span className="text-emerald-400 font-semibold">FWD</span>, or{' '}
          <span className="text-amber-400 font-semibold">Load</span> directly in the circuit to toggle states in real time.
        </div>
      </div>

      {/* Schematic SVG Container */}
      <div
        id="schematic-container"
        className={`flex-1 w-full border rounded-xl relative overflow-hidden select-none flex items-center justify-center p-2 min-h-[380px] transition-colors ${
          darkMode ? 'bg-[#070c1a] border-slate-800/90' : 'bg-slate-50 border-slate-200 shadow-inner'
        }`}
      >
        <svg
          viewBox="0 0 760 400"
          className="w-full h-full max-h-[440px] block"
          style={{
            backgroundImage: `radial-gradient(circle, ${darkMode ? '#1e293b' : '#cbd5e1'} 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        >
          <defs>
            <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-wire-bright" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-cyan-pip" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* BASE BUS WIRES */}
          <line x1={leg1X} y1={topRailY} x2={loadX} y2={topRailY} stroke={wireColor} strokeWidth="3.5" />
          <line x1={leg1X} y1={botRailY} x2={loadX} y2={botRailY} stroke={wireColor} strokeWidth="3.5" />

          {/* LEG 1 (Phase A) */}
          <line x1={leg1X} y1={topRailY} x2={leg1X} y2={68} stroke={wireColor} strokeWidth="3" />
          <line x1={leg1X} y1={132} x2={leg1X} y2={phaseAY} stroke={wireColor} strokeWidth="3" />
          <line x1={leg1X} y1={phaseAY} x2={leg1X} y2={258} stroke={wireColor} strokeWidth="3" />
          <line x1={leg1X} y1={322} x2={leg1X} y2={botRailY} stroke={wireColor} strokeWidth="3" />

          {/* LEG 2 (Neutral) */}
          <line x1={leg2X} y1={topRailY} x2={leg2X} y2={68} stroke={wireColor} strokeWidth="3" />
          <line x1={leg2X} y1={132} x2={leg2X} y2={neutralY} stroke={wireColor} strokeWidth="3" />
          <line x1={leg2X} y1={neutralY} x2={leg2X} y2={258} stroke={wireColor} strokeWidth="3" />
          <line x1={leg2X} y1={322} x2={leg2X} y2={botRailY} stroke={wireColor} strokeWidth="3" />

          {/* AC SOURCE WIRING */}
          <path
            d={`M ${acSourceX} ${acSourceY - acRadius} L ${acSourceX} ${phaseAY} L ${leg1X} ${phaseAY}`}
            fill="none"
            stroke={wireColor}
            strokeWidth="3"
          />
          <path
            d={`M ${acSourceX} ${acSourceY + acRadius} L ${acSourceX} ${neutralY} L ${leg1X - 12} ${neutralY} A 12 12 0 0 1 ${leg1X + 12} ${neutralY} L ${leg2X} ${neutralY}`}
            fill="none"
            stroke={wireColor}
            strokeWidth="3"
          />

          {/* FWD WIRING */}
          {fwdConnected && (
            <>
              <line x1={fwdX} y1={topRailY} x2={fwdX} y2={165} stroke={wireColor} strokeWidth="3" />
              <line x1={fwdX} y1={235} x2={fwdX} y2={botRailY} stroke={wireColor} strokeWidth="3" />
            </>
          )}

          {/* LOAD WIRING */}
          <line x1={loadX} y1={topRailY} x2={loadX} y2={125} stroke={wireColor} strokeWidth="3.5" />
          <line x1={loadX} y1={275} x2={loadX} y2={botRailY} stroke={wireColor} strokeWidth="3.5" />

          {/* ACTIVE CONDUCTION CURRENT FLOW OVERLAYS */}
          {isFreewheel && (
            <g filter="url(#glow-wire-bright)">
              <path
                d={`M ${leg1X} ${phaseAY} L ${leg1X} 68 M ${leg1X} ${topRailY} L ${loadX} ${topRailY} L ${loadX} 125 M ${loadX} 275 L ${loadX} ${botRailY} L ${leg1X} ${botRailY} L ${leg1X} 322 M ${leg1X} 258 L ${leg1X} ${phaseAY}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeDasharray="8 8"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </g>
          )}

          {isPos && !isFreewheel && (
            <g filter="url(#glow-wire-bright)">
              <path
                d={`M ${acSourceX} ${acSourceY - acRadius} L ${acSourceX} ${phaseAY} L ${leg1X} ${phaseAY} L ${leg1X} 68 M ${leg1X} ${topRailY} L ${loadX} ${topRailY} L ${loadX} 125 M ${loadX} 275 L ${loadX} ${botRailY} L ${leg2X} ${botRailY} L ${leg2X} 322 M ${leg2X} 258 L ${leg2X} ${neutralY} L ${leg1X + 12} ${neutralY} A 12 12 0 0 0 ${leg1X - 12} ${neutralY} L ${acSourceX} ${neutralY} L ${acSourceX} ${acSourceY + acRadius}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3.5"
                strokeDasharray="8 8"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </g>
          )}

          {isNeg && !isFreewheel && (
            <g filter="url(#glow-wire-bright)">
              <path
                d={`M ${acSourceX} ${acSourceY + acRadius} L ${acSourceX} ${neutralY} L ${leg1X - 12} ${neutralY} A 12 12 0 0 1 ${leg1X + 12} ${neutralY} L ${leg2X} ${neutralY} L ${leg2X} 68 M ${leg2X} ${topRailY} L ${loadX} ${topRailY} L ${loadX} 125 M ${loadX} 275 L ${loadX} ${botRailY} L ${leg1X} ${botRailY} L ${leg1X} 322 M ${leg1X} 258 L ${leg1X} ${phaseAY} L ${acSourceX} ${phaseAY} L ${acSourceX} ${acSourceY - acRadius}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3.5"
                strokeDasharray="8 8"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </g>
          )}

          {/* BUSBAR NODAL BEADS */}
          {topRailBeads.map((bx, idx) => (
            <circle
              key={`top-${idx}`}
              cx={bx}
              cy={topRailY}
              r={3}
              fill={darkMode ? '#06b6d4' : '#0284c7'}
              opacity="0.85"
              filter="url(#glow-cyan-pip)"
            />
          ))}
          {botRailBeads.map((bx, idx) => (
            <circle
              key={`bot-${idx}`}
              cx={bx}
              cy={botRailY}
              r={3}
              fill={darkMode ? '#06b6d4' : '#0284c7'}
              opacity="0.85"
              filter="url(#glow-cyan-pip)"
            />
          ))}

          {/* SOLDER JUNCTIONS */}
          <circle cx={leg1X} cy={topRailY} r={4.5} fill="#0ea5e9" />
          <circle cx={leg2X} cy={topRailY} r={4.5} fill="#0ea5e9" />
          <circle cx={leg1X} cy={botRailY} r={4.5} fill="#0ea5e9" />
          <circle cx={leg2X} cy={botRailY} r={4.5} fill="#0ea5e9" />
          <circle cx={leg1X} cy={phaseAY} r={4.5} fill="#0ea5e9" />
          <circle cx={leg2X} cy={neutralY} r={4.5} fill="#0ea5e9" />
          <circle cx={loadX} cy={topRailY} r={4.5} fill="#0ea5e9" />
          <circle cx={loadX} cy={botRailY} r={4.5} fill="#0ea5e9" />
          {fwdConnected && (
            <>
              <circle cx={fwdX} cy={topRailY} r={4.5} fill="#0ea5e9" />
              <circle cx={fwdX} cy={botRailY} r={4.5} fill="#0ea5e9" />
            </>
          )}

          {/* AC SOURCE SYMBOL (CLICKABLE) */}
          <g
            transform={`translate(${acSourceX}, ${acSourceY})`}
            className="cursor-pointer group"
            onClick={cycleSourceVoltage}
          >
            <title>AC Source: Click to change RMS voltage (230V → 120V → 400V)</title>
            <circle
              cx="0"
              cy="0"
              r={acRadius}
              fill={darkMode ? '#0b1739' : '#e0f2fe'}
              stroke="#0284c7"
              strokeWidth="2.5"
              className="group-hover:stroke-cyan-400 transition"
            />
            <path
              d="M -16 0 Q -8 -18 0 0 T 16 0"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.8"
              strokeLinecap="round"
              className="group-hover:stroke-cyan-400 transition"
            />
            <circle cx="0" cy={-acRadius} r={3} fill="#0284c7" />
            <circle cx="0" cy={acRadius} r={3} fill="#0284c7" />

            <text
              x="0"
              y="46"
              fill={darkMode ? '#f1f5f9' : '#0f172a'}
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              AC Source
            </text>
            <text
              x="0"
              y="60"
              fill={darkMode ? '#94a3b8' : '#475569'}
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              vs = {instantState.vs.toFixed(1)} V
            </text>
          </g>

          <text x={115} y={phaseAY - 7} fill={darkMode ? '#38bdf8' : '#0369a1'} fontSize="10" fontFamily="monospace" fontWeight="bold">
            Phase A
          </text>
          <text x={115} y={neutralY - 7} fill={darkMode ? '#94a3b8' : '#475569'} fontSize="10" fontFamily="monospace" fontWeight="bold">
            Neutral (N)
          </text>

          <text x={loadX + 16} y={topRailY + 4} fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace">
            + Vo ({instantState.vo.toFixed(1)} V)
          </text>
          <text x={loadX + 16} y={botRailY + 4} fill={darkMode ? '#38bdf8' : '#0284c7'} fontSize="11" fontWeight="bold" fontFamily="monospace">
            - Vo (GND)
          </text>

          {/* SWITCH 1: T1 / D1 (CLICKABLE) */}
          <g
            transform={`translate(${leg1X}, 100)`}
            className="cursor-pointer group"
            onClick={() => toggleSwitch('T1')}
          >
            <title>Switch T1: Click to toggle Diode (D) ↔ Thyristor (T)</title>
            <rect
              x="-30"
              y="-32"
              width="60"
              height="64"
              rx="10"
              fill={
                instantState.switches.T1
                  ? darkMode ? '#064e3b' : '#dcfce7'
                  : darkMode ? '#0a142e' : '#f8fafc'
              }
              stroke={
                instantState.switches.T1
                  ? darkMode ? '#10b981' : '#16a34a'
                  : darkMode ? '#334155' : '#cbd5e1'
              }
              strokeWidth={instantState.switches.T1 ? '2.5' : '1.5'}
              filter={instantState.switches.T1 ? 'url(#glow-green)' : undefined}
            />
            <polygon
              points="0,-16 -13,10 13,10"
              fill={
                instantState.switches.T1
                  ? darkMode ? '#34d399' : '#15803d'
                  : '#64748b'
              }
            />
            <line
              x1="-13"
              y1="-16"
              x2="13"
              y2="-16"
              stroke={
                instantState.switches.T1
                  ? darkMode ? '#34d399' : '#15803d'
                  : '#64748b'
              }
              strokeWidth="2.5"
            />
            {switches.T1 === 'thyristor' && (
              <path
                d="M -13 10 L -21 16"
                stroke={instantState.switches.T1 ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2"
              />
            )}
            <text
              x="-22"
              y="-12"
              fill={switches.T1 === 'thyristor' ? '#d97706' : '#0284c7'}
              fontSize="9"
              fontWeight="bold"
            >
              {switches.T1 === 'thyristor' ? 'T1' : 'D1'}
            </text>
            <text
              x="0"
              y="24"
              fill={
                instantState.switches.T1
                  ? darkMode ? '#34d399' : '#15803d'
                  : darkMode ? '#94a3b8' : '#64748b'
              }
              fontSize="8"
              textAnchor="middle"
              fontWeight="bold"
            >
              {instantState.switches.T1 ? 'ON' : 'OFF'}
            </text>
          </g>
          <text x={leg1X} y={58} fill={darkMode ? '#64748b' : '#475569'} fontSize="8" textAnchor="middle">
            Ph A (Top)
          </text>

          {/* SWITCH 4: D4 / T4 (CLICKABLE) */}
          <g
            transform={`translate(${leg1X}, 290)`}
            className="cursor-pointer group"
            onClick={() => toggleSwitch('T4')}
          >
            <title>Switch T4: Click to toggle Diode (D) ↔ Thyristor (T)</title>
            <rect
              x="-30"
              y="-32"
              width="60"
              height="64"
              rx="10"
              fill={
                instantState.switches.T4
                  ? darkMode ? '#064e3b' : '#dcfce7'
                  : darkMode ? '#0a142e' : '#f8fafc'
              }
              stroke={
                instantState.switches.T4
                  ? darkMode ? '#10b981' : '#16a34a'
                  : darkMode ? '#334155' : '#cbd5e1'
              }
              strokeWidth={instantState.switches.T4 ? '2.5' : '1.5'}
              filter={instantState.switches.T4 ? 'url(#glow-green)' : undefined}
            />
            <polygon
              points="0,-16 -13,10 13,10"
              fill={
                instantState.switches.T4
                  ? darkMode ? '#34d399' : '#15803d'
                  : '#64748b'
              }
            />
            <line
              x1="-13"
              y1="-16"
              x2="13"
              y2="-16"
              stroke={
                instantState.switches.T4
                  ? darkMode ? '#34d399' : '#15803d'
                  : '#64748b'
              }
              strokeWidth="2.5"
            />
            {switches.T4 === 'thyristor' && (
              <path
                d="M -13 10 L -21 16"
                stroke={instantState.switches.T4 ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2"
              />
            )}
            <text
              x="-22"
              y="-12"
              fill={switches.T4 === 'thyristor' ? '#d97706' : '#0284c7'}
              fontSize="9"
              fontWeight="bold"
            >
              {switches.T4 === 'thyristor' ? 'T4' : 'D4'}
            </text>
            <text
              x="0"
              y="24"
              fill={
                instantState.switches.T4
                  ? darkMode ? '#34d399' : '#15803d'
                  : darkMode ? '#94a3b8' : '#64748b'
              }
              fontSize="8"
              textAnchor="middle"
              fontWeight="bold"
            >
              {instantState.switches.T4 ? 'ON' : 'OFF'}
            </text>
          </g>
          <text x={leg1X} y={345} fill={darkMode ? '#64748b' : '#475569'} fontSize="8" textAnchor="middle">
            Ph A (Bot)
          </text>

          {/* SWITCH 3: T3 / D3 (CLICKABLE) */}
          <g
            transform={`translate(${leg2X}, 100)`}
            className="cursor-pointer group"
            onClick={() => toggleSwitch('T3')}
          >
            <title>Switch T3: Click to toggle Diode (D) ↔ Thyristor (T)</title>
            <rect
              x="-30"
              y="-32"
              width="60"
              height="64"
              rx="10"
              fill={
                instantState.switches.T3
                  ? darkMode ? '#064e3b' : '#dcfce7'
                  : darkMode ? '#0a142e' : '#f8fafc'
              }
              stroke={
                instantState.switches.T3
                  ? darkMode ? '#10b981' : '#16a34a'
                  : darkMode ? '#334155' : '#cbd5e1'
              }
              strokeWidth={instantState.switches.T3 ? '2.5' : '1.5'}
              filter={instantState.switches.T3 ? 'url(#glow-green)' : undefined}
            />
            <polygon
              points="0,-16 -13,10 13,10"
              fill={
                instantState.switches.T3
                  ? darkMode ? '#34d399' : '#15803d'
                  : '#64748b'
              }
            />
            <line
              x1="-13"
              y1="-16"
              x2="13"
              y2="-16"
              stroke={
                instantState.switches.T3
                  ? darkMode ? '#34d399' : '#15803d'
                  : '#64748b'
              }
              strokeWidth="2.5"
            />
            {switches.T3 === 'thyristor' && (
              <path
                d="M -13 10 L -21 16"
                stroke={instantState.switches.T3 ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2"
              />
            )}
            <text
              x="-22"
              y="-12"
              fill={switches.T3 === 'thyristor' ? '#d97706' : '#0284c7'}
              fontSize="9"
              fontWeight="bold"
            >
              {switches.T3 === 'thyristor' ? 'T3' : 'D3'}
            </text>
            <text
              x="0"
              y="24"
              fill={
                instantState.switches.T3
                  ? darkMode ? '#34d399' : '#15803d'
                  : darkMode ? '#94a3b8' : '#64748b'
              }
              fontSize="8"
              textAnchor="middle"
              fontWeight="bold"
            >
              {instantState.switches.T3 ? 'ON' : 'OFF'}
            </text>
          </g>
          <text x={leg2X} y={58} fill={darkMode ? '#64748b' : '#475569'} fontSize="8" textAnchor="middle">
            Neut (Top)
          </text>

          {/* SWITCH 2: D2 / T2 (CLICKABLE) */}
          <g
            transform={`translate(${leg2X}, 290)`}
            className="cursor-pointer group"
            onClick={() => toggleSwitch('T2')}
          >
            <title>Switch T2: Click to toggle Diode (D) ↔ Thyristor (T)</title>
            <rect
              x="-30"
              y="-32"
              width="60"
              height="64"
              rx="10"
              fill={
                instantState.switches.T2
                  ? darkMode ? '#064e3b' : '#dcfce7'
                  : darkMode ? '#0a142e' : '#f8fafc'
              }
              stroke={
                instantState.switches.T2
                  ? darkMode ? '#10b981' : '#16a34a'
                  : darkMode ? '#334155' : '#cbd5e1'
              }
              strokeWidth={instantState.switches.T2 ? '2.5' : '1.5'}
              filter={instantState.switches.T2 ? 'url(#glow-green)' : undefined}
            />
            <polygon
              points="0,-16 -13,10 13,10"
              fill={
                instantState.switches.T2
                  ? darkMode ? '#34d399' : '#15803d'
                  : '#64748b'
              }
            />
            <line
              x1="-13"
              y1="-16"
              x2="13"
              y2="-16"
              stroke={
                instantState.switches.T2
                  ? darkMode ? '#34d399' : '#15803d'
                  : '#64748b'
              }
              strokeWidth="2.5"
            />
            {switches.T2 === 'thyristor' && (
              <path
                d="M -13 10 L -21 16"
                stroke={instantState.switches.T2 ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2"
              />
            )}
            <text
              x="-22"
              y="-12"
              fill={switches.T2 === 'thyristor' ? '#d97706' : '#0284c7'}
              fontSize="9"
              fontWeight="bold"
            >
              {switches.T2 === 'thyristor' ? 'T2' : 'D2'}
            </text>
            <text
              x="0"
              y="24"
              fill={
                instantState.switches.T2
                  ? darkMode ? '#34d399' : '#15803d'
                  : darkMode ? '#94a3b8' : '#64748b'
              }
              fontSize="8"
              textAnchor="middle"
              fontWeight="bold"
            >
              {instantState.switches.T2 ? 'ON' : 'OFF'}
            </text>
          </g>
          <text x={leg2X} y={345} fill={darkMode ? '#64748b' : '#475569'} fontSize="8" textAnchor="middle">
            Neut (Bot)
          </text>

          {/* FREEWHEELING DIODE (D_FW) (CLICKABLE) */}
          <g
            transform={`translate(${fwdX}, 200)`}
            className="cursor-pointer group"
            onClick={toggleFWD}
          >
            <title>Freewheeling Diode (D_FW): Click to Connect / Disconnect loop</title>
            {fwdConnected ? (
              <>
                <rect
                  x="-26"
                  y="-26"
                  width="52"
                  height="52"
                  rx="8"
                  fill={darkMode ? '#064e3b' : '#dcfce7'}
                  stroke={darkMode ? '#10b981' : '#16a34a'}
                  strokeWidth="2"
                  className="group-hover:stroke-cyan-400 transition"
                />
                <polygon points="0,-14 -12,8 12,8" fill={darkMode ? '#34d399' : '#15803d'} />
                <line x1="-12" y1="-14" x2="12" y2="-14" stroke={darkMode ? '#34d399' : '#15803d'} strokeWidth="2.5" />
                <text x="0" y="20" fill={darkMode ? '#34d399' : '#15803d'} fontSize="8" textAnchor="middle" fontWeight="bold">
                  D_FW ON
                </text>
              </>
            ) : (
              <g opacity="0.45" className="group-hover:opacity-75 transition">
                <rect
                  x="-26"
                  y="-26"
                  width="52"
                  height="52"
                  rx="8"
                  fill="none"
                  stroke={darkMode ? '#64748b' : '#94a3b8'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <polygon points="0,-14 -12,8 12,8" fill="none" stroke={darkMode ? '#64748b' : '#94a3b8'} strokeWidth="1.5" />
                <line x1="-12" y1="-14" x2="12" y2="-14" stroke={darkMode ? '#64748b' : '#94a3b8'} strokeWidth="2" />
                <text x="0" y="-32" fill={darkMode ? '#94a3b8' : '#475569'} fontSize="8" textAnchor="middle">
                  D_FW
                </text>
                <text x="0" y="38" fill={darkMode ? '#94a3b8' : '#475569'} fontSize="7" textAnchor="middle">
                  DISCONNECTED
                </text>
              </g>
            )}
          </g>

          {/* LOAD BLOCK INSTRUMENT (CLICKABLE) */}
          <g
            transform={`translate(${loadX}, 200)`}
            className="cursor-pointer group"
            onClick={cycleLoadType}
          >
            <title>Load Block: Click to cycle load type (R → RL → RLE)</title>
            <rect
              x="-50"
              y="-75"
              width="100"
              height="150"
              rx="14"
              fill={darkMode ? '#081026' : '#ffffff'}
              stroke="#0284c7"
              strokeWidth="2"
              className="group-hover:stroke-cyan-400 transition"
            />
            <circle cx="0" cy="-75" r="3.5" fill="#0284c7" />
            <circle cx="0" cy="75" r="3.5" fill="#0284c7" />

            <text x="0" y="-52" fill="#0284c7" fontSize="11" fontWeight="bold" textAnchor="middle">
              {loadType} Load
            </text>

            <path
              d="M -22 -32 L -15 -38 L -7 -26 L 1 -38 L 9 -26 L 15 -38 L 22 -32"
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
            />
            <text x="0" y="-14" fill={darkMode ? '#e2e8f0' : '#1e293b'} fontSize="9" fontFamily="monospace" textAnchor="middle">
              R = {R} Ω
            </text>

            {loadType !== 'R' && (
              <>
                <path
                  d="M -20 6 C -20 -3, -12 -3, -12 6 C -12 -3, -4 -3, -4 6 C -4 -3, 4 -3, 4 6 C 4 -3, 12 -3, 12 6 C 12 -3, 20 -3, 20 6"
                  fill="none"
                  stroke={darkMode ? '#34d399' : '#059669'}
                  strokeWidth="2"
                />
                <text x="0" y="24" fill={darkMode ? '#e2e8f0' : '#1e293b'} fontSize="9" fontFamily="monospace" textAnchor="middle">
                  L = {L_mH} mH
                </text>
              </>
            )}

            {loadType === 'RLE' && (
              <text x="0" y="40" fill="#e11d48" fontSize="9" fontFamily="monospace" textAnchor="middle">
                E = {E_emf} V
              </text>
            )}

            <g transform="translate(0, 56)">
              <rect x="-42" y="-11" width="84" height="22" rx="6" fill="#0284c7" />
              <text
                x="0"
                y="4"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                i = {instantState.io >= 0 ? '+' : ''}{instantState.io.toFixed(2)}A ▶
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
