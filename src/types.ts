export type PhaseType = '1ph' | '3ph';
export type BridgeType = 'full' | 'half';
export type DeviceSetup = 'all_diodes' | 'all_thyristors' | 'semi_conv';
export type LoadType = 'R' | 'RL' | 'RLE';

export interface SwitchState {
  id: string;
  name: string;
  label: string;
  type: 'diode' | 'thyristor'; // user can toggle
  isOn: boolean;
  position: 'top-left' | 'bot-left' | 'top-right' | 'bot-right';
}

export interface SimulationParams {
  phase: PhaseType;
  bridge: BridgeType;
  deviceSetup: DeviceSetup;
  alphaDeg: number; // firing angle
  fwdConnected: boolean; // freewheeling diode
  loadType: LoadType;
  R: number; // Resistance (ohms)
  L_mH: number; // Inductance (mH)
  E_emf: number; // Back EMF (V)
  vRms: number; // Source RMS (V)
  gridFreq: number; // 50Hz or 60Hz
  switches: {
    T1: 'diode' | 'thyristor';
    T2: 'diode' | 'thyristor';
    T3: 'diode' | 'thyristor';
    T4: 'diode' | 'thyristor';
  };
}

export interface MetricValues {
  vDcAvg: number;
  vRmsOut: number;
  iDcAvg: number;
  iRmsOut: number;
  pLoad: number;
  sIn: number;
  powerFactor: number;
  displacementFactor: number;
  rippleFactor: number;
  formFactor: number;
  thdCurrent: number;
  isContinuous: boolean;
  idealVdcFormula: string;
  idealVdcVal: number;
  activePairLabel: string;
}

export interface WaveformDataPoint {
  thetaDeg: number;
  thetaRad: number;
  vs: number;
  vo: number;
  io: number;
  is: number;
  gatePulse: boolean;
  activePair: string;
}
