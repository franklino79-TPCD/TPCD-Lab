/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelType, SimConfig } from "../types";

export class MorphogenesisEngine {
  public width: number;
  public height: number;
  
  // Grid fields
  public morphology: Int8Array; // 1 for active structure, 0 for empty
  public energy: Float32Array; // potential landscape
  public memory: Float32Array; // path trace reinforcement
  public tension: Float32Array; // elastic/gradient tension
  
  // Reactant concentrations for Reaction-Diffusion
  public gridA: Float32Array;
  public gridB: Float32Array;
  
  // U(1) Gauge fields (Camino A: Gauge Sector & BF coupling)
  public gaugeAx: Float32Array; // horizontal link connections A_x in R / 2pi Z
  public gaugeAy: Float32Array; // vertical link connections A_y in R / 2pi Z
  public gaugeF: Float32Array;  // discrete curvature plaquettes F := dA mod 2pi
  
  // Mycelial hyphae agents
  public hyphae: Array<{
    x: number;
    y: number;
    angle: number;
    age: number;
    active: boolean;
  }> = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const size = width * height;
    
    this.morphology = new Int8Array(size);
    this.energy = new Float32Array(size);
    this.memory = new Float32Array(size);
    this.tension = new Float32Array(size);
    this.gridA = new Float32Array(size).fill(1.0);
    this.gridB = new Float32Array(size).fill(0.0);
    
    this.gaugeAx = new Float32Array(size);
    this.gaugeAy = new Float32Array(size);
    this.gaugeF = new Float32Array(size);
    
    this.reset();
  }

  // Helper to wrap physical quantities to angular domain [-pi, pi] as defined in the U(1) gauge sector
  private wrapAngle(val: number): number {
    let w = (val + Math.PI) % (2 * Math.PI);
    if (w < 0) w += 2 * Math.PI;
    return w - Math.PI;
  }

  // Recompute gauge field curvatures F_p = dA (circulation of A around plaquette (x,y))
  public recomputeGaugeCurvatures() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        const xp = (x + 1) % this.width;
        const yp = (y + 1) % this.height;
        
        // F_p = A_x(x,y) + A_y(x+1, y) - A_x(x, y+1) - A_y(x,y)
        const val = this.gaugeAx[idx] + this.gaugeAy[y * this.width + xp] - this.gaugeAx[yp * this.width + x] - this.gaugeAy[idx];
        
        // Wrap F_p to [-pi, pi] as defined in the paper (F in R / 2pi Z)
        this.gaugeF[idx] = this.wrapAngle(val);
      }
    }
  }

  // Seed quantum vortices using quantized vector potential superposition: A = charge * (-dy/r^2, dx/r^2)
  public seedGaugeVortices(numPairs: number = 2) {
    const size = this.width * this.height;
    this.gaugeAx.fill(0);
    this.gaugeAy.fill(0);
    
    const vortices: Array<{ cx: number; cy: number; charge: number }> = [];
    
    // Seed central topological vortex
    vortices.push({ cx: this.width / 2, cy: this.height / 2, charge: 1.0 });
    
    // Seed dipolar pairs to generate linking paths
    for (let i = 0; i < numPairs; i++) {
      const vx1 = Math.floor(0.2 * this.width + Math.random() * 0.6 * this.width);
      const vy1 = Math.floor(0.2 * this.height + Math.random() * 0.6 * this.height);
      vortices.push({ cx: vx1, cy: vy1, charge: 1.0 });
      
      const vx2 = Math.floor(0.2 * this.width + Math.random() * 0.6 * this.width);
      const vy2 = Math.floor(0.2 * this.height + Math.random() * 0.6 * this.height);
      vortices.push({ cx: vx2, cy: vy2, charge: -1.0 });
    }
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        let ax = 0;
        let ay = 0;
        
        for (const v of vortices) {
          let dx = x - v.cx;
          let dy = y - v.cy;
          
          // Periodic boundaries
          if (dx > this.width / 2) dx -= this.width;
          if (dx < -this.width / 2) dx += this.width;
          if (dy > this.height / 2) dy -= this.height;
          if (dy < -this.height / 2) dy += this.height;
          
          const r2 = dx * dx + dy * dy + 0.8; // soft core
          ax += v.charge * (-dy / r2);
          ay += v.charge * (dx / r2);
        }
        
        // Wrap to [-pi, pi]
        this.gaugeAx[idx] = this.wrapAngle(ax);
        this.gaugeAy[idx] = this.wrapAngle(ay);
      }
    }
    
    this.recomputeGaugeCurvatures();
  }

  public reset(model: ModelType = 'reaction-diffusion') {
    const size = this.width * this.height;
    this.morphology.fill(0);
    this.energy.fill(0);
    this.memory.fill(0);
    this.tension.fill(0);
    this.hyphae = [];
    
    if (model === 'reaction-diffusion') {
      // Seed Reaction-Diffusion with a central patch of B
      this.gridA.fill(1.0);
      this.gridB.fill(0.0);
      
      const cx = Math.floor(this.width / 2);
      const cy = Math.floor(this.height / 2);
      const radius = 6;
      for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const idx = y * this.width + x;
            this.gridA[idx] = 0.5 + Math.random() * 0.1;
            this.gridB[idx] = 0.25 + Math.random() * 0.1;
          }
        }
      }
    } else if (model === 'mycelium-active') {
      // Spawn central mycelium hyphae pointing in radial directions
      const cx = this.width / 2;
      const cy = this.height / 2;
      const numAgents = 16;
      for (let i = 0; i < numAgents; i++) {
        const angle = (i * 2 * Math.PI) / numAgents;
        this.hyphae.push({
          x: cx,
          y: cy,
          angle: angle,
          age: 0,
          active: true,
        });
      }
      // Draw seed cell
      const idx = Math.floor(cy) * this.width + Math.floor(cx);
      this.morphology[idx] = 1;
      this.memory[idx] = 1.0;
    } else {
      // Seed for Monte Carlo / Coral
      const cx = Math.floor(this.width / 2);
      const cy = Math.floor(this.height / 2);
      
      // Central seed
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const idx = (cy + dy) * this.width + (cx + dx);
          if (idx >= 0 && idx < size) {
            this.morphology[idx] = 1;
            this.memory[idx] = 1.0;
          }
        }
      }
      
      // Add random noisy structures to trigger self-organization
      for (let i = 0; i < size * 0.04; i++) {
        const x = Math.floor(Math.random() * this.width);
        const y = Math.floor(Math.random() * this.height);
        this.morphology[y * this.width + x] = 1;
        this.memory[y * this.width + x] = 0.5;
      }
    }
    
    // Initialize gauge vortices upon reset representing the Seifert 1-cycle points
    this.seedGaugeVortices(2);
  }

  // Laplaciano O(1)-ish para reacción difusión
  private computeLaplacian(x: number, y: number, grid: Float32Array): number {
    const idx = y * this.width + x;
    const lValue = grid[idx];
    
    // Vecinos de Von Neumann periódicos
    const xm = (x - 1 + this.width) % this.width;
    const xp = (x + 1) % this.width;
    const ym = (y - 1 + this.height) % this.height;
    const yp = (y + 1) % this.height;
    
    // Laplaciano estándar de 5 puntos
    const sum = grid[y * this.width + xm] +
                grid[y * this.width + xp] +
                grid[ym * this.width + x] +
                grid[yp * this.width + x];
                
    return sum - 4.0 * lValue;
  }

  // Recurso: cálculo local de energía para Ising Monte Carlo (incluyendo acoplamiento de calibre BF)
  private getLocalEnergy(x: number, y: number, J: number, mu: number, gamma: number, kGauge: number): number {
    const size = this.width * this.height;
    const idx = y * this.width + x;
    const spin = this.morphology[idx] === 1 ? 1 : -1;
    
    let sumSpins = 0;
    // Vecinos de Moore periódicos
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + this.width) % this.width;
        const ny = (y + dy + this.height) % this.height;
        const nIdx = ny * this.width + nx;
        sumSpins += this.morphology[nIdx] === 1 ? 1 : -1;
      }
    }
    
    const energySpin = -J * spin * sumSpins;
    const energyMemory = -mu * this.memory[idx] * spin;
    const energyTension = gamma * this.tension[idx] * (spin === 1 ? 1.0 : 0.0);
    
    // Acoplamiento BF de Seifert correcto: -kGauge * F_p * \Sigma_p
    // canónicamente dependiente de si el espín es activo (i.e. pertenece a la superficie Seifert \Sigma)
    const energyBF = -kGauge * this.gaugeF[idx] * (spin === 1 ? 1.0 : 0.0);
    
    return energySpin + energyMemory + energyTension + energyBF;
  }

  // Un solo paso global para el modelo seleccionado
  public step(config: SimConfig): { flipsAccepted: number } {
    let flipsAccepted = 0;
    const size = this.width * this.height;

    // 1. Calcular de antemano la tensión mecánica local (derivada espacial discreta de densidad)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        let neighborsSum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + this.width) % this.width;
            const ny = (y + dy + this.height) % this.height;
            neighborsSum += this.morphology[ny * this.width + nx];
            count++;
          }
        }
        // Laplacian de la densidad
        const lap = neighborsSum - count * this.morphology[idx];
        this.tension[idx] = Math.abs(lap);
      }
    }

    if (config.model === 'reaction-diffusion') {
      const nextA = new Float32Array(size);
      const nextB = new Float32Array(size);
      
      const F = config.feedRate;
      const K = config.killRate;
      const Da = config.diffusionA;
      const Db = config.diffusionB;
      const dt = 1.0;

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = y * this.width + x;
          const a = this.gridA[idx];
          const b = this.gridB[idx];
          
          const lapA = this.computeLaplacian(x, y, this.gridA);
          const lapB = this.computeLaplacian(x, y, this.gridB);
          
          const reaction = a * b * b;
          nextA[idx] = Math.max(0, Math.min(1.0, a + (Da * lapA - reaction + F * (1.0 - a)) * dt));
          nextB[idx] = Math.max(0, Math.min(1.0, b + (Db * lapB + reaction - (K + F) * b) * dt));
          
          // Sincronizar con morfología binaria
          this.morphology[idx] = nextB[idx] > config.activeCellsThreshold ? 1 : 0;
          this.memory[idx] = this.memory[idx] * (1 - config.memoryDecay) + nextB[idx] * 0.1;
          this.energy[idx] = - (3 * nextA[idx] - nextB[idx] * 2);
        }
      }
      
      this.gridA = nextA;
      this.gridB = nextB;
      
    } else if (config.model === 'monte-carlo') {
      // Dinámica de Glauber de Monte Carlo con acoplamiento de memoria y sector Gauge BF
      const steps = Math.floor(size * 0.4); // número de spins muestreados localmente
      const muVal = config.muMemory !== undefined ? config.muMemory : (config.memoryDecay * 15);
      const kGauge = config.gaugeLevel !== undefined ? config.gaugeLevel : 2;
      
      for (let s = 0; s < steps; s++) {
        const x = Math.floor(Math.random() * this.width);
        const y = Math.floor(Math.random() * this.height);
        const idx = y * this.width + x;
        
        const E_init = this.getLocalEnergy(x, y, 1.0, muVal, config.tensionStrength, kGauge);
        
        // Propuesta de cambio de espín
        const prevVal = this.morphology[idx];
        this.morphology[idx] = prevVal === 1 ? 0 : 1;
        
        const E_final = this.getLocalEnergy(x, y, 1.0, muVal, config.tensionStrength, kGauge);
        const dE = E_final - E_init;
        
        let accept = false;
        if (dE <= 0) {
          accept = true;
        } else {
          const p = Math.exp(-dE / Math.max(config.temperature, 0.001));
          if (Math.random() < p) {
            accept = true;
          }
        }
        
        if (accept) {
          flipsAccepted++;
          // Al alimentar la celda, aumenta la memoria
          if (this.morphology[idx] === 1) {
            this.memory[idx] = Math.min(5.0, this.memory[idx] + 1.0);
          }
        } else {
          // Revertir
          this.morphology[idx] = prevVal;
        }
      }
      
      // Decaimiento natural y arrastre de memoria en todo el grid
      for (let i = 0; i < size; i++) {
        this.memory[i] *= (1.0 - config.memoryDecay);
        this.memory[i] += this.morphology[i] * 0.2;
        this.energy[i] = this.getLocalEnergy(
          i % this.width, 
          Math.floor(i / this.width), 
          1.0, 
          muVal, 
          config.tensionStrength,
          kGauge
        );
      }
      
    } else if (config.model === 'mycelium-active') {
      // Movimiento de agentes activos (Hifas de micelio)
      const nextAgents: typeof this.hyphae = [];
      const growthRate = 0.2;
      
      for (const agent of this.hyphae) {
        if (!agent.active) continue;
        
        // Siente las tres direcciones frontales: Izquierda, Centro, Derecha
        const angleLeft = agent.angle - Math.PI / 6;
        const angleCenter = agent.angle;
        const angleRight = agent.angle + Math.PI / 6;
        
        const distSense = 3.0;
        
        const sense = (angle: number) => {
          const sx = Math.floor((agent.x + Math.cos(angle) * distSense + this.width) % this.width);
          const sy = Math.floor((agent.y + Math.sin(angle) * distSense + this.height) % this.height);
          const idx = sy * this.width + sx;
          
          // Desea ir donde hay alta memoria y baja tensión mecánica
          return this.memory[idx] * 2.0 - this.tension[idx] * config.tensionStrength * 1.5;
        };
        
        const wl = sense(angleLeft);
        const wc = sense(angleCenter);
        const wr = sense(angleRight);
        
        // Ajustar dirección según los pesos frontales
        if (wl > wc && wl > wr) {
          agent.angle -= 0.15;
        } else if (wr > wc && wr > wl) {
          agent.angle += 0.15;
        }
        
        // Añadir fluctuación Browniana térmica (ligada a la temperatura)
        agent.angle += (Math.random() - 0.5) * config.temperature * 0.5;
        
        // Desplazarse
        agent.x = (agent.x + Math.cos(agent.angle) * 1.2 + this.width) % this.width;
        agent.y = (agent.y + Math.sin(agent.angle) * 1.2 + this.height) % this.height;
        agent.age++;
        
        // Dibujar en el grid
        const kx = Math.floor(agent.x);
        const ky = Math.floor(agent.y);
        const kidx = ky * this.width + kx;
        this.morphology[kidx] = 1;
        this.memory[kidx] = Math.min(5.0, this.memory[kidx] + 0.8);
        
        // Ramificación estocástica (branching)
        if (Math.random() < 0.04 && this.hyphae.length + nextAgents.length < 150) {
          const branchOffset = Math.random() < 0.5 ? Math.PI / 4 : -Math.PI / 4;
          nextAgents.push({
            x: agent.x,
            y: agent.y,
            angle: agent.angle + branchOffset,
            age: 0,
            active: true
          });
        }
        
        // Condición de muerte por densidad/agotamiento local o envejecimiento excesivo
        const checkIdx = ky * this.width + kx;
        if (this.memory[checkIdx] > 4.5 || agent.age > 200) {
          agent.active = false;
        } else {
          nextAgents.push(agent);
        }
      }
      
      this.hyphae = nextAgents;
      
      // Decaimiento del campo químico globales
      for (let i = 0; i < size; i++) {
        this.memory[i] *= (1.0 - config.memoryDecay);
        this.memory[i] += this.morphology[i] * 0.1;
        // La energía es inversa de la densidad y proporcional a la tensión
        this.energy[i] = -this.memory[i] * 0.5 + this.tension[i] * 0.2;
      }
      
      // Si nos quedamos sin agentes, resucitar algunos hilos en puntos aleatorios activos
      if (this.hyphae.length === 0) {
        for (let i = 0; i < 6; i++) {
          const rx = Math.floor(Math.random() * this.width);
          const ry = Math.floor(Math.random() * this.height);
          const idx = ry * this.width + rx;
          if (this.morphology[idx] === 1) {
            this.hyphae.push({
              x: rx,
              y: ry,
              angle: Math.random() * 2 * Math.PI,
              age: 0,
              active: true
            });
          }
        }
      }
    } else if (config.model === 'coral-growth') {
      // Crecimiento guiado por agregación limitada por difusión estocástica (DLA) adaptada con simulated-annealing
      // Las partículas fluyen desde posiciones libres y se adhieren a la masa del coral
      const steps = Math.floor(size * 0.8);
      for (let s = 0; s < steps; s++) {
        const x = Math.floor(Math.random() * this.width);
        const y = Math.floor(Math.random() * this.height);
        const idx = y * this.width + x;
        if (this.morphology[idx] === 0) {
          // Evaluar si tiene algún vecino ya consolidado
          let activeNeighbor = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = (x + dx + this.width) % this.width;
              const ny = (y + dy + this.height) % this.height;
              if (this.morphology[ny * this.width + nx] === 1) {
                activeNeighbor = true;
                break;
              }
            }
          }
          
          if (activeNeighbor) {
            // El calor disminuye la agregación y favorece la fluidez
            const stickiness = 1.0 - Math.min(config.temperature * 0.4, 0.95);
            if (Math.random() < stickiness) {
              this.morphology[idx] = 1;
              this.memory[idx] = 4.0;
              flipsAccepted++;
            }
          }
        }
      }
      
      for (let i = 0; i < size; i++) {
        this.memory[i] *= (1.0 - config.memoryDecay * 1.5);
        this.memory[i] += this.morphology[i] * 0.35;
        this.energy[i] = (this.morphology[i] === 1 ? -1 : 1) * (1.0 - 0.2 * this.tension[i]);
      }
    }

    // --- U(1) GAUGE SECTOR METROPOLIS SWEEP (Camino A) ---
    // El campo de gauge U(1) evoluciona térmicamente segun el acoplamiento BF, alineando su flujo F_p
    // con el borde del muro de dominio del sector Ising (las celdas activas)
    const eSquared = config.gaugeCoupling !== undefined ? config.gaugeCoupling : 0.50;
    const eFactor = 1.0 / (2.0 * eSquared);
    const kVal = config.gaugeLevel !== undefined ? config.gaugeLevel : 2;
    const numGaugeUpdates = Math.floor(size * 0.15); // Sweep de enlaces ligero para mantener FPS altos

    for (let s = 0; s < numGaugeUpdates; s++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      const idx = y * this.width + x;
      
      const updateAx = Math.random() < 0.5;
      const delta = (Math.random() - 0.5) * 0.6; // desplazamiento propuesto de fase
      
      if (updateAx) {
        // Enlace horizontal A_x(x, y) afecta las placas (x,y) y (x, y-1) en el Toro T^2
        const yPrev = (y - 1 + this.height) % this.height;
        const idxPrev = yPrev * this.width + x;
        
        const F1 = this.gaugeF[idx];
        const F2 = this.gaugeF[idxPrev];
        
        const active1 = this.morphology[idx] === 1 ? 1.0 : 0.0;
        const active2 = this.morphology[idxPrev] === 1 ? 1.0 : 0.0;
        
        // Delta E_kin (Maxwell) + Delta E_bf (Acoplamiento de Seifert)
        const dE_kin = eFactor * (Math.pow(F1 + delta, 2) + Math.pow(F2 - delta, 2) - Math.pow(F1, 2) - Math.pow(F2, 2));
        const dE_int = -kVal * delta * (active1 - active2);
        const dE = dE_kin + dE_int;
        
        if (dE <= 0 || Math.random() < Math.exp(-dE / Math.max(config.temperature, 0.01))) {
          this.gaugeAx[idx] = this.wrapAngle(this.gaugeAx[idx] + delta);
          this.gaugeF[idx] = this.wrapAngle(F1 + delta);
          this.gaugeF[idxPrev] = this.wrapAngle(F2 - delta);
        }
      } else {
        // Enlace vertical A_y(x, y) afecta las placas (x,y) y (x-1, y)
        const xPrev = (x - 1 + this.width) % this.width;
        const idxPrev = y * this.width + xPrev;
        
        const F1 = this.gaugeF[idx];
        const F2 = this.gaugeF[idxPrev];
        
        const active1 = this.morphology[idx] === 1 ? 1.0 : 0.0;
        const active2 = this.morphology[idxPrev] === 1 ? 1.0 : 0.0;
        
        // Delta E_kin (Maxwell) + Delta E_bf (Acoplamiento de Seifert)
        const dE_kin = eFactor * (Math.pow(F1 - delta, 2) + Math.pow(F2 + delta, 2) - Math.pow(F1, 2) - Math.pow(F2, 2));
        const dE_int = -kVal * delta * (active2 - active1);
        const dE = dE_kin + dE_int;
        
        if (dE <= 0 || Math.random() < Math.exp(-dE / Math.max(config.temperature, 0.01))) {
          this.gaugeAy[idx] = this.wrapAngle(this.gaugeAy[idx] + delta);
          this.gaugeF[idx] = this.wrapAngle(F1 - delta);
          this.gaugeF[idxPrev] = this.wrapAngle(F2 + delta);
        }
      }
    }

    // Recomputación períodica de seguridad para eliminar deriva numéricas de flotantes
    if (Math.random() < 0.01) {
      this.recomputeGaugeCurvatures();
    }

    // Retornar flips accepted
    return { flipsAccepted };
  }

  // Provocar un "defect bubble" que reestructura la topología local
  public induceBubbleDefect(cx: number, cy: number, radius: number) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const x = (cx + dx + this.width) % this.width;
          const y = (cy + dy + this.height) % this.height;
          const idx = y * this.width + x;
          this.morphology[idx] = 0;
          this.gridA[idx] = 1.0;
          this.gridB[idx] = 0.0;
          this.memory[idx] = 0.05 + Math.random() * 0.05;
        }
      }
    }
  }

  // -- ANÁLISIS TOPOLÓGICO Y GEOMÉTRICO (Cálculos matemáticos exactos en JS) --

  /**
   * Calcula la característica de Euler: Chi = V - E + F
   */
  public getEulerCharacteristic(): number {
    let V = 0;
    let E_h = 0;
    let E_v = 0;
    let F = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (this.morphology[idx] === 1) {
          V++;
          
          // Arista horizontal a la derecha (periódico o dirichlet según convención)
          const xp = (x + 1) % this.width;
          if (this.morphology[y * this.width + xp] === 1) {
            E_h++;
          }
          
          // Arista vertical abajo
          const yp = (y + 1) % this.height;
          if (this.morphology[yp * this.width + x] === 1) {
            E_v++;
          }

          // Faceta cuadrada (2x2 completo)
          const yp_ny = (y + 1) % this.height;
          const xp_nx = (x + 1) % this.width;
          if (
            this.morphology[y * this.width + xp_nx] === 1 &&
            this.morphology[yp_ny * this.width + x] === 1 &&
            this.morphology[yp_ny * this.width + xp_nx] === 1
          ) {
            F++;
          }
        }
      }
    }

    return V - (E_h + E_v) + F;
  }

  /**
   * Calcula los componentes conectados usando Union-Find (Disjoint Set Union)
   */
  public getConnectedComponents(): number {
    const size = this.width * this.height;
    const parent = new Int32Array(size);
    for (let i = 0; i < size; i++) {
      parent[i] = i;
    }

    const find = (i: number): number => {
      let root = i;
      while (parent[root] !== root) {
        root = parent[root];
      }
      // Compresión de caminos rápida
      let curr = i;
      while (curr !== root) {
        const nxt = parent[curr];
        parent[curr] = root;
        curr = nxt;
      }
      return root;
    };

    const union = (p: number, q: number) => {
      const rootP = find(p);
      const rootQ = find(q);
      if (rootP !== rootQ) {
        parent[rootP] = rootQ;
      }
    };

    let activeCount = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (this.morphology[idx] === 1) {
          activeCount++;
          // Conectar con vecinos adyacentes a la derecha y abajo
          const xp = (x + 1) % this.width;
          const idxRight = y * this.width + xp;
          if (this.morphology[idxRight] === 1) {
            union(idx, idxRight);
          }

          const yp = (y + 1) % this.height;
          const idxDown = yp * this.width + x;
          if (this.morphology[idxDown] === 1) {
            union(idx, idxDown);
          }
          
          // Soporte diagonal para vecindario Moore completo de 8 vecinos
          const yp_ny = (y + 1) % this.height;
          const xp_nx = (x + 1) % this.width;
          const idxDiag1 = yp_ny * this.width + xp_nx;
          if (this.morphology[idxDiag1] === 1) {
            union(idx, idxDiag1);
          }
          
          const xm_nx = (x - 1 + this.width) % this.width;
          const idxDiag2 = yp_ny * this.width + xm_nx;
          if (this.morphology[idxDiag2] === 1) {
            union(idx, idxDiag2);
          }
        }
      }
    }

    const uniqueRoots = new Set<number>();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (this.morphology[idx] === 1) {
          uniqueRoots.add(find(idx));
        }
      }
    }

    return uniqueRoots.size;
  }

  /**
   * Calcula el fractal dimension del grid morphology binario mediante Box Counting
   */
  public getFractalDimension(): number {
    const sizes = [2, 4, 8, 16];
    const counts: number[] = [];
    const logInverses: number[] = [];
    
    let activeCount = 0;
    for (let i = 0; i < this.morphology.length; i++) {
      if (this.morphology[i] === 1) activeCount++;
    }
    if (activeCount === 0) return 0.0;
    
    for (const s of sizes) {
      let boxCount = 0;
      for (let y = 0; y < this.height; y += s) {
        for (let x = 0; x < this.width; x += s) {
          let hasActive = false;
          const limitY = Math.min(y + s, this.height);
          const limitX = Math.min(x + s, this.width);
          for (let by = y; by < limitY; by++) {
            for (let bx = x; bx < limitX; bx++) {
              if (this.morphology[by * this.width + bx] === 1) {
                hasActive = true;
                break;
              }
            }
            if (hasActive) break;
          }
          if (hasActive) {
            boxCount++;
          }
        }
      }
      if (boxCount > 0) {
        counts.push(boxCount);
        logInverses.push(Math.log(1.0 / s));
      }
    }
    
    if (counts.length < 2) return 0.0;
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const n = counts.length;
    
    for (let i = 0; i < n; i++) {
      const x = logInverses[i];
      const y = Math.log(counts[i]);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const x = logInverses[i];
      const y = Math.log(counts[i]);
      num += (x - meanX) * (y - meanY);
      den += (x - meanX) * (x - meanX);
    }
    
    if (den === 0) return 0.0;
    return Math.abs(num / den);
  }

  /**
   * Devuelve un análisis detallado topológico, fractal y gauge en un único paso optimizado
   */
  public getTopologicalAnalysis(config?: SimConfig) {
    const size = this.width * this.height;
    const parent = new Int32Array(size);
    for (let i = 0; i < size; i++) {
      parent[i] = i;
    }

    const find = (i: number): number => {
      let root = i;
      while (parent[root] !== root) {
        root = parent[root];
      }
      let curr = i;
      while (curr !== root) {
        const nxt = parent[curr];
        parent[curr] = root;
        curr = nxt;
      }
      return root;
    };

    const union = (p: number, q: number) => {
      const rootP = find(p);
      const rootQ = find(q);
      if (rootP !== rootQ) {
        parent[rootP] = rootQ;
      }
    };

    let activeCount = 0;
    let totalActiveFlux = 0;
    let totalKineticU1 = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (this.morphology[idx] === 1) {
          activeCount++;
          totalActiveFlux += this.gaugeF[idx];
          
          const xp = (x + 1) % this.width;
          if (this.morphology[y * this.width + xp] === 1) {
            union(idx, y * this.width + xp);
          }
          const yp = (y + 1) % this.height;
          if (this.morphology[yp * this.width + x] === 1) {
            union(idx, yp * this.width + x);
          }
          // Moore diagonals
          const yp_ny = (y + 1) % this.height;
          const xp_nx = (x + 1) % this.width;
          if (this.morphology[yp_ny * this.width + xp_nx] === 1) {
            union(idx, yp_ny * this.width + xp_nx);
          }
          const xm_nx = (x - 1 + this.width) % this.width;
          if (this.morphology[yp_ny * this.width + xm_nx] === 1) {
            union(idx, yp_ny * this.width + xm_nx);
          }
        }
        totalKineticU1 += this.gaugeF[idx] * this.gaugeF[idx];
      }
    }

    // Calcular tamaños y flujos acumulados de cada componente conectado
    const rootSizes = new Map<number, number>();
    const rootFluxes = new Map<number, number>();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (this.morphology[idx] === 1) {
          const root = find(idx);
          rootSizes.set(root, (rootSizes.get(root) || 0) + 1);
          rootFluxes.set(root, (rootFluxes.get(root) || 0) + this.gaugeF[idx]);
        }
      }
    }

    let b0 = rootSizes.size;
    let largestSize = 0;
    for (const [root, s] of rootSizes.entries()) {
      if (s > largestSize) {
        largestSize = s;
      }
    }

    // Filtrar pequeñas fluctuaciones térmicas (tamaño de cluster < 6) para el Linking Number macroscópico
    let stableActiveFlux = 0;
    for (const [root, s] of rootSizes.entries()) {
      if (s >= 6) {
        stableActiveFlux += rootFluxes.get(root) || 0;
      }
    }

    const euler = this.getEulerCharacteristic();
    const b1 = Math.max(0, b0 - euler);
    const largestRatio = activeCount > 0 ? largestSize / size : 0.0; // relative to canvas total size

    // Config parameters or defaults
    const kVal = config?.gaugeLevel !== undefined ? config.gaugeLevel : 2;
    const eSquared = config?.gaugeCoupling !== undefined ? config.gaugeCoupling : 0.50;
    
    // Maxwell Kinetic Term: (1/2e^2) * \sum (F_p)^2
    const energyMaxwell = (1.0 / (2.0 * eSquared)) * totalKineticU1;
    // BF Coupling Term: - k * \sum_{p \in active} F_p
    const energyBF = - kVal * totalActiveFlux;
    // Winding number representing Seifert boundary enclosing quantized flux lines (Gauss Linking)
    // Filtramos ruido micro-térmico usando el flujo de componentes estables y coherentes
    const gaussLinking = Math.abs(stableActiveFlux) > 0.05 ? Math.round(stableActiveFlux / (2.0 * Math.PI)) : 0;
    // Scale limit defined in paper: l_c = \sqrt{2 pi k / J} (J=1.0)
    const confinementLimit = Math.sqrt(2 * Math.PI * kVal);

    return {
      b0,
      b1,
      euler,
      activeCount,
      activeRatio: activeCount / size,
      largestSize,
      largestRatio,
      fractalDim: this.getFractalDimension(),
      entropy: this.getShannonEntropy(),
      totalEnergy: this.getTotalEnergy(),
      
      // Gauge sector additions
      totalActiveFlux,
      energyMaxwell,
      energyBF,
      gaussLinking,
      confinementLimit
    };
  }

  /**
   * Calcula la entropía de Shannon (orden vs desorden del grid binario)
   */
  public getShannonEntropy(): number {
    const size = this.width * this.height;
    let ones = 0;
    for (let i = 0; i < size; i++) {
      if (this.morphology[i] === 1) ones++;
    }
    const p1 = ones / size;
    const p0 = 1.0 - p1;

    if (p0 === 0 || p1 === 0) return 0.0;
    return -(p0 * Math.log2(p0) + p1 * Math.log2(p1));
  }

  /**
   * Calcula la energía total integrada del grid
   */
  public getTotalEnergy(): number {
    let sum = 0.0;
    const size = this.width * this.height;
    for (let i = 0; i < size; i++) {
        sum += Math.abs(this.energy[i]);
    }
    return sum / size;
  }
}
