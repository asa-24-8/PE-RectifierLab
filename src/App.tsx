import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SimulationParams } from './types';
import { calculateSimulation } from './utils/physics';
import { Header } from './components/Header';
import { SchematicDiagram } from './components/SchematicDiagram';
import { Oscilloscope } from './components/Oscilloscope';
import { Controls } from './components/Controls';
import { MetricsBar } from './components/MetricsBar';
import { FormulaCard } from './components/FormulaCard';
import { DerivationsModal } from './components/DerivationsModal';
import { PresetsModal } from './components/PresetsModal';
import { TheoryModal } from './components/TheoryModal';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<'derivations' | 'presets' | 'theory' | null>(null);

  // Initial parameters calibrated to match the user's screenshot
  const [params, setParams] = useState<SimulationParams>({
    phase: '1ph',
    bridge: 'full',
    deviceSetup: 'semi_conv',
    alphaDeg: 45,
    fwdConnected: false,
    loadType: 'RL',
    R: 20,
    L_mH: 45,
    E_emf: 24,
    vRms: 230,
    gridFreq: 50,
    switches: {
      T1: 'thyristor',
      T2: 'diode',
      T3: 'thyristor',
      T4: 'diode'
    }
  });

  // Playback state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.4);
  const [angleDeg, setAngleDeg] = useState<number>(206); // exact 206.0° from screenshot 1

  // Sync document root class with theme for complete light/dark coverage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Simulation numerical calculation
  const { waveforms, metrics, instantaneousAt } = useMemo(() => {
    return calculateSimulation(params, 360);
  }, [params]);

  // Instantaneous state at current cursor angle
  const instantState = useMemo(() => {
    return instantaneousAt(angleDeg);
  }, [instantaneousAt, angleDeg]);

  // Animation frame loop
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let animId: number;
    const animate = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isRunning) {
        setAngleDeg((prev) => {
          const degAdvance = speed * 120 * dt;
          return (prev + degAdvance) % 360;
        });
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, speed]);

  const stepAngle = (delta: number) => {
    setAngleDeg((prev) => ((prev + delta) % 360 + 360) % 360);
  };

  const resetAngle = () => {
    setAngleDeg(0);
  };

  const resetAll = () => {
    setParams({
      phase: '1ph',
      bridge: 'full',
      deviceSetup: 'semi_conv',
      alphaDeg: 45,
      fwdConnected: false,
      loadType: 'RL',
      R: 20,
      L_mH: 45,
      E_emf: 24,
      vRms: 230,
      gridFreq: 50,
      switches: {
        T1: 'thyristor',
        T2: 'diode',
        T3: 'thyristor',
        T4: 'diode'
      }
    });
    setSpeed(1.4);
    setAngleDeg(206);
    setIsRunning(false);
  };

  const applyPreset = (patch: Partial<SimulationParams>) => {
    setParams((prev) => ({
      ...prev,
      ...patch,
      switches: patch.switches || prev.switches
    }));
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      darkMode ? 'bg-[#070c1a] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* App Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        openModal={setModalOpen}
        resetAll={resetAll}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* ROW 1: Circuit Schematic (Left) & Oscilloscope (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Circuit Schematic Diagram (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <SchematicDiagram
              params={params}
              setParams={setParams}
              instantState={instantState}
              angleDeg={angleDeg}
              darkMode={darkMode}
            />
          </div>

          {/* Oscilloscope Waveforms (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <Oscilloscope
              waveforms={waveforms}
              metrics={metrics}
              angleDeg={angleDeg}
              setAngleDeg={setAngleDeg}
              vPeakMax={375}
              iPeakMax={17}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* ROW 2: Playback Bar & 3 Parameter Control Cards */}
        <Controls
          params={params}
          setParams={setParams}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          speed={speed}
          setSpeed={setSpeed}
          stepAngle={stepAngle}
          resetAngle={resetAngle}
          darkMode={darkMode}
        />

        {/* ROW 3: 6 Analytical Metric Cards */}
        <MetricsBar metrics={metrics} darkMode={darkMode} />

        {/* ROW 4: Theoretical Equation & Ideal Vdc Card */}
        <FormulaCard params={params} metrics={metrics} darkMode={darkMode} />
      </main>

      {/* Footer */}
      <footer className={`border-t py-3 px-6 text-center text-xs font-mono transition-colors ${
        darkMode ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-600 bg-white'
      }`}>
        RectifierLab • Interactive Power Electronics Studio • Replicated for Power Electronics Theory Aut 26-27 (DDN, AH)
      </footer>

      {/* Modals */}
      <DerivationsModal
        isOpen={modalOpen === 'derivations'}
        onClose={() => setModalOpen(null)}
        liveParams={params}
        darkMode={darkMode}
      />
      <PresetsModal
        isOpen={modalOpen === 'presets'}
        onClose={() => setModalOpen(null)}
        applyPreset={applyPreset}
        darkMode={darkMode}
      />
      <TheoryModal
        isOpen={modalOpen === 'theory'}
        onClose={() => setModalOpen(null)}
        darkMode={darkMode}
      />
    </div>
  );
}
