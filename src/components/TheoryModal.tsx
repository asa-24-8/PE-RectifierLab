import React from 'react';
import { X, BookOpen, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose, darkMode = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
        darkMode ? 'bg-[#0b1329] border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Power Electronics Theory Reference
              </h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Operating principles, commutation physics & circuit topologies
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          <div className={`p-4 rounded-xl border space-y-2 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
              <Layers className="w-4 h-4" />
              1. Converter Quadrants of Operation
            </h4>
            <p className="leading-relaxed">
              <strong>Single-Quadrant (Semi-Converters / Converters with FWD):</strong> Operates only in the 1st quadrant (V_dc &gt; 0, I_dc &gt; 0). The freewheeling diode prevents the output voltage from ever turning negative. Power flows strictly from the AC grid to the DC load.
            </p>
            <p className="leading-relaxed">
              <strong>Two-Quadrant (Fully-Controlled Bridge Converters):</strong> Operates in the 1st and 4th quadrants. Current I_dc is strictly unidirectional due to the thyristors, but voltage V_dc can be continuously varied from positive to negative by controlling the firing angle α from 0° to nearly 180°.
            </p>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              2. Freewheeling Diode (FWD) Advantages
            </h4>
            <ul className={`list-disc pl-5 space-y-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <li>Clamps negative inductive voltage spikes across the load to 0V.</li>
              <li>Improves output waveform form factor and reduces current ripple.</li>
              <li>Increases displacement power factor and total system power factor.</li>
              <li>Transfers energy stored in the load inductor through the diode instead of returning it through the AC source.</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
              <AlertCircle className="w-4 h-4 text-rose-500" />
              3. Continuous vs Discontinuous Conduction Mode (CCM vs DCM)
            </h4>
            <p className="leading-relaxed">
              In Continuous Conduction Mode (CCM), the inductor is sufficiently large such that load current i_o(t) never decays to zero before the next firing pulse. In Discontinuous Conduction Mode (DCM), the current drops to zero at extinction angle β &lt; π + α, causing the terminal voltage to float to the back-EMF value until the next thyristor trigger.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end ${
          darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
