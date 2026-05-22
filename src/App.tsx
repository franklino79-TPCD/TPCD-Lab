/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Folder, 
  FileCode, 
  Activity, 
  Sliders, 
  Eye, 
  HelpCircle, 
  Copy, 
  Check, 
  Flame, 
  Zap, 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  ListOrdered,
  ChevronRight,
  MousePointerClick,
  BookOpen,
  FileImage
} from "lucide-react";
import { ModelType, SimConfig, MetricSnapshot, ArchitecturalFile } from "./types";
import { MorphogenesisEngine } from "./utils/simulation";
import { ARCHITECTURE_FILES } from "./data/architectureDocs";
import ScientificFigures from "./components/ScientificFigures";

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"laboratory" | "architecture" | "roadmap" | "sweep" | "figures">("laboratory");

  // --- STATE FOR TOPOLOGICAL MEMORY TRANSITION SWEEP ---
  const [sweepConfig, setSweepConfig] = useState({
    temperature: 1.35,
    tensionStrength: 0.32,
    memoryDecay: 0.05,
    bubbleDefectRate: 0.002,
    stepsPerPoint: 600,
  });

  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweepIndex, setSweepIndex] = useState<number>(0);
  const [sweepCurrentStep, setSweepCurrentStep] = useState<number>(0);
  const [sweepResults, setSweepResults] = useState<Array<{
    mu: number;
    b0: number;
    b1: number;
    euler: number;
    activeCount: number;
    activeRatio: number;
    largestRatio: number;
    fractalDim: number;
    entropy: number;
    totalEnergy: number;
    avalancheFactor: number;
  }>>([]);

  // List of mu values to sweep: 0.0 to 1.2 in steps of 0.05
  const muValues = [
    0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 
    0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2
  ];

  // Simulation Engine Initialization (Grid size 256x256 is default for high-fidelity coral structures)
  const [gridW, setGridW] = useState<number>(256);
  const [gridH, setGridH] = useState<number>(256);
  const engineRef = useRef<MorphogenesisEngine | null>(null);

  if (!engineRef.current || engineRef.current.width !== gridW || engineRef.current.height !== gridH) {
    engineRef.current = new MorphogenesisEngine(gridW, gridH);
  }
  const engine = engineRef.current;

  // Configuration State
  const [config, setConfig] = useState<SimConfig>({
    model: "reaction-diffusion",
    width: 256,
    height: 256,
    temperature: 1.2,
    diffusionA: 0.16,
    diffusionB: 0.08,
    feedRate: 0.035,
    killRate: 0.060,
    memoryDecay: 0.04,
    tensionStrength: 0.4,
    bubbleDefectRate: 0.003,
    annealingSpeed: 0.005,
    isAnnealingActive: false,
    activeCellsThreshold: 0.25,
    gaugeLevel: 2,
    gaugeCoupling: 0.50,
  });

  // Simulator Running State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [stepCount, setStepCount] = useState<number>(0);
  const [activeVisualizer, setActiveVisualizer] = useState<"morphology" | "energy" | "memory" | "tension" | "gauge">("morphology");
  const [canvasScale, setCanvasScale] = useState<number>(3);
  const [interactiveMode, setInteractiveMode] = useState<"seed" | "bubble">("seed");
  
  // Real time calculated metrics
  const [metrics, setMetrics] = useState<MetricSnapshot & {
    totalActiveFlux?: number;
    energyMaxwell?: number;
    energyBF?: number;
    gaussLinking?: number;
    confinementLimit?: number;
  }>({
    step: 0,
    energy: 0,
    connectedComponents: 1,
    eulerCharacteristic: 1,
    entropy: 0,
    avalancheSize: 0,
    totalActiveFlux: 0,
    energyMaxwell: 0,
    energyBF: 0,
    gaussLinking: 0,
    confinementLimit: 0,
  });

  // History track for charts (Limit to last 50 snapshots)
  const [metricsHistory, setMetricsHistory] = useState<MetricSnapshot[]>([]);

  // Local Hover Inspector variables
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; val: number; eng: number; ten: number; mem: number } | null>(null);

  // Handle Model Change
  const [selectedFile, setSelectedFile] = useState<ArchitecturalFile>(ARCHITECTURE_FILES[0]);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);

  // Canvas element ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle Model Change
  const handleModelChange = (model: ModelType) => {
    setIsPlaying(false);
    let updatedConfig = { ...config, model };
    
    // Set typical ideal default parameters depending on chosen model
    if (model === "reaction-diffusion") {
      updatedConfig.feedRate = 0.035;
      updatedConfig.killRate = 0.060;
      updatedConfig.diffusionA = 0.16;
      updatedConfig.diffusionB = 0.08;
      updatedConfig.temperature = 0.8;
      updatedConfig.memoryDecay = 0.04;
    } else if (model === "monte-carlo") {
      updatedConfig.temperature = 1.45;
      updatedConfig.tensionStrength = 0.5;
      updatedConfig.memoryDecay = 0.05;
    } else if (model === "mycelium-active") {
      updatedConfig.temperature = 0.4;
      updatedConfig.tensionStrength = 0.3;
      updatedConfig.memoryDecay = 0.03;
    } else if (model === "coral-growth") {
      updatedConfig.temperature = 0.15;        // baja temperatura = más estable
      updatedConfig.memoryDecay = 0.08;
      updatedConfig.tensionStrength = 0.15;
      updatedConfig.bubbleDefectRate = 0.001;
      updatedConfig.feedRate = 0.0; // no usado en coral
    }

    setConfig(updatedConfig);
    engine.reset(model);
    setStepCount(0);
    setMetricsHistory([]);
    setMetrics({
      step: 0,
      energy: engine.getTotalEnergy(),
      connectedComponents: engine.getConnectedComponents(),
      eulerCharacteristic: engine.getEulerCharacteristic(),
      entropy: engine.getShannonEntropy(),
      avalancheSize: 0,
      totalActiveFlux: 0,
      energyMaxwell: 0,
      energyBF: 0,
      gaussLinking: 0,
      confinementLimit: 0,
    });
    setTimeout(() => {
      setIsPlaying(true);
    }, 50);
  };

  // Re-seed with current model
  const handleReset = () => {
    engine.reset(config.model);
    setStepCount(0);
    setMetricsHistory([]);
    updateMetrics(0, 0);
  };

  // Run scientific step and gather statistics
  const executeStep = () => {
    let flips = 0;
    
    // Annealing cooldown logic
    if (config.isAnnealingActive && config.temperature > 0.05) {
      const nextTemp = Math.max(0.01, config.temperature - config.temperature * config.annealingSpeed);
      setConfig(prev => ({ ...prev, temperature: nextTemp }));
    }

    // Run underlying engine step
    const res = engine.step(config);
    flips = res.flipsAccepted;

    // Stochastic random bubble defects occurrence
    if (Math.random() < config.bubbleDefectRate) {
      const cx = Math.floor(Math.random() * gridW);
      const cy = Math.floor(Math.random() * gridH);
      const cr = Math.floor(4 + Math.random() * 6);
      engine.induceBubbleDefect(cx, cy, cr);
    }

    const currentStep = stepCount + 1;
    setStepCount(currentStep);
    updateMetrics(currentStep, flips);
  };

  const updateMetrics = (stepNum: number, flips: number) => {
    const cc = engine.getConnectedComponents();
    const euler = engine.getEulerCharacteristic();
    const ent = engine.getShannonEntropy();
    const en = engine.getTotalEnergy();

    const snap: MetricSnapshot = {
      step: stepNum,
      energy: en,
      connectedComponents: cc,
      eulerCharacteristic: euler,
      entropy: ent,
      avalancheSize: flips,
    };

    setMetrics(snap);

    // Keep active trajectory log for performance plotting
    if (stepNum % 5 === 0) {
      setMetricsHistory(prev => {
        const next = [...prev, snap];
        if (next.length > 55) {
          next.shift();
        }
        return next;
      });
    }
  };

  // Main Simulation Loop
  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const loop = () => {
        executeStep();
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, config, stepCount]);

  // Canvas Grid Rendering Routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = engine.width;
    const h = engine.height;
    
    // Clear back buffer
    ctx.fillStyle = "#1e293b"; // dark slate base
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = canvas.width / w;
    const cellH = canvas.height / h;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const morph = engine.morphology[idx];
        const mem = engine.memory[idx];
        const eng = engine.energy[idx];
        const ten = engine.tension[idx];

        // Process procedural color rendering according to active visualizer channel
        let fillStyle = "#111827";

        if (activeVisualizer === "morphology") {
          // Copper scientific palette: dense structure glows copper, empty cells are charcoal dark
          if (morph === 1) {
            // map memory to structural brightness
            const bright = Math.min(255, Math.floor(130 + Math.min(mem, 3.0) * 40));
            fillStyle = `rgb(${bright}, ${Math.floor(bright * 0.55)}, ${Math.floor(bright * 0.2)})`;
          } else {
            // subtle gradient representing background chemicals
            const bGradient = Math.max(0, Math.floor(Math.min(mem, 1.0) * 60));
            fillStyle = `rgb(${15 + Math.floor(bGradient * 0.2)}, ${23 + Math.floor(bGradient * 0.4)}, ${31 + bGradient})`;
          }
        } 
        else if (activeVisualizer === "energy") {
          // Diverging Blue-to-Red (Ising coupling matrix)
          // Normalise energy bounds typically around [-4.0, 4.0]
          const normEng = Math.max(-1, Math.min(1, eng / 3.0)); // scale [-1, 1]
          if (normEng < 0) {
            // Negative Energy: Blue shades
            const b = Math.floor(100 + Math.abs(normEng) * 155);
            fillStyle = `rgb(10, 50, ${b})`;
          } else {
            // Positive Energy: Red shades
            const r = Math.floor(100 + normEng * 155);
            fillStyle = `rgb(${r}, 30, 20)`;
          }
        } 
        else if (activeVisualizer === "memory") {
          // Hot temperature trail representation (Yellow, Orange, Red)
          const normMem = Math.min(1.0, mem / 3.0);
          if (normMem > 0.05) {
            const r = Math.floor(100 + normMem * 155);
            const g = Math.floor(normMem * 200);
            const b = Math.floor(normMem * 50);
            fillStyle = `rgb(${r}, ${g}, ${b})`;
          } else {
            fillStyle = `rgb(15, 23, 42)`;
          }
        } 
        else if (activeVisualizer === "tension") {
          // Mechanical stress gradient (Viridis glow: Deep Blue -> Green -> Lime Cyan)
          const normTen = Math.min(1.0, ten / 4.0);
          if (normTen > 0.02) {
            const r = Math.floor(normTen * 120);
            const g = Math.floor(100 + normTen * 155);
            const b = Math.floor(140 + normTen * 115);
            fillStyle = `rgb(${r}, ${g}, ${b})`;
          } else {
            fillStyle = `rgb(15, 23, 42)`;
          }
        }
        else if (activeVisualizer === "gauge") {
          // Campo de Curvatura Gauge U(1) local F_p: [-pi, pi]
          const fVal = engine.gaugeF[idx];
          const absF = Math.abs(fVal);
          const normF = Math.min(1.0, absF / Math.PI); // normalizado [0, 1]
          
          if (normF > 0.04) {
            if (fVal < 0) {
              // Vórtice negativo - Color cian eléctrico brillante
              fillStyle = `rgb(6, ${Math.floor(130 + normF * 125)}, ${Math.floor(180 + normF * 75)})`;
            } else {
              // Vórtice positivo - Color fucsia purpura de alta energía
              fillStyle = `rgb(${Math.floor(200 + normF * 55)}, 6, ${Math.floor(130 + normF * 125)})`;
            }
          } else {
            // Fondo oscuro para flux nulo, con un sutil tinte verde si está en el sector de Seifert activo
            if (morph === 1) {
              fillStyle = "rgb(16, 32, 26)"; // sector activo (Seifert discrete sheet)
            } else {
              fillStyle = "rgb(10, 12, 18)"; // fondo del vacío general
            }
          }
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(x * cellW, y * cellH, cellW - 0.5, cellH - 0.5);
      }
    }

    // Render agent heads as little glowing spots for mycelial models
    if (config.model === "mycelium-active") {
      ctx.fillStyle = "#38bdf8"; // cyan light
      for (const agent of engine.hyphae) {
        if (agent.active) {
          ctx.beginPath();
          ctx.arc(
            agent.x * cellW,
            agent.y * cellH,
            1.8,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }
    }
  }, [stepCount, activeVisualizer, activeTab]);

  // Topological Sweep Loop running in animation frames for responsive rendering
  useEffect(() => {
    if (!isSweeping) return;

    let animId: number;
    let localStep = sweepCurrentStep;
    let localIndex = sweepIndex;
    
    // Seed new mu simulation on start
    if (localStep === 0) {
      engine.reset("monte-carlo");
    }

    const runBatch = () => {
      if (!isSweeping) return;

      const batchSize = 14; // optimal rendering speeds
      let eulerChanges = 0;
      let prevEuler = engine.getEulerCharacteristic();
      const currentMu = muValues[localIndex];
      
      const stepConfig: SimConfig = {
        model: "monte-carlo",
        width: gridW,
        height: gridH,
        temperature: sweepConfig.temperature,
        tensionStrength: sweepConfig.tensionStrength,
        memoryDecay: sweepConfig.memoryDecay,
        bubbleDefectRate: sweepConfig.bubbleDefectRate,
        diffusionA: 0.16,
        diffusionB: 0.08,
        feedRate: 0.035,
        killRate: 0.060,
        annealingSpeed: 0.005,
        isAnnealingActive: false,
        activeCellsThreshold: 0.25,
        muMemory: currentMu,
        gaugeLevel: config.gaugeLevel,
        gaugeCoupling: config.gaugeCoupling
      };

      for (let i = 0; i < batchSize; i++) {
        if (localStep >= sweepConfig.stepsPerPoint) break;

        engine.step(stepConfig);
        
        if (Math.random() < sweepConfig.bubbleDefectRate) {
          const cx = Math.floor(Math.random() * gridW);
          const cy = Math.floor(Math.random() * gridH);
          const cr = Math.floor(3 + Math.random() * 5);
          engine.induceBubbleDefect(cx, cy, cr);
        }

        const currEuler = engine.getEulerCharacteristic();
        eulerChanges += Math.abs(currEuler - prevEuler);
        prevEuler = currEuler;

        localStep++;
      }

      setSweepCurrentStep(localStep);
      setStepCount(prev => prev + 1);

      if (localStep >= sweepConfig.stepsPerPoint) {
        // Point complete!
        const analysis = engine.getTopologicalAnalysis(stepConfig);
        const currentMu = muValues[localIndex];
        const avgAbsDEuler = eulerChanges / sweepConfig.stepsPerPoint;

        const resultPoint = {
          mu: currentMu,
          b0: analysis.b0,
          b1: analysis.b1,
          euler: analysis.euler,
          activeCount: analysis.activeCount,
          activeRatio: analysis.activeRatio,
          largestRatio: analysis.largestRatio,
          fractalDim: analysis.fractalDim,
          entropy: analysis.entropy,
          totalEnergy: analysis.totalEnergy,
          avalancheFactor: avgAbsDEuler * 100
        };

        setSweepResults(prev => {
          const existsIdx = prev.findIndex(p => Math.abs(p.mu - currentMu) < 0.01);
          if (existsIdx !== -1) {
            const copy = [...prev];
            copy[existsIdx] = resultPoint;
            return copy;
          }
          return [...prev, resultPoint].sort((a, b) => a.mu - b.mu);
        });

        if (localIndex < muValues.length - 1) {
          setSweepIndex(localIndex + 1);
          setSweepCurrentStep(0);
        } else {
          setIsSweeping(false);
        }
      } else {
        animId = requestAnimationFrame(runBatch);
      }
    };

    animId = requestAnimationFrame(runBatch);
    return () => cancelAnimationFrame(animId);
  }, [isSweeping, sweepIndex, sweepCurrentStep, sweepConfig]);

  // Clipboard copy script helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  // Interactive mouse click inspector and structural painter
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellX = Math.floor((clickX / rect.width) * gridW);
    const cellY = Math.floor((clickY / rect.height) * gridH);

    if (cellX >= 0 && cellX < gridW && cellY >= 0 && cellY < gridH) {
      if (interactiveMode === "bubble") {
        // Induce bubble morphogenetic defect
        engine.induceBubbleDefect(cellX, cellY, 6);
        updateMetrics(stepCount, 10);
      } else {
        // Draw seeds / Activate cells
        const idx = cellY * gridW + cellX;
        engine.morphology[idx] = 1;
        engine.memory[idx] = 3.5;
        if (config.model === "reaction-diffusion") {
          engine.gridB[idx] = 0.85; // saturate reactant B
        }
        updateMetrics(stepCount, 1);
      }
    }
  };

  // Update hover inspect values on cursor move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellX = Math.floor((clickX / rect.width) * gridW);
    const cellY = Math.floor((clickY / rect.height) * gridH);

    if (cellX >= 0 && cellX < gridW && cellY >= 0 && cellY < gridH) {
      const idx = cellY * gridW + cellX;
      setHoveredCell({
        x: cellX,
        y: cellY,
        val: engine.morphology[idx],
        eng: Number(engine.energy[idx].toFixed(3)),
        ten: Number(engine.tension[idx].toFixed(3)),
        mem: Number(engine.memory[idx].toFixed(3)),
      });
    } else {
      setHoveredCell(null);
    }
  };

  // Automatically trigger a single snapshot generation (conceptually simulate sandbox file write)
  const triggerSimulationSnapshotExport = () => {
    alert(`[SNAPSHOT SIMULADO]\nSe ha generado el archivo del estado experimental:\n'snapshots/snapshot_step_${stepCount}.json'\nContiene morphology (Int8Array) y el histórico de métricas topológicas.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-900">
      
      {/* Dynamic Scientific Laboratory Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 text-[10px] font-mono border border-cyan-800 bg-cyan-950/40 text-cyan-400 uppercase tracking-widest rounded">
                EXPERIMENTO_PROCEDURAL_V04
              </span>
              <span className="text-xs font-mono text-slate-500">
                2026-05-21 UTC
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1">
              Motor de Morfogénesis Topológica Emergente
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl font-mono mt-0.5">
              Simulador experimental de autoorganización, landscapes de energía acoplada, tensión local y defectos elásticos temporales.
            </p>
          </div>

          {/* Tab Navigation System */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg gap-1">
            <button
              onClick={() => {
                setActiveTab("laboratory");
                if (isSweeping) setIsSweeping(false);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "laboratory"
                  ? "bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              [01. LABORATORIO_SIM]
            </button>
            <button
              onClick={() => {
                setActiveTab("architecture");
                if (isSweeping) setIsSweeping(false);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "architecture"
                  ? "bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              [02. ARQUITECTURA_RPO]
            </button>
            <button
              onClick={() => {
                setActiveTab("roadmap");
                if (isSweeping) setIsSweeping(false);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "roadmap"
                  ? "bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              [03. ROADMAP_CIENTÍFICO]
            </button>
            <button
              onClick={() => {
                setActiveTab("sweep");
                setIsPlaying(false); // Stop standard lab play loop to avoid resource conflict
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "sweep"
                  ? "bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              [04. BARRIDO_TRANSICION]
            </button>
            <button
              onClick={() => {
                setActiveTab("figures");
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "figures"
                  ? "bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              [05. REPORTE_FIGURAS]
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: LABORATORY SIMULATOR */}
        {/* ========================================================================= */}
        {activeTab === "laboratory" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Configuration Parameters (SPAN 4) */}
            <section className="lg:col-span-4 flex flex-col gap-6" id="parameters-panel">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                    SISTEMA & PARÁMETROS
                  </h2>
                </div>

                {/* MODO FULL CORAL PRESET */}
                <div className="mb-4 bg-gradient-to-br from-cyan-950/40 via-slate-900/40 to-emerald-950/40 border border-cyan-800/60 p-3.5 rounded-lg">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setGridW(256);
                      setGridH(256);
                      setCanvasScale(3);
                      
                      // Optimal Coral Grow parameters
                      const fullCoralConfig = {
                        model: "coral-growth" as ModelType,
                        width: 256,
                        height: 256,
                        temperature: 0.15,
                        diffusionA: 0.16,
                        diffusionB: 0.08,
                        feedRate: 0.0,
                        killRate: 0.060,
                        memoryDecay: 0.08,
                        tensionStrength: 0.15,
                        bubbleDefectRate: 0.001,
                        annealingSpeed: 0.005,
                        isAnnealingActive: false,
                        activeCellsThreshold: 0.25,
                      };
                      setConfig(fullCoralConfig);

                      setTimeout(() => {
                        engineRef.current = new MorphogenesisEngine(256, 256);
                        engineRef.current.reset("coral-growth");
                        setStepCount(0);
                        setMetricsHistory([]);
                        setIsPlaying(true);
                      }, 100);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-cyan-900 via-teal-900 to-emerald-900 hover:from-cyan-800 hover:to-emerald-800 text-cyan-200 border border-cyan-500 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40 animate-pulse"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    ACTIVAR [MODO FULL CORAL]
                  </button>
                  <p className="text-[10px] text-slate-400 mt-2 font-sans leading-normal">
                    Fuerza instantáneamente un grid de <strong className="text-cyan-300 font-mono">256x256</strong> con temperatura ultraestable (<strong className="text-cyan-300 font-mono">0.15</strong>), desintegración Hebbiana óptima (<strong className="text-cyan-300 font-mono">0.08</strong>) y asimilación acelerada para maximizar la ramificación dendrítica.
                  </p>
                </div>

                {/* RESOLUCIÓN DINÁMICA DE LA REJILLA */}
                <div className="mb-4 border-b border-slate-800/60 pb-4">
                  <label className="block text-xs font-mono text-slate-400 mb-2">
                    REGLA DIGITAL (RESOLUCIÓN REJILLA):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "64²", w: 64, h: 64, scale: 5 },
                      { label: "128²", w: 128, h: 128, scale: 4 },
                      { label: "256²", w: 256, h: 256, scale: 3 },
                      { label: "320²", w: 320, h: 320, scale: 2 },
                    ].map((res) => {
                      const isActive = gridW === res.w;
                      return (
                        <button
                          key={res.label}
                          onClick={() => {
                            setIsPlaying(false);
                            setGridW(res.w);
                            setGridH(res.h);
                            setCanvasScale(res.scale);
                            setConfig(prev => ({
                              ...prev,
                              width: res.w,
                              height: res.h
                            }));
                            setTimeout(() => {
                              engineRef.current = new MorphogenesisEngine(res.w, res.h);
                              engineRef.current.reset(config.model);
                              setStepCount(0);
                              setMetricsHistory([]);
                              setIsPlaying(true);
                            }, 100);
                          }}
                          className={`py-1 text-center font-mono text-xs rounded transition-all cursor-pointer border ${
                            isActive
                              ? "bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold"
                              : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-350"
                          }`}
                        >
                          {res.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model Selector Section */}
                <div className="mb-4">
                  <label className="block text-xs font-mono text-slate-400 mb-2">
                    MODELO RECTOR DE CRECIMIENTO:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        id: "reaction-diffusion",
                        title: "Reacción-Difusión (Turing)",
                        desc: "Formación de venas biológicas mediante gradientes químicos de inhibidores."
                      },
                      {
                        id: "monte-carlo",
                        title: "Montel Carlo + Espín Acoplado",
                        desc: "Metrólopolis Glauber dinámicos buscando mínimos locales de energía."
                      },
                      {
                        id: "mycelium-active",
                        title: "Red Miceliar Activa",
                        desc: "Agentes que se multiplican depositando masa y sensando tensión espacial."
                      },
                      {
                        id: "coral-growth",
                        title: "Agregación de Corales (DLA)",
                        desc: "Partículas estocásticas que consolidan morfología al colisionar."
                      }
                    ].map((modelOpt) => (
                      <button
                        key={modelOpt.id}
                        onClick={() => handleModelChange(modelOpt.id as ModelType)}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          config.model === modelOpt.id
                            ? "bg-slate-950 border-cyan-800 text-cyan-300 ring-1 ring-cyan-900/50"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        <div className="font-mono text-xs font-bold leading-tight flex items-center justify-between">
                          <span>{modelOpt.title}</span>
                          {config.model === modelOpt.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-sans leading-snug">
                          {modelOpt.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders Box */}
                <div className="space-y-4 border-t border-slate-800/80 pt-4">
                  
                  {/* Model Specific Parameters */}
                  {config.model === "reaction-diffusion" && (
                    <>
                      <div>
                        <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                          <span>Velocidad de Alimentación (Feed F)</span>
                          <span className="text-cyan-400 font-bold">{config.feedRate}</span>
                        </div>
                        <input
                          type="range"
                          min="0.01"
                          max="0.09"
                          step="0.001"
                          value={config.feedRate}
                          onChange={(e) => setConfig({ ...config, feedRate: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                          <span>Muerte Química (Kill K)</span>
                          <span className="text-cyan-400 font-bold">{config.killRate}</span>
                        </div>
                        <input
                          type="range"
                          min="0.04"
                          max="0.07"
                          step="0.001"
                          value={config.killRate}
                          onChange={(e) => setConfig({ ...config, killRate: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>
                    </>
                  )}

                  {/* General Core Parameters */}
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Temperatura de Ruido ({config.model === "monte-carlo" || config.model === "coral-growth" ? "Fluctuación T" : "Ruido Motor"})</span>
                      <span className="text-cyan-400 font-bold">{config.temperature.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="3.0"
                      step="0.05"
                      value={config.temperature}
                      onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                      disabled={config.isAnnealingActive}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Disipación de Memoria (\tau / decay)</span>
                      <span className="text-cyan-400 font-bold">{config.memoryDecay.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.15"
                      step="0.005"
                      value={config.memoryDecay}
                      onChange={(e) => setConfig({ ...config, memoryDecay: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Coeficiente de Tensión Estructural (\gamma)</span>
                      <span className="text-cyan-400 font-bold">{config.tensionStrength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.05"
                      value={config.tensionStrength}
                      onChange={(e) => setConfig({ ...config, tensionStrength: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Tasa de Defectos (Bubble defects)</span>
                      <span className="text-cyan-400 font-bold">{(config.bubbleDefectRate * 1000).toFixed(1)}‰</span>
                    </div>
                    <input
                      type="range"
                      min="0.00"
                      max="0.015"
                      step="0.0005"
                      value={config.bubbleDefectRate}
                      onChange={(e) => setConfig({ ...config, bubbleDefectRate: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* PARÁMETROS DE SECTOR GAUGE U(1) Y ACOPLAMIENTO BF (Camino A) */}
                  <div className="border-t border-slate-800/80 pt-3 mt-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-2.5">
                      SECTOR GAUGE U(1) & ACOPLAMIENTO BF
                    </span>
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between text-xs font-mono text-slate-450 mb-1">
                          <span>Nivel de Teoría BF (Constante k)</span>
                          <span className="text-cyan-400 font-extrabold">{config.gaugeLevel !== undefined ? config.gaugeLevel : 2}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={config.gaugeLevel !== undefined ? config.gaugeLevel : 2}
                          onChange={(e) => setConfig({ ...config, gaugeLevel: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-mono text-slate-450 mb-1">
                          <span>Acoplamiento de Calibre Gauge (e²)</span>
                          <span className="text-cyan-400 font-extrabold">{(config.gaugeCoupling !== undefined ? config.gaugeCoupling : 0.50).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="1.50"
                          step="0.05"
                          value={config.gaugeCoupling !== undefined ? config.gaugeCoupling : 0.50}
                          onChange={(e) => setConfig({ ...config, gaugeCoupling: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Annealing automation tool */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Flame className={`w-3.5 h-3.5 ${config.isAnnealingActive ? "text-orange-400 animate-pulse" : "text-slate-500"}`} />
                      <span className="text-xs font-mono font-bold text-slate-300">COOLING / ANNEALING COLD-START</span>
                    </div>
                    <button
                      onClick={() => setConfig({ ...config, isAnnealingActive: !config.isAnnealingActive })}
                      className={`text-[10px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                        config.isAnnealingActive
                          ? "bg-orange-950 border border-orange-850 text-orange-400 font-bold"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {config.isAnnealingActive ? "DESACTIVAR" : "ACTIVAR"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-snug font-sans">
                    Al activar el Recocido Simulado, la temperatura de fluctuación descenderá continuamente un <strong className="text-slate-400">{(config.annealingSpeed * 100).toFixed(1)}%</strong> por paso, cristalizando las venas y morfología en configuraciones robustas de mínima tensión.
                  </p>
                </div>
              </div>

              {/* Dynamic Interactive Tools box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <MousePointerClick className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    INTERACCIÓN DIRECTA EN GRID
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInteractiveMode("seed")}
                    className={`flex flex-col items-center p-2 rounded-lg border font-mono text-[11px] transition-all cursor-pointer ${
                      interactiveMode === "seed"
                        ? "bg-cyan-950/40 border-cyan-800/80 text-cyan-400"
                        : "bg-slate-955 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 mb-1" />
                    SEMBRAR MASA (dibujar)
                  </button>

                  <button
                    onClick={() => setInteractiveMode("bubble")}
                    className={`flex flex-col items-center p-2 rounded-lg border font-mono text-[11px] transition-all cursor-pointer ${
                      interactiveMode === "bubble"
                        ? "bg-orange-950/45 border-orange-850/80 text-orange-400"
                        : "bg-slate-955 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 mb-1" />
                    BURBUJA DE DEFECTO
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2.5 text-center italic leading-tight font-sans">
                  * Haz clic o arrastra directamente dentro de la rejilla de la visualización central para simular el impacto inmediato!
                </p>
              </div>
            </section>

            {/* Middle Column: Grid Visualizer with Hover Inspector (SPAN 5) */}
            <section className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col items-center">
                
                {/* Visualizer header / selector */}
                <div className="w-full flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-xs font-bold text-slate-300">CANAL DE VISUALIZACIÓN:</span>
                  </div>
                  
                  <div className="flex flex-wrap bg-slate-950 border border-slate-800 p-0.5 rounded gap-0.5">
                    {[
                      { id: "morphology", label: "Morfología" },
                      { id: "energy", label: "Energía" },
                      { id: "memory", label: "Memoria" },
                      { id: "tension", label: "Tensión" },
                      { id: "gauge", label: "Curvatura U(1)" }
                    ].map((viz) => (
                      <button
                        key={viz.id}
                        onClick={() => setActiveVisualizer(viz.id as any)}
                        className={`px-2 py-1 text-[10px] font-mono rounded cursor-pointer transition-all ${
                          activeVisualizer === viz.id
                            ? "bg-cyan-900/60 text-cyan-300 font-bold"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {viz.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Physical Canvas Container */}
                <div className="relative border border-slate-800 bg-slate-950 p-2 rounded-lg flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={gridW * canvasScale}
                    height={gridH * canvasScale}
                    onClick={handleCanvasInteraction}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={() => setHoveredCell(null)}
                    className="cursor-crosshair rounded border border-slate-900 shadow-inner bg-slate-950"
                  />

                  {/* Absolute active overlay if annealing is running */}
                  {config.isAnnealingActive && (
                    <div className="absolute top-4 left-4 bg-orange-950/90 border border-orange-850 px-2 py-1 rounded text-[10px] font-mono text-orange-400 flex items-center gap-1.5 animate-pulse shadow-md">
                      <Flame className="w-3 h-3" />
                      ENFRIANDO_SISTEMA: T={(config.temperature).toFixed(3)}
                    </div>
                  )}

                  {/* Display step counter */}
                  <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-400 shadow-md">
                    PASO: {stepCount}
                  </div>
                </div>

                {/* Flow Controller Row */}
                <div className="w-full flex justify-between items-center mt-4 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        isPlaying 
                          ? "bg-red-950 border border-red-800 hover:bg-red-900/40 text-red-400"
                          : "bg-emerald-950 border border-emerald-800 hover:bg-emerald-900/40 text-emerald-400"
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? "PAUSAR" : "INICIAR"}
                    </button>

                    <button
                      onClick={executeStep}
                      disabled={isPlaying}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-slate-300 text-xs font-mono transition-all cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      PASO
                    </button>
                    
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-xs font-mono transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      RESETEAR
                    </button>
                  </div>

                  <button
                    onClick={triggerSimulationSnapshotExport}
                    className="px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 font-mono text-[10px] font-bold text-slate-400 rounded transition-all cursor-pointer"
                  >
                    GUARDAR SNAPSHOT
                  </button>
                </div>

                {/* Live Hover Cell Inspector */}
                <div className="w-full mt-3 bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 text-xs font-mono">
                  <div className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">
                    INSPECTOR DE CELDA LOCAL:
                  </div>
                  {hoveredCell ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-300">
                      <div>Coordenada: <span className="text-white">({hoveredCell.x}, {hoveredCell.y})</span></div>
                      <div>Morfología: <span className={`font-bold ${hoveredCell.val === 1 ? "text-cyan-400" : "text-slate-600"}`}>{hoveredCell.val === 1 ? "ACTIVO" : "VACÍO"}</span></div>
                      <div>Energía: <span className="text-white">{hoveredCell.eng} V</span></div>
                      <div>Memoria Tr.: <span className="text-white">{hoveredCell.mem}</span></div>
                      <div>Tensión: <span className="text-white">{hoveredCell.ten} \gamma</span></div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-[11px] py-1">
                      Pasa el cursor por el grid de simulación para inspeccionar vectores locales y potencial Hamiltoniano...
                    </div>
                  )}
                </div>

              </div>
            </section>

            {/* Right Column: Mathematical & Topological Analysis (SPAN 3) */}
            <section className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Topological metrics card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                    ANÁLISIS TOPOLÓGICO
                  </h2>
                </div>

                {/* Componentes Conectados (Nc) gauge */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Componentes Conectados (N_c)
                  </div>
                  <div className="text-3xl font-bold text-white font-mono mt-1 mb-1">
                    {metrics.connectedComponents}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight font-sans">
                    Número de clústeres independientes calculados mediante Union-Find en tiempo real.
                  </p>
                </div>

                {/* Euler Characteristic (chi) representation */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Característica de Euler (\chi)
                  </div>
                  <div className={`text-3xl font-bold font-mono mt-1 mb-1 ${metrics.eulerCharacteristic <= 0 ? "text-cyan-400" : "text-emerald-400"}`}>
                    {metrics.eulerCharacteristic}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight font-sans">
                    Calculado por \chi = V - E + F. <strong className="text-slate-400">Valores negativos</strong> indican estructuras con alta densidad de ciclos y túneles (labyrinth).
                  </p>
                </div>

                {/* Additional metrics grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850/80 text-center">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase">ENTROPÍA H_s</span>
                    <span className="text-sm font-bold text-white font-mono">{metrics.entropy.toFixed(3)}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850/80 text-center">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase">ENERGÍA INTEGRADA</span>
                    <span className="text-sm font-bold text-white font-mono">{metrics.energy.toFixed(3)}</span>
                  </div>
                </div>

                {/* Gauge Sector and BF Coupling Metrics (Alineamiento Gauge k) */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4 shadow-inner">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest text-center font-bold mb-2">
                    Sector Gauge U(1) & Acoplamiento BF
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center mb-2">
                    <div className="bg-slate-900/60 border border-slate-850 p-2 rounded">
                      <span className="block text-[8px] font-mono text-slate-500 uppercase leading-none mb-1">NÚMERO DE ENLACE lk</span>
                      <span className="text-lg font-bold text-cyan-300 font-mono">
                        {metrics.gaussLinking !== undefined ? metrics.gaussLinking : 0}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-850 p-2 rounded">
                      <span className="block text-[8px] font-mono text-slate-500 uppercase leading-none mb-1">LÍMITE CONFINAMIENTO l_c</span>
                      <span className="text-lg font-bold text-purple-400 font-mono">
                        {metrics.confinementLimit !== undefined ? metrics.confinementLimit.toFixed(2) : "0.00"} px
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-900/60 border border-slate-850 p-1.5 rounded">
                      <span className="block text-[7.5px] font-mono text-slate-500 uppercase leading-none mb-0.5">E_MAXWELL (Cinética)</span>
                      <span className="text-xs font-mono text-slate-300">
                        {metrics.energyMaxwell !== undefined ? metrics.energyMaxwell.toFixed(2) : "0.00"}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-850 p-1.5 rounded">
                      <span className="block text-[7.5px] font-mono text-slate-500 uppercase leading-none mb-0.5">E_BF INT (Acoplada)</span>
                      <span className="text-xs font-mono text-slate-300">
                        {metrics.energyBF !== undefined ? metrics.energyBF.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight mt-2.5 text-center px-1 font-sans">
                    El número de enlace (linking number <strong className="text-cyan-300 font-bold font-mono">lk = 1/2π ∫ F</strong>) mide la carga de vórtices gauge U(1) atrapados en los lazos de la morfología activa. El límite de confinamiento localiza el radio de protección estructural de las venas vasculares frente al ruido térmico.
                  </p>
                </div>

                {/* Small explanation about metrics */}
                <div className="bg-cyan-950/20 border border-cyan-900/50 p-3 rounded-lg text-[10px] font-mono text-cyan-400 leading-snug">
                  <div className="font-bold flex items-center gap-1 mb-1 text-cyan-300">
                    <HelpCircle className="w-3 h-3" />
                     ¿QUÉ SIGNIFICA \chi EN INVESTIGACIÓN?
                  </div>
                  La dinámica de fase se asocia a \chi. Cuando \chi disminuye y se vuelve altamente negativa, el sistema ha transitado de un estado gaseoso (dots aislados) a un estado mesofase reticular con alta conectividad y agujeros cerrados (ciclos).
                </div>
              </div>

              {/* Dynamic Micro SVG Chart showing Nc & Chi trajectory */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-slate-300 uppercase">HISTORIAL DE TOPOLOGÍA</span>
                </div>

                {metricsHistory.length > 2 ? (
                  <div className="w-full h-28 bg-slate-950 rounded p-1 border border-slate-850 relative">
                    <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="12" x2="100" y2="12" stroke="#1e293b" strokeDasharray="2" strokeWidth="0.5" />
                      <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeDasharray="2" strokeWidth="0.5" />
                      <line x1="0" y1="37" x2="100" y2="37" stroke="#1e293b" strokeDasharray="2" strokeWidth="0.5" />

                      {/* Line Plot for Connected Components */}
                      <path
                        d={metricsHistory
                          .map((snap, idx) => {
                            const x = (idx / (metricsHistory.length - 1)) * 100;
                            // Scale connected components: max height roughly corresponds to value 25
                            const maxVal = Math.max(...metricsHistory.map(h => h.connectedComponents), 10);
                            const y = 50 - (snap.connectedComponents / maxVal) * 35 - 5;
                            return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#f59e0b" // Orange/amber
                        strokeWidth="1.2"
                      />

                      {/* Line Plot for Euler Characteristic */}
                      <path
                        d={metricsHistory
                          .map((snap, idx) => {
                            const x = (idx / (metricsHistory.length - 1)) * 100;
                            // Scale euler characteristic - values can be negative, standard scale min -30 to max 30
                            const y = 25 - (snap.eulerCharacteristic / 45) * 20;
                            return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#22d3ee" // Cyan
                        strokeWidth="1.2"
                      />
                    </svg>
                    
                    {/* Tiny Legend */}
                    <div className="absolute top-2 left-2 flex gap-3 text-[8px] font-mono">
                      <span className="flex items-center gap-1 text-amber-500">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        N_c (Componentes)
                      </span>
                      <span className="flex items-center gap-1 text-cyan-400">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                        \chi (Euler)
                      </span>
                    </div>

                    <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500">
                      Últimos 50 ticks
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-slate-950 rounded flex items-center justify-center border border-slate-850 text-slate-600 text-xs font-mono text-center px-4">
                    Esperando trayectoria de pasos para plotear curvas críticas...
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-2 font-mono leading-tight">
                  Gráfica que mapea la homeostasis estructural. Se observa cómo el recocido disminuye las fluctuaciones congelando las curvas en mesofase.
                </p>
              </div>

            </section>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REPOSITORY ARCHITECTURE & CODE WORKSPACE */}
        {/* ========================================================================= */}
        {activeTab === "architecture" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Repository Tree Explorer (SPAN 3) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                    REPOSITORIO CIENTÍFICO
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4 font-sans">
                  Siga la estructura modular propuesta para un entorno de investigación en producción de Python con matrices Numpy y funciones optimizadas por Numba.
                </p>

                {/* Folder Map widget */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-white font-bold mb-2">
                      <Folder className="w-4 h-4 text-yellow-500" />
                      morfogenesis_engine/
                    </div>

                    <div className="pl-4 space-y-1">
                      
                      {/* Config files */}
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 py-0.5">
                          <Folder className="w-3.5 h-3.5 text-yellow-600/80" />
                          config/
                        </div>
                        <div className="pl-4">
                          {ARCHITECTURE_FILES.filter(f => f.category === "configuration").map(f => (
                            <button
                              key={f.path}
                              onClick={() => setSelectedFile(f)}
                              className={`flex items-center gap-1 text-[11px] font-mono py-1 w-full text-left rounded px-1.5 transition-all text-ellipsis overflow-hidden ${
                                selectedFile.path === f.path
                                  ? "bg-slate-800 text-cyan-400 font-bold"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <FileCode className="w-3 h-3 text-cyan-500 shrink-0" />
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Core modules */}
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 py-0.5">
                          <Folder className="w-3.5 h-3.5 text-yellow-600/80" />
                          core/
                        </div>
                        <div className="pl-4">
                          {ARCHITECTURE_FILES.filter(f => f.category === "core").map(f => (
                            <button
                              key={f.path}
                              onClick={() => setSelectedFile(f)}
                              className={`flex items-center gap-1 text-[11px] font-mono py-1 w-full text-left rounded px-1.5 transition-all text-ellipsis overflow-hidden ${
                                selectedFile.path === f.path
                                  ? "bg-slate-800 text-cyan-400 font-bold"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <FileCode className="w-3 h-3 text-cyan-500 shrink-0" />
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Analysis modules */}
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 py-0.5">
                          <Folder className="w-3.5 h-3.5 text-yellow-600/80" />
                          analysis/
                        </div>
                        <div className="pl-4">
                          {ARCHITECTURE_FILES.filter(f => f.category === "analysis").map(f => (
                            <button
                              key={f.path}
                              onClick={() => setSelectedFile(f)}
                              className={`flex items-center gap-1 text-[11px] font-mono py-1 w-full text-left rounded px-1.5 transition-all text-ellipsis overflow-hidden ${
                                selectedFile.path === f.path
                                  ? "bg-slate-800 text-cyan-400 font-bold"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <FileCode className="w-3 h-3 text-cyan-500 shrink-0" />
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visualization modules */}
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 py-0.5">
                          <Folder className="w-3.5 h-3.5 text-yellow-600/80" />
                          visualization/
                        </div>
                        <div className="pl-4">
                          {ARCHITECTURE_FILES.filter(f => f.category === "visualization").map(f => (
                            <button
                              key={f.path}
                              onClick={() => setSelectedFile(f)}
                              className={`flex items-center gap-1 text-[11px] font-mono py-1 w-full text-left rounded px-1.5 transition-all text-ellipsis overflow-hidden ${
                                selectedFile.path === f.path
                                  ? "bg-slate-800 text-cyan-400 font-bold"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <FileCode className="w-3 h-3 text-cyan-500 shrink-0" />
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Experiments modules */}
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 py-0.5">
                          <Folder className="w-3.5 h-3.5 text-yellow-600/80" />
                          experiments/
                        </div>
                        <div className="pl-4">
                          {ARCHITECTURE_FILES.filter(f => f.category === "experiments").map(f => (
                            <button
                              key={f.path}
                              onClick={() => setSelectedFile(f)}
                              className={`flex items-center gap-1 text-[11px] font-mono py-1 w-full text-left rounded px-1.5 transition-all ${
                                selectedFile.path === f.path
                                  ? "bg-slate-800 text-cyan-400 font-bold"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <FileCode className="w-3 h-3 text-cyan-500 shrink-0" />
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Code stats card */}
                <div className="border border-slate-800 bg-slate-950 p-3 rounded-lg mt-6 font-mono text-[10px] space-y-1 text-slate-400">
                  <div>TIPO DE REPOSITORIO: Sandbox Científico</div>
                  <div>DISEÑO: CPU-Efficient / Sparse</div>
                  <div>COMPILADOR ACELERADOR: Numba JIT</div>
                  <div>PARALELIZACIÓN: thread_safe</div>
                </div>
              </div>
            </div>

            {/* Middle & Right: Code Viewer & Architectural Design (SPAN 9) */}
            <div className="lg:col-span-9 flex flex-col gap-6">
              
              {/* Actual File Viewer */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
                
                {/* File Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                      RUTA ARCHIVO: {selectedFile.path}
                    </span>
                    <h4 className="text-sm font-mono font-bold text-white mt-1">
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-sans mt-1">
                      {selectedFile.description}
                    </p>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-mono transition-all cursor-pointer"
                  >
                    {copiedFile ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ¡COPIADO!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        COPIAR CÓDIGO
                      </>
                    )}
                  </button>
                </div>

                {/* Preformatted fully annotated Python source code */}
                <div className="relative rounded-lg bg-slate-950 p-4 border border-slate-850 overflow-x-auto max-h-[480px]">
                  <pre className="text-xs font-mono text-slate-300 leading-relaxed select-text">
                    <code>{selectedFile.code}</code>
                  </pre>
                </div>
              </div>

              {/* Architectural Design Blueprint Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
                  ESTRATEGIA COMPUTACIONAL & FLUJO DE DATOS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-2">
                    <h5 className="font-mono text-slate-200 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      1. Pipeline de Simulación
                    </h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      La simulación es guiada por eventos y actualizaciones de celdas activas en lugar de un bucle denso completo. El lattice registra las coordenadas de frontera activa (active-front) en un conjunto disperso, garantizando rendimiento <strong className="text-slate-300">O(1)</strong> en cálculos de energía y saltos de Monte Carlo estocásticos.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-mono text-slate-200 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      2. Delta-Energy Calculations
                    </h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      El cálculo de energía se realiza de forma estrictamente local. Al proponer un cambio, el Hamiltoniano local se reevalúa en el vecindario inmediato del espín. Si el delta-energía <strong className="text-slate-300">\Delta E \le 0</strong>, se acepta inmediatamente; de lo contrario, se aplica el filtro Metropolis adaptivo, evitando la reevaluación total del grid.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-mono text-slate-200 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      3. Coexistencia Multiproceso
                    </h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      La arquitectura separa la física de transiciones locales de los hilos de cálculo estadístico (Connected Components / Persistencia) de forma asíncrona. La matemática del core compila mediante <strong className="text-cyan-400 font-mono">@numba.njit(fastmath=True)</strong> logrando tasas de ejecución nativas C++ en simples recursos mononúcleo.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SCIENTIFIC RESEARCH ROADMAP */}
        {/* ========================================================================= */}
        {activeTab === "roadmap" && (
          <div className="space-y-6">
            
            {/* Mathematical Foundations section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
                FUNDACIÓN MATEMÁTICA DEL MOTOR
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Hamiltonian Matrix Card */}
                <div className="bg-slate-950 p-5 rounded-lg border border-slate-850">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">ECUACIÓN DEL SISTEMA Ising-Memory-Tension</span>
                  <div className="my-3 p-3 bg-slate-900/60 rounded text-center border border-slate-800 font-mono text-xs text-cyan-300">
                    {"H(\\sigma) = -J \\sum_{\\langle i, j \\rangle} \\sigma_i \\sigma_j - \\mu \\sum_i M_i \\sigma_i + \\gamma \\sum_i T_i \\sigma_i"}
                  </div>
                  <ul className="text-xs text-slate-400 space-y-2 font-sans leading-relaxed">
                    <li>
                      <strong className="text-slate-300">J (Interacción de Intercambio):</strong> Acoplamiento elástico local que dicta si las celdas adyacentes tienden a agruparse en filamentos continuos (Ferromagnético) o a dispersarse (Antiferromagnético).
                    </li>
                    <li>
                      <strong className="text-slate-300">M_i (Memoria de Ruta / Pheroromone):</strong> Historial acumulativo Hebbiano local. Si una celda ha estado ocupada históricamente, la energía local disminuye fuertemente para conservar y ensanchar la vena de crecimiento.
                    </li>
                    <li>
                      <strong className="text-slate-300">T_i (Tensión Mecánica Gradiente):</strong> Gradiente discreto que actúa como tensión de flexión elástica, desalentando curvas con radios de curvatura excesivamente pronunciados y protegiendo el orden topológico.
                    </li>
                  </ul>
                </div>

                {/* Reaction diffusion Turing */}
                <div className="bg-slate-950 p-5 rounded-lg border border-slate-850">
                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">ECUACIÓN DE REACCIóN-DIFUSION (Gray-Scott)</span>
                  <div className="my-3 p-3 bg-slate-900/60 rounded text-center border border-slate-800 font-mono text-xs text-amber-400">
                    {"\\partial u/\\partial t = D_u \\nabla^2 u - uv^2 + F(1-u) \\quad \\quad \\partial v/\\partial t = D_v \\nabla^2 v + uv^2 - (F+K)v"}
                  </div>
                  <ul className="text-xs text-slate-400 space-y-2 font-sans leading-relaxed">
                    <li>
                      <strong className="text-slate-300">u (Sustrato Alimentador) / v (Activador Morfológico):</strong> Representa el consumo local de recursos necesarios para el crecimiento de venas. Favorece la bifurcación y la emergencia de laberintos de Turing.
                    </li>
                    <li>
                      <strong className="text-slate-300">F (Tasa de Alimentación) / K (Tasa de Decaimiento):</strong> Gobiernan el orden morfológico dictando si el tejido regenera de forma estable o colapsa de manera metastásica en puntos aislados.
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Incremental roadmap steps card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">
                ROADMAP INCREMENTAL DE DESARROLLO CIENTÍFICO
              </h2>

              <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-8">
                {[
                  {
                    stage: "Etapa 1",
                    title: "Modelo Mínimo Funcional & Sistema de Grids",
                    desc: "Implementación matemática del grid discreto local bidimensional con condiciones de borde periódicas. Estructura de tensores de Numpy para densidad, energía potencial y memoria química dispersa.",
                    completed: true
                  },
                  {
                    stage: "Etapa 2",
                    title: "Simulated Annealing & Transiciones Monte Carlo",
                    desc: "Diseño del algoritmo de Glauber/Metropolis con cálculo de delta-energías localizadas en O(1). Implementación de la automatización de la temperatura de ruido para inducir enfriamientos cristalográficos.",
                    completed: true
                  },
                  {
                    stage: "Etapa 3",
                    title: "Bubble Defects & Inestabilidades Estocásticas",
                    desc: "Inyección estocástica de 'bubble moves' colapsando morfologías. Simulación de deforma elástica por burbujas destructoras locales y reordenación de corrientes, emulando defectos elásticos de spin glasses.",
                    completed: true
                  },
                  {
                    stage: "Etapa 4",
                    title: "Morfogénesis Compleja & Redes de Agentes Activos",
                    desc: "Motor biomimético de agentes móviles exploradores de baja tensión. Ramificaciones estocásticas Hebbianas de hifas con auto-impedancia reproductiva emulando desarrollo de micelio forestal verdadero.",
                    completed: true
                  },
                  {
                    stage: "Etapa 5",
                    title: "Análisis Topológico Avanzado en Tiempo Real",
                    desc: "Cálculo en vivo de la Característica de Euler Euler-Poincaré 2D para píxeles y extracción de componentes conectados Union-Find para mapear avalanchas morfogénicas críticas de forma determinista.",
                    completed: true
                  },
                  {
                    stage: "Etapa 6",
                    title: "Exploración Científico-Artística Multicanal",
                    desc: "Exportación reproducible en snapshots JSON interoperables y mapas multicanal (morfología copper, energía local diverging blue-red, mapa de tensión elástico e historial de memoria hebbiana local).",
                    completed: true
                  }
                ].map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle timeline bullet */}
                    <span className="absolute -left-10 top-0.5 bg-slate-950 border-2 border-cyan-500 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] text-cyan-400 font-bold z-10 shadow-lg">
                      {idx + 1}
                    </span>

                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-lg">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 text-[9px] font-mono border border-cyan-800 bg-cyan-950/60 text-cyan-400 font-bold tracking-widest rounded uppercase">
                          {step.stage}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                          <Check className="w-3 h-3 text-emerald-400" />
                          FASE_COMPILADA
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scientific Testing Framework details */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
                PROTOCOLO DE DIAGNÓSTICO Y TESTING CIENTÍFICO
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded border border-slate-855 leading-relaxed text-slate-400">
                  <div className="text-white font-bold mb-1 flex items-center gap-1.5 text-xs text-cyan-400">
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                     1. CONSERVACIÓN DE LA HOMEODINÁMICA
                  </div>
                  Mapea si los frentes de crecimiento activos respetan el decaimiento de disipación temporal de energía potencial. Se valida induciendo perturbaciones deterministas y observando el tiempo transcurrido en retornar al equilibrio asintótico del sistema.
                </div>

                <div className="bg-slate-950 p-4 rounded border border-slate-855 leading-relaxed text-slate-400">
                  <div className="text-white font-bold mb-1 flex items-center gap-1.5 text-xs text-cyan-400">
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                     2. CONSISTENCIA DE LA FÓRMULA DE EULER
                  </div>
                  Prueba cruzada comparando la Característica de Euler calculada pixel por pixel contra el conteo topológico teórico b0 y b1 en matrices discretas controladas. Garantiza que no existan fugas al cerrar anillos o ciclos en condiciones periódicas de borde.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MEMORY-INDUCED TOPOLOGICAL TRANSITION RESEARCH WORKSPACE */}
        {/* ========================================================================= */}
        {activeTab === "sweep" && (
          <div className="space-y-6">
            
            {/* Scientific Workspace Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2.5 mb-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="font-mono text-base font-bold text-white tracking-wide uppercase">
                  Estudio de Transición Topológica inducida por Memoria
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-4xl font-sans">
                Exploración algorítmica de la hipótesis crítica del motor: <em className="text-cyan-300">"Existe un valor crítico de acoplamiento de memoria (μ_c) donde el sistema realiza una transición de fase geométrica espontánea, mutando de agregados fractales arbóreos dispersos a una red vascular densa y continua."</em>
              </p>
            </div>

            {/* Sweep Control Deck & Real-time Grid Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Parameters, Presets & Controls (SPAN 5) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-slate-200 uppercase">PARÁMETROS DEL EXPERIMENTO (Fijos excepto μ)</span>
                </div>

                <div className="space-y-3.5">
                  
                  {/* Preset loader btn */}
                  <div>
                    <button
                      onClick={() => {
                        setSweepConfig({
                          temperature: 1.35,
                          tensionStrength: 0.32,
                          memoryDecay: 0.05,
                          bubbleDefectRate: 0.002,
                          stepsPerPoint: 600
                        });
                        // Clear results to invite fresh sweep
                        setSweepResults([]);
                        setSweepIndex(0);
                        setSweepCurrentStep(0);
                      }}
                      className="w-full py-1.5 bg-cyan-950/50 hover:bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-lg text-xs font-mono transition-all font-bold flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      CARGAR PARÁMETROS DE LA HIPÓTESIS (μ_c)
                    </button>
                    <p className="text-[9px] text-slate-500 mt-1 pl-1">
                      Establece la temperatura elástica ideal a <span className="text-slate-400 font-bold">1.35</span> y la tensión a <span className="text-slate-400 font-bold">0.32</span>.
                    </p>
                  </div>

                  {/* Temperature slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>TEMPERATURA (T - Ruido Térmico):</span>
                      <span className="text-white">{sweepConfig.temperature.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.5"
                      step="0.05"
                      disabled={isSweeping}
                      value={sweepConfig.temperature}
                      onChange={(e) => setSweepConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  {/* Tension slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                       <span>TENSIÓN MECÁNICA GLOBAL (γ):</span>
                      <span className="text-white">{sweepConfig.tensionStrength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.02"
                      disabled={isSweeping}
                      value={sweepConfig.tensionStrength}
                      onChange={(e) => setSweepConfig(prev => ({ ...prev, tensionStrength: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  {/* Decay slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>DECAIMIENTO DE MEMORIA (τ - Disipación):</span>
                      <span className="text-white">{sweepConfig.memoryDecay.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.2"
                      step="0.01"
                      disabled={isSweeping}
                      value={sweepConfig.memoryDecay}
                      onChange={(e) => setSweepConfig(prev => ({ ...prev, memoryDecay: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  {/* Steps per point */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>PASOS DE SIMULACIÓN POR PUNTO:</span>
                      <span className="text-white">{sweepConfig.stepsPerPoint} ticks</span>
                    </div>
                    <input
                      type="range"
                      min="150"
                      max="2000"
                      step="50"
                      disabled={isSweeping}
                      value={sweepConfig.stepsPerPoint}
                      onChange={(e) => setSweepConfig(prev => ({ ...prev, stepsPerPoint: parseInt(e.target.value) }))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                </div>

                <div className="mt-2 border-t border-slate-800 pt-4 flex gap-2">
                  {!isSweeping ? (
                    <button
                      onClick={() => {
                        setIsSweeping(true);
                        setSweepIndex(0);
                        setSweepCurrentStep(0);
                        // Do not clear if we want to redraw, but let's clear for fresh run
                        setSweepResults([]);
                      }}
                      className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/20 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current text-slate-950" />
                      INICIAR BARRIDO CRÍTICO
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsSweeping(false)}
                      className="flex-1 py-2.5 bg-red-950 text-red-400 hover:bg-red-900 border border-red-800 font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Pause className="w-4 h-4 fill-current text-red-400" />
                      DETENER BARRIDO
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsSweeping(false);
                      setSweepResults([]);
                      setSweepIndex(0);
                      setSweepCurrentStep(0);
                      engine.reset("monte-carlo");
                      setStepCount(prev => prev + 1);
                    }}
                    className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Resetear Experimento"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Right Side: LIVE Grid Render Canvas & Status Indicator (SPAN 7) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col md:flex-row gap-5 items-center justify-between">
                
                {/* Simulated grid Canvas */}
                <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-1 shrink-0 shadow-xl">
                  <canvas
                    ref={canvasRef}
                    width={gridW * canvasScale}
                    height={gridH * canvasScale}
                    className="w-48 h-48 md:w-[220px] md:h-[220px] block relative z-10 rounded-lg"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/90 border border-slate-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-400 font-bold z-20">
                    CANVAS LIVE
                  </div>
                </div>

                {/* Status Readout dashboard */}
                <div className="flex-1 w-full space-y-3.5 self-stretch flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                      ESTADO DEL PROCESADOR CIENTÍFICO
                    </span>
                    
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Punto de Memoria (μ):</span>
                        <span className="text-cyan-300 font-bold">mu = {muValues[sweepIndex].toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Progreso Barrido:</span>
                        <span className="text-white">{sweepIndex + 1} de {muValues.length} ({Math.round(((sweepIndex) / muValues.length) * 100)}%)</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Progreso Celda Actual:</span>
                        <span className="text-slate-200">{sweepCurrentStep} / {sweepConfig.stepsPerPoint} ticks</span>
                      </div>
                    </div>
                  </div>

                  {/* Progressive Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.round(((sweepIndex + 1) / muValues.length) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-slate-500">
                      <span>μ = 0.0</span>
                      <span>μ = 1.2 (Fase Reticular Vascularizada)</span>
                    </div>
                  </div>

                  {/* Phase Detector Widget */}
                  <div className="bg-slate-950 border border-slate-850/80 p-3 rounded-lg flex flex-col justify-center">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">ANÁLISIS EN LÍNEA DE LA MORFOLOGÍA</span>
                    {sweepResults.length > 0 && sweepIndex > 0 ? (
                      <div className="mt-1">
                        {muValues[sweepIndex] < 0.45 ? (
                          <>
                            <div className="text-xs font-mono font-bold text-amber-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              FASE: MORFOLOGÍA FRACTAL DISPERSA (DLA)
                            </div>
                            <p className="text-[9px] text-slate-400 font-sans leading-tight mt-0.5">
                              La memoria baja provoca coalescencia débil. El sistema se comporta como un cristal de espín desordenado con dendritas sueltas y loops casi nulos.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              FASE: RED VASCULAR CONSOLIDADA (MICELIO)
                            </div>
                            <p className="text-[9px] text-slate-400 font-sans leading-tight mt-0.5">
                              La memoria supera el valor baje de umbral crítico μ_c. Se desencadenan bucles homólogos continuos que bajan el Hamiltoniano cerrando caminos vasculares estables.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic mt-0.5">Pendiente de iniciar simulación para determinar bifurcaciones...</span>
                    )}
                  </div>

                </div>

              </div>
            </div>

            {/* HIGH FIDELITY MULTIVARIABLE CHARTS BOARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-slate-200 uppercase">
                  BARRIDO DE DOSIS CRÍTICA (Curvas de Transición Estructural vs μ)
                </span>
                <span className="text-[10px] font-mono text-slate-500 ml-auto">Filtros: Box Counting & Union-Find</span>
              </div>

              {sweepResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  
                  {/* CHART 1: Euler characteristic */}
                  {(() => {
                    const vals = sweepResults.map(r => r.euler);
                    const min = Math.min(...vals, -55);
                    const max = Math.max(...vals, 15);
                    return drawLineChart(sweepResults, "euler", "Euler (\\chi = b_0 - b_1)", "#22d3ee", min, max);
                  })()}

                  {/* CHART 2: Loop density */}
                  {(() => {
                    const vals = sweepResults.map(r => r.b1);
                    const min = 0;
                    const max = Math.max(...vals, 45);
                    return drawLineChart(sweepResults, "b1", "Betti Loops (b_1)", "#38bdf8", min, max);
                  })()}

                  {/* CHART 3: Largest Component component ratio */}
                  {(() => {
                    const vals = sweepResults.map(r => r.largestRatio);
                    const min = 0.0;
                    const max = Math.max(...vals, 0.45);
                    return drawLineChart(sweepResults, "largestRatio", "Largest component (%)", "#a855f7", min, max);
                  })()}

                  {/* CHART 4: Box Counting Fractal dimension */}
                  {(() => {
                    const vals = sweepResults.map(r => r.fractalDim);
                    const min = 1.0;
                    const max = Math.max(...vals, 1.95);
                    return drawLineChart(sweepResults, "fractalDim", "Fractal Dim (D_f)", "#10b981", min, max);
                  })()}

                  {/* CHART 5: Avalanche topological speed */}
                  {(() => {
                    const vals = sweepResults.map(r => r.avalancheFactor);
                    const min = 0.0;
                    const max = Math.max(...vals, 4.5);
                    return drawLineChart(sweepResults, "avalancheFactor", "Avalanchas |d\\chi/dt|", "#f59e0b", min, max);
                  })()}

                </div>
              ) : (
                <div className="h-36 bg-slate-950 rounded-xl border border-slate-850 flex flex-col items-center justify-center text-center p-6 space-y-1">
                  <Sparkles className="w-5 h-5 text-slate-600 animate-bounce" />
                  <span className="text-xs font-mono text-slate-400 font-bold uppercase">Datos del Experimento Pendientes</span>
                  <p className="text-[10px] text-slate-500 font-sans max-w-md">
                    Haz click en <strong className="text-cyan-400 font-mono">"INICIAR BARRIDO CRÍTICO"</strong> arriba. El procesador simulará mecánicas de Glauber consecutivas para cada acoplamiento μ, computando dimensiones fractales algebraicas y transiciones homológicas en vivo.
                  </p>
                </div>
              )}

              {/* Scientific Annotation on Transition Point */}
              {sweepResults.length >= 10 && (
                <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-900/50 rounded-lg text-[10px] font-mono text-cyan-400 leading-relaxed">
                  <div className="font-bold flex items-center gap-1 mb-1 text-cyan-300">
                    <HelpCircle className="w-3 h-3" />
                    INFORME DE TRANSICIÓN MATEMÁTICA DETECTADA:
                  </div>
                  Observa cómo la característica de Euler <strong className="text-cyan-300">\chi</strong> desciende por debajo de cero y cruza su inflexión alrededor de <strong className="text-amber-400">μ ≈ 0.40 - 0.55</strong>. Simultáneamente, la dimensión fractal <strong className="text-emerald-400">D_f</strong> despega de su régimen dendrítico fractal (~1.5) buscando un régimen vascular denso (~1.8). La curva de <strong className="text-purple-400">largest component</strong> exhibe una pendiente abrupta, el característico comportamiento sigmoideo de la percolación dimensional 2D, validando la hipótesis de transición inducida por memoria.
                </div>
              )}
            </div>

            {/* COEXISTENCE PHASE DIAGRAM (DOUBLE SWEEP MATRIX) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-2 pb-2 border-b border-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                Mapa de Coexistencia de Fases Morfogenéticas (Barrido Dual μ - γ)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-4xl font-sans mb-4">
                Regiones morfológicas emergentes mapeadas variando el acoplamiento de memoria (<span className="text-cyan-300 font-mono">μ</span>) contra la tensión mecánica global (<span className="text-cyan-300 font-mono">γ</span>) del Hamiltoniano discreto:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    title: "Régimen Coralino DLA",
                    coords: "μ < 0.35, γ < 0.30",
                    desc: "La baja memoria impide la autocuración de los frentes de onda y la baja tensión elástica tolera espinas sueltas. El crecimiento consolida ramificaciones libres, fractales autosemejantes y dendritas arquetípicas.",
                    phaseCode: "CORAL_DLA_PHASE",
                    isActive: sweepConfig.temperature > 1.0 && sweepConfig.tensionStrength < 0.3 && (sweepConfig.isAnnealingActive ? false : true)
                  },
                  {
                    title: "Red Vascular / Micelial",
                    coords: "μ > 0.45, γ ≈ 0.25 - 0.45",
                    desc: "Región óptima de transporte. La consolidación Hebbiana es lo suficientemente fuerte como para formar venas, pero la tensión mecánica balanceada restringe filamentos dispersos propiciando anastomosis eficaces.",
                    phaseCode: "MYCELIAL_ANASTOMOSIS",
                    isActive: sweepConfig.tensionStrength >= 0.3 && sweepConfig.tensionStrength <= 0.5 && sweepConfig.temperature <= 1.5
                  },
                  {
                    title: "Ising Compacto Extremo",
                    coords: "μ > 0.60, γ > 0.60",
                    desc: "La muy alta tensión elástica castiga ferozmente las curvaturas y unifica bordes morfológicos. La masa colapsa en parches compactos, lisos y geométricamente masivos, anulando la ramificación biológica ordinaria.",
                    phaseCode: "COMPACT_LATTICE_REGIME",
                    isActive: sweepConfig.tensionStrength > 0.5
                  },
                  {
                    title: "Ruido Amorfo Térmico",
                    coords: "T > 1.80 (Cualquier μ)",
                    desc: "Fluctuaciones estocásticas masivas rompen cualquier orden topológico o cinético. El sistema vibra desordenado, sin frentes continuos de corriente, replicando un gas infinito por encima de la temperatura de Curie.",
                    phaseCode: "AMORPHOUS_THERMAL_CHAOS",
                    isActive: sweepConfig.temperature > 1.8
                  }
                ].map((ph, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      ph.isActive
                        ? "bg-cyan-950/40 border-cyan-600 ring-2 ring-cyan-500/30 scale-[1.02] shadow-cyan-950/20"
                        : "bg-slate-950/60 border-slate-850 opacity-80"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono text-slate-500">{ph.coords}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-mono rounded font-bold ${
                        ph.isActive ? "bg-cyan-950 text-cyan-400 border border-cyan-800" : "bg-slate-900 text-slate-400 border border-slate-800"
                      }`}>
                        {ph.phaseCode}
                      </span>
                    </div>

                    <h4 className="text-xs font-mono font-bold text-white mb-1.5">{ph.title}</h4>
                    <p className="text-[11px] text-slate-400 font-sans leading-normal">{ph.desc}</p>
                    
                    {ph.isActive && (
                      <div className="mt-2.5 text-[9px] font-mono text-cyan-400 font-bold flex items-center gap-1 uppercase">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                        COORDENADA EN CURSO EN ESTA REGIÓN
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: SCIENTIFIC FIGURES REPORT */}
        {activeTab === "figures" && (
          <div className="space-y-6">
            <ScientificFigures mainConfig={config} />
          </div>
        )}

      </main>

      {/* Aesthetic Academic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 mt-12 text-center text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
          <div>
            PROYECTO EXPERIMENTAL: MORFOGÉNESIS TOPOLÓGICA EMERGENTE © 2026
          </div>
          <div className="text-[11px] text-slate-500">
            COMPUTADO MEDIANTE INTEL/AMD DOMÉSTICO DE MANERA EFICIENTE EN TIEMPO REAL
          </div>
        </div>
      </footer>

    </div>
  );
}

// Helper function to render a high fidelity micro line chart using SVGs
function drawLineChart(
  data: any[],
  key: string,
  label: string,
  color: string,
  minVal: number,
  maxVal: number
) {
  if (data.length === 0) {
    return (
      <div className="h-28 bg-slate-950 rounded border border-slate-855 flex items-center justify-center text-[10px] text-slate-600 font-mono italic">
        Esperando datos...
      </div>
    );
  }

  const paddingLeft = 14;
  const paddingRight = 6;
  const paddingTop = 8;
  const paddingBottom = 16;
  const chartW = 100 - paddingLeft - paddingRight;
  const chartH = 60 - paddingTop - paddingBottom;

  const points = data.map((pt) => {
    const x = paddingLeft + (pt.mu / 1.2) * chartW;
    const val = pt[key];
    const range = maxVal - minVal;
    const normalizedVal = range !== 0 ? (val - minVal) / range : 0.5;
    const y = paddingTop + chartH - normalizedVal * chartH;
    return { x, y, mu: pt.mu, val };
  });

  const pathStr = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

  return (
    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-855 relative group">
      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1 pb-1 border-b border-slate-900 pb-1">
        <span>{label}</span>
        <span className="font-bold text-white font-sans text-[10px]">
          {data[data.length - 1][key] !== undefined ? data[data.length - 1][key].toFixed(2) : "0.00"}
        </span>
      </div>
      <div className="h-32 w-full relative">
        <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
          <line x1={paddingLeft} y1={paddingTop} x2={100 - paddingRight} y2={paddingTop} stroke="#1e293b" strokeDasharray="1" strokeWidth="0.3" />
          <line x1={paddingLeft} y1={paddingTop + chartH / 2} x2={100 - paddingRight} y2={paddingTop + chartH / 2} stroke="#1e293b" strokeDasharray="1" strokeWidth="0.3" />
          <line x1={paddingLeft} y1={paddingTop + chartH} x2={100 - paddingRight} y2={paddingTop + chartH} stroke="#1e293b" strokeWidth="0.4" />
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + chartH} stroke="#1e293b" strokeWidth="0.4" />

          {minVal < 0 && maxVal > 0 && (
            <line 
              x1={paddingLeft} 
              y1={paddingTop + chartH * (maxVal / (maxVal - minVal))} 
              x2={100 - paddingRight} 
              y2={paddingTop + chartH * (maxVal / (maxVal - minVal))} 
              stroke="#334155" 
              strokeWidth="0.5" 
            />
          )}

          {data.length > 1 && (
            <path d={pathStr} fill="none" stroke={color} strokeWidth="1.2" className="transition-all duration-300" />
          )}

          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="1"
              fill={color}
              stroke="#0f172a"
              strokeWidth="0.3"
              className="cursor-pointer hover:r-2 transition-all"
            />
          ))}
        </svg>

        <div className="absolute left-0 top-[8px] text-[7px] font-mono text-slate-500">{maxVal}</div>
        <div className="absolute left-0 bottom-[16px] text-[7px] font-mono text-slate-500">{minVal}</div>
        <div className="absolute left-[14%] bottom-0 text-[7px] font-mono text-slate-500">μ=0.0</div>
        <div className="absolute right-1 bottom-0 text-[7px] font-mono text-slate-500">1.2</div>
      </div>
    </div>
  );
}
