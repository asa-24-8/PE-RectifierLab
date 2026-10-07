import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Layers,
  BarChart2,
  Maximize2,
  Compass,
  Eye
} from 'lucide-react';
import { WaveformDataPoint, MetricValues } from '../types';

interface OscilloscopeProps {
  waveforms: WaveformDataPoint[];
  metrics: MetricValues;
  angleDeg: number;
  setAngleDeg: (val: number) => void;
  vPeakMax?: number;
  iPeakMax?: number;
  darkMode?: boolean;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  waveforms,
  metrics,
  angleDeg,
  setAngleDeg,
  vPeakMax = 375,
  iPeakMax = 17,
  darkMode = true
}) => {
  const [activeTab, setActiveTab] = useState<'superimposed' | 'channels' | 'fft'>('superimposed');
  const [cycles, setCycles] = useState<1 | 2>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showVavg, setShowVavg] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // SVG dimensions for superimposed mode
  const width = 640;
  const height = 135; // per plot
  const padL = 40;
  const padR = 20;
  const padT = 15;
  const padB = 20;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const midY = padT + plotH / 2;

  // Total degrees to plot (360 or 720)
  const totalDeg = cycles * 360;

  // Scale functions
  const xForDeg = (deg: number) => padL + (deg / totalDeg) * plotW;
  const yForVolt = (v: number) => midY - (v / vPeakMax) * (plotH / 2);
  const yForCurr = (i: number) => midY - (i / iPeakMax) * (plotH / 2);

  // Build SVG paths for 1 or 2 cycles
  const { pathVs, pathVo, pathIo, pathIs, gatePulses, activeSegments } = useMemo(() => {
    const vsPts: string[] = [];
    const voPts: string[] = [];
    const ioPts: string[] = [];
    const isPts: string[] = [];
    const gates: { x: number; w: number }[] = [];
    const segments: { pair: string; degStart: number; degEnd: number; xStart: number; xEnd: number }[] = [];

    let currentSegmentPair = '';
    let currentSegStartDeg = 0;
    let currentSegStartX = padL;

    for (let c = 0; c < cycles; c++) {
      for (let i = 0; i < waveforms.length; i++) {
        const pt = waveforms[i];
        const deg = c * 360 + pt.thetaDeg;
        const x = xForDeg(deg);
        const yVs = yForVolt(pt.vs);
        const yVo = yForVolt(pt.vo);
        const yIo = yForCurr(pt.io);
        const yIs = yForCurr(pt.is);

        if (c === 0 && i === 0) {
          vsPts.push(`M ${x} ${yVs}`);
          voPts.push(`M ${x} ${yVo}`);
          ioPts.push(`M ${x} ${yIo}`);
          isPts.push(`M ${x} ${yIs}`);
          currentSegmentPair = pt.activePair;
          currentSegStartDeg = 0;
          currentSegStartX = x;
        } else {
          vsPts.push(`L ${x} ${yVs}`);
          voPts.push(`L ${x} ${yVo}`);
          ioPts.push(`L ${x} ${yIo}`);
          isPts.push(`L ${x} ${yIs}`);

          if (pt.activePair !== currentSegmentPair) {
            segments.push({
              pair: currentSegmentPair,
              degStart: currentSegStartDeg,
              degEnd: deg,
              xStart: currentSegStartX,
              xEnd: x
            });
            currentSegmentPair = pt.activePair;
            currentSegStartDeg = deg;
            currentSegStartX = x;
          }
        }

        if (pt.gatePulse && i % 8 === 0) {
          gates.push({ x: x - 4, w: 8 });
        }
      }
    }

    segments.push({
      pair: currentSegmentPair,
      degStart: currentSegStartDeg,
      degEnd: totalDeg,
      xStart: currentSegStartX,
      xEnd: padL + plotW
    });

    return {
      pathVs: vsPts.join(' '),
      pathVo: voPts.join(' '),
      pathIo: ioPts.join(' '),
      pathIs: isPts.join(' '),
      gatePulses: gates,
      activeSegments: segments
    };
  }, [waveforms, cycles, vPeakMax, iPeakMax, totalDeg]);

  // Current Cursor position
  const normAngle = ((angleDeg % 360) + 360) % 360;
  const cursorDeg = (angleDeg % totalDeg + totalDeg) % totalDeg;
  const cursorX = xForDeg(cursorDeg);
  const currentPt = waveforms[Math.min(waveforms.length - 1, Math.max(0, Math.floor((normAngle / 360) * waveforms.length)))];
  const cursorVoY = yForVolt(currentPt?.vo || 0);
  const cursorIoY = yForCurr(currentPt?.io || 0);

  // Interactive Cursor Dragging on SVG
  const handlePointerAction = useCallback(
    (clientX: number, targetRect: DOMRect) => {
      const relX = clientX - targetRect.left;
      const svgRelX = (relX / targetRect.width) * width;
      const clampedX = Math.max(padL, Math.min(padL + plotW, svgRelX));
      const ratio = (clampedX - padL) / plotW;
      const newDeg = (ratio * totalDeg) % 360;
      setAngleDeg(newDeg);
    },
    [totalDeg, setAngleDeg, width, plotW, padL]
  );

  const onSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    handlePointerAction(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const onSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      handlePointerAction(e.clientX, e.currentTarget.getBoundingClientRect());
    }
  };

  const onSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Active Pair Bar Pointer Action (Click & Drag)
  const [isActiveBarDragging, setIsActiveBarDragging] = useState<boolean>(false);
  const activeBarRef = useRef<HTMLDivElement>(null);

  const handleActiveBarPointer = (clientX: number) => {
    if (!activeBarRef.current) return;
    const rect = activeBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newDeg = (ratio * totalDeg) % 360;
    setAngleDeg(newDeg);
  };

  const onActiveBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsActiveBarDragging(true);
    handleActiveBarPointer(e.clientX);
  };

  const onActiveBarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isActiveBarDragging) {
      handleActiveBarPointer(e.clientX);
    }
  };

  const onActiveBarPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsActiveBarDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Channels sub-plot height and scales
  const chHeight = 72;
  const chPlotH = chHeight - 16;
  const chMidY = 8 + chPlotH / 2;
  const yForChVolt = (v: number) => chMidY - (v / vPeakMax) * (chPlotH / 2);
  const yForChCurr = (i: number) => chMidY - (i / iPeakMax) * (chPlotH / 2);

  // Channel Paths
  const { chPathVs, chPathVo, chPathIo } = useMemo(() => {
    const vsPts: string[] = [];
    const voPts: string[] = [];
    const ioPts: string[] = [];

    for (let c = 0; c < cycles; c++) {
      for (let i = 0; i < waveforms.length; i++) {
        const pt = waveforms[i];
        const deg = c * 360 + pt.thetaDeg;
        const x = xForDeg(deg);
        const yVs = yForChVolt(pt.vs);
        const yVo = yForChVolt(pt.vo);
        const yIo = yForChCurr(pt.io);

        if (c === 0 && i === 0) {
          vsPts.push(`M ${x} ${yVs}`);
          voPts.push(`M ${x} ${yVo}`);
          ioPts.push(`M ${x} ${yIo}`);
        } else {
          vsPts.push(`L ${x} ${yVs}`);
          voPts.push(`L ${x} ${yVo}`);
          ioPts.push(`L ${x} ${yIo}`);
        }
      }
    }
    return {
      chPathVs: vsPts.join(' '),
      chPathVo: voPts.join(' '),
      chPathIo: ioPts.join(' ')
    };
  }, [waveforms, cycles, vPeakMax, iPeakMax, totalDeg]);

  // FFT Bar mock harmonics
  const harmonics = useMemo(() => {
    return [
      { n: 1, val: 100 },
      { n: 3, val: 32 },
      { n: 5, val: 18 },
      { n: 7, val: 11 },
      { n: 9, val: 7 },
      { n: 11, val: 5 },
      { n: 13, val: 3 }
    ];
  }, []);

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col h-full transition-colors ${
      darkMode ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      {/* Top Controls Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3 ${
        darkMode ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        {/* View Mode Tabs */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('superimposed')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'superimposed'
                ? 'bg-cyan-600 text-white shadow-sm'
                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Superimposed
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'channels'
                ? 'bg-cyan-600 text-white shadow-sm'
                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Oscilloscope Channels
          </button>
          <button
            onClick={() => setActiveTab('fft')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fft'
                ? 'bg-cyan-600 text-white shadow-sm'
                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Harmonics (FFT)
          </button>
        </div>

        {/* Oscilloscope Sub Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCycles(cycles === 1 ? 2 : 1)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            {cycles} Cycle ({cycles === 1 ? '360°' : '720°'})
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
              showGrid
                ? darkMode ? 'bg-cyan-950 border-cyan-800 text-cyan-300 font-bold' : 'bg-cyan-100 border-cyan-300 text-cyan-800 font-bold'
                : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Toggle Grid Lines, Axis Marks, and Y-Axis Values"
          >
            # Grid {showGrid ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowVavg(!showVavg)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
              showVavg
                ? darkMode ? 'bg-cyan-950 border-cyan-800 text-cyan-300 font-semibold' : 'bg-cyan-100 border-cyan-300 text-cyan-800 font-semibold'
                : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            V_avg
          </button>
          <button
            onClick={() => {
              const elem = document.getElementById('oscilloscope-container');
              if (elem) {
                if (!document.fullscreenElement) elem.requestFullscreen?.();
                else document.exitFullscreen?.();
              }
            }}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Full Screen Plot"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Plot Area */}
      <div
        id="oscilloscope-container"
        className={`flex-1 w-full border rounded-xl p-2 relative flex flex-col justify-between overflow-hidden shadow-inner ${
          darkMode ? 'bg-[#070c1a] border-slate-800/90' : 'bg-[#050b17] border-slate-300'
        }`}
      >
        {activeTab === 'superimposed' && (
          <>
            {/* VOLTAGE PLOT */}
            <div className="relative">
              <div className="flex justify-between items-center text-[11px] text-slate-400 px-2 pt-1 font-mono">
                <span className="text-slate-300 font-semibold">
                  Voltage Waveforms (v_s & v_o Superimposed)
                </span>
                {showGrid && <span className="text-slate-500">[V]</span>}
              </div>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto block select-none cursor-crosshair touch-none"
                onPointerDown={onSvgPointerDown}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp}
              >
                {/* Grid & Y-Axis values ONLY when showGrid is true */}
                {showGrid && (
                  <>
                    <line x1={padL} y1={padT} x2={padL + plotW} y2={padT} stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1={padL} y1={midY} x2={padL + plotW} y2={midY} stroke="#334155" strokeWidth="1" />
                    <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#1e293b" strokeDasharray="3 3" />
                    {[90, 180, 270, 360, ...(cycles === 2 ? [450, 540, 630, 720] : [])].map((d) => (
                      <line
                        key={d}
                        x1={xForDeg(d)}
                        y1={padT}
                        x2={xForDeg(d)}
                        y2={padT + plotH}
                        stroke="#1e293b"
                        strokeDasharray="2 2"
                      />
                    ))}

                    {/* Y-Axis Value Labels (Hidden when showGrid is false) */}
                    <text x="32" y={padT + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                      {vPeakMax}V
                    </text>
                    <text x="32" y={midY + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                      0V
                    </text>
                    <text x="32" y={padT + plotH} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                      -{vPeakMax}V
                    </text>
                  </>
                )}

                {/* V_avg Reference line */}
                {showVavg && (
                  <line
                    x1={padL}
                    y1={yForVolt(metrics.vDcAvg)}
                    x2={padL + plotW}
                    y2={yForVolt(metrics.vDcAvg)}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Input vs curve (dotted blue) */}
                <path
                  d={pathVs}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />

                {/* Rectified vo curve (solid neon green) */}
                <path
                  d={pathVo}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Vertical Cursor Line (Draggable & Clickable) */}
                <line
                  x1={cursorX}
                  y1={padT}
                  x2={cursorX}
                  y2={padT + plotH}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                {/* Cursor glowing tag & dot */}
                <circle cx={cursorX} cy={cursorVoY} r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                <rect
                  x={Math.max(padL, Math.min(padL + plotW - 46, cursorX - 23))}
                  y={padT - 13}
                  width="46"
                  height="12"
                  rx="3"
                  fill="#0284c7"
                  opacity="0.9"
                />
                <text
                  x={Math.max(padL, Math.min(padL + plotW - 46, cursorX - 23)) + 23}
                  y={padT - 4}
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {normAngle.toFixed(0)}°
                </text>
              </svg>
            </div>

            {/* CURRENT PLOT */}
            <div className={`relative ${showGrid ? 'border-t border-slate-800/80 mt-1' : 'mt-1'}`}>
              <div className="flex justify-between items-center text-[11px] text-slate-400 px-2 pt-1 font-mono">
                <span className="text-slate-300 font-semibold">
                  Current Waveforms (i_o & i_s)
                </span>
                {showGrid && <span className="text-slate-500">[A]</span>}
              </div>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto block select-none cursor-crosshair touch-none"
                onPointerDown={onSvgPointerDown}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp}
              >
                {/* Grid & Y-Axis values ONLY when showGrid is true */}
                {showGrid && (
                  <>
                    <line x1={padL} y1={padT} x2={padL + plotW} y2={padT} stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1={padL} y1={midY} x2={padL + plotW} y2={midY} stroke="#334155" strokeWidth="1" />
                    <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#1e293b" strokeDasharray="3 3" />
                    {[0, 90, 180, 270, 360, ...(cycles === 2 ? [450, 540, 630, 720] : [])].map((d) => (
                      <g key={d}>
                        <line
                          x1={xForDeg(d)}
                          y1={padT}
                          x2={xForDeg(d)}
                          y2={padT + plotH}
                          stroke="#1e293b"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={xForDeg(d)}
                          y={padT + plotH + 14}
                          fill="#64748b"
                          fontSize="8"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {d}°
                        </text>
                      </g>
                    ))}

                    {/* Y-Axis Value Labels (Hidden when showGrid is false) */}
                    <text x="32" y={padT + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                      {iPeakMax}A
                    </text>
                    <text x="32" y={midY + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                      0A
                    </text>
                    <text x="32" y={padT + plotH} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                      -{iPeakMax}A
                    </text>
                  </>
                )}

                {/* Gate Pulse markers (amber bars at bottom) */}
                {gatePulses.map((g, idx) => (
                  <rect
                    key={idx}
                    x={g.x}
                    y={padT + plotH - 12}
                    width={g.w + 14}
                    height="8"
                    rx="2"
                    fill="#fbbf24"
                    opacity="0.9"
                  />
                ))}

                {/* Source Current is (purple) */}
                <path
                  d={pathIs}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Load Current io (amber/yellow) */}
                <path
                  d={pathIo}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Vertical Cursor Line */}
                <line
                  x1={cursorX}
                  y1={padT}
                  x2={cursorX}
                  y2={padT + plotH}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                <circle cx={cursorX} cy={cursorIoY} r="4.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>
          </>
        )}

        {/* CHANNELS VIEW (DEDICATED SEPARATE CHANNELS FOR vs, vo, io) */}
        {activeTab === 'channels' && (
          <div className="space-y-1.5 overflow-y-auto max-h-[300px] p-1">
            {/* Channel 1: Source Voltage vs */}
            <div className="relative">
              <div className="flex justify-between items-center text-[10px] text-cyan-400 px-2 font-mono">
                <span className="font-semibold">CH 1: Source Voltage v_s(ωt)</span>
                {showGrid && <span>±{vPeakMax}V</span>}
              </div>
              <svg
                viewBox={`0 0 ${width} ${chHeight}`}
                className="w-full h-auto block select-none cursor-crosshair touch-none"
                onPointerDown={onSvgPointerDown}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp}
              >
                {showGrid && (
                  <>
                    <line x1={padL} y1={8} x2={padL + plotW} y2={8} stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1={padL} y1={chMidY} x2={padL + plotW} y2={chMidY} stroke="#334155" strokeWidth="1" />
                    <line x1={padL} y1={8 + chPlotH} x2={padL + plotW} y2={8 + chPlotH} stroke="#1e293b" strokeDasharray="3 3" />
                    {[90, 180, 270, 360].map((d) => (
                      <line key={d} x1={xForDeg(d)} y1={8} x2={xForDeg(d)} y2={8 + chPlotH} stroke="#1e293b" strokeDasharray="2 2" />
                    ))}
                    <text x="32" y={8 + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">+{vPeakMax}V</text>
                    <text x="32" y={chMidY + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">0V</text>
                    <text x="32" y={8 + chPlotH} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">-{vPeakMax}V</text>
                  </>
                )}
                <path d={chPathVs} fill="none" stroke="#0284c7" strokeWidth="2" />
                <line x1={cursorX} y1={8} x2={cursorX} y2={8 + chPlotH} stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx={cursorX} cy={yForChVolt(currentPt?.vs || 0)} r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
              </svg>
            </div>

            {/* Channel 2: Output Voltage vo */}
            <div className={`relative ${showGrid ? 'border-t border-slate-800/80 pt-1' : 'pt-1'}`}>
              <div className="flex justify-between items-center text-[10px] text-emerald-400 px-2 font-mono">
                <span className="font-semibold">CH 2: Output Voltage v_o(ωt)</span>
                {showGrid && <span>0 ~ {vPeakMax}V</span>}
              </div>
              <svg
                viewBox={`0 0 ${width} ${chHeight}`}
                className="w-full h-auto block select-none cursor-crosshair touch-none"
                onPointerDown={onSvgPointerDown}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp}
              >
                {showGrid && (
                  <>
                    <line x1={padL} y1={8} x2={padL + plotW} y2={8} stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1={padL} y1={chMidY} x2={padL + plotW} y2={chMidY} stroke="#334155" strokeWidth="1" />
                    <line x1={padL} y1={8 + chPlotH} x2={padL + plotW} y2={8 + chPlotH} stroke="#1e293b" strokeDasharray="3 3" />
                    {[90, 180, 270, 360].map((d) => (
                      <line key={d} x1={xForDeg(d)} y1={8} x2={xForDeg(d)} y2={8 + chPlotH} stroke="#1e293b" strokeDasharray="2 2" />
                    ))}
                    <text x="32" y={8 + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">+{vPeakMax}V</text>
                    <text x="32" y={chMidY + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">0V</text>
                    <text x="32" y={8 + chPlotH} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">-{vPeakMax}V</text>
                  </>
                )}
                <path d={chPathVo} fill="none" stroke="#10b981" strokeWidth="2.2" />
                <line x1={cursorX} y1={8} x2={cursorX} y2={8 + chPlotH} stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx={cursorX} cy={yForChVolt(currentPt?.vo || 0)} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
              </svg>
            </div>

            {/* Channel 3: Output Current io */}
            <div className={`relative ${showGrid ? 'border-t border-slate-800/80 pt-1' : 'pt-1'}`}>
              <div className="flex justify-between items-center text-[10px] text-amber-400 px-2 font-mono">
                <span className="font-semibold">CH 3: Load Current i_o(ωt)</span>
                {showGrid && <span>0 ~ {iPeakMax}A</span>}
              </div>
              <svg
                viewBox={`0 0 ${width} ${chHeight}`}
                className="w-full h-auto block select-none cursor-crosshair touch-none"
                onPointerDown={onSvgPointerDown}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp}
              >
                {showGrid && (
                  <>
                    <line x1={padL} y1={8} x2={padL + plotW} y2={8} stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1={padL} y1={chMidY} x2={padL + plotW} y2={chMidY} stroke="#334155" strokeWidth="1" />
                    <line x1={padL} y1={8 + chPlotH} x2={padL + plotW} y2={8 + chPlotH} stroke="#1e293b" strokeDasharray="3 3" />
                    {[90, 180, 270, 360].map((d) => (
                      <line key={d} x1={xForDeg(d)} y1={8} x2={xForDeg(d)} y2={8 + chPlotH} stroke="#1e293b" strokeDasharray="2 2" />
                    ))}
                    <text x="32" y={8 + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">+{iPeakMax}A</text>
                    <text x="32" y={chMidY + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">0A</text>
                    <text x="32" y={8 + chPlotH} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">-{iPeakMax}A</text>
                  </>
                )}
                <path d={chPathIo} fill="none" stroke="#fbbf24" strokeWidth="2.2" />
                <line x1={cursorX} y1={8} x2={cursorX} y2={8 + chPlotH} stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" />
                <circle cx={cursorX} cy={yForChCurr(currentPt?.io || 0)} r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
              </svg>
            </div>
          </div>
        )}

        {/* Harmonics FFT View */}
        {activeTab === 'fft' && (
          <div className="p-4 flex flex-col justify-center h-full">
            <h4 className="text-xs font-mono font-semibold text-cyan-300 mb-2">
              Harmonic Spectrum of Input Current i_s(t)
            </h4>
            <div className="flex items-end gap-4 h-48 border-b border-slate-800 pb-2 px-6">
              {harmonics.map((h) => (
                <div key={h.n} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono text-cyan-400">{h.val}%</span>
                  <div
                    className="w-full bg-gradient-to-t from-cyan-600 to-indigo-500 rounded-t-md transition-all duration-300"
                    style={{ height: `${h.val * 1.5}px` }}
                  />
                  <span className="text-[10px] font-mono text-slate-400">n={h.n}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-mono">
              <span>Fundamental Frequency f1 = 50 Hz</span>
              <span className="text-cyan-400 font-bold">THD_i = {metrics.thdCurrent.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* ACTIVE PAIR SEGMENT BAR (CLICKABLE & DRAGGABLE TO ADJUST CURSOR ωt) */}
        <div className={`mt-2 pt-2 border-t flex items-center gap-2 ${
          darkMode ? 'border-slate-800/80' : 'border-slate-800'
        }`}>
          <div className="text-[10px] font-mono uppercase tracking-wider shrink-0 text-slate-400">
            ACTIVE PAIR
          </div>
          <div
            ref={activeBarRef}
            onPointerDown={onActiveBarPointerDown}
            onPointerMove={onActiveBarPointerMove}
            onPointerUp={onActiveBarPointerUp}
            className="flex-1 relative flex h-6 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden text-[10px] font-mono cursor-pointer hover:border-cyan-500/50 transition select-none touch-none"
            title="Click or drag anywhere along the active pair bar to adjust angle ωt"
          >
            {activeSegments.map((seg, idx) => {
              const segSpan = seg.degEnd - seg.degStart;
              const widthPct = (segSpan / totalDeg) * 100;
              const isActive = (cursorDeg >= seg.degStart && cursorDeg < seg.degEnd);

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-center border-r border-slate-800/80 transition select-none ${
                    isActive
                      ? 'bg-purple-900/90 text-purple-100 font-bold ring-1 ring-purple-400'
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/80'
                  }`}
                  style={{
                    width: `${widthPct}%`
                  }}
                >
                  <span className="truncate px-0.5">{seg.pair}</span>
                </div>
              );
            })}

            {/* Glowing vertical cursor pin indicator over the Active Pair bar */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] pointer-events-none transform -translate-x-1/2"
              style={{
                left: `${(cursorDeg / totalDeg) * 100}%`
              }}
            />
          </div>
        </div>

        {/* ANGLE WT SLIDER */}
        <div className={`mt-2.5 flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl border ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-1.5 text-xs text-slate-200 shrink-0 font-mono">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Angle ωt:</span>
          </div>

          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={normAngle}
            onChange={(e) => setAngleDeg(Number(e.target.value))}
            className="flex-1 accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />

          <span className="font-mono text-cyan-400 font-bold text-xs shrink-0 w-16 text-right">
            {normAngle.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
};
