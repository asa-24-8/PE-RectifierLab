import { SimulationParams, MetricValues, WaveformDataPoint } from '../types';

export function calculateSimulation(
  params: SimulationParams,
  pointsCount: number = 360
): {
  waveforms: WaveformDataPoint[];
  metrics: MetricValues;
  instantaneousAt: (angleDeg: number) => {
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
} {
  const {
    phase,
    bridge,
    deviceSetup,
    alphaDeg,
    fwdConnected,
    loadType,
    R,
    L_mH,
    E_emf,
    vRms,
    gridFreq,
    switches: userSwitches
  } = params;

  const omega = 2 * Math.PI * gridFreq;
  const Vm = Math.SQRT2 * vRms;
  const L = Math.max(L_mH * 1e-3, 1e-6);
  const alphaRad = (alphaDeg * Math.PI) / 180;

  // Determine switch classifications
  const isAllDiodes =
    userSwitches.T1 === 'diode' &&
    userSwitches.T2 === 'diode' &&
    userSwitches.T3 === 'diode' &&
    userSwitches.T4 === 'diode';

  const isAllThyristors =
    userSwitches.T1 === 'thyristor' &&
    userSwitches.T2 === 'thyristor' &&
    userSwitches.T3 === 'thyristor' &&
    userSwitches.T4 === 'thyristor';

  // Positive conduction starts when forward biased AND triggered (if thyristor)
  const posHasThyristor = userSwitches.T1 === 'thyristor' || userSwitches.T2 === 'thyristor';
  const posStartAngle = posHasThyristor ? alphaRad : 0;

  // Negative conduction starts when forward biased AND triggered (if thyristor)
  const negHasThyristor = userSwitches.T3 === 'thyristor' || userSwitches.T4 === 'thyristor';
  const negStartAngle = negHasThyristor ? (Math.PI + alphaRad) : Math.PI;

  // Freewheeling action is active when external FWD is connected
  // This ensures toggling FWD instantly alters the output voltage between negative dipping and 0V clamping
  const freewheelActive = fwdConnected;

  // Discrete angle step
  const dTheta = (2 * Math.PI) / pointsCount;
  const dThetaDeg = 360 / pointsCount;

  // Arrays for 1 period [0, 2*pi)
  const voRaw: number[] = new Array(pointsCount).fill(0);
  const vsRaw: number[] = new Array(pointsCount).fill(0);
  const activePairs: string[] = new Array(pointsCount).fill('');
  const t1States: boolean[] = new Array(pointsCount).fill(false);
  const t2States: boolean[] = new Array(pointsCount).fill(false);
  const t3States: boolean[] = new Array(pointsCount).fill(false);
  const t4States: boolean[] = new Array(pointsCount).fill(false);

  for (let i = 0; i < pointsCount; i++) {
    const theta = i * dTheta;
    const vs = Vm * Math.sin(theta);
    vsRaw[i] = vs;

    if (phase === '1ph') {
      if (bridge === 'full') {
        if (isAllDiodes) {
          // Uncontrolled Diode Bridge: continuous rectified sine wave
          voRaw[i] = Math.abs(vs);
          if (vs >= 0) {
            activePairs[i] = 'D1 D2';
            t1States[i] = true;
            t2States[i] = true;
          } else {
            activePairs[i] = 'D3 D4';
            t3States[i] = true;
            t4States[i] = true;
          }
        } else if (freewheelActive) {
          // Converter with Freewheeling Diode (or Semi-Converter natural diode freewheeling)
          // 0 to posStartAngle: Freewheeling from negative half cycle
          // posStartAngle to pi: Positive pair conducts -> vo = vs
          // pi to negStartAngle: Freewheeling (FWD or T1+D4) -> vo = 0 clamped!
          // negStartAngle to 2pi: Negative pair conducts -> vo = -vs
          if (theta >= posStartAngle && theta < Math.PI) {
            voRaw[i] = Math.max(0, vs);
            activePairs[i] = `${userSwitches.T1 === 'thyristor' ? 'T1' : 'D1'} ${userSwitches.T2 === 'thyristor' ? 'T2' : 'D2'}`;
            t1States[i] = true;
            t2States[i] = true;
          } else if (theta >= Math.PI && theta < negStartAngle) {
            voRaw[i] = 0; // CLAMPED TO ZERO BY FREEWHEELING DIODE!
            if (fwdConnected) {
              activePairs[i] = 'D_FW';
            } else {
              activePairs[i] = 'T1 D4';
              t1States[i] = true;
              t4States[i] = true;
            }
          } else if (theta >= negStartAngle && theta < 2 * Math.PI) {
            voRaw[i] = Math.max(0, -vs);
            activePairs[i] = `${userSwitches.T3 === 'thyristor' ? 'T3' : 'D3'} ${userSwitches.T4 === 'thyristor' ? 'T4' : 'D4'}`;
            t3States[i] = true;
            t4States[i] = true;
          } else {
            // theta < posStartAngle (freewheeling from end of negative cycle)
            voRaw[i] = 0;
            if (fwdConnected) {
              activePairs[i] = 'D_FW';
            } else {
              activePairs[i] = 'D2 T3';
              t2States[i] = true;
              t3States[i] = true;
            }
          }
        } else {
          // Fully Controlled Converter WITHOUT Freewheeling Diode
          // With inductive load (RL/RLE), thyristors stay on until the opposite pair is fired!
          // Therefore, output voltage FOLLOWS vs INTO NEGATIVE VOLTAGE TERRITORY!
          if (loadType === 'R') {
            // Resistive load: current naturally drops to 0 at pi, so cannot conduct negative voltage
            if (theta >= posStartAngle && theta < Math.PI) {
              voRaw[i] = vs;
              activePairs[i] = 'T1 T2';
              t1States[i] = true;
              t2States[i] = true;
            } else if (theta >= negStartAngle && theta < 2 * Math.PI) {
              voRaw[i] = -vs;
              activePairs[i] = 'T3 T4';
              t3States[i] = true;
              t4States[i] = true;
            } else {
              voRaw[i] = 0;
              activePairs[i] = 'OFF';
            }
          } else {
            // RL / RLE Load: CONTINUOUS CONDUCTION WITH NEGATIVE VOLTAGE EXCURSIONS!
            if (theta >= posStartAngle && theta < negStartAngle) {
              // Conduction from alpha to pi + alpha: voltage goes negative from pi to pi + alpha!
              voRaw[i] = vs;
              activePairs[i] = 'T1 T2';
              t1States[i] = true;
              t2States[i] = true;
            } else {
              // Conduction from pi + alpha to 2pi + alpha: negative pair conducts
              voRaw[i] = -vs;
              activePairs[i] = 'T3 T4';
              t3States[i] = true;
              t4States[i] = true;
            }
          }
        }
      } else {
        // Half-Wave Converter
        if (theta >= posStartAngle && theta < (fwdConnected ? Math.PI : Math.PI + (alphaRad * 0.4))) {
          voRaw[i] = Math.max(0, vs);
          activePairs[i] = userSwitches.T1 === 'thyristor' ? 'T1' : 'D1';
          t1States[i] = true;
        } else {
          voRaw[i] = 0;
          activePairs[i] = fwdConnected ? 'D_FW' : 'OFF';
        }
      }
    } else {
      // 3-Phase 6-Pulse Converter
      const Vml = Math.sqrt(3) * Vm;
      const pulseIndex = Math.floor(((theta + Math.PI / 6 - alphaRad + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 3));
      const centerAngle = alphaRad + pulseIndex * (Math.PI / 3);
      const rippleVal = Vml * Math.cos(theta - centerAngle);
      voRaw[i] = (fwdConnected || deviceSetup === 'semi_conv') ? Math.max(0, rippleVal) : rippleVal;
      const pairs = ['T1 T2', 'T2 T3', 'T3 T4', 'T4 T5', 'T5 T6', 'T6 T1'];
      activePairs[i] = pairs[pulseIndex % 6];
    }
  }

  // Numerical Solution of Load Current io(theta)
  // L * omega * (di / dtheta) + R * i + E = vo(theta)
  const ioRaw: number[] = new Array(pointsCount).fill(0);
  let currentI = loadType === 'R' ? 0 : 5; // initial guess
  const dt = dTheta / omega;
  const numWarmupCycles = loadType === 'R' ? 1 : 6;

  for (let cycle = 0; cycle < numWarmupCycles; cycle++) {
    for (let i = 0; i < pointsCount; i++) {
      const vo = voRaw[i];
      const E = loadType === 'RLE' ? E_emf : 0;
      if (loadType === 'R') {
        currentI = Math.max(0, (vo - E) / R);
      } else {
        const di_dt = (vo - R * currentI - E) / L;
        currentI = Math.max(0, currentI + di_dt * dt);
      }
      if (cycle === numWarmupCycles - 1) {
        ioRaw[i] = currentI;
      }
    }
  }

  // Calculate Source Current is(theta)
  const isRaw: number[] = new Array(pointsCount).fill(0);
  for (let i = 0; i < pointsCount; i++) {
    const pair = activePairs[i];
    if (pair.includes('T1') && (pair.includes('T2') || pair.includes('D2')) || pair.includes('D1 D2')) {
      isRaw[i] = ioRaw[i];
    } else if (pair.includes('T3') && (pair.includes('T4') || pair.includes('D4')) || pair.includes('D3 D4')) {
      isRaw[i] = -ioRaw[i];
    } else {
      // Freewheeling (D_FW, T1 D4, D2 T3): source is bypassed, is = 0!
      isRaw[i] = 0;
    }
  }

  // Numerical Metrics
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumIsSq = 0;
  let sumP = 0;

  for (let i = 0; i < pointsCount; i++) {
    sumVo += voRaw[i];
    sumVoSq += voRaw[i] * voRaw[i];
    sumIo += ioRaw[i];
    sumIoSq += ioRaw[i] * ioRaw[i];
    sumIsSq += isRaw[i] * isRaw[i];
    sumP += voRaw[i] * ioRaw[i];
  }

  const vDcAvg = sumVo / pointsCount;
  const vRmsOut = Math.sqrt(sumVoSq / pointsCount);
  const iDcAvg = sumIo / pointsCount;
  const iRmsOut = Math.sqrt(sumIoSq / pointsCount);
  const iRmsSource = Math.sqrt(sumIsSq / pointsCount);
  const pLoad = sumP / pointsCount;
  const sIn = Math.max(vRms * iRmsSource, 1);
  const powerFactor = Math.min(1, Math.max(0, pLoad / sIn));
  const displacementFactor = Math.cos(alphaRad);
  const formFactor = vDcAvg > 0 ? vRmsOut / vDcAvg : 1;
  const rippleFactor = Math.sqrt(Math.max(0, formFactor * formFactor - 1));

  const minIo = Math.min(...ioRaw);
  const isContinuous = loadType !== 'R' && minIo > 0.15;

  const isFundamentalRms = iDcAvg > 0 ? (2 * Math.SQRT2 / Math.PI) * iDcAvg : 0.001;
  const thdCurrent = iRmsSource > isFundamentalRms
    ? (Math.sqrt(Math.max(0, iRmsSource * iRmsSource - isFundamentalRms * isFundamentalRms)) / isFundamentalRms) * 100
    : 17.9;

  // Theoretical ideal formula and value
  let idealVdcFormula = '';
  let idealVdcVal = 0;

  if (phase === '1ph') {
    if (bridge === 'full') {
      if (freewheelActive) {
        idealVdcFormula = 'Vdc = (Vm / π) · (1 + cos α)';
        idealVdcVal = (Vm / Math.PI) * (1 + Math.cos(alphaRad));
      } else if (isAllDiodes) {
        idealVdcFormula = 'Vdc = (2 · Vm / π)';
        idealVdcVal = (2 * Vm) / Math.PI;
      } else {
        idealVdcFormula = 'Vdc = (2 · Vm / π) · cos α';
        idealVdcVal = (2 * Vm / Math.PI) * Math.cos(alphaRad);
      }
    } else {
      idealVdcFormula = 'Vdc = (Vm / 2π) · (1 + cos α)';
      idealVdcVal = (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
    }
  } else {
    const Vml = Math.sqrt(3) * Vm;
    idealVdcFormula = 'Vdc = (3 · Vml / π) · cos α';
    idealVdcVal = (3 * Vml / Math.PI) * Math.cos(alphaRad);
  }

  // Waveform Array
  const waveforms: WaveformDataPoint[] = [];
  for (let i = 0; i < pointsCount; i++) {
    const thetaDeg = i * dThetaDeg;
    const thetaRad = i * dTheta;
    const isGate = (Math.abs(thetaDeg - alphaDeg) < 8) || (Math.abs(thetaDeg - (180 + alphaDeg)) < 8);
    waveforms.push({
      thetaDeg,
      thetaRad,
      vs: vsRaw[i],
      vo: voRaw[i],
      io: ioRaw[i],
      is: isRaw[i],
      gatePulse: isGate,
      activePair: activePairs[i]
    });
  }

  const metrics: MetricValues = {
    vDcAvg,
    vRmsOut,
    iDcAvg,
    iRmsOut,
    pLoad,
    sIn,
    powerFactor,
    displacementFactor,
    rippleFactor,
    formFactor,
    thdCurrent,
    isContinuous,
    idealVdcFormula,
    idealVdcVal,
    activePairLabel: ''
  };

  const instantaneousAt = (angleDeg: number) => {
    const normAngle = ((angleDeg % 360) + 360) % 360;
    const idx = Math.min(pointsCount - 1, Math.max(0, Math.floor((normAngle / 360) * pointsCount)));
    const pt = waveforms[idx];

    let loopDesc = '';
    if (pt.activePair === 'D_FW') {
      loopDesc = 'Freewheeling Diode Clamping (D_FW)';
    } else if (pt.activePair.includes('T1 D4') || pt.activePair.includes('D2 T3')) {
      loopDesc = `Semi-Converter Freewheeling (${pt.activePair})`;
    } else if (pt.activePair.includes('T1') || pt.activePair.includes('D1')) {
      loopDesc = `Positive Half Cycle Conduction (${pt.activePair})`;
    } else if (pt.activePair.includes('T3') || pt.activePair.includes('D3')) {
      loopDesc = `Negative Half Cycle Conduction (${pt.activePair})`;
    } else {
      loopDesc = 'Load Freewheeling / Discontinuous';
    }

    return {
      vs: pt.vs,
      vo: pt.vo,
      io: pt.io,
      is: pt.is,
      activePair: pt.activePair,
      loopDescription: loopDesc,
      switches: {
        T1: t1States[idx],
        T2: t2States[idx],
        T3: t3States[idx],
        T4: t4States[idx]
      }
    };
  };

  return { waveforms, metrics, instantaneousAt };
}
