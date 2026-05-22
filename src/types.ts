/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModelType = 'reaction-diffusion' | 'monte-carlo' | 'mycelium-active' | 'coral-growth';

export interface SimConfig {
  model: ModelType;
  width: number;
  height: number;
  temperature: number; // T in Monte Carlo
  diffusionA: number; // Da
  diffusionB: number; // Db
  feedRate: number; // f
  killRate: number; // k
  memoryDecay: number; // \tau
  tensionStrength: number; // \gamma
  bubbleDefectRate: number; // R_d
  annealingSpeed: number; // rate at which temperature drops
  isAnnealingActive: boolean;
  activeCellsThreshold: number; // threshold for binary visualization
  muMemory?: number; // memory coupling strength (\mu)
  gaugeLevel?: number; // level k in U(1) BF sector (e.g., 1 to 5)
  gaugeCoupling?: number; // e^2 gauge coupling (e.g., 0.1 to 1.5)
}

export interface MetricSnapshot {
  step: number;
  energy: number;
  connectedComponents: number;
  eulerCharacteristic: number;
  entropy: number;
  avalancheSize: number;
}

export interface ArchitecturalFile {
  name: string;
  path: string;
  category: 'core' | 'analysis' | 'visualization' | 'experiments' | 'configuration';
  description: string;
  code: string;
}
