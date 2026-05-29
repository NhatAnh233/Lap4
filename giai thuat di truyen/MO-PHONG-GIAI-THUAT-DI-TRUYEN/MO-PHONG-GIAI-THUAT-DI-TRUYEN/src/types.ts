/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// General GA Status types
export type SimulationStatus = "idle" | "running" | "paused" | "completed";

// --- Shakespeare's Monkey Types ---
export interface MonkeyIndividual {
  id: string;
  genes: string;
  fitness: number; // percentage of matching characters (0 to 1)
}

export interface MonkeyHistoryPoint {
  generation: number;
  bestFitness: number;
  averageFitness: number;
  bestText: string;
}

export interface MonkeyConfig {
  target: string;
  populationSize: number;
  mutationRate: number; // e.g., 0.01 for 1%
  selectionMethod: "roulette" | "tournament" | "elitism";
}

// --- Travelling Salesperson (TSP) Types ---
export interface City {
  id: string;
  name: string;
  x: number; // percentage coordinate 0-100
  y: number; // percentage coordinate 0-100
}

export interface TspIndividual {
  path: City[]; // ordered cities
  distance: number; // total path length
  fitness: number; // 1 / distance (or scaled)
}

export interface TspHistoryPoint {
  generation: number;
  bestDistance: number;
  averageDistance: number;
  bestFitness: number;
}

export interface TspConfig {
  cityCount: number;
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitismCount: number;
}
