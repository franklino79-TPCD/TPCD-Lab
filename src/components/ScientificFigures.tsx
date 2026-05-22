/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Activity, 
  Eye, 
  Layers, 
  BookOpen, 
  Zap, 
  TrendingUp, 
  Award, 
  Info,
  ChevronRight
} from "lucide-react";

export interface ScientificFiguresProps {
  mainConfig?: {
    gaugeLevel: number;
    gaugeCoupling: number;
  };
}

export default function ScientificFigures({ mainConfig }: ScientificFiguresProps) {
  const [selectedFig, setSelectedFig] = useState<number>(0);
  
  // Tab/Selector state for multiversal figure browser
  const figs = [
    { id: 0, title: "Hero: Three-Dimensional Gauss-BF Cover", short: "Hero Cover View" },
    { id: 1, title: "Figure 1: Temporal Evolution (Dual Panel)", short: "Fig 1: BF Evolution" },
    { id: 2, title: "Figure 2: Coherent Channel Visualization", short: "Fig 2: Multichannel U(1)" },
    { id: 3, title: "Figure 3: Curvature Phase Maps (k vs μ)", short: "Fig 3: Phase k vs μ" },
    { id: 4, title: "Figure 4: Confinement Scale of Tubules lc", short: "Fig 4: Confinement lc" },
    { id: 5, title: "Figure 5: Plaquette Vortex Zoom-in", short: "Fig 5: Local Vortices" },
    { id: 6, title: "Figure 6: Seifert-BF Theoretical Diagram", short: "Fig 6: Seifert Model" }
  ];

  return (
    <div className="space-y-6">
      {/* Article Metadata Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 bg-cyan-950/40 border-l border-b border-slate-800 rounded-bl-lg text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
          Theoretical Physics Preprint: arXiv:2605.04322
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
            ACADEMIC ILLUSTRATION PANEL
          </span>
        </div>
        
        <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight leading-tight max-w-4xl">
          Topological Stabilization of Domain Defects and Emergence of the Mass Hierarchy in Pregeometric Hypergraphs
        </h2>
        
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4">
          <div>
            <strong className="text-slate-200">Author:</strong> Franklin Octavio Saucedo Moreno (Lab of Discrete Gravity)
          </div>
          <div>
            <strong className="text-slate-200">Theory Sector:</strong> BF Gauge U(1) coupled to Heifert Memory
          </div>
          <div>
            <strong className="text-slate-200">Support:</strong> Confined Toroidal 2D Lattice (k ∈ [1, 5])
          </div>
        </div>
      </div>

      {/* Main Layout containing Navigation Drawer and Figure Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar (3 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col gap-2 shadow-xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold px-2 py-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-500" />
            DIAGRAM AND FIGURE INDEX
          </span>
          
          <div className="space-y-1.5 mt-2">
            {figs.map((fig) => (
              <button
                key={fig.id}
                onClick={() => setSelectedFig(fig.id)}
                className={`w-full text-left p-3 rounded-lg text-xs font-mono transition-all border flex items-center justify-between ${
                  selectedFig === fig.id
                    ? "bg-cyan-950/60 border-cyan-800/80 text-cyan-300 font-extrabold shadow-inner"
                    : "bg-slate-900/30 border-slate-850/40 text-slate-400 hover:bg-slate-900/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedFig === fig.id ? "bg-cyan-400" : "bg-slate-600"}`} />
                  <span>{fig.short}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${selectedFig === fig.id ? "translate-x-1 text-cyan-400" : ""}`} />
              </button>
            ))}
          </div>

          <div className="bg-slate-950/50 p-3.5 border border-slate-900 rounded-lg mt-4 text-[11px] font-mono leading-relaxed text-slate-450 text-center">
            <span className="font-bold text-cyan-400 block mb-1">INSTRUCTIONS</span>
            Click on any figure to open the local simulator, interact with gauge curvature fields, and analyze theoretical derivations.
          </div>
        </div>

        {/* Content Viewer (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl min-h-[500px]">
          {selectedFig === 0 && <HeroCoverFigure />}
          {selectedFig === 1 && <Figure1EvolucionTemp />}
          {selectedFig === 2 && <Figure2Multicanal />}
          {selectedFig === 3 && <Figure3PhaseMaps />}
          {selectedFig === 4 && <Figure4ConfinementScale />}
          {selectedFig === 5 && <Figure5PlaquetteZoom />}
          {selectedFig === 6 && <Figure6SchematicDiagram />}
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// HERO VISUALIZER COMPONENT
// -------------------------------------------------------------------------
function HeroCoverFigure() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [kVal, setKVal] = useState<number>(3);
  const [muVal, setMuVal] = useState<number>(0.6);
  const [layers, setLayers] = useState({
    vascular: true,
    vortices: true,
    fluxLines: true,
    gridUnits: false
  });
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let t = 0;
    const animate = () => {
      t += 0.05;
      setAnimationFrame(t);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // 1. Draw subtle coordinate grid background
      if (layers.gridUnits) {
        ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
        ctx.lineWidth = 0.5;
        const spacing = 15;
        for (let x = 0; x < w; x += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += spacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // 2. Generate simulated vascular fibers (using Perlin-like mathematical noise paths)
      const centerX = w / 2;
      const centerY = h / 2;
      
      // We will draw several primary branches that depend on muVal (higher muVal = denser connections)
      const numBranches = Math.floor(12 + muVal * 25);
      const branches: Array<Array<{x: number, y: number, r: number}>> = [];

      for (let b = 0; b < numBranches; b++) {
        const angle = (b * 2 * Math.PI) / numBranches + Math.sin(t * 0.2 + b) * 0.1;
        const points = [];
        let currX = centerX;
        let currY = centerY;
        const length = 110 + Math.sin(t * 0.5 + b) * 15;
        const steps = 40;

        for (let s = 0; s < steps; s++) {
          const ratio = s / steps;
          const radialDist = ratio * length;
          // Perturb radial coordinate with sine/cosine and memory fields
          const freq = 4 + kVal;
          const amplitude = 12 * (1 - ratio) * (1 - muVal * 0.4) + Math.cos(t * b * 0.01) * 3;
          const theta = angle + Math.sin(ratio * Math.PI * freq + t * (0.4 + 0.1 * kVal)) * (0.05 + 0.02 * kVal);
          
          currX = centerX + radialDist * Math.cos(theta);
          currY = centerY + radialDist * Math.sin(theta);
          
          points.push({
            x: currX,
            y: currY,
            r: Math.max(0.5, 4.5 * (1 - ratio) * (1.1 + Math.sin(t + b) * 0.1) * (1 + muVal * 0.5))
          });
        }
        branches.push(points);
      }

      // Draw the vascular structures
      if (layers.vascular) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(16, 185, 129, 0.2)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        branches.forEach((bPoints, bIdx) => {
          // Draw Seifert active sheet shadow
          ctx.beginPath();
          ctx.moveTo(bPoints[0].x, bPoints[0].y);
          bPoints.forEach((p, pIdx) => {
            if (pIdx > 0) ctx.lineTo(p.x, p.y);
          });
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 + muVal * 0.15})`;
          ctx.lineWidth = 14 * (1 + kVal * 0.1);
          ctx.stroke();

          // Draw inner vascular core (copper green / neon emerald)
          ctx.beginPath();
          ctx.moveTo(bPoints[0].x, bPoints[0].y);
          bPoints.forEach((p, pIdx) => {
            if (pIdx > 0) {
              const prev = bPoints[pIdx - 1];
              const xc = (p.x + prev.x) / 2;
              const yc = (p.y + prev.y) / 2;
              ctx.quadraticCurveTo(prev.x, prev.y, xc, yc);
            }
          });
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.85 + muVal * 0.1})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Draw secondary fiber lines representing tight memory domains
          ctx.beginPath();
          ctx.moveTo(bPoints[0].x, bPoints[0].y);
          bPoints.forEach((p, pIdx) => {
            if (pIdx > 0) ctx.lineTo(p.x, p.y);
          });
          ctx.strokeStyle = "rgba(244, 244, 245, 0.4)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        });
        
        ctx.shadowBlur = 0; // reset
      }

      // 3. Draw vortices (field charge spots mapped near the vascular veins representing gauge U(1) vortices trapped)
      if (layers.vortices) {
        branches.forEach((bPoints, bIdx) => {
          // Select 2 specific nodes per branch to spawn a vortex
          const spawnIndices = [Math.floor(bPoints.length * 0.35), Math.floor(bPoints.length * 0.75)];
          spawnIndices.forEach((nodeIdx, ptIdx) => {
            const node = bPoints[nodeIdx];
            if (!node) return;

            const isPositive = (bIdx + ptIdx) % 2 === 0;
            const vortexRadius = 6 + kVal + Math.sin(t * 3 + bIdx) * 1.5;
            
            // Draw radial vortex wave
            const pulse = (parseInt((t * 20).toString()) % 60) / 60;
            ctx.shadowBlur = 0;
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, vortexRadius * (1 + pulse), 0, 2 * Math.PI);
            ctx.strokeStyle = isPositive 
              ? `rgba(236, 72, 153, ${0.4 * (1 - pulse)})`   // Fuchsia
              : `rgba(6, 182, 212, ${0.4 * (1 - pulse)})`;   // Cyan
            ctx.lineWidth = 1.0;
            ctx.stroke();

            // Core singularity
            ctx.beginPath();
            ctx.arc(node.x, node.y, 2.5, 0, 2 * Math.PI);
            ctx.fillStyle = isPositive ? "#ec4899" : "#06b6d4";
            ctx.fill();

            // Little polarity symbol
            ctx.font = "bold 8px monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(isPositive ? "+" : "-", node.x - 3, node.y + 3);
          });
        });
      }

      // 4. Draw magnetic streamlines / flux vector lines wrapping around veins representing A_mu field
      if (layers.fluxLines) {
        ctx.lineWidth = 0.8;
        branches.forEach((bPoints, bIdx) => {
          if (bIdx % 2 !== 0) return; // limit count to stay clean
          const nodeIdx = Math.floor(bPoints.length * 0.5);
          const node = bPoints[nodeIdx];
          if (!node) return;

          const numArrows = 6;
          const rotationSpeed = 0.5 * (1 + kVal * 0.2);
          const loopRadius = 25 + kVal * 5;

          ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
          ctx.beginPath();
          ctx.arc(node.x, node.y, loopRadius, 0, 2 * Math.PI);
          ctx.stroke();

          // Draw little arrows circulating
          for (let a = 0; a < numArrows; a++) {
            const rotAngle = (a * 2 * Math.PI) / numArrows + (bIdx % 2 === 0 ? -1 : 1) * t * rotationSpeed;
            const ax = node.x + loopRadius * Math.cos(rotAngle);
            const ay = node.y + loopRadius * Math.sin(rotAngle);

            ctx.beginPath();
            ctx.arc(ax, ay, 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(125, 211, 252, 0.7)";
            ctx.fill();
            
            // Arrow direction tangent
            const tangent = rotAngle + Math.PI / 2;
            const arrowLen = 4;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - arrowLen * Math.cos(tangent), ay - arrowLen * Math.sin(tangent));
            ctx.strokeStyle = "rgba(125, 211, 252, 0.8)";
            ctx.stroke();
          }
        });
      }

      // 5. Draw mathematical annotations (LaTeX labels on canvas margins for high styling)
      ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
      ctx.font = "9px monospace";
      ctx.fillText(`\\mathcal{L}_{BF} = \\frac{k}{2\\pi} B \\wedge F`, 15, h - 35);
      ctx.fillText(`L_c = \\sqrt{2\\pi k / J} = ${(Math.sqrt(2 * Math.PI * kVal)).toFixed(2)} px`, 15, h - 20);
      ctx.fillText(`lk = \\frac{1}{2\\pi} \\oint A = ${(kVal !== 0 ? Math.round(kVal * 0.8) : 0)}`, 15, h - 5);

      ctx.fillStyle = "rgba(16, 185, 129, 0.7)";
      ctx.fillText(`\\Sigma \\equiv \\{p | \\sigma_p = +1\\} (Seifert Sheet)`, w - 170, 15);
      ctx.fillStyle = "rgba(236, 72, 153, 0.8)";
      ctx.fillText(`U(1) Vortices: \\rho_v = \\epsilon^{\\mu\\nu}\\partial_\\mu A_\\nu`, w - 170, 30);
      
      // Central Singular Core tag
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#ef4444";
      ctx.fillText("PREGEOMETRIC SINGULAR CORE", centerX + 12, centerY + 3);
    };

    timerRef.current = window.setInterval(animate, 1000 / 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [kVal, muVal, layers]);

  return (
    <div className="space-y-4">
      {/* Title block */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-1.5">
            <Award className="w-5 h-5 text-yellow-500 animate-bounce" />
            Cover Illustration: Multichannel Pregeometric Landscape
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            An integrated artistic visualization with mathematical rigor describing vascular domains interacting with gauge flows.
          </p>
        </div>
        
        <span className="bg-cyan-950/50 border border-cyan-800 text-cyan-400 px-2 py-0.5 text-[9px] font-mono rounded-full font-bold uppercase">
          SCIENTIFIC HERO COVER
        </span>
      </div>

      {/* Two columns: Controls on the side, Large Canvas on the center */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Side (Controls / Descriptions) - SPAN 4 */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block border-b border-slate-900 pb-1.5">
              DUAL THEORETICAL PARAMETERS
            </span>
            
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Theory Level (k)</span>
                <span className="text-cyan-400 font-bold">k = {kVal}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={kVal}
                onChange={(e) => setKVal(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Memory Coupling (μ)</span>
                <span className="text-cyan-400 font-bold">μ = {muVal.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.2"
                step="0.05"
                value={muVal}
                onChange={(e) => setMuVal(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-2.5">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block border-b border-slate-900 pb-1.5">
              FLOW CHANNEL FILTERING
            </span>
            
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={layers.vascular} 
                onChange={() => setLayers(prev => ({...prev, vascular: !prev.vascular}))} 
                className="rounded text-cyan-500 focus:ring-opacity-0 focus:ring-0 bg-slate-900 border-slate-800"
              />
              Active Morphology Σ (Vascular)
            </label>

            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={layers.vortices} 
                onChange={() => setLayers(prev => ({...prev, vortices: !prev.vortices}))} 
                className="rounded text-cyan-500 focus:ring-opacity-0 focus:ring-0 bg-slate-900 border-slate-800"
              />
              Local U(1) Vortices (ρ_v)
            </label>

            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={layers.fluxLines} 
                onChange={() => setLayers(prev => ({...prev, fluxLines: !prev.fluxLines}))} 
                className="rounded text-cyan-500 focus:ring-opacity-0 focus:ring-0 bg-slate-900 border-slate-800"
              />
              Gauge Flux Lines (Curvature F)
            </label>

            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={layers.gridUnits} 
                onChange={() => setLayers(prev => ({...prev, gridUnits: !prev.gridUnits}))} 
                className="rounded text-cyan-500 focus:ring-opacity-0 focus:ring-0 bg-slate-900 border-slate-800"
              />
              Modular Euclidean Grid (Background)
            </label>
          </div>
        </div>

        {/* Right Side (Visual Canvas) - SPAN 8 */}
        <div className="md:col-span-8 flex flex-col justify-between items-center rounded-xl bg-slate-950 p-2.5 border border-slate-850 relative">
          <canvas 
            ref={canvasRef} 
            width={480} 
            height={320} 
            className="w-full h-auto bg-[#030712] rounded-lg border border-slate-900"
          />
          <div className="w-full text-[10px] text-slate-500 font-mono flex justify-between px-2 mt-2 pt-2 border-t border-slate-900">
            <span>Rendering Resolution: 480x320</span>
            <span>Type: Streamline Field Mesh</span>
            <span>Mode: Vector Interactive</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl leading-relaxed text-xs text-slate-400">
        <div className="font-mono text-cyan-300 font-bold mb-1 uppercase flex items-center gap-1">
          <Info className="w-4 h-4" /> Associated Scientific Description:
        </div>
        This integrated visualization synthesizes the formal structure of a **Pregeometric Hypergraph**. The biologically continuous seams represent the **discretized Seifert surface** $\Sigma$ (in emerald tones). Magenta represents local accumulations of positive gauge flux, while cyan records negative spin curvature sinks. Cinematic phase lines simulate the exact Chern-Simons / BF-style magnetic coupling (E_BF ∝ ⟨Σ, F⟩).
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// FIGURE 1: TEMPORAL EVOLUTION COMPARISON (SIDE-BY-SIDE SIMULATION DUAL)
// -------------------------------------------------------------------------
function Figure1EvolucionTemp() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const [dataPointsLeft, setDataPointsLeft] = useState<Array<{x: number, y: number}>>([]);
  const [dataPointsRight, setDataPointsRight] = useState<Array<{x: number, y: number}>>([]);

  const width = 180;
  const height = 150;

  // Initialize nodes for animation
  useEffect(() => {
    // Generate left side nodes (thin, chaotic, segmented, decaying over time - NO BF)
    const ptsL = [];
    for (let i = 0; i < 40; i++) {
      ptsL.push({
        x: 20 + Math.random() * (width - 40),
        y: 20 + Math.random() * (height - 40),
        v: Math.random() * 2 * Math.PI,
        size: 1 + Math.random() * 3
      });
    }
    setDataPointsLeft(ptsL);

    // Generate right side nodes (thick, dense, self-stabilized vascular threads, robust - WITH BF)
    const ptsR = [];
    for (let i = 0; i < 40; i++) {
      ptsR.push({
        x: 20 + Math.random() * (width - 40),
        y: 20 + Math.random() * (height - 40),
        v: Math.random() * 2 * Math.PI,
        size: 1.5 + Math.random() * 4
      });
    }
    setDataPointsRight(ptsR);
  }, []);

  // Simple local simulation ticks for evolution comparison
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setStep(prev => {
        if (prev >= 150) {
          setIsPlaying(false);
          return 150;
        }

        // Advance left nodes randomly without spatial coordination (degrade/evaporate)
        setDataPointsLeft(old => {
          return old.map(p => {
            // Decaying / breaking down morphology
            const stepCoeff = prev / 150;
            const sizeReduction = 1.0 - stepCoeff * 0.45;
            const dx = Math.sin(p.v + Math.random() * 0.4) * 1.5;
            const dy = Math.cos(p.v + Math.random() * 0.4) * 1.5;
            return {
              ...p,
              x: Math.max(5, Math.min(width - 5, p.x + dx)),
              y: Math.max(5, Math.min(height - 5, p.y + dy)),
              size: Math.max(0.5, p.size * sizeReduction)
            };
          });
        });

        // Advance right nodes (attract towards each other to reflect BF stability constraints, forming dense tubes)
        setDataPointsRight(old => {
          // Compute center of mass to pull slightly towards clustering or filamental grouping
          const centerX = width / 2;
          const centerY = height / 2;
          return old.map((p, idx) => {
            // Draw veins together
            const stepCoeff = prev / 150;
            const vx = Math.sin(p.v + (idx / 10)) * 1.2;
            const vy = Math.cos(p.v + (idx / 10)) * 1.2;
            
            // Attractor forces
            const dx = vx + (centerX - p.x) * 0.015 * stepCoeff;
            const dy = vy + (centerY - p.y) * 0.015 * stepCoeff;

            return {
              ...p,
              x: Math.max(5, Math.min(width - 5, p.x + dx)),
              y: Math.max(5, Math.min(height - 5, p.y + dy)),
              size: Math.min(10, p.size * (1 + stepCoeff * 0.015)) // vascular veins consolidate
            };
          });
        });

        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
    // Regenerate
    const ptsL = [];
    for (let i = 0; i < 40; i++) {
      ptsL.push({
        x: 20 + Math.random() * (width - 40),
        y: 20 + Math.random() * (height - 40),
        v: Math.random() * 2 * Math.PI,
        size: 1 + Math.random() * 3
      });
    }
    setDataPointsLeft(ptsL);

    const ptsR = [];
    for (let i = 0; i < 40; i++) {
      ptsR.push({
        x: 20 + Math.random() * (width - 40),
        y: 20 + Math.random() * (height - 40),
        v: Math.random() * 2 * Math.PI,
        size: 1.5 + Math.random() * 4
      });
    }
    setDataPointsRight(ptsR);
  };

  return (
    <div className="space-y-4">
      {/* Title block */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-serif text-lg font-bold text-white">
            Figure 1: Temporal Evolution of the Vascular Network with and without BF Coupling
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Experimental illustration of how topological gauge coupling stabilizes filaments against thermal dissipation.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold text-[10px] font-mono rounded flex items-center gap-1 hover:bg-cyan-900"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlaying ? "PAUSE" : "START EVOLUTION"}
          </button>
          <button
            onClick={handleReset}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[10px] font-mono rounded flex items-center gap-1 hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3" />
            RESET
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Panel A: WITHOUT BF */}
        <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl relative flex flex-col items-center">
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-950/40 border border-red-900 rounded text-[9px] font-mono text-red-400 font-bold">
            PANEL A: WITHOUT BF COUPLING (k = 0)
          </div>
          
          <div className="w-full text-right text-[10px] font-mono text-slate-500 mb-1">
            Step: {step} / 150
          </div>

          <svg className="w-full h-40 bg-[#04060c] rounded border border-slate-900">
            {/* Draw disjoint decaying segments */}
            {dataPointsLeft.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={p.size}
                fill="none"
                stroke="#ef4444"
                strokeWidth={p.size * 0.4}
                opacity={0.3 + (1 - step/150) * 0.4}
              />
            ))}
            
            {/* Decay representation */}
            {step > 40 && (
              <text x="10" y="140" fill="rgba(239, 68, 68, 0.7)" className="font-mono text-[9px]">
                [WARNING: Noise dissolving filaments]
              </text>
            )}
          </svg>
          
          <p className="text-[11px] text-slate-400 mt-2.5 font-sans leading-relaxed text-center px-1">
            <strong className="text-red-400 font-bold block mb-0.5">Vein Collapse</strong>
            In the absence of the gauge term (k_BF = 0), the vascular veins lack protective vacuum pressure. Thermal noise (entropy) dominates, dissolving and splitting the network into small amorphous fragments.
          </p>
        </div>

        {/* Panel B: WITH BF */}
        <div className="bg-slate-940 p-4 border border-slate-900 rounded-xl relative flex flex-col items-center">
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-950/40 border border-green-900 rounded text-[9px] font-mono text-green-400 font-bold">
            PANEL B: WITH BF COUPLING (k = 3)
          </div>

          <div className="w-full text-right text-[10px] font-mono text-slate-500 mb-1">
            Step: {step} / 150
          </div>

          <svg className="w-full h-40 bg-[#04060c] rounded border border-slate-900">
            {/* Draw consolidating fibers connecting */}
            {dataPointsRight.map((p, idx) => {
              const next = dataPointsRight[(idx + 1) % dataPointsRight.length];
              return (
                <line
                  key={`l-${idx}`}
                  x1={p.x}
                  y1={p.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="#10b981"
                  strokeWidth={Math.min(5, 1 + step/30)}
                  opacity={0.25 + (step/150) * 0.5}
                />
              );
            })}
            
            {dataPointsRight.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={p.size * 0.8}
                fill="#34d399"
                opacity={0.7}
              />
            ))}
            
            {/* Stable representation */}
            {step > 80 && (
              <text x="10" y="140" fill="rgba(16, 185, 129, 0.9)" className="font-mono text-[9px] animate-pulse">
                [STABLE: Gauge charge locks links]
              </text>
            )}
          </svg>

          <p className="text-[11px] text-slate-400 mt-2.5 font-sans leading-relaxed text-center px-1">
            <strong className="text-green-400 font-bold block mb-0.5">Topological Stabilization</strong>
            With k_BF = 3, the curvature term magnetically dampens surface fluctuations. Vascular veins are continuously reinforced by trapped gauge flux, ensuring persistent and unbroken filament topology.
          </p>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// FIGURE 2: MULTI-CHANNEL VISUALIZER (COHERENT U(1) CURVATURE PORTFOLIO)
// -------------------------------------------------------------------------
function Figure2Multicanal() {
  const [channel, setChannel] = useState<"combined" | "morphology" | "gauge">("combined");
  
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-serif text-lg font-bold text-white">
            Figure 2: Multichannel Analysis of Morphology-Gauge Coexistence
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Spectral view to isolate magnetic current flows and domain boundaries in the virtual crystalline lattice.
          </p>
        </div>

        {/* Channel Selector Buttons */}
        <div className="flex bg-slate-950 p-1 border border-slate-805 rounded-lg text-[9px] font-mono">
          <button
            onClick={() => setChannel("combined")}
            className={`px-2.5 py-1 rounded transition-all ${
              channel === "combined" ? "bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold" : "text-slate-400"
            }`}
          >
            MIXED COMPOSITE
          </button>
          <button
            onClick={() => setChannel("morphology")}
            className={`px-2.5 py-1 rounded transition-all ${
              channel === "morphology" ? "bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold" : "text-slate-400"
            }`}
          >
            SCALAR CHANNEL Σ_p
          </button>
          <button
            onClick={() => setChannel("gauge")}
            className={`px-2.5 py-1 rounded transition-all ${
              channel === "gauge" ? "bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold" : "text-slate-400"
            }`}
          >
            GAUGE CHANNEL F_p
          </button>
        </div>
      </div>

      <div className="relative rounded-xl border border-slate-850 p-2 text-center bg-slate-950 transition-all">
        {/* Render representation overlay based on selected channel */}
        <svg className="w-full h-56 bg-[#04060b] rounded-lg transition-all border border-slate-900">
          
          {/* Sinuosity background paths represent morphology in all but scalar channels */}
          {(channel === "combined" || channel === "morphology") && (
            <g>
              {/* Green thick vascular path */}
              <path 
                d="M 20 130 C 90 20, 140 220, 260 90 C 340 10, 420 170, 460 70" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth={channel === "combined" ? "12" : "22"} 
                className="transition-all duration-300" 
                opacity={channel === "combined" ? 0.35 : 0.85} 
              />
              <path 
                d="M 20 130 C 90 20, 140 220, 260 90 C 340 10, 420 170, 460 70" 
                fill="none" 
                stroke="#34d399" 
                strokeWidth="1.5" 
                className="transition-all duration-300"
                opacity={0.8}
              />
            </g>
          )}

          {/* Vortex singularities plotted in combined and gauge modes */}
          {(channel === "combined" || channel === "gauge") && (
            <g>
              {/* Positive vortices (Magenta) */}
              <g transform="translate(140, 120)">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="3" className="animate-spin" />
                <circle cx="0" cy="0" r="3" fill="#ec4899" />
                <text x="6" y="3" fill="#ec4899" className="font-mono text-[9px] font-extrabold">+</text>
              </g>

              <g transform="translate(340, 60)">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="3" className="animate-spin" />
                <circle cx="0" cy="0" r="3" fill="#ec4899" />
                <text x="6" y="3" fill="#ec4899" className="font-mono text-[9px] font-extrabold">+</text>
              </g>

              {/* Negative vortices (Cyan) */}
              <g transform="translate(240, 100)">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3" />
                <circle cx="0" cy="0" r="3" fill="#06b6d4" />
                <text x="6" y="3" fill="#06b6d4" className="font-mono text-[9px] font-bold">-</text>
              </g>

              <g transform="translate(85, 90)">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3" />
                <circle cx="0" cy="0" r="3" fill="#06b6d4" />
                <text x="6" y="3" fill="#06b6d4" className="font-mono text-[9px] font-bold">-</text>
              </g>
            </g>
          )}

          {/* Add LaTeX lines indicating the physics isolated */}
          <text x="15" y="210" fill="#64748b" className="font-mono text-[9px]">
            {channel === "combined" && "Total Composite Field: \\Pi = \\Sigma \\times F"}
            {channel === "morphology" && "Scalar Domain Channel of Essence: \\sigma_p \\in \\{-1, +1\\}"}
            {channel === "gauge" && "Solitonic Vortex Gauge Curvature: F_p = \\Delta \\times A"}
          </text>
        </svg>

        <div className="mt-3 grid grid-cols-3 gap-3 text-left">
          <div className="bg-slate-900 border border-slate-850 p-2 rounded">
            <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none mb-1">Vascular Morphology</span>
            <div className="text-xs font-mono font-bold text-emerald-400">Green Scalar Channel</div>
            <p className="text-[9px] text-slate-400 mt-1">Locates the support of the pregeometric membrane (Σ).</p>
          </div>
          <div className="bg-slate-900 border border-slate-850 p-2 rounded">
            <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none mb-1">Positive Polarity</span>
            <div className="text-xs font-mono font-bold text-pink-400">Magenta (+) Channel</div>
            <p className="text-[9px] text-slate-400 mt-1">Local charge zones with positive winding number (W = +1).</p>
          </div>
          <div className="bg-slate-900 border border-slate-850 p-2 rounded">
            <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none mb-1">Negative Polarity</span>
            <div className="text-xs font-mono font-bold text-cyan-400">Cyan (-) Channel</div>
            <p className="text-[9px] text-slate-400 mt-1">Local charge zones with negative winding anti-vortex (W = -1).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// FIGURE 3: PHASE MAP COLLECTIVE (k vs mu INTERACTIVE BENTO GRID)
// -------------------------------------------------------------------------
function Figure3PhaseMaps() {
  const [selectedCoord, setSelectedCoord] = useState<{k: number, mu: number}>({ k: 3, mu: 0.6 });

  // Phase coordinates database
  const coordinatesList = [
    { k: 1, mu: 0.2, phase: "Amorphous Chaos", color: "text-red-400", euler: 54, fractal: 1.12, linking: 0 },
    { k: 1, mu: 0.6, phase: "Seg. Filaments", color: "text-orange-400", euler: 18, fractal: 1.34, linking: 1 },
    { k: 1, mu: 1.0, phase: "Dendritic Net", color: "text-yellow-400", euler: -2, fractal: 1.52, linking: 2 },
    { k: 2, mu: 0.2, phase: "Gauge Liquid", color: "text-cyan-400", euler: 32, fractal: 1.25, linking: 1 },
    { k: 2, mu: 0.6, phase: "Stable Confined", color: "text-emerald-400", euler: -8, fractal: 1.62, linking: 3 },
    { k: 2, mu: 1.0, phase: "Hard Vascular", color: "text-teal-400", euler: -14, fractal: 1.74, linking: 4 },
    { k: 3, mu: 0.2, phase: "Confluent Plasma", color: "text-purple-400", euler: 12, fractal: 1.40, linking: 2 },
    { k: 3, mu: 0.6, phase: "Vascular Hyper-Net", color: "text-cyan-300", euler: -24, fractal: 1.82, linking: 5 },
    { k: 3, mu: 1.0, phase: "Spheroidal Mesh", color: "text-slate-200", euler: -48, fractal: 1.95, linking: 7 },
    { k: 4, mu: 0.6, phase: "Critical Seifert Net", color: "text-fuchsia-400", euler: -32, fractal: 1.88, linking: 6 }
  ];

  const getCoordData = (k: number, mu: number) => {
    return coordinatesList.find(c => c.k === k && c.mu === mu) || {
      phase: "Unmapped Transition",
      color: "text-slate-500",
      euler: -5,
      fractal: 1.48,
      linking: Math.floor(k * mu * 3)
    };
  };

  const currentData = getCoordData(selectedCoord.k, selectedCoord.mu);

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="font-serif text-lg font-bold text-white">
          Figure 3: Topological Phase Diagnosis in Constraint Space (k vs μ)
        </h3>
        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
          Interactive matrix to explore changes in Euler characteristic and fractal dimension across the multi-variable landscape.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Interactive Matrix Grid (SPAN 7) */}
        <div className="md:col-span-7 bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block mb-3 text-center">
            SELECT COORDINATES (Click on Cells k vs μ)
          </span>

          <div className="space-y-3">
            {/* Mu labels above columns */}
            <div className="grid grid-cols-5 text-center text-[9px] font-mono text-slate-550">
              <span className="opacity-0">k / mu</span>
              <span>μ = 0.2</span>
              <span>μ = 0.4</span>
              <span>μ = 0.6</span>
              <span>μ = 1.0</span>
            </div>

            {/* Matrix rows for k = 1 to 4 */}
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="grid grid-cols-5 gap-1.5 items-center">
                <span className="text-[10px] font-mono text-slate-400 font-bold text-right pr-2">k = {k}</span>
                
                {[0.2, 0.4, 0.6, 1.0].map((mu) => {
                  const isSel = selectedCoord.k === k && selectedCoord.mu === mu;
                  const cInfo = getCoordData(k, mu);
                  
                  return (
                    <button
                      key={mu}
                      onClick={() => setSelectedCoord({ k, mu })}
                      className={`h-11 rounded-lg border text-[9px] font-mono flex flex-col items-center justify-center p-1 leading-tight transition-all ${
                        isSel 
                          ? "bg-cyan-950/70 border-cyan-500 scale-102 ring-2 ring-cyan-500/20 shadow-lg font-bold text-cyan-300"
                          : "bg-slate-900/60 border-slate-850 hover:border-slate-700 text-slate-450 hover:text-white"
                      }`}
                    >
                      <span>{cInfo.phase.split(" ")[0]}</span>
                      <span className="text-[8px] opacity-65">lk = {cInfo.linking}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="text-[9px] font-mono text-slate-550 text-center mt-4 border-t border-slate-900 pt-2 flex justify-between">
            <span>Calibration Matrix: k (Level) ∈ [1..4]</span>
            <span>Memory: μ ∈ [0.2..1.0]</span>
          </div>
        </div>

        {/* Right Phase Detail Panel (SPAN 5) */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-3">
            <span className="text-[10px] font-mono text-slate-500 uppercase">TOPOLOGICAL INSPECTOR</span>
            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded text-[9px] font-mono">
              k={selectedCoord.k}, μ={selectedCoord.mu.toFixed(1)}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block mb-0.5">PHYSICAL STATE</span>
              <div className={`text-sm font-mono font-extrabold ${currentData.color}`}>
                {currentData.phase}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-955 border border-slate-850 p-2 rounded">
                <span className="block text-[8px] font-mono text-slate-500 uppercase leading-none mb-1">EULER CHARACTERISTIC</span>
                <span className={`text-base font-bold font-mono ${currentData.euler <= 0 ? "text-cyan-400" : "text-emerald-400"}`}>
                  {currentData.euler}
                </span>
              </div>
              <div className="bg-slate-955 border border-slate-850 p-2 rounded">
                <span className="block text-[8px] font-mono text-slate-500 uppercase leading-none mb-1">FRACTAL DIMENSION</span>
                <span className="text-base font-bold text-slate-200 font-mono">
                  {currentData.fractal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-855 p-3 rounded-lg">
              <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1">LINKED GAUGE CHARGE</span>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white font-mono">Linking Number (lk)</span>
                <span className="text-sm font-bold text-cyan-300 font-mono">{currentData.linking}</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-cyan-400 h-1 transition-all duration-300"
                  style={{ width: `${(currentData.linking / 8) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[9.5px] text-slate-455 font-sans mt-4 leading-tight">
            By increasing <strong className="text-cyan-400">μ</strong>, the system connects filaments. Gauge coupling <strong className="text-cyan-400">k</strong> locks these bridges as quantized curvature sums, leading to a sharp drop in Euler characteristic (χ &lt; 0), signaling the stabilization of dense microcapillaries.
          </p>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// FIGURE 4: CONFINEMENT SCALE lc (INTERACTIVE CYLINDER SCALER)
// -------------------------------------------------------------------------
function Figure4ConfinementScale() {
  const [level, setLevel] = useState<number>(3);
  
  // Calculate exact l_c based on J = 1.0
  const lc = Math.sqrt(2 * Math.PI * level);

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="font-serif text-lg font-bold text-white">
          Figure 4: Confinement Scale l_c Comparison for k = [1, 3, 5]
        </h3>
        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
          Effect of the quantization parameter k on the electromagnetic shielding radius of the vascular conduits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Side (Scaler and Physics equation - SPAN 4) */}
        <div className="md:col-span-4 flex flex-col justify-between bg-slate-950 p-4 border border-slate-850 rounded-xl shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block border-b border-slate-900 pb-1.5 mb-3.5">
              ADJUST LEVEL k
            </span>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>Sector Level k:</span>
                  <span className="text-white font-extrabold font-mono">k = {level}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="bg-slate-900 p-3 rounded border border-slate-850 text-center">
                <span className="text-[8px] font-mono text-slate-500 uppercase block mb-0.5">Scale Formula</span>
                <span className="text-sm font-sans font-extrabold text-slate-200 block font-mono">
                  {"\\ell_c \\approx \\sqrt{\\frac{2\\pi k}{J}}"}
                </span>
                <span className="text-lg font-bold text-purple-400 block font-mono mt-1">
                  {"\\ell_c"} = {lc.toFixed(2)} px
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-sans leading-relaxed mt-4">
            The gauge coupling constant {"\\ell_c"} defines the minimum thickness a spin channel must have to resist local tearing. At higher levels of <strong className="text-cyan-300">k</strong>, the U(1) gauge flux tubes defensively widen the filament.
          </p>
        </div>

        {/* Right Side (Scale Comparison Visualizer - SPAN 8) */}
        <div className="md:col-span-8 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center relative">
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400">
            DIGITAL FLUX TUBE SIMULATION (LONGITUDINAL VIEW)
          </span>

          <svg className="w-full h-44 bg-[#03060a] rounded border border-slate-900 mt-2">
            {/* Draw safety tube based on level and lc */}
            <g transform="translate(0, 10)">
              {/* Central filamental vein */}
              <line x1="10" y1="80" x2="430" y2="80" stroke="#10b981" strokeWidth="4" opacity="0.8" />
              <line x1="10" y1="80" x2="430" y2="80" stroke="#f4f4f5" strokeWidth="0.8" opacity="0.4" />

              {/* Protective Gauge Cylinder shading */}
              <rect 
                x="30" 
                y={80 - lc * 6} 
                width="380" 
                height={lc * 12} 
                fill="url(#confinementGrad)" 
                stroke="rgba(168, 85, 247, 0.5)" 
                strokeWidth="1.5"
                rx="6"
                className="transition-all duration-300"
              />

              {/* Little vector labels on edges of the protective shield */}
              <line x1="220" y1="80" x2="220" y2={80 - lc * 6} stroke="#a855f7" strokeWidth="1" strokeDasharray="2" />
              <text x="225" y={80 - (lc * 3)} fill="#a855f7" className="font-mono text-[9px]">
                lc = {lc.toFixed(1)} px
              </text>
              
              <text x="40" y={80 + (lc * 6) + 12} fill="#64748b" className="font-mono text-[8px]">
                [Topologically Safe Confined Region]
              </text>
            </g>

            {/* Gradient definition */}
            <defs>
              <linearGradient id="confinementGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.0" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>

          <div className="w-full text-right text-[9px] font-mono text-slate-500 mt-2">
            *Assuming interfacial elastic tension $J = 1.0$ (lattice constant).
          </div>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// FIGURE 5: PLAQUETTE ZOOM-IN (DISCRETE PHASE ARROWS AND CIRCULATION)
// -------------------------------------------------------------------------
function Figure5PlaquetteZoom() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Discrete phases of gauge Ax and Ay on plaquette edges
  // Plaquette corners: A(0,0)=1.1, A(1,0)=1.5, etc.
  const phases = {
    Ax_bottom: { val: 1.25, label: "A_x(x,y)" },
    Ay_right: { val: 1.40, label: "A_y(x+1,y)" },
    Ax_top: { val: -0.32, label: "A_x(x,y+1)" },
    Ay_left: { val: -0.55, label: "A_y(x,y)" }
  };

  // Curvature loop calculation: F = Ax_bottom + Ay_right - Ax_top - Ay_left
  const F_p = phases.Ax_bottom.val + phases.Ay_right.val - phases.Ax_top.val - phases.Ay_left.val;
  // Wrapped inside [-pi, pi]
  let F_wrapped = (F_p + Math.PI) % (2 * Math.PI);
  if (F_wrapped < 0) F_wrapped += 2 * Math.PI;
  F_wrapped -= Math.PI;

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="font-serif text-lg font-bold text-white">
          Figure 5: Zoom-in of a Singular Vortex Trapped in the Discrete Plaquette
        </h3>
        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
          Mathematical proof of the U(1) gauge potential circulation on the four junctions of the primary lattice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Interactive Vector Diagram (SPAN 7) */}
        <div className="md:col-span-7 bg-slate-950 p-4 border border-slate-850 rounded-xl relative flex items-center justify-center">
          <svg className="w-full h-56 bg-[#03060a] rounded-lg border border-slate-900">
            {/* Draw Plaquette Grid corner nodes */}
            {/* Corners coordinates on SVG:
                Top-Left: (60, 40), Top-Right: (220, 40)
                Bottom-Left: (60, 180), Bottom-Right: (220, 180)
            */}
            <g transform="translate(20, 0)">
              {/* Grid corners */}
              <circle cx="60" cy="40" r="4.5" fill="#475569" />
              <circle cx="220" cy="40" r="4.5" fill="#475569" />
              <circle cx="60" cy="180" r="4.5" fill="#475569" />
              <circle cx="220" cy="180" r="4.5" fill="#475569" />

              {/* Corner labels */}
              <text x="35" y="32" fill="#94a3b8" className="font-mono text-[8px]">(x, y+1)</text>
              <text x="225" y="32" fill="#94a3b8" className="font-mono text-[8px]">(x+1, y+1)</text>
              <text x="35" y="196" fill="#94a3b8" className="font-mono text-[8px]">(x, y)</text>
              <text x="225" y="196" fill="#94a3b8" className="font-mono text-[8px]">(x+1, y)</text>

              {/* Edge connections (Potentials A_mu) */}
              {/* Bottom edge: Ax(x,y) from left to right */}
              <line x1="60" y1="180" x2="220" y2="180" stroke="#06b6d4" strokeWidth="2.5" />
              <path d="M 145 177 L 153 180 L 145 183 Z" fill="#06b6d4" />
              <text x="110" y="192" fill="#06b6d4" className="font-mono text-[9px] font-bold">A_x = 1.25 rad</text>

              {/* Right edge: Ay(x+1,y) from bottom to top */}
              <line x1="220" y1="180" x2="220" y2="40" stroke="#06b6d4" strokeWidth="2.5" />
              <path d="M 217 105 L 220 97 L 223 105 Z" fill="#06b6d4" />
              <text x="227" y="113" fill="#06b6d4" className="font-mono text-[9px] font-bold">A_y = 1.40 rad</text>

              {/* Top edge: Ax(x,y+1) from left to right (subtracted in cycle circulation) */}
              <line x1="60" y1="40" x2="220" y2="40" stroke="#f43f5e" strokeWidth="2.5" />
              <path d="M 145 37 L 153 40 L 145 43 Z" fill="#f43f5e" />
              <text x="110" y="32" fill="#f43f5e" className="font-mono text-[9px] font-bold">A_x = -0.32 rad (subtracted)</text>

              {/* Left edge: Ay(x,y) from bottom to top */}
              <line x1="60" y1="180" x2="60" y2="40" stroke="#f43f5e" strokeWidth="2.5" />
              <path d="M 57 105 L 60 97 L 63 105 Z" fill="#f43f5e" />
              <text x="5" y="113" fill="#f43f5e" className="font-mono text-[9px] font-bold">A_y = -0.55 rad (subtracted)</text>

              {/* Vortex flow vortex swirl in center */}
              <g transform="translate(140, 110)">
                <circle cx="0" cy="0" r="28" fill="rgba(168, 85, 247, 0.08)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1" strokeDasharray="3" className="animate-spin" />
                <circle cx="0" cy="0" r="4.5" fill="#a855f7" />
                <text x="-25" y="32" fill="#a855f7" className="font-mono text-[10px] font-extrabold pb-1 font-mono">VORTEX: F_p = \pi</text>
              </g>
            </g>
          </svg>
        </div>

        {/* Right Side Plaquette Calculus ledger (SPAN 5) */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg text-[11px] font-mono">
          <div className="border-b border-slate-800 pb-2 mb-3">
            <span className="text-[10px] font-mono text-slate-550 block">INTEGRATION METHOD</span>
            <span className="text-white font-bold block">Derivation of Curvature F_p</span>
          </div>

          <div className="space-y-3 font-sans">
            <div className="bg-slate-955 p-3 rounded border border-slate-855 font-mono">
              <span className="text-[8.5px] text-slate-500 uppercase block mb-1">Plaquette Circulation d_A</span>
              <div className="text-xs text-slate-300">
                Base formula:
                <div className="text-white font-bold mt-1 text-[11px] bg-slate-950 p-1.5 rounded text-center">
                  F_p = A_x(b) + A_y(r) - A_x(t) - A_y(l)
                </div>
              </div>
            </div>

            <div className="bg-slate-955 p-3 rounded border border-slate-855 font-mono space-y-1.5">
              <span className="text-[8.5px] text-slate-500 uppercase block mb-1">Variable Calculus</span>
              <div className="flex justify-between">
                <span>Positive sums:</span>
                <span className="text-emerald-400">1.25 + 1.40 = 2.65</span>
              </div>
              <div className="flex justify-between">
                <span>Negative subtractions:</span>
                <span className="text-rose-455">-(-0.32) -(-0.55) = +0.87</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-850 font-bold">
                <span>Total sum F_p:</span>
                <span className="text-white">3.52 rad</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-purple-400">
                <span>Modular [-\pi, \pi] (F_wrapped):</span>
                <span>{F_wrapped.toFixed(2)} rad</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-snug mt-4 font-sans">
            Since the total phase around the plaquette exceeds <strong className="text-cyan-300">\pi</strong>, compact gauge theory classifies this excess as a localized quantized vortex charge (pregeometric singularity).
          </p>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// FIGURE 6: CRITICAL SEIFERT CONCEPT SCHEMATIC (ACADEMIC CHART GRAPH)
// -------------------------------------------------------------------------
function Figure6SchematicDiagram() {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="font-serif text-lg font-bold text-white">
          Figure 6: Dual Seifert-BF Coupling Mechanism (Thread Diagram)
        </h3>
        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
          Conceptual layout detailing the geometric relation between gauge curvature strings and the protecting vascular sheets.
        </p>
      </div>

      <div className="bg-slate-950 rounded-xl p-5 border border-slate-850 flex items-center justify-center">
        <svg className="w-full max-w-lg h-56 bg-[#04060c] rounded-lg border border-slate-900 shadow-inner">
          {/* Schematic visual drawing */}
          <g transform="translate(10, 0)">
            {/* Draw 2D Membrane sheet slice perspectivized */}
            <path 
              d="M 50 140 L 150 70 L 410 70 L 310 140 Z" 
              fill="rgba(16, 185, 129, 0.08)" 
              stroke="#10b981" 
              strokeWidth="1.5" 
              strokeDasharray="4" 
            />
            <text x="60" y="85" fill="#10b981" className="font-mono text-[9px] font-bold">Seifert Sheet of Morphology \Sigma</text>

            {/* Vertically intersecting Gauge Field Curvature Line (Flux Line) */}
            {/* Draws a beautiful ring surrounding the vein intersection */}
            <g transform="translate(230, 105)">
              {/* Bottom projection arrow */}
              <line x1="0" y1="-70" x2="0" y2="70" stroke="#38bdf8" strokeWidth="2.5" />
              <path d="M -4 45 L 0 52 L 4 45 Z" fill="#38bdf8" />
              
              {/* Intersecting point sparkle */}
              <circle cx="0" cy="0" r="4.5" fill="#f59e0b" className="animate-ping" />
              <circle cx="0" cy="0" r="3" fill="#f59e0b" />
              <text x="7" y="3" fill="#f59e0b" className="font-mono text-[8px] font-bold">Intersection Point lk</text>

              {/* Phase circulation loop on the sheet surface */}
              <ellipse cx="0" cy="0" rx="40" ry="15" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3" />
              <text x="45" y="-5" fill="#ec4899" className="font-mono text-[8px]">Quantized Junction d A</text>
            </g>

            {/* Coordinate markers */}
            <text x="250" y="195" fill="#38bdf8" className="font-mono text-[9px]">Gauge Curvature Line F_p (Magnetic Flux)</text>
          </g>
        </svg>
      </div>

      <div className="bg-slate-950 p-4 border border-slate-855 rounded-xl leading-relaxed text-xs text-slate-400">
        <span className="font-mono text-cyan-300 font-bold block mb-1 uppercase">SEIFERT MODEL SYNTHESIS:</span>
        The diagram above demonstrates how the **Linking Number** represents the gauge curvature integral enclosed by the vascular membrane surface. Exact matching between the sheet boundary and the gauge path rigidly locks local microscopic fluctuations, acting as an amazing topological shield against dissipative temperature.
      </div>
    </div>
  );
}
