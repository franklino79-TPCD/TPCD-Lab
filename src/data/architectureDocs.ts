/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArchitecturalFile } from "../types";

export const ARCHITECTURE_FILES: ArchitecturalFile[] = [
  {
    name: "lattice.py",
    path: "core/lattice.py",
    category: "core",
    description: "Sistema de grids interactivos (densos y dispersos) con buffers optimizados para actualizaciones O(1) y cálculo eficiente de vecindarios de Moore/von Neumann.",
    code: `import numpy as np
from typing import Tuple, Dict, Set

class TopologicalLattice:
    """
    Representa el espacio discretizado de simetría cuadrada en 2D.
    Soporta operaciones densas optimizadas para difusión y almacenamiento disperso
    para actualizaciones de Monte Carlo del frente de crecimiento procedural.
    """
    def __init__(self, width: int, height: int, boundary: str = "periodic"):
        self.width = width
        self.height = height
        self.boundary = boundary # "periodic" o "dirichlet"
        
        # Buffer primario de morfología: 1 = Estructura, 0 = Vacío
        self.morphology = np.zeros((width, height), dtype=np.int8)
        
        # Campo de energía potencial local V(x, y)
        self.energy = np.zeros((width, height), dtype=np.float32)
        
        # Campo de memoria temporal / histéresis M(x, y)
        self.memory = np.zeros((width, height), dtype=np.float32)
        
        # Tensión estructural acumulada o deformación elástica local S(x, y)
        self.tension = np.zeros((width, height), dtype=np.float32)
        
        # Estructura dispersa (Sparse Set) para frentes activos (optimiza O(1) Monte Carlo)
        self.active_sites: Set[Tuple[int, int]] = set()

    def get_neighbors(self, x: int, y: int, radius: int = 1, neighborhood: str = "moore") -> np.ndarray:
        """
        Retorna las coordenadas de los vecinos de forma circular o cuadrada.
        Aplica condiciones de borde (borde periódico u de tipo Dirichlet).
        """
        neighbors = []
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                if dx == 0 and dy == 0:
                    continue
                if neighborhood == "von_neumann" and abs(dx) + abs(dy) > radius:
                    continue
                
                nx, ny = x + dx, y + dy
                if self.boundary == "periodic":
                    nx = nx % self.width
                    ny = ny % self.height
                    neighbors.append((nx, ny))
                elif self.boundary == "dirichlet":
                    if 0 <= nx < self.width and 0 <= ny < self.height:
                        neighbors.append((nx, ny))
        return np.array(neighbors, dtype=np.int32)

    def compute_local_tension_tensor(self, x: int, y: int) -> float:
        """
        Calcula la tensión elástica local usando el gradiente discreto de densidad.
        Modelado como el Laplaciano discreto del campo morfológico.
        """
        neighbors = self.get_neighbors(x, y, radius=1, neighborhood="moore")
        val = float(self.morphology[x, y])
        sum_neighbors = 0.0
        for nx, ny in neighbors:
            sum_neighbors += self.morphology[nx, ny]
        # Laplaciano aproximado para malla cuadrada
        laplacian = sum_neighbors - len(neighbors) * val
        self.tension[x, y] = np.abs(laplacian)
        return self.tension[x, y]

    def register_active_site(self, x: int, y: int):
        self.active_sites.add((x, y))

    def unregister_active_site(self, x: int, y: int):
        self.active_sites.discard((x, y))
`
  },
  {
    name: "physics.py",
    path: "core/physics.py",
    category: "core",
    description: "Módulo de física estadística y evolución morfológica. Implementa algoritmos de Reacción-Difusión (Gray-Scott), dinámica de Ising con Metropolis, transiciones de energía adaptativa y 'bubble defects'.",
    code: `import numpy as np
import numba
from typing import Tuple

@numba.njit(fastmath=True)
def step_reaction_diffusion_kernel(
    A: np.ndarray, B: np.ndarray, 
    Da: float, Db: float, 
    feed: float, kill: float, 
    dt: float = 1.0
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Ecuación de Turing/Gray-Scott compilada por Numba para CPU de alto rendimiento.
    Da/Db: coeficientes de difusión.
    feed/kill: tasas de alimentación y muerte.
    """
    w, h = A.shape
    next_A = A.copy()
    next_B = B.copy()
    
    for x in range(1, w - 1):
        for y in range(1, h - 1):
            # Cómputo del Laplaciano discreto en 5 puntos
            lap_A = A[x+1, y] + A[x-1, y] + A[x, y+1] + A[x, y-1] - 4 * A[x, y]
            lap_B = B[x+1, y] + B[x-1, y] + B[x, y+1] + B[x, y-1] - 4 * B[x, y]
            
            abb = A[x, y] * B[x, y]**2
            
            next_A[x, y] = A[x, y] + (Da * lap_A - abb + feed * (1.0 - A[x, y])) * dt
            next_B[x, y] = B[x, y] + (Db * lap_B + abb - (kill + feed) * B[x, y]) * dt
            
            # Recorte por estabilidad
            if next_A[x, y] < 0: next_A[x, y] = 0.0
            if next_A[x, y] > 1: next_A[x, y] = 1.0
            if next_B[x, y] < 0: next_B[x, y] = 0.0
            if next_B[x, y] > 1: next_B[x, y] = 1.0
            
    return next_A, next_B

@numba.njit(fastmath=True)
def calculate_local_energy(
    morphology: np.ndarray, memory: np.ndarray, tension: np.ndarray,
    x: int, y: int, J_coupling: float = 1.0, mu_memory: float = 0.5, gamma_tension: float = 0.3
) -> float:
    """
    Calcula el Hamiltoniano local E = -J * sum(S_i * S_j) - mu * M_i * S_i + gamma * T_i
    J_coupling: acoplamiento de espín ferro / antiferromagnético.
    mu_memory: ganancia de memoria del camino histórico (retroalimentación positiva).
    gamma_tension: penalización por tensión o curvatura excesiva.
    """
    w, h = morphology.shape
    spin = 1 if morphology[x, y] > 0 else -1
    
    # Interacción de Ising con vecinos de Moore (8 vecinos)
    interaction_sum = 0
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            # Vecinos periódicos
            nx = (x + dx) % w
            ny = (y + dy) % h
            n_spin = 1 if morphology[nx, ny] > 0 else -1
            interaction_sum += n_spin
            
    energy_spin = -J_coupling * spin * interaction_sum
    energy_memory = -mu_memory * memory[x, y] * spin
    energy_tension = gamma_tension * tension[x, y] * (1.0 if spin == 1 else 0.0)
    
    return energy_spin + energy_memory + energy_tension

@numba.njit(fastmath=True)
def process_monte_carlo_step(
    morphology: np.ndarray, memory: np.ndarray, tension: np.ndarray,
    temperature: float, J_coupling: float, mu_memory: float, gamma_tension: float,
    steps: int = 1000
) -> Tuple[np.ndarray, int]:
    """
    Realiza pasos aleatorios de Monte Carlo con criterio de aceptación de Metropolis-Hastings.
    Actualiza la morfología celular y mide el tamaño de las avalanchas (avalanche size).
    """
    w, h = morphology.shape
    flips_accepted = 0
    
    for _ in range(steps):
        # Selección de una celda aleatoria
        x = np.random.randint(0, w)
        y = np.random.randint(0, h)
        
        # Energía antes y después de la propuesta de cambio (spin flip)
        E_init = calculate_local_energy(morphology, memory, tension, x, y, J_coupling, mu_memory, gamma_tension)
        
        # Propuesta de transición
        morphology[x, y] = 1 - morphology[x, y] 
        E_final = calculate_local_energy(morphology, memory, tension, x, y, J_coupling, mu_memory, gamma_tension)
        
        delta_E = E_final - E_init
        
        # Criterio de aceptación Metropolis
        accept = False
        if delta_E <= 0:
            accept = True
        else:
            p = np.exp(-delta_E / max(temperature, 1e-6))
            if np.random.random() < p:
                accept = True
                
        if accept:
            flips_accepted += 1
        else:
            # Revertir cambio
            morphology[x, y] = 1 - morphology[x, y]
            
    return morphology, flips_accepted

@numba.njit(fastmath=True)
def apply_bubble_defect(
    morphology: np.ndarray, memory: np.ndarray,
    cx: int, cy: int, radius: int, probability: float
) -> np.ndarray:
    """
    Simula una inestabilidad local ('bubble defect') dislocando o contrayendo
    la morfología dentro de un haz del espacio geométrico.
    """
    w, h = morphology.shape
    for dx in range(-radius, radius + 1):
        for dy in range(-radius, radius + 1):
            if dx*dx + dy*dy <= radius*radius:
                nx = (cx + dx) % w
                ny = (cy + dy) % h
                if np.random.random() < probability:
                    # Contracción topológica: vacía la celda y reordena el campo de memoria
                    morphology[nx, ny] = 0
                    memory[nx, ny] *= 0.1
    return morphology
`
  },
  {
    name: "growth.py",
    path: "core/growth.py",
    category: "core",
    description: "Crecimiento procedural de redes de transporte tipo micelio y raíces mediante agentes autopropulsados guiados por gradientes de tensión y autoinhibición.",
    code: `import numpy as np
from typing import List, Tuple

class ActiveHyphaeAgent:
    """
    Agente individual de hifa (micelio) que explora el landscape bajo leyes
    de búsqueda de energía, depósito de memoria/feromonas y ramificación estocástica.
    """
    def __init__(self, x: float, y: float, angle: float, velocity: float = 1.0):
        self.x = x
        self.y = y
        self.angle = angle
        self.velocity = velocity
        self.age = 0
        self.alive = True

    def move_and_sense(self, lattice_shape: Tuple[int, int], memory_field: np.ndarray, tension_field: np.ndarray) -> Tuple[int, int]:
        """
        Siente el entorno usando tres sensores frontales (con ángulo offset).
        Se desplaza hacia regiones de baja tensión pero alta energía/memoria (automanutención).
        """
        w, h = lattice_shape
        
        # Ángulos de sensado frontal (-pi/6, 0, pi/6)
        sensor_angles = [self.angle - np.pi/6, self.angle, self.angle + np.pi/6]
        sensor_weights = [0.0, 0.0, 0.0]
        
        sensor_dist = 3.0
        for i, sa in enumerate(sensor_angles):
            sx = int(round(self.x + np.cos(sa) * sensor_dist)) % w
            sy = int(round(self.y + np.sin(sa) * sensor_dist)) % h
            
            # Queremos: Alta memoria (caminos existentes) o atracción bio, pero evitar colapsar
            # por tensiones mecánicas excesivas.
            sensor_weights[i] = memory_field[sx, sy] * 2.0 - tension_field[sx, sy] * 0.5
            
        # Selección del ángulo con mayor peso
        best_idx = np.argmax(sensor_weights)
        if best_idx == 0:
            self.angle -= 0.2
        elif best_idx == 2:
            self.angle += 0.2
            
        # Añadir ruido Browniano rotacional
        self.angle += np.random.normal(0, 0.1)
        
        # Actualización de posición
        self.x = (self.x + np.cos(self.angle) * self.velocity) % w
        self.y = (self.y + np.sin(self.angle) * self.velocity) % h
        
        self.age += 1
        return int(self.x), int(self.y)

class MyceliumGrowthEngine:
    """
    Engine que orquesta el crecimiento de la colonia de hifas.
    Administra la ramificación (branching) y muertes por sobrepoblación local.
    """
    def __init__(self, width: int, height: int, branching_prob: float = 0.03, max_agents: int = 200):
        self.width = width
        self.height = height
        self.branching_prob = branching_prob
        self.max_agents = max_agents
        self.agents: List[ActiveHyphaeAgent] = []

    def spawn_hypha(self, x: float, y: float, angle: float):
        if len(self.agents) < self.max_agents:
            self.agents.append(ActiveHyphaeAgent(x, y, angle))

    def update(self, morphology: np.ndarray, memory: np.ndarray, tension: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Avanza el estado físico de los agentes un paso temporal.
        Deposita materia morfológica en la posición actual y difunde la memoria.
        """
        new_agents = []
        for agent in self.agents:
            if not agent.alive:
                continue
            
            px, py = agent.move_and_sense((self.width, self.height), memory, tension)
            
            # Depositar densidad física y actualizar memoria química
            morphology[px, py] = 1
            memory[px, py] += 1.0 # RefuerzoHebbiano
            
            # Ramificación estocástica
            if np.random.random() < self.branching_prob and len(self.agents) + len(new_agents) < self.max_agents:
                # Spawn bifurcado a +- 45 grados
                branch_angle = agent.angle + np.random.choice([-1, 1]) * (np.pi / 4)
                new_agents.append(ActiveHyphaeAgent(agent.x, agent.y, branch_angle, agent.velocity))
                
            # Muerte por hacinamiento o edad
            if memory[px, py] > 10.0 or agent.age > 300:
                agent.alive = False
                
        # Limpiar agentes muertos
        self.agents = [a for a in self.agents if a.alive] + new_agents
        return morphology, memory
`
  },
  {
    name: "topology.py",
    path: "analysis/topology.py",
    category: "analysis",
    description: "Análisis geométrico-topológico rigoroso de las estructuras emergentes. Computa componentes conectados, característica de Euler y detecta transiciones de fase críticas.",
    code: `import numpy as np
import scipy.ndimage as ndimage
try:
    import networkx as nx
except ImportError:
    nx = None

class TopologicalAnalyzer:
    """
    Colección de algoritmos especializados en extraer la topología interna
    de las redes continuas o binarias de morfogénesis.
    """
    @staticmethod
    def compute_connected_components(morphology: np.ndarray) -> Tuple[np.ndarray, int]:
        """
        Encuentra clústeres independientes usando conectividad de 8 vecinos.
        Equivalente a union-find en grafos bidimensionales.
        """
        # Estructura de vecindad de 8 elementos
        connectivity = np.ones((3, 3), dtype=np.int8)
        labeled_array, num_features = ndimage.label(morphology > 0.5, structure=connectivity)
        return labeled_array, num_features

    @staticmethod
    def compute_euler_characteristic(morphology: np.ndarray) -> int:
        """
        Calcula aproximación discreta de la Característica de Euler (Chi = V - E + F)
        en el grid usando un algoritmo de Euler-Poincaré 2D para píxeles:
        V = número de píxeles activos (Vértices/Celdas).
        E = número de aristas adyacentes verticales y horizontales.
        F = número de cuadrados 2x2 completamente rellenos de celdas.
        """
        bin_grid = (morphology > 0.5).astype(np.int32)
        V = np.sum(bin_grid)
        
        # Conexiones horizontales (E_h) y verticales (E_v)
        E_h = np.sum(bin_grid[:, :-1] & bin_grid[:, 1:])
        E_v = np.sum(bin_grid[:-1, :] & bin_grid[1:, :])
        E = E_h + E_v
        
        # Caras cuadradas 2x2 (F)
        F = np.sum(
            bin_grid[:-1, :-1] & 
            bin_grid[:-1, 1:] & 
            bin_grid[1:, :-1] & 
            bin_grid[1:, 1:]
        )
        
        # Chi = V - E + F
        return int(V - E + F)

    @staticmethod
    def extract_graph_skeleton(morphology: np.ndarray) -> "nx.Graph":
        """
        Transforma la red de morfología binada en un grafo topológico de filamentos
        usando NetworkX. Mide conectividad global, centralidad y densidad de ciclos.
        """
        if nx is None:
            raise ImportError("NetworkX es obligatorio para la extracción morfológica de grafos.")
            
        from skimage.morphology import skeletonize
        
        # Esqueletización para obtener espesor de 1 px
        skel = skeletonize(morphology > 0.5)
        points = np.argwhere(skel)
        
        G = nx.Graph()
        # Agregar nodos (coordenadas de píxeles)
        for p in points:
            G.add_node(tuple(p))
            
        # Conectar vecinos inmediatos de 8-conectividad
        for p in points:
            x, y = p
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    neighbor = (x + dx, y + dy)
                    if neighbor in G:
                        # Añadir arista con peso igual a la distancia euclidiana
                        weight = 1.0 if abs(dx) + abs(dy) == 1 else 1.414
                        G.add_edge(tuple(p), neighbor, weight=weight)
                        
        return G

    @staticmethod
    def compute_betti_numbers(morphology: np.ndarray) -> Tuple[int, int]:
        """
        Retorna los primeros números de Betti:
        b0: Clústeres conectados (Connected Components).
        b1: Número de ciclos/agujeros cerrado de la estructura.
        Calculado a partir de b0 y la característica de Euler discretizada (Chi = b0 - b1).
        """
        _, b0 = TopologicalAnalyzer.compute_connected_components(morphology)
        chi = TopologicalAnalyzer.compute_euler_characteristic(morphology)
        
        # Chi = b0 - b1  =>  b1 = b0 - Chi
        b1 = b0 - chi
        return b0, max(0, b1)
`
  },
  {
    name: "renderer.py",
    path: "visualization/renderer.py",
    category: "visualization",
    description: "Pipeline visual procedural. Provee mapeo de color hiperdetallado, superposición analítica de gradiente elástico y composición estética en escala de laboratorio.",
    code: `import numpy as np
import matplotlib.pyplot as plt
from typing import Tuple

class ScientificVisualizer:
    """
    Renderiza los campos físicos del lattice en imágenes estáticas de alto contraste
    usando paletas científicas y layouts de publicación académica.
    """
    def __init__(self, theme: str = "slate_scientific"):
        self.theme = theme
        plt.style.use('seaborn-v0_8-whitegrid' if 'white' in theme else 'dark_background')

    def compose_multispectral_plot(
        self, 
        morphology: np.ndarray, 
        energy: np.ndarray, 
        memory: np.ndarray, 
        tension: np.ndarray,
        step: int
    ) -> plt.Figure:
        """
        Crea un plot multicanal mostrando:
        1. Morfología emergente (malla principal)
        2. Paisaje de Energía potencial local (Ising Hamiltonians)
        3. Tensión acumulada (stress maps)
        4. Memoria estructural (pathway reinforcement historics)
        """
        fig, axes = plt.subplots(2, 2, figsize=(10, 10), dpi=150)
        
        # Panel 1: Morfología activa
        im0 = axes[0, 0].imshow(morphology, cmap="copper", interpolation="nearest")
        axes[0, 0].set_title(f"Morfología Activa - Paso {step}", fontsize=11, fontweight="bold")
        fig.colorbar(im0, ax=axes[0, 0], fraction=0.046, pad=0.04)
        
        # Panel 2: Landscape de Energía
        im1 = axes[0, 1].imshow(energy, cmap="bwr", interpolation="nearest")
        axes[0, 1].set_title("Paisaje de Energía Local V(x)", fontsize=11)
        fig.colorbar(im1, ax=axes[0, 1], fraction=0.046, pad=0.04)
        
        # Panel 3: Memoria / Caminos Hebbianos
        im2 = axes[1, 0].imshow(memory, cmap="hot", interpolation="nearest")
        axes[1, 0].set_title("Filtro de Memoria de Sendero M(x)", fontsize=11)
        fig.colorbar(im2, ax=axes[1, 0], fraction=0.046, pad=0.04)
        
        # Panel 4: Mapa de Tensión de Red
        im3 = axes[1, 1].imshow(tension, cmap="viridis", interpolation="nearest")
        axes[1, 1].set_title("Gradiente de Tensión / Estrés Topológico", fontsize=11)
        fig.colorbar(im3, ax=axes[1, 1], fraction=0.046, pad=0.04)
        
        # Limpieza estética general
        for ax in axes.ravel():
            ax.grid(False)
            ax.set_xticks([])
            ax.set_yticks([])
            
        fig.tight_layout()
        return fig

    def export_frame(self, fig: plt.Figure, filepath: str):
        fig.savefig(filepath, bbox_inches='tight', pad_inches=0.1)
        plt.close(fig)
`
  },
  {
    name: "sandbox.py",
    path: "experiments/sandbox.py",
    category: "experiments",
    description: "Harness experimental reproducible. Configura semillas globales deterministas, reproduce perfiles de simulación e instrumentaliza logging y snapshots estables.",
    code: `import os
import json
import yaml
import numpy as np
from typing import Dict, Any
from core.lattice import TopologicalLattice
from core.physics import process_monte_carlo_step, apply_bubble_defect
from analysis.topology import TopologicalAnalyzer

class ReproducibleExperiment:
    """
    Sujeto de prueba para persistencia y auditoría de morfogénesis.
    Carga configuraciones YAML y serializa el histórico de datos en snapshots JSON/HDF5.
    """
    def __init__(self, config_path: str):
        self.config = self.load_config(config_path)
        self.seed = self.config.get("seed", 42)
        np.random.seed(self.seed)
        
        self.width = self.config.get("width", 128)
        self.height = self.config.get("height", 128)
        
        # Inicialización del lattice
        self.lattice = TopologicalLattice(self.width, self.height)
        self.step_counter = 0
        self.history_metrics = []

        # Parámetros físicos del experimento
        self.temperature = self.config.get("temperature", 1.5)
        self.J_coupling = self.config.get("J_coupling", 1.0)
        self.mu_memory = self.config.get("mu_memory", 0.7)
        self.gamma_tension = self.config.get("gamma_tension", 0.4)
        
        # Inicializar núcleo con algunas perturbaciones periódicas
        self.seed_geometry()

    def load_config(self, filepath: str) -> Dict[str, Any]:
        with open(filepath, 'r') as f:
            return yaml.safe_load(f)

    def seed_geometry(self):
        """Inicializa estructuras semilla puntuales en el centro"""
        cx, cy = self.width // 2, self.height // 2
        # Pequeña cruz nuclear
        self.lattice.morphology[cx-4:cx+5, cy] = 1
        self.lattice.morphology[cx, cy-4:cy+5] = 1

    def run_simulation(self, total_steps: int, snapshot_interval: int = 50):
        print(f"Iniciando Experimento de Morfogénesis - Semilla {self.seed}")
        for i in range(total_steps):
            # 1. Recalcular tensión mecánicas
            for x in range(self.width):
                for y in range(self.height):
                    self.lattice.compute_local_tension_tensor(x, y)
            
            # 2. Paso evolutivo de Monte Carlo
            self.lattice.morphology, accepted = process_monte_carlo_step(
                self.lattice.morphology, self.lattice.memory, self.lattice.tension,
                self.temperature, self.J_coupling, self.mu_memory, self.gamma_tension,
                steps=self.width * self.height // 4
            )
            
            # 3. Decaimiento natural y difusión de la memoria química
            self.lattice.memory *= 0.95
            self.lattice.memory += self.lattice.morphology * 0.25
            
            # 4. Perturbación estocástica de Burbujas
            bubble_prob = self.config.get("bubble_prob", 0.002)
            if np.random.random() < bubble_prob:
                bx = np.random.randint(0, self.width)
                by = np.random.randint(0, self.height)
                br = np.random.randint(5, 12)
                apply_bubble_defect(self.lattice.morphology, self.lattice.memory, bx, by, br, 0.8)
                print(f"[Paso {self.step_counter}] Defecto temporal (Bubble Defect) inducido en ({bx}, {by})")

            # 5. Análisis geométrico periódico
            if self.step_counter % 10 == 0:
                chi = TopologicalAnalyzer.compute_euler_characteristic(self.lattice.morphology)
                _, cc = TopologicalAnalyzer.compute_connected_components(self.lattice.morphology)
                
                metrics = {
                    "step": self.step_counter,
                    "connected_components": cc,
                    "euler_characteristic": chi,
                    "average_tension": float(np.mean(self.lattice.tension)),
                    "accepted_flips": accepted
                }
                self.history_metrics.append(metrics)
                
            if self.step_counter % snapshot_interval == 0:
                self.save_snapshot()
                
            self.step_counter += 1

    def save_snapshot(self):
        output_dir = "snapshots"
        os.makedirs(output_dir, exist_ok=True)
        filename = f"snapshot_step_{self.step_counter:04d}.json"
        
        state = {
            "step": self.step_counter,
            "morphology": self.lattice.morphology.tolist(),
            "memory": self.lattice.memory.tolist(),
            "history": self.history_metrics
        }
        
        with open(os.path.join(output_dir, filename), "w") as f:
            json.dump(state, f, indent=4)
        print(f"Snapshot guardado: {filename}")

if __name__ == "__main__":
    # Test rápido de ejecución
    # El config yaml contiene parámetros científicos deterministas
    test_config = "config/experiment_001.yaml"
    # Crear directorio y config dummy si no existe
    os.makedirs("config", exist_ok=True)
    with open(test_config, "w") as f:
        yaml.dump({
            "seed": 101,
            "width": 64,
            "height": 64,
            "temperature": 1.2,
            "J_coupling": 1.0,
            "mu_memory": 0.8,
            "gamma_tension": 0.3,
            "bubble_prob": 0.005
        }, f)
        
    exp = ReproducibleExperiment(test_config)
    exp.run_simulation(total_steps=100, snapshot_interval=50)
`
  },
  {
    name: "constants.yaml",
    path: "config/experiment_001.yaml",
    category: "configuration",
    description: "Configuración molecular de control para simulación morfogénica. Define la semilla del generador congruente lineal, acoplamientos energéticos y coeficientes de campo.",
    code: `# Experimento 001: Redes de Micelio Autoguiado bajo Tensión y Memoria
seed: 1337
width: 128
height: 128

# Constantes del Hamiltoniano de Ising Morfológico
temperature: 1.45          # Ruido térmico / Fluctuación local de crecimiento
J_coupling: 1.0            # Coeficiente de interacción vecinal (ferromagnético)
mu_memory: 0.85            # Intensidad de retroalimentación de senderos de memoria
gamma_tension: 0.40        # Constante de rigidez / Penalización de tensión local

# Dinámica estocástica y difusión
diffusion_rate_memory: 0.15 # Coeficiente de difusión de memoria química (M)
memory_decay: 0.04          # Tasa de disipación temporal de la memoria (\tau)

# Inestabilidad Térmica Colectiva
bubble_prob: 0.003          # Probabilidad de 'bubble moves' que contraen localmente el espacio
bubble_radius_bounds: [4, 12] # Límites de escala para el colapso topológico local
`
  }
];
