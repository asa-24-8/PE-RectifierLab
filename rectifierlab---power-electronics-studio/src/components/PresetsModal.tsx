import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, Zap, CheckCircle2, Sliders, Filter } from 'lucide-react';
import { SimulationParams } from '../types';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applyPreset: (patch: Partial<SimulationParams>) => void;
  darkMode?: boolean;
}

type PresetCategory = 'all' | '1ph' | '3ph' | 'controlled' | 'uncontrolled' | 'special';

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  applyPreset,
  darkMode = true
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<PresetCategory>('all');

  const presets = [
    {
      id: '1ph_diode_rl',
      category: '1ph',
      isControlled: false,
      badge: '1Φ Uncontrolled Diode Bridge',
      alphaLabel: 'α = 0° (Natural)',
      title: '1-Phase Diode Bridge (RL Load)',
      description: 'Full-wave 4-diode rectifier with highly inductive filter creating smooth continuous DC load current.',
      specText: 'RL Load • R = 20Ω, L = 40mH • Vs = 230V RMS',
      patch: {
        phase: '1ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'all_diodes' as const,
        switches: { T1: 'diode' as const, T2: 'diode' as const, T3: 'diode' as const, T4: 'diode' as const },
        alphaDeg: 0,
        fwdConnected: false,
        loadType: 'RL' as const,
        R: 20,
        L_mH: 40,
        E_emf: 0,
        vRms: 230
      }
    },
    {
      id: '1ph_fully_controlled',
      category: '1ph',
      isControlled: true,
      badge: '1Φ Controlled Bridge',
      alphaLabel: 'α = 45°',
      title: '1-Phase Fully Controlled Converter (CCM)',
      description: '4-Thyristor full converter allowing wide-range DC voltage control. Inductor current maintains conduction into negative territory without FWD.',
      specText: 'RL Load • R = 20Ω, L = 50mH • Vs = 230V RMS',
      patch: {
        phase: '1ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'all_thyristors' as const,
        switches: { T1: 'thyristor' as const, T2: 'thyristor' as const, T3: 'thyristor' as const, T4: 'thyristor' as const },
        alphaDeg: 45,
        fwdConnected: false,
        loadType: 'RL' as const,
        R: 20,
        L_mH: 50,
        E_emf: 0,
        vRms: 230
      }
    },
    {
      id: '1ph_semi_fwd',
      category: '1ph',
      isControlled: true,
      badge: '1Φ Semi-Converter + FWD',
      alphaLabel: 'α = 60°',
      title: '1-Phase Semi-Converter with Freewheeling Diode',
      description: '2 Thyristors (top) + 2 Diodes (bottom) paired with external FWD. Eliminates negative voltage spikes and maximizes input power factor.',
      specText: 'RL Load • R = 15Ω, L = 60mH • FWD Active',
      patch: {
        phase: '1ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'semi_conv' as const,
        switches: { T1: 'thyristor' as const, T2: 'diode' as const, T3: 'thyristor' as const, T4: 'diode' as const },
        alphaDeg: 60,
        fwdConnected: true,
        loadType: 'RL' as const,
        R: 15,
        L_mH: 60,
        E_emf: 0,
        vRms: 230
      }
    },
    {
      id: '1ph_pure_r',
      category: '1ph',
      isControlled: true,
      badge: '1Φ Resistive Baseline',
      alphaLabel: 'α = 30°',
      title: '1-Phase Controlled Rectifier (Pure R Load)',
      description: 'Resistive load benchmark where load current naturally drops to zero at π (180°), producing discontinuous output voltage.',
      specText: 'Pure R Load • R = 25Ω, L = 0mH • Vs = 230V RMS',
      patch: {
        phase: '1ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'all_thyristors' as const,
        switches: { T1: 'thyristor' as const, T2: 'thyristor' as const, T3: 'thyristor' as const, T4: 'thyristor' as const },
        alphaDeg: 30,
        fwdConnected: false,
        loadType: 'R' as const,
        R: 25,
        L_mH: 0,
        E_emf: 0,
        vRms: 230
      }
    },
    {
      id: '3ph_diode_bridge',
      category: '3ph',
      isControlled: false,
      badge: '3Φ 6-Pulse Diode Bridge',
      alphaLabel: 'α = 0° (Natural)',
      title: '3-Phase 6-Pulse Diode Bridge Rectifier',
      description: 'Industry workhorse uncontrolled 6-diode rectifier with 300Hz fundamental ripple frequency and exceptional 4.2% low voltage ripple factor.',
      specText: 'RL Load • R = 25Ω, L = 30mH • Line-to-Line 400V',
      patch: {
        phase: '3ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'all_diodes' as const,
        switches: { T1: 'diode' as const, T2: 'diode' as const, T3: 'diode' as const, T4: 'diode' as const },
        alphaDeg: 0,
        fwdConnected: false,
        loadType: 'RL' as const,
        R: 25,
        L_mH: 30,
        E_emf: 0,
        vRms: 230
      }
    },
    {
      id: '3ph_fully_controlled',
      category: '3ph',
      isControlled: true,
      badge: '3Φ 6-Pulse Controlled',
      alphaLabel: 'α = 30°',
      title: '3-Phase Fully Controlled Converter (6 Thyristors)',
      description: '6-Thyristor bridge providing precise voltage regulation for large industrial DC drives and variable frequency drive (VFD) front-ends.',
      specText: 'RL Load • R = 25Ω, L = 45mH • Line-to-Line 400V',
      patch: {
        phase: '3ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'all_thyristors' as const,
        switches: { T1: 'thyristor' as const, T2: 'thyristor' as const, T3: 'thyristor' as const, T4: 'thyristor' as const },
        alphaDeg: 30,
        fwdConnected: false,
        loadType: 'RL' as const,
        R: 25,
        L_mH: 45,
        E_emf: 0,
        vRms: 230
      }
    },
    {
      id: '3ph_semi_conv',
      category: '3ph',
      isControlled: true,
      badge: '3Φ Semi-Converter (3T + 3D)',
      alphaLabel: 'α = 45°',
      title: '3-Phase Semi-Converter Bridge',
      description: 'Economic 3-Thyristor + 3-Diode bridge with inherent freewheeling action preventing negative voltage output across all firing angles.',
      specText: 'RL Load • R = 20Ω, L = 40mH • Line-to-Line 400V',
      patch: {
        phase: '3ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'semi_conv' as const,
        switches: { T1: 'thyristor' as const, T2: 'diode' as const, T3: 'thyristor' as const, T4: 'diode' as const },
        alphaDeg: 45,
        fwdConnected: false,
        loadType: 'RL' as const,
        R: 20,
        L_mH: 40,
        E_emf: 0,
        vRms: 230
      }
    },
    {
      id: 'rle_battery_drive',
      category: 'special',
      isControlled: true,
      badge: 'RLE DC Motor / Battery Drive',
      alphaLabel: 'α = 30°',
      title: 'Active Back-EMF Load (DC Motor Drive / Battery Charger)',
      description: 'Controlled converter driving an active Back-EMF load (E = 80V DC). Thyristors trigger only when supply voltage exceeds counter EMF.',
      specText: 'RLE Load • R = 10Ω, L = 50mH, E = 80V Back-EMF',
      patch: {
        phase: '1ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'all_thyristors' as const,
        switches: { T1: 'thyristor' as const, T2: 'thyristor' as const, T3: 'thyristor' as const, T4: 'thyristor' as const },
        alphaDeg: 30,
        fwdConnected: false,
        loadType: 'RLE' as const,
        R: 10,
        L_mH: 50,
        E_emf: 80,
        vRms: 230
      }
    },
    {
      id: 'inversion_mode_regeneration',
      category: 'special',
      isControlled: true,
      badge: 'Line-Commutated Inverter Mode',
      alphaLabel: 'α = 120° (Inversion)',
      title: 'Regenerative Inverter Mode (Power Flow Back to AC Grid)',
      description: 'Two-quadrant converter operating with α > 90° and active Back-EMF (E = 120V). Average DC voltage becomes negative, transferring power from DC into the AC mains.',
      specText: 'RLE Load • R = 8Ω, L = 80mH, E = 120V DC Source',
      patch: {
        phase: '1ph' as const,
        bridge: 'full' as const,
        deviceSetup: 'all_thyristors' as const,
        switches: { T1: 'thyristor' as const, T2: 'thyristor' as const, T3: 'thyristor' as const, T4: 'thyristor' as const },
        alphaDeg: 120,
        fwdConnected: false,
        loadType: 'RLE' as const,
        R: 8,
        L_mH: 80,
        E_emf: 120,
        vRms: 230
      }
    },
    {
      id: '1ph_half_wave_fwd',
      category: '1ph',
      isControlled: true,
      badge: '1Φ Half-Wave + FWD',
      alphaLabel: 'α = 30°',
      title: '1-Phase Half-Wave Controlled Rectifier with FWD',
      description: 'Single-switch demonstration showing inductor energy freewheeling commutation and discharge across D_FW during the negative supply half-cycle.',
      specText: 'RL Load • R = 15Ω, L = 35mH • FWD Active',
      patch: {
        phase: '1ph' as const,
        bridge: 'half' as const,
        deviceSetup: 'all_thyristors' as const,
        switches: { T1: 'thyristor' as const, T2: 'diode' as const, T3: 'thyristor' as const, T4: 'diode' as const },
        alphaDeg: 30,
        fwdConnected: true,
        loadType: 'RL' as const,
        R: 15,
        L_mH: 35,
        E_emf: 0,
        vRms: 230
      }
    }
  ];

  const filteredPresets = presets.filter((p) => {
    if (category === 'all') return true;
    if (category === '1ph') return p.category === '1ph';
    if (category === '3ph') return p.category === '3ph';
    if (category === 'controlled') return p.isControlled;
    if (category === 'uncontrolled') return !p.isControlled;
    if (category === 'special') return p.category === 'special';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className={`border w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
        darkMode ? 'bg-[#080e1e] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-start justify-between p-5 border-b ${
          darkMode ? 'border-slate-800/80 bg-[#0b1328]/70' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Standard Converter Presets
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Power Electronics Curricula
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                One-click standard bench setups for single-phase, three-phase, semi-converters, and regenerative drives.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className={`p-3 border-b flex items-center gap-1.5 overflow-x-auto ${
          darkMode ? 'border-slate-800/80 bg-[#091124]/40' : 'border-slate-200 bg-slate-100/60'
        }`}>
          <div className="flex items-center gap-1 text-xs text-slate-400 mr-2 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          {(
            [
              { id: 'all', label: 'All Presets' },
              { id: '1ph', label: 'Single-Phase (1Φ)' },
              { id: '3ph', label: 'Three-Phase (3Φ)' },
              { id: 'controlled', label: 'Controlled (Thyristors)' },
              { id: 'uncontrolled', label: 'Uncontrolled (Diodes)' },
              { id: 'special', label: 'RLE & Regeneration' }
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                category === item.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : darkMode
                    ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 2-Column Grid of Presets */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all duration-150 ${
                  darkMode
                    ? 'bg-[#0d1629] border-slate-800/90 hover:border-cyan-500/40 shadow-lg'
                    : 'bg-slate-50 border-slate-200 hover:border-cyan-400 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {preset.badge}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      {preset.alphaLabel}
                    </span>
                  </div>

                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {preset.title}
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {preset.specText}
                  </span>
                  <button
                    onClick={() => {
                      applyPreset(preset.patch);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm shrink-0"
                  >
                    <span>Load Preset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
