import React from 'react';
import {
  Zap,
  Sun,
  Moon,
  Maximize2,
  Calculator,
  Bookmark,
  BookOpen,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  openModal: (modal: 'derivations' | 'presets' | 'theory' | null) => void;
  resetAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  openModal,
  resetAll
}) => {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <header className={`border-b sticky top-0 z-30 px-4 sm:px-6 py-3 backdrop-blur transition-colors ${
      darkMode ? 'border-slate-800 bg-[#080d1a]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>RectifierLab</h1>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                darkMode ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
              }`}>
                Power Electronics Studio
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Interactive Single-Phase & Three-Phase Diode/Thyristor Bridge Converter Simulation
              </p>
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                darkMode
                  ? 'bg-cyan-950/70 border-cyan-800/80 text-slate-300'
                  : 'bg-cyan-50/90 border-cyan-200 text-slate-700 shadow-xs'
              }`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Student:</span>
                <span className={darkMode ? 'text-cyan-300 font-semibold' : 'text-cyan-700 font-semibold'}>Ashley Sheldon</span>
                <span className={darkMode ? 'text-slate-600' : 'text-slate-400'}>•</span>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Roll No:</span>
                <span className={darkMode ? 'text-amber-300 font-semibold' : 'text-amber-700 font-semibold'}>24EE10041</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-xs ${
              darkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Full Screen Studio */}
          <button
            onClick={toggleFullScreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-500" />
            <span>Full Screen Studio</span>
          </button>

          {/* Waveform Analysis & Derivations (Highlighted Golden) */}
          <button
            onClick={() => openModal('derivations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition cursor-pointer ${
              darkMode
                ? 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/50'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
            }`}
          >
            <Calculator className={`w-3.5 h-3.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <span>Waveform Analysis & Derivations</span>
          </button>

          {/* Presets */}
          <button
            onClick={() => openModal('presets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
            <span>Presets</span>
          </button>

          {/* Theory */}
          <button
            onClick={() => openModal('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>Theory</span>
          </button>

          {/* Reset All */}
          <button
            onClick={resetAll}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              darkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border-slate-200'
            }`}
            title="Reset Everything"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
