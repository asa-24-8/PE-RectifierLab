import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Calculator,
  RefreshCw,
  TrendingUp,
  Table,
  Cpu,
  Sliders,
  ArrowRight,
  BookOpen,
  Sigma,
  Zap,
  Activity,
  CheckCircle2,
  Layers,
  Crosshair
} from 'lucide-react';
import { SimulationParams } from '../types';

interface DerivationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveParams?: SimulationParams;
  darkMode?: boolean;
}

export type ConverterCaseKey =
  | '1ph_full_continuous'
  | '1ph_full_r_fwd'
  | '1ph_full_dcm'
  | '1ph_semi'
  | '1ph_half_rl_beta'
  | '1ph_half_diode_beta'
  | '1ph_half_r'
  | '3ph_full_6pulse'
  | '3ph_semi_3t3d'
  | '3ph_diode_6pulse'
  | '3ph_half_3pulse';

// Helper component to render mathematical fractions with a real horizontal bar
export const MathFrac: React.FC<{
  num: React.ReactNode;
  den: React.ReactNode;
  className?: string;
}> = ({ num, den, className = '' }) => (
  <span className={`inline-flex flex-col items-center justify-center align-middle mx-1 text-center leading-tight ${className}`}>
    <span className="border-b border-current pb-0.5 px-1">{num}</span>
    <span className="pt-0.5 px-1">{den}</span>
  </span>
);

export const DerivationsModal: React.FC<DerivationsModalProps> = ({
  isOpen,
  onClose,
  liveParams,
  darkMode = true
}) => {
  if (!isOpen) return null;

  // Active top tab: Derivations & Calculus | Live Substitution | Formula Summary Table
  const [activeTab, setActiveTab] = useState<'derivations' | 'live_sub' | 'summary'>('derivations');

  // Selected converter case (matching screenshot options exactly)
  const [selectedCase, setSelectedCase] = useState<ConverterCaseKey>('1ph_full_r_fwd');

  // Custom evaluation parameters (defaults or synced from live circuit)
  const [evalVs, setEvalVs] = useState<number>(liveParams?.vRms || 230);
  const [evalAlpha, setEvalAlpha] = useState<number>(liveParams?.alphaDeg ?? 45);
  const [evalR, setEvalR] = useState<number>(liveParams?.R || 20);
  const [evalL, setEvalL] = useState<number>(liveParams?.L_mH || 40);
  const [evalE, setEvalE] = useState<number>(liveParams?.E_emf || 0);

  // Interactive Cursor position on the Annotated Output Voltage Waveform (in radians from 0 to 4π = 720°)
  const [waveformCursorTheta, setWaveformCursorTheta] = useState<number>((45 * Math.PI) / 180);
  const [isWaveformDragging, setIsWaveformDragging] = useState<boolean>(false);

  // Sync Live Circuit action
  const syncLiveCircuit = () => {
    if (!liveParams) return;
    setEvalVs(liveParams.vRms);
    setEvalAlpha(liveParams.alphaDeg);
    setEvalR(liveParams.R);
    setEvalL(liveParams.L_mH);
    setEvalE(liveParams.E_emf);

    if (liveParams.phase === '3ph') {
      if (liveParams.deviceSetup === 'all_diodes') setSelectedCase('3ph_diode_6pulse');
      else if (liveParams.deviceSetup === 'semi_conv') setSelectedCase('3ph_semi_3t3d');
      else if (liveParams.bridge === 'half') setSelectedCase('3ph_half_3pulse');
      else setSelectedCase('3ph_full_6pulse');
    } else {
      if (liveParams.bridge === 'half') {
        if (liveParams.loadType === 'R') setSelectedCase('1ph_half_r');
        else if (liveParams.deviceSetup === 'all_diodes') setSelectedCase('1ph_half_diode_beta');
        else setSelectedCase('1ph_half_rl_beta');
      } else if (liveParams.deviceSetup === 'semi_conv') {
        setSelectedCase('1ph_semi');
      } else if (liveParams.fwdConnected || liveParams.loadType === 'R') {
        setSelectedCase('1ph_full_r_fwd');
      } else {
        setSelectedCase('1ph_full_continuous');
      }
    }
  };

  // Case definitions with numerical values and formulas
  const caseData = useMemo(() => {
    const Vm = Math.SQRT2 * evalVs;
    const alphaRad = (evalAlpha * Math.PI) / 180;
    const betaDeg = Math.min(225, Math.max(185, 180 + evalAlpha * 0.45));
    const betaRad = (betaDeg * Math.PI) / 180;

    let T0_str = 'π';
    let vdcVal = 0;
    let vrmsVal = 0;
    let integralUpper = Math.PI;
    let integralLower = alphaRad;
    let isClampedToZero = true;

    // Mathematical formula components for upper half cards
    let vdcFormulaComponent: React.ReactNode = null;
    let vrmsFormulaComponent: React.ReactNode = null;

    switch (selectedCase) {
      case '1ph_full_continuous':
        T0_str = 'π';
        vdcVal = (2 * Vm / Math.PI) * Math.cos(alphaRad);
        vrmsVal = Vm / Math.SQRT2;
        integralLower = alphaRad;
        integralUpper = Math.PI + alphaRad;
        isClampedToZero = false;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>2 · V<sub>m</sub></>} den="π" /> · cos α
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = <MathFrac num={<>V<sub>m</sub></>} den="√2" /> = V<sub>s,rms</sub>
          </span>
        );
        break;

      case '1ph_full_r_fwd':
        T0_str = 'π';
        vdcVal = (Vm / Math.PI) * (1 + Math.cos(alphaRad));
        vrmsVal = (Vm / Math.SQRT2) * Math.sqrt(Math.max(0, 1 - (alphaRad / Math.PI) + (Math.sin(2 * alphaRad) / (2 * Math.PI))));
        integralLower = alphaRad;
        integralUpper = Math.PI;
        isClampedToZero = true;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>V<sub>m</sub></>} den="π" /> · (1 + cos α)
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = <MathFrac num={<>V<sub>m</sub></>} den="√2" /> · √[ 1 - <MathFrac num="α" den="π" /> + <MathFrac num="sin 2α" den="2π" /> ]
          </span>
        );
        break;

      case '1ph_full_dcm':
        T0_str = 'π';
        vdcVal = (Vm / Math.PI) * (Math.cos(alphaRad) - Math.cos(betaRad));
        vrmsVal = (Vm / Math.sqrt(2 * Math.PI)) * Math.sqrt(Math.max(0, (betaRad - alphaRad) - 0.5 * (Math.sin(2 * betaRad) - Math.sin(2 * alphaRad))));
        integralLower = alphaRad;
        integralUpper = betaRad;
        isClampedToZero = true;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>V<sub>m</sub></>} den="π" /> · (cos α - cos β)
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = <MathFrac num={<>V<sub>m</sub></>} den="√2π" /> · √[ (β - α) - <MathFrac num={<>sin 2β - sin 2α</>} den="2" /> ]
          </span>
        );
        break;

      case '1ph_semi':
        T0_str = 'π';
        vdcVal = (Vm / Math.PI) * (1 + Math.cos(alphaRad));
        vrmsVal = (Vm / Math.SQRT2) * Math.sqrt(Math.max(0, 1 - (alphaRad / Math.PI) + (Math.sin(2 * alphaRad) / (2 * Math.PI))));
        integralLower = alphaRad;
        integralUpper = Math.PI;
        isClampedToZero = true;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>V<sub>m</sub></>} den="π" /> · (1 + cos α)
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = <MathFrac num={<>V<sub>m</sub></>} den="√2" /> · √[ 1 - <MathFrac num="α" den="π" /> + <MathFrac num="sin 2α" den="2π" /> ]
          </span>
        );
        break;

      case '1ph_half_rl_beta':
        T0_str = '2π';
        vdcVal = (Vm / (2 * Math.PI)) * (Math.cos(alphaRad) - Math.cos(betaRad));
        vrmsVal = (Vm / (2 * Math.sqrt(Math.PI))) * Math.sqrt(Math.max(0, (betaRad - alphaRad) - 0.5 * (Math.sin(2 * betaRad) - Math.sin(2 * alphaRad))));
        integralLower = alphaRad;
        integralUpper = betaRad;
        isClampedToZero = true;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>V<sub>m</sub></>} den="2π" /> · (cos α - cos β)
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = <MathFrac num={<>V<sub>m</sub></>} den="2√π" /> · √[ (β - α) - <MathFrac num={<>sin 2β - sin 2α</>} den="2" /> ]
          </span>
        );
        break;

      case '1ph_half_diode_beta':
        T0_str = '2π';
        vdcVal = (Vm / (2 * Math.PI)) * (1 - Math.cos(betaRad));
        vrmsVal = (Vm / (2 * Math.sqrt(Math.PI))) * Math.sqrt(Math.max(0, betaRad - 0.5 * Math.sin(2 * betaRad)));
        integralLower = 0;
        integralUpper = betaRad;
        isClampedToZero = true;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>V<sub>m</sub></>} den="2π" /> · (1 - cos β)
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = <MathFrac num={<>V<sub>m</sub></>} den="2√π" /> · √[ β - <MathFrac num="sin 2β" den="2" /> ]
          </span>
        );
        break;

      case '1ph_half_r':
        T0_str = '2π';
        vdcVal = (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
        vrmsVal = (Vm / 2) * Math.sqrt(Math.max(0, 1 - (alphaRad / Math.PI) + (Math.sin(2 * alphaRad) / (2 * Math.PI))));
        integralLower = alphaRad;
        integralUpper = Math.PI;
        isClampedToZero = true;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>V<sub>m</sub></>} den="2π" /> · (1 + cos α)
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = <MathFrac num={<>V<sub>m</sub></>} den="2" /> · √[ 1 - <MathFrac num="α" den="π" /> + <MathFrac num="sin 2α" den="2π" /> ]
          </span>
        );
        break;

      case '3ph_full_6pulse': {
        const Vm_LL = Math.sqrt(3) * Vm;
        T0_str = 'π / 3';
        vdcVal = (3 * Vm_LL / Math.PI) * Math.cos(alphaRad);
        vrmsVal = Vm_LL * Math.sqrt(Math.max(0, 0.5 + ((3 * Math.sqrt(3)) / (4 * Math.PI)) * Math.cos(2 * alphaRad)));
        integralLower = alphaRad - Math.PI / 6;
        integralUpper = alphaRad + Math.PI / 6;
        isClampedToZero = false;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>3 · V<sub>m,LL</sub></>} den="π" /> · cos α
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = V<sub>m,LL</sub> · √[ <MathFrac num="1" den="2" /> + <MathFrac num={<>3√3</>} den="4π" /> · cos 2α ]
          </span>
        );
        break;
      }

      case '3ph_semi_3t3d': {
        const Vm_LL = Math.sqrt(3) * Vm;
        T0_str = 'π / 3';
        vdcVal = (3 * Vm_LL / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
        vrmsVal = Vm_LL * Math.sqrt(Math.max(0, (3 / (4 * Math.PI)) * ((Math.PI - alphaRad) + 0.5 * Math.sin(2 * alphaRad))));
        integralLower = alphaRad;
        integralUpper = Math.PI;
        isClampedToZero = true;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>3 · V<sub>m,LL</sub></>} den="2π" /> · (1 + cos α)
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = V<sub>m,LL</sub> · √[ <MathFrac num="3" den="4π" /> · ((π - α) + <MathFrac num="sin 2α" den="2" />) ]
          </span>
        );
        break;
      }

      case '3ph_diode_6pulse': {
        const Vm_LL = Math.sqrt(3) * Vm;
        T0_str = 'π / 3';
        vdcVal = (3 * Vm_LL / Math.PI); // alpha = 0
        vrmsVal = Vm_LL * Math.sqrt(0.5 + ((3 * Math.sqrt(3)) / (4 * Math.PI)));
        integralLower = -Math.PI / 6;
        integralUpper = Math.PI / 6;
        isClampedToZero = false;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>3 · V<sub>m,LL</sub></>} den="π" /> ≈ 1.35 · V<sub>LL,rms</sub>
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = V<sub>m,LL</sub> · √[ <MathFrac num="1" den="2" /> + <MathFrac num={<>3√3</>} den="4π" /> ]
          </span>
        );
        break;
      }

      case '3ph_half_3pulse': {
        T0_str = '2π / 3';
        vdcVal = ((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * Math.cos(alphaRad);
        vrmsVal = Vm * Math.sqrt(Math.max(0, 0.5 + ((3 * Math.sqrt(3)) / (8 * Math.PI)) * Math.cos(2 * alphaRad)));
        integralLower = alphaRad + Math.PI / 6;
        integralUpper = alphaRad + 5 * Math.PI / 6;
        isClampedToZero = false;
        vdcFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>dc</sub> = <MathFrac num={<>3√3 · V<sub>m,ph</sub></>} den="2π" /> · cos α
          </span>
        );
        vrmsFormulaComponent = (
          <span className="font-serif inline-flex items-center">
            V<sub>rms</sub> = V<sub>m,ph</sub> · √[ <MathFrac num="1" den="2" /> + <MathFrac num={<>3√3</>} den="8π" /> · cos 2α ]
          </span>
        );
        break;
      }
    }

    const formFactor = Math.abs(vdcVal) > 0.01 ? vrmsVal / Math.abs(vdcVal) : 1;
    const rippleFactor = Math.sqrt(Math.max(0, formFactor * formFactor - 1)) * 100;
    const idcVal = evalR > 0 ? (vdcVal - evalE) / evalR : 0;
    const pdcVal = vdcVal * idcVal;

    return {
      Vm,
      alphaRad,
      betaDeg,
      betaRad,
      T0_str,
      vdcVal,
      vrmsVal,
      formFactor,
      rippleFactor,
      idcVal,
      pdcVal,
      integralLower,
      integralUpper,
      isClampedToZero,
      vdcFormulaComponent,
      vrmsFormulaComponent
    };
  }, [selectedCase, evalVs, evalAlpha, evalR, evalE]);

  // Annotated Waveform Plot dimensions matching screenshot layout
  const plotWidth = 720;
  const plotHeight = 220;
  const padL = 50;
  const padR = 25;
  const padT = 25;
  const padB = 30;
  const w = plotWidth - padL - padR;
  const h = plotHeight - padT - padB;
  const midY = padT + h / 2;

  // Exact 0° to 720° (4π) degree scaling
  const xForTheta = (thetaRad: number) => padL + (thetaRad / (4 * Math.PI)) * w;
  const yForVolt = (v: number) => midY - (v / (caseData.Vm * 1.2)) * (h / 2);

  // Function to evaluate instantaneous Vo at any arbitrary theta angle
  const getVoAtTheta = useCallback((theta: number) => {
    const tMod = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    if (selectedCase === '3ph_diode_6pulse') {
      const pulseIndex = Math.floor(((theta + Math.PI / 6) % (2 * Math.PI)) / (Math.PI / 3));
      const centerAngle = pulseIndex * (Math.PI / 3);
      const Vm_LL = Math.sqrt(3) * caseData.Vm;
      return Vm_LL * Math.cos(theta - centerAngle);
    } else if (selectedCase === '3ph_full_6pulse') {
      const pulseIndex = Math.floor(((theta + Math.PI / 6 - caseData.alphaRad + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 3));
      const centerAngle = caseData.alphaRad + pulseIndex * (Math.PI / 3);
      const Vm_LL = Math.sqrt(3) * caseData.Vm;
      return Vm_LL * Math.cos(theta - centerAngle);
    } else if (selectedCase === '3ph_semi_3t3d') {
      const pulseIndex = Math.floor(((theta + Math.PI / 6 - caseData.alphaRad + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 3));
      const centerAngle = caseData.alphaRad + pulseIndex * (Math.PI / 3);
      const Vm_LL = Math.sqrt(3) * caseData.Vm;
      return Math.max(0, Vm_LL * Math.cos(theta - centerAngle));
    } else if (selectedCase === '3ph_half_3pulse') {
      const pulseIndex = Math.floor(((theta + Math.PI / 6 - caseData.alphaRad + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI / 3));
      const centerAngle = caseData.alphaRad + Math.PI / 2 + pulseIndex * (2 * Math.PI / 3);
      return caseData.Vm * Math.sin(theta - centerAngle + Math.PI / 2);
    } else if (selectedCase === '1ph_full_continuous') {
      if (tMod >= caseData.alphaRad && tMod < Math.PI + caseData.alphaRad) {
        return caseData.Vm * Math.sin(tMod);
      } else {
        return -caseData.Vm * Math.sin(tMod);
      }
    } else if (selectedCase === '1ph_full_r_fwd' || selectedCase === '1ph_semi') {
      if (tMod >= caseData.alphaRad && tMod < Math.PI) {
        return caseData.Vm * Math.sin(tMod);
      } else if (tMod >= Math.PI + caseData.alphaRad && tMod < 2 * Math.PI) {
        return -caseData.Vm * Math.sin(tMod);
      } else {
        return 0;
      }
    } else if (selectedCase === '1ph_half_r') {
      if (tMod >= caseData.alphaRad && tMod < Math.PI) {
        return caseData.Vm * Math.sin(tMod);
      } else {
        return 0;
      }
    } else {
      // Discontinuous DCM
      if (tMod >= caseData.alphaRad && tMod < caseData.betaRad) {
        return caseData.Vm * Math.sin(tMod);
      } else {
        return 0;
      }
    }
  }, [caseData, selectedCase]);

  // Handle pointer action on the Annotated Output Voltage Waveform
  const handleWaveformPointer = useCallback(
    (clientX: number, targetRect: DOMRect) => {
      const relX = clientX - targetRect.left;
      const svgRelX = (relX / targetRect.width) * plotWidth;
      const clampedX = Math.max(padL, Math.min(padL + w, svgRelX));
      const ratio = (clampedX - padL) / w;
      const theta = ratio * 4 * Math.PI; // 0 to 720 deg (4π)
      setWaveformCursorTheta(theta);
    },
    [plotWidth, padL, w]
  );

  const onWaveformPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsWaveformDragging(true);
    handleWaveformPointer(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const onWaveformPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    handleWaveformPointer(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const onWaveformPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsWaveformDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Instantaneous Cursor Probe Values for Vo, Vs, and wt
  const cursorDegNorm = ((waveformCursorTheta * 180 / Math.PI) % 360 + 360) % 360;
  const cursorTotalDeg = (waveformCursorTheta * 180 / Math.PI);
  const cursorVs = caseData.Vm * Math.sin(waveformCursorTheta);
  const cursorVo = getVoAtTheta(waveformCursorTheta);
  const cursorX = xForTheta(waveformCursorTheta);
  const cursorYVs = yForVolt(cursorVs);
  const cursorYVo = yForVolt(cursorVo);

  // Build annotated SVG curves, hatched definite integral, and V_dc/V_rms reference levels
  const { pathVs, pathVo, hatchAreaPath, xHatchStart, xHatchEnd } = useMemo(() => {
    const vsPts: string[] = [];
    const voPts: string[] = [];
    const hatchPts: string[] = [];
    const numPoints = 320;

    const startHatchTheta = caseData.integralLower;
    const endHatchTheta = caseData.integralUpper;
    const xStart = xForTheta(startHatchTheta);
    const xEnd = xForTheta(endHatchTheta);

    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * 4 * Math.PI; // 720 deg
      const x = xForTheta(theta);
      const vs = caseData.Vm * Math.sin(theta);
      const vo = getVoAtTheta(theta);

      const yVs = yForVolt(vs);
      const yVo = yForVolt(vo);

      if (i === 0) {
        vsPts.push(`M ${x} ${yVs}`);
        voPts.push(`M ${x} ${yVo}`);
      } else {
        vsPts.push(`L ${x} ${yVs}`);
        voPts.push(`L ${x} ${yVo}`);
      }

      if (theta >= startHatchTheta && theta <= endHatchTheta) {
        if (hatchPts.length === 0) {
          hatchPts.push(`M ${x} ${midY}`);
          hatchPts.push(`L ${x} ${yVo}`);
        } else {
          hatchPts.push(`L ${x} ${yVo}`);
        }
      }
    }

    if (hatchPts.length > 0) {
      hatchPts.push(`L ${xEnd} ${midY}`);
      hatchPts.push('Z');
    }

    return {
      pathVs: vsPts.join(' '),
      pathVo: voPts.join(' '),
      hatchAreaPath: hatchPts.join(' '),
      xHatchStart: xStart,
      xHatchEnd: xEnd
    };
  }, [caseData, getVoAtTheta]);

  // Master Summary Comparison Table Rows covering all 11 converter cases
  const summaryRows = [
    {
      key: '1ph_full_continuous' as ConverterCaseKey,
      group: '1Φ',
      title: '1-Phase Full-Bridge Controlled Rectifier (Continuous Conduction)',
      subtext: 'Continuous Inductive Current (Two-Quadrant CCM)',
      T0: 'π',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>2 · V<sub>m</sub></>} den="π" /> · cos α
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="√2" /> = V<sub>s,rms</sub>
        </span>
      ),
      piv: 'V_m',
      quadrants: 'Two (I & IV)'
    },
    {
      key: '1ph_full_r_fwd' as ConverterCaseKey,
      group: '1Φ',
      title: '1-Phase Full-Bridge Controlled Rectifier (R Load / with FWD)',
      subtext: 'Resistive Load (R) or RL Load with Freewheeling Diode',
      T0: 'π',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="π" /> · (1 + cos α)
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="√2" /> · √[ 1 - <MathFrac num="α" den="π" /> + <MathFrac num="sin 2α" den="2π" /> ]
        </span>
      ),
      piv: 'V_m',
      quadrants: 'One (I)'
    },
    {
      key: '1ph_full_dcm' as ConverterCaseKey,
      group: '1Φ',
      title: '1-Phase Full-Bridge Controlled (Discontinuous Conduction, RL Load)',
      subtext: 'Inductive current extinguishes at β < π + α',
      T0: 'π',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="π" /> · (cos α - cos β)
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="√2π" /> · √[ (β - α) - <MathFrac num={<>sin 2β - sin 2α</>} den="2" /> ]
        </span>
      ),
      piv: 'V_m',
      quadrants: 'One (I)'
    },
    {
      key: '1ph_semi' as ConverterCaseKey,
      group: '1Φ',
      title: '1-Phase Semi-Converter (Half-Controlled Bridge)',
      subtext: '2 Thyristors + 2 Diodes with natural freewheeling commutation',
      T0: 'π',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="π" /> · (1 + cos α)
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="√2" /> · √[ 1 - <MathFrac num="α" den="π" /> + <MathFrac num="sin 2α" den="2π" /> ]
        </span>
      ),
      piv: 'V_m',
      quadrants: 'One (I)'
    },
    {
      key: '1ph_half_rl_beta' as ConverterCaseKey,
      group: '1Φ',
      title: '1-Phase Half-Wave Controlled Rectifier (RL Load with Extinction β)',
      subtext: 'Single controlled thyristor with inductive extinction angle β',
      T0: '2π',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="2π" /> · (cos α - cos β)
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="2√π" /> · √[ (β - α) - <MathFrac num={<>sin 2β - sin 2α</>} den="2" /> ]
        </span>
      ),
      piv: 'V_m',
      quadrants: 'One (I)'
    },
    {
      key: '1ph_half_diode_beta' as ConverterCaseKey,
      group: '1Φ',
      title: '1-Phase Half-Wave Diode Rectifier (RL Load with Extinction β)',
      subtext: 'Uncontrolled diode with inductive load extending conduction to β',
      T0: '2π',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="2π" /> · (1 - cos β)
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="2√π" /> · √[ β - <MathFrac num="sin 2β" den="2" /> ]
        </span>
      ),
      piv: 'V_m',
      quadrants: 'One (I)'
    },
    {
      key: '1ph_half_r' as ConverterCaseKey,
      group: '1Φ',
      title: '1-Phase Half-Wave Controlled Rectifier (R Load)',
      subtext: 'Single thyristor pulse into purely resistive load',
      T0: '2π',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="2π" /> · (1 + cos α)
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>V<sub>m</sub></>} den="2" /> · √[ 1 - <MathFrac num="α" den="π" /> + <MathFrac num="sin 2α" den="2π" /> ]
        </span>
      ),
      piv: 'V_m',
      quadrants: 'One (I)'
    },
    {
      key: '3ph_full_6pulse' as ConverterCaseKey,
      group: '3Φ',
      title: '3-Phase Full-Bridge Controlled Converter (6-Pulse Rectifier)',
      subtext: 'Continuous current 6-thyristor bridge with 300Hz ripple',
      T0: 'π / 3',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>3 · V<sub>m,LL</sub></>} den="π" /> · cos α
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          V<sub>m,LL</sub> · √[ <MathFrac num="1" den="2" /> + <MathFrac num={<>3√3</>} den="4π" /> · cos 2α ]
        </span>
      ),
      piv: '√3 · V_m',
      quadrants: 'Two (I & IV)'
    },
    {
      key: '3ph_semi_3t3d' as ConverterCaseKey,
      group: '3Φ',
      title: '3-Phase Semi-Converter (Half-Controlled 3T + 3D Bridge)',
      subtext: '3 Thyristors + 3 Diodes with inherent freewheeling action',
      T0: 'π / 3',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>3 · V<sub>m,LL</sub></>} den="2π" /> · (1 + cos α)
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          V<sub>m,LL</sub> · √[ <MathFrac num="3" den="4π" /> · ((π - α) + <MathFrac num="sin 2α" den="2" />) ]
        </span>
      ),
      piv: '√3 · V_m',
      quadrants: 'One (I)'
    },
    {
      key: '3ph_diode_6pulse' as ConverterCaseKey,
      group: '3Φ',
      title: '3-Phase Diode Bridge Rectifier (Uncontrolled 6-Pulse)',
      subtext: 'Uncontrolled natural commutation at 60° intervals (α = 0°)',
      T0: 'π / 3',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>3 · V<sub>m,LL</sub></>} den="π" /> ≈ 1.35 · V<sub>LL,rms</sub>
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          V<sub>m,LL</sub> · √[ <MathFrac num="1" den="2" /> + <MathFrac num={<>3√3</>} den="4π" /> ]
        </span>
      ),
      piv: '√3 · V_m',
      quadrants: 'One (I)'
    },
    {
      key: '3ph_half_3pulse' as ConverterCaseKey,
      group: '3Φ',
      title: '3-Phase Half-Wave Controlled Converter (3-Pulse Rectifier)',
      subtext: '3-Thyristor star-connected converter with 150Hz fundamental ripple',
      T0: '2π / 3',
      vdcComponent: (
        <span className="font-serif inline-flex items-center">
          <MathFrac num={<>3√3 · V<sub>m,ph</sub></>} den="2π" /> · cos α
        </span>
      ),
      vrmsComponent: (
        <span className="font-serif inline-flex items-center">
          V<sub>m,ph</sub> · √[ <MathFrac num="1" den="2" /> + <MathFrac num={<>3√3</>} den="8π" /> · cos 2α ]
        </span>
      ),
      piv: '√3 · V_m',
      quadrants: 'Two (I & IV)'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className={`border w-full max-w-5xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
        darkMode ? 'bg-[#080e1e] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Top Header matching screenshot */}
        <div className={`flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b ${
          darkMode ? 'border-slate-800/80 bg-[#0b1328]/70' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Calculator className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Waveform & Output Voltage Analysis
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Calculus & LaTeX Derivations
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Detailed step-by-step mathematical derivations of Average (V_dc) and RMS (V_rms) load voltages with annotated waveforms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={syncLiveCircuit}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                darkMode
                  ? 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-700/60'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-300 shadow-xs'
              }`}
              title="Sync input parameters from live circuit bench"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Live Circuit</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Control Bar: Converter Case Dropdown (Left with amber ring) & 3 Tabs (Right) */}
        <div className={`p-4 border-b flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
          darkMode ? 'border-slate-800/80 bg-[#091124]/50' : 'border-slate-200 bg-slate-50/50'
        }`}>
          {/* Converter Case Dropdown matching exact screenshot options & categories */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 shrink-0">
              <Cpu className="w-4 h-4" />
              <span>Converter Case:</span>
            </div>
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value as ConverterCaseKey)}
              className={`flex-1 text-xs rounded-xl px-3 py-2 border-2 border-amber-500 font-semibold focus:outline-none shadow-sm cursor-pointer ${
                darkMode
                  ? 'bg-slate-900 text-slate-100'
                  : 'bg-white text-slate-800'
              }`}
            >
              <optgroup label="Single-Phase (1Φ) Converters" className="font-bold text-cyan-500">
                <option value="1ph_full_continuous">1-Phase Full-Bridge Controlled Rectifier (Continuous Conduction)</option>
                <option value="1ph_full_r_fwd">1-Phase Full-Bridge Controlled Rectifier (R Load / with FWD)</option>
                <option value="1ph_full_dcm">1-Phase Full-Bridge Controlled (Discontinuous Conduction, RL Load)</option>
                <option value="1ph_semi">1-Phase Semi-Converter (Half-Controlled Bridge)</option>
                <option value="1ph_half_rl_beta">1-Phase Half-Wave Controlled Rectifier (RL Load with Extinction β)</option>
                <option value="1ph_half_diode_beta">1-Phase Half-Wave Diode Rectifier (RL Load with Extinction β)</option>
                <option value="1ph_half_r">1-Phase Half-Wave Controlled Rectifier (R Load)</option>
              </optgroup>
              <optgroup label="Three-Phase (3Φ) Converters" className="font-bold text-amber-500">
                <option value="3ph_full_6pulse">3-Phase Full-Bridge Controlled Converter (6-Pulse Rectifier)</option>
                <option value="3ph_semi_3t3d">3-Phase Semi-Converter (Half-Controlled 3T + 3D Bridge)</option>
                <option value="3ph_diode_6pulse">3-Phase Diode Bridge Rectifier (Uncontrolled 6-Pulse)</option>
                <option value="3ph_half_3pulse">3-Phase Half-Wave Controlled Converter (3-Pulse Rectifier)</option>
              </optgroup>
            </select>
          </div>

          {/* 3 Main Tabs: Derivations & Calculus | Live Substitution | Formula Summary Table */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border self-start md:self-auto overflow-x-auto ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('derivations')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                activeTab === 'derivations'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Derivations & Calculus
            </button>
            <button
              onClick={() => setActiveTab('live_sub')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                activeTab === 'live_sub'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Substitution
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Formula Summary Table
            </button>
          </div>
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
          {/* ========================================================================= */}
          {/* UPPER HALF: CONSTANT OUTPUT WAVEFORM CARD & FORMULA CARDS ACROSS ALL TABS */}
          {/* ========================================================================= */}
          <div className={`border rounded-2xl p-4 shadow-lg transition-colors ${
            darkMode ? 'bg-[#0d1629] border-slate-800/90' : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Top row: Title & Real-time Vo / Vs / wt cursor readout + Slider + V_dc / V_rms badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span className={`text-xs sm:text-sm font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Annotated Output Voltage Waveform
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                  T_0 = {caseData.T0_str}
                </span>

                {/* LIVE CURSOR PROBE BADGE (SHOWS Vo, Vs, and wt AT CURSOR POSITION) */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border font-mono text-xs shadow-xs ${
                  darkMode ? 'bg-slate-900/90 border-cyan-500/40 text-slate-200' : 'bg-white border-cyan-300 text-slate-800'
                }`}>
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-cyan-400 font-bold">ωt = {cursorDegNorm.toFixed(1)}°</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-yellow-400 font-bold">Vo = {cursorVo.toFixed(1)} V</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-sky-400 font-bold">Vs = {cursorVs.toFixed(1)} V</span>
                </div>
              </div>

              {/* Firing Angle Slider & Golden/Cyan Value Badges matching screenshot */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-mono">Firing Angle (α):</span>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="5"
                    value={evalAlpha}
                    onChange={(e) => setEvalAlpha(Number(e.target.value))}
                    className="w-24 accent-amber-400 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800"
                  />
                  <span className="text-xs font-mono font-bold text-amber-400 w-8 text-right">
                    {evalAlpha}°
                  </span>
                </div>

                <div className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs shadow-xs">
                  V_dc = {caseData.vdcVal.toFixed(1)} V
                </div>
                <div className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs shadow-xs">
                  V_rms = {caseData.vrmsVal.toFixed(1)} V
                </div>
              </div>
            </div>

            {/* SVG Annotated Waveform Plot matching screenshot with interactive dragging */}
            <div className="w-full bg-[#070c1a] border border-slate-800 rounded-xl p-2 relative select-none overflow-hidden">
              <svg
                viewBox={`0 0 ${plotWidth} ${plotHeight}`}
                className="w-full h-auto block select-none cursor-crosshair touch-none"
                onPointerDown={onWaveformPointerDown}
                onPointerMove={onWaveformPointerMove}
                onPointerUp={onWaveformPointerUp}
              >
                <defs>
                  <pattern id="hatch-pattern-grid" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#0284c7" strokeWidth="1.5" opacity="0.45" />
                  </pattern>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1={padL} y1={padT} x2={padL + w} y2={padT} stroke="#1e293b" strokeDasharray="3 3" />
                <line x1={padL} y1={midY} x2={padL + w} y2={midY} stroke="#334155" strokeWidth="1.5" />
                <line x1={padL} y1={padT + h} x2={padL + w} y2={padT + h} stroke="#1e293b" strokeDasharray="3 3" />

                {/* Vertical degree markers: 0°, 90°, 180°, 270°, 360°, 450°, 540°, 630°, 720° */}
                {[
                  { deg: 0, rad: 0, label: '0°' },
                  { deg: 90, rad: Math.PI / 2, label: '90°' },
                  { deg: 180, rad: Math.PI, label: '180°' },
                  { deg: 270, rad: 3 * Math.PI / 2, label: '270°' },
                  { deg: 360, rad: 2 * Math.PI, label: '360°' },
                  { deg: 450, rad: 5 * Math.PI / 2, label: '450°' },
                  { deg: 540, rad: 3 * Math.PI, label: '540°' },
                  { deg: 630, rad: 7 * Math.PI / 2, label: '630°' },
                  { deg: 720, rad: 4 * Math.PI, label: '720°' }
                ].map((item) => (
                  <g key={item.deg}>
                    <line
                      x1={xForTheta(item.rad)}
                      y1={padT}
                      x2={xForTheta(item.rad)}
                      y2={padT + h}
                      stroke="#1e293b"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={xForTheta(item.rad)}
                      y={padT + h + 15}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {item.label}
                    </text>
                  </g>
                ))}

                {/* Hatched Integration Region */}
                {hatchAreaPath && (
                  <path d={hatchAreaPath} fill="url(#hatch-pattern-grid)" opacity="0.8" />
                )}

                {/* V_dc horizontal dashed teal line with tag badge */}
                <line
                  x1={padL}
                  y1={yForVolt(caseData.vdcVal)}
                  x2={padL + w}
                  y2={yForVolt(caseData.vdcVal)}
                  stroke="#14b8a6"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <rect x={padL + w - 75} y={yForVolt(caseData.vdcVal) - 9} width="72" height="16" rx="3" fill="#14b8a6" />
                <text x={padL + w - 39} y={yForVolt(caseData.vdcVal) + 3} fill="#042f2e" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  V_dc = {caseData.vdcVal.toFixed(1)}V
                </text>

                {/* V_rms horizontal dashed blue line with tag badge */}
                <line
                  x1={padL}
                  y1={yForVolt(caseData.vrmsVal)}
                  x2={padL + w}
                  y2={yForVolt(caseData.vrmsVal)}
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />
                <rect x={padL + 15} y={yForVolt(caseData.vrmsVal) - 9} width="75" height="16" rx="3" fill="#0284c7" opacity="0.9" />
                <text x={padL + 52} y={yForVolt(caseData.vrmsVal) + 3} fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  V_rms = {caseData.vrmsVal.toFixed(1)}V
                </text>

                {/* Input Voltage vs (dashed cyan curve) */}
                <path d={pathVs} fill="none" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="3 3" opacity="0.75" />

                {/* Rectified Output Voltage vo (solid yellow/amber curve matching screenshot) */}
                <path d={pathVo} fill="none" stroke="#facc15" strokeWidth="2.8" strokeLinecap="round" />

                {/* INTERACTIVE VERTICAL CURSOR LINE SHOWING WHERE USER DRAGS OR PLACES CURSOR */}
                <line
                  x1={cursorX}
                  y1={padT}
                  x2={cursorX}
                  y2={padT + h}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                {/* Cursor glowing tracking dot on vo (amber/yellow) */}
                <circle cx={cursorX} cy={cursorYVo} r="5.5" fill="#facc15" stroke="#ffffff" strokeWidth="2" />

                {/* Cursor glowing tracking dot on vs (cyan/blue) */}
                <circle cx={cursorX} cy={cursorYVs} r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />

                {/* Floating tooltip badge directly above cursor line */}
                <g transform={`translate(${Math.max(padL + 80, Math.min(padL + w - 80, cursorX))}, ${padT + 10})`}>
                  <rect x="-75" y="-12" width="150" height="20" rx="4" fill="#091124" stroke="#0284c7" strokeWidth="1.5" opacity="0.95" />
                  <text x="0" y="2" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    ωt: {cursorDegNorm.toFixed(1)}° | Vo: {cursorVo.toFixed(1)}V | Vs: {cursorVs.toFixed(1)}V
                  </text>
                </g>

                {/* Y-Axis Value Labels */}
                <text x="42" y={padT + 4} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                  +{caseData.Vm.toFixed(0)}V
                </text>
                <text x="42" y={midY + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                  0V
                </text>
                <text x="42" y={padT + h} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                  -{caseData.Vm.toFixed(0)}V
                </text>
              </svg>
            </div>

            {/* Bottom Legend Row matching screenshot */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-4 flex-wrap font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-yellow-400 rounded-sm"></span>
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>v_o(ωt) Output Voltage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-cyan-500"></span>
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>v_s(ωt) AC Input</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-teal-400"></span>
                  <span className="text-teal-400 font-semibold">V_dc</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-sky-400"></span>
                  <span className="text-sky-400 font-semibold">V_rms</span>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Form Factor FF: <span className="text-amber-400 font-bold">{caseData.formFactor.toFixed(3)}</span> • Ripple Factor RF: <span className="text-cyan-400 font-bold">{caseData.rippleFactor.toFixed(1)}%</span>
              </div>
            </div>

            {/* TWO FORMULA CARDS UNDER THE WAVEFORM (VISIBLE ACROSS ALL TABS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5 pt-3 border-t border-slate-800/80">
              {/* AVERAGE DC VOLTAGE FORMULA */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-[10px] font-mono font-bold tracking-wider text-teal-400 uppercase mb-1">
                  AVERAGE DC VOLTAGE FORMULA (V_DC)
                </div>
                <div className="text-xs sm:text-sm font-semibold text-emerald-400 flex items-center justify-between flex-wrap gap-2">
                  <div>{caseData.vdcFormulaComponent}</div>
                  <div className="font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    = {caseData.vdcVal.toFixed(2)} V
                  </div>
                </div>
              </div>

              {/* RMS OUTPUT VOLTAGE FORMULA */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-[10px] font-mono font-bold tracking-wider text-sky-400 uppercase mb-1">
                  RMS OUTPUT VOLTAGE FORMULA (V_RMS)
                </div>
                <div className="text-xs sm:text-sm font-semibold text-sky-400 flex items-center justify-between flex-wrap gap-2">
                  <div>{caseData.vrmsFormulaComponent}</div>
                  <div className="font-mono text-sky-300 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                    = {caseData.vrmsVal.toFixed(2)} V
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LOWER HALF: TAB CONTENT THAT CHANGES BENEATH THE CONSTANT WAVEFORM        */}
          {/* ========================================================================= */}

          {/* TAB 1: DERIVATIONS & CALCULUS */}
          {activeTab === 'derivations' && (
            <div className="space-y-4">
              {/* PART A: DERIVATION OF AVERAGE DC VOLTAGE (V_DC) */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                darkMode ? 'bg-[#0d1629] border-slate-800/90' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2">
                  <Sigma className="w-4 h-4 text-emerald-400" />
                  <span>Part A: Step-by-Step Calculus Derivation of V_dc</span>
                </div>

                {/* Step 1 */}
                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-[11px] font-mono font-bold text-cyan-400">
                    Step 1: Fundamental Mean Value Integral over Period T_0 = {caseData.T0_str}
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Integrating the instantaneous piecewise voltage function v_o(θ) over its repetition interval:
                  </p>
                  <div className={`p-2.5 rounded-lg font-serif text-center text-xs sm:text-sm border flex items-center justify-center flex-wrap gap-2 ${
                    darkMode ? 'bg-slate-950 text-cyan-200 border-slate-800/60' : 'bg-slate-100 text-cyan-900 border-slate-300'
                  }`}>
                    <span>V<sub>dc</sub> = </span>
                    <MathFrac num="1" den={<>T<sub>0</sub></>} />
                    <span>∫<sub>lower</sub><sup>upper</sup> v<sub>o</sub>(θ) dθ = </span>
                    <MathFrac num="1" den={caseData.T0_str} />
                    <span>∫<sub>α</sub><sup>{caseData.isClampedToZero ? 'π' : 'π + α'}</sup> V<sub>m</sub> sin θ dθ</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-[11px] font-mono font-bold text-cyan-400">
                    Step 2: Analytical Evaluation with ∫ sin θ dθ = [ -cos θ ]
                  </div>
                  <div className={`p-2.5 rounded-lg font-serif text-center text-xs sm:text-sm border flex items-center justify-center flex-wrap gap-2 ${
                    darkMode ? 'bg-slate-950 text-cyan-200 border-slate-800/60' : 'bg-slate-100 text-cyan-900 border-slate-300'
                  }`}>
                    <span>V<sub>dc</sub> = </span>
                    <MathFrac num={<>V<sub>m</sub></>} den={caseData.T0_str} />
                    <span>[ -cos θ ]<sub>α</sub><sup>{caseData.isClampedToZero ? 'π' : 'π + α'}</sup> = </span>
                    <MathFrac num={<>V<sub>m</sub></>} den={caseData.T0_str} />
                    <span>[ -cos({caseData.isClampedToZero ? 'π' : 'π + α'}) - (-cos α) ]</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-[11px] font-mono font-bold text-emerald-400">
                    Step 3: Closed-form Analytical Result
                  </div>
                  <div className={`p-3 rounded-lg font-serif text-center text-xs sm:text-sm font-bold border flex items-center justify-center flex-wrap gap-2 shadow-inner ${
                    darkMode ? 'bg-slate-950 text-emerald-400 border-emerald-900/60' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    <span>V<sub>dc</sub> = </span>
                    {caseData.isClampedToZero ? (
                      <>
                        <MathFrac num={<>V<sub>m</sub></>} den="π" />
                        <span>· (1 + cos α) = </span>
                        <MathFrac num={<>√2 · V<sub>s</sub></>} den="π" />
                        <span>· (1 + cos α)</span>
                      </>
                    ) : (
                      <>
                        <MathFrac num={<>2 · V<sub>m</sub></>} den="π" />
                        <span>· cos α = </span>
                        <MathFrac num={<>2√2 · V<sub>s</sub></>} den="π" />
                        <span>· cos α</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* PART B: DERIVATION OF RMS VOLTAGE (V_RMS) */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                darkMode ? 'bg-[#0d1629] border-slate-800/90' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 text-sm font-bold text-sky-400 border-b border-slate-800 pb-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Part B: Step-by-Step Calculus Derivation of V_rms</span>
                </div>

                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-[11px] font-mono font-bold text-indigo-400">
                    Step 1: RMS Definition & Double-Angle Identity [ sin² θ = ½(1 - cos 2θ) ]
                  </div>
                  <div className={`p-2.5 rounded-lg font-serif text-center text-xs sm:text-sm border flex items-center justify-center flex-wrap gap-2 ${
                    darkMode ? 'bg-slate-950 text-indigo-200 border-slate-800/60' : 'bg-slate-100 text-indigo-900 border-slate-300'
                  }`}>
                    <span>V<sub>rms</sub> = </span>
                    <span>[ </span>
                    <MathFrac num="1" den={caseData.T0_str} />
                    <span>∫<sub>lower</sub><sup>upper</sup> V<sub>m</sub>² sin² θ dθ ]<sup>½</sup> = </span>
                    <MathFrac num={<>V<sub>m</sub></>} den="√2" />
                    {caseData.isClampedToZero ? (
                      <span>· √[ 1 - <MathFrac num="α" den="π" /> + <MathFrac num="sin 2α" den="2π" /> ]</span>
                    ) : (
                      <span> = V<sub>s,rms</sub></span>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-[11px] font-mono font-bold text-sky-400">
                    Step 2: Harmonic Ripple & Power Factor Summary
                  </div>
                  <div className={`p-3 rounded-lg font-serif text-center text-xs sm:text-sm font-bold border flex items-center justify-center flex-wrap gap-3 ${
                    darkMode ? 'bg-slate-950 text-sky-300 border-sky-900/60' : 'bg-sky-50 text-sky-900 border-sky-300'
                  }`}>
                    <div>Form Factor (FF) = V<sub>rms</sub> / V<sub>dc</sub> = {caseData.formFactor.toFixed(3)}</div>
                    <span>•</span>
                    <div>Ripple Factor (RF) = √(FF² - 1) = {caseData.rippleFactor.toFixed(1)}%</div>
                    <span>•</span>
                    <div>Displacement Factor = cos(α) = {Math.cos(caseData.alphaRad).toFixed(3)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SUBSTITUTION */}
          {activeTab === 'live_sub' && (
            <div className="space-y-4">
              {/* Parameter Inputs */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                darkMode ? 'bg-[#0d1629] border-slate-800/90' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Sliders className="w-4 h-4" />
                    <span>Evaluate Formula with Custom Numerical Parameters</span>
                  </div>
                  <button
                    onClick={syncLiveCircuit}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset to Live Circuit Bench
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className={`mb-1 block font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Source RMS (V_s):</label>
                    <input
                      type="number"
                      value={evalVs}
                      onChange={(e) => setEvalVs(Number(e.target.value))}
                      className={`w-full border px-3 py-1.5 rounded-lg font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Firing Angle (α°):</label>
                    <input
                      type="number"
                      value={evalAlpha}
                      onChange={(e) => setEvalAlpha(Number(e.target.value))}
                      className={`w-full border px-3 py-1.5 rounded-lg font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Resistance R (Ω):</label>
                    <input
                      type="number"
                      value={evalR}
                      onChange={(e) => setEvalR(Number(e.target.value))}
                      className={`w-full border px-3 py-1.5 rounded-lg font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Inductance L (mH):</label>
                    <input
                      type="number"
                      value={evalL}
                      onChange={(e) => setEvalL(Number(e.target.value))}
                      className={`w-full border px-3 py-1.5 rounded-lg font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Step-by-Step Numerical Evaluation Cards matching screenshot with clean symbols */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* V_DC NUMERICAL EVALUATION (ZERO \frac strings!) */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  darkMode ? 'bg-[#0d1629] border-slate-800/90' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      V_DC Numerical Evaluation
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {caseData.vdcVal.toFixed(2)} V
                    </span>
                  </div>
                  <div className={`font-mono text-xs space-y-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <div>Peak Voltage V_m = √2 × {evalVs} = {caseData.Vm.toFixed(2)} V</div>
                    <div>cos(α) = cos({evalAlpha}°) = {Math.cos(caseData.alphaRad).toFixed(4)}</div>
                    <div className="pt-2 text-emerald-400 font-bold border-t border-slate-800 flex items-center flex-wrap gap-1">
                      <span>V_dc = </span>
                      {caseData.isClampedToZero ? (
                        <span>(V_m / π) · (1 + cos α) = {caseData.vdcVal.toFixed(2)} V</span>
                      ) : (
                        <span>(2 · V_m / π) · cos α = {caseData.vdcVal.toFixed(2)} V</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* V_RMS NUMERICAL EVALUATION */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  darkMode ? 'bg-[#0d1629] border-slate-800/90' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">
                      V_RMS Numerical Evaluation
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                      {caseData.vrmsVal.toFixed(2)} V
                    </span>
                  </div>
                  <div className={`font-mono text-xs space-y-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <div>Form Factor (FF) = V_rms / V_dc = {caseData.formFactor.toFixed(4)}</div>
                    <div>Ripple Factor (RF) = √(FF² - 1) = {caseData.rippleFactor.toFixed(2)}%</div>
                    <div className="pt-2 text-sky-400 font-bold border-t border-slate-800">
                      V_rms = {caseData.vrmsVal.toFixed(2)} V
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FORMULA SUMMARY TABLE COVERING ALL 11 TOPOLOGY CASES */}
          {activeTab === 'summary' && (
            <div className={`border rounded-2xl overflow-hidden shadow-lg ${
              darkMode ? 'bg-[#0d1629] border-slate-800/90' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${
                      darkMode ? 'border-slate-800 bg-[#091124] text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
                    }`}>
                      <th className="py-3 px-3 font-semibold font-mono">Phase</th>
                      <th className="py-3 px-4 font-semibold">Topology & Load Case</th>
                      <th className="py-3 px-3 font-semibold font-mono">T_0</th>
                      <th className="py-3 px-4 font-semibold text-emerald-400">Average Output V_dc</th>
                      <th className="py-3 px-4 font-semibold text-sky-400">RMS Output V_rms</th>
                      <th className="py-3 px-3 font-semibold font-mono">PIV</th>
                      <th className="py-3 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-[11px]">
                    {summaryRows.map((row) => {
                      const isSelected = selectedCase === row.key;
                      return (
                        <tr
                          key={row.key}
                          className={`transition ${
                            isSelected
                              ? 'bg-amber-950/40 border-l-4 border-l-amber-400'
                              : darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-cyan-400">{row.group}</td>
                          <td className="py-3 px-4 font-sans">
                            <div className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>{row.title}</div>
                            <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{row.subtext}</div>
                          </td>
                          <td className={`py-3 px-3 font-mono font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{row.T0}</td>
                          <td className="py-3 px-4 text-emerald-500 font-bold">{row.vdcComponent}</td>
                          <td className="py-3 px-4 text-sky-500 font-semibold">{row.vrmsComponent}</td>
                          <td className="py-3 px-3 font-mono text-slate-400">{row.piv}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCase(row.key);
                                setActiveTab('derivations');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition cursor-pointer text-[10px] inline-flex items-center gap-1 font-sans font-semibold"
                            >
                              <span>Derive</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-[#091124]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="text-xs font-mono text-slate-400">
            Current Case: <span className="text-amber-400 font-semibold">{selectedCase}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer shadow-md"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
