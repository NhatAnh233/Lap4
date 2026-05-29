/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MonkeyIndividual, MonkeyConfig } from "../types";

// Standard alphabet supporting English letters, numbers, spaces, basic punctuation and Vietnamese accents
export const ALPHABET = 
  "aàảãáạăằẳẵắặâầẩẫấậeèẻẽéẹêềểễếệiìỉĩíịoòỏõóọôồổỗốộơờởỡớợuùủũúụưừửữứựyỳỷỹýỵđ" +
  "AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬEÈẺẼÉẸÊỀỂỄẾỆIÌỈĨÍỊOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢUÙỦŨÚỤƯỪỬỮỨỰYỲỶỸÝY Đ" +
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?'-_()";

export function getRandomChar(): string {
  const index = Math.floor(Math.random() * ALPHABET.length);
  return ALPHABET[index];
}

export function generateRandomString(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += getRandomChar();
  }
  return result;
}

export function calcMonkeyFitness(genes: string, target: string): number {
  if (genes.length !== target.length) return 0;
  let matches = 0;
  for (let i = 0; i < target.length; i++) {
    if (genes[i] === target[i]) {
      matches++;
    }
  }
  return matches / target.length;
}

export function initializeMonkeyPopulation(
  target: string,
  popSize: number
): MonkeyIndividual[] {
  const population: MonkeyIndividual[] = [];
  for (let i = 0; i < popSize; i++) {
    const genes = generateRandomString(target.length);
    population.push({
      id: Math.random().toString(36).substring(2, 9),
      genes,
      fitness: calcMonkeyFitness(genes, target),
    });
  }
  return population;
}

/**
 * Perform single-point crossover between 2 parent gene strings
 */
export function crossoverMonkeys(
  parentA: string,
  parentB: string
): string {
  const length = parentA.length;
  const midpoint = Math.floor(Math.random() * length);
  let child = "";
  for (let i = 0; i < length; i++) {
    if (i < midpoint) {
      child += parentA[i];
    } else {
      child += parentB[i];
    }
  }
  return child;
}

/**
 * Perform mutation on a gene string
 */
export function mutateGenes(genes: string, rate: number): string {
  let mutated = "";
  for (let i = 0; i < genes.length; i++) {
    if (Math.random() < rate) {
      mutated += getRandomChar();
    } else {
      mutated += genes[i];
    }
  }
  return mutated;
}

/**
 * Natural selection: selects a parent using Roulette Wheel selection
 */
function selectRouletteWheel(
  population: MonkeyIndividual[],
  totalFitness: number
): MonkeyIndividual {
  if (totalFitness === 0) {
    // If all individuals have 0 fitness, select completely randomly
    return population[Math.floor(Math.random() * population.length)];
  }

  let index = 0;
  let r = Math.random() * totalFitness;
  while (r > 0 && index < population.length) {
    r -= population[index].fitness;
    if (r <= 0) {
      return population[index];
    }
    index++;
  }
  return population[population.length - 1];
}

/**
 * Natural selection: Tournament Selection
 */
function selectTournament(
  population: MonkeyIndividual[],
  tournamentSize: number = 5
): MonkeyIndividual {
  let best: MonkeyIndividual | null = null;
  for (let i = 0; i < tournamentSize; i++) {
    const ind = population[Math.floor(Math.random() * population.length)];
    if (best === null || ind.fitness > best.fitness) {
      best = ind;
    }
  }
  return best || population[0];
}

/**
 * Evolve the population by one generation
 */
export function evolveMonkeyGeneration(
  population: MonkeyIndividual[],
  target: string,
  config: MonkeyConfig
): {
  newPopulation: MonkeyIndividual[];
  bestIndividual: MonkeyIndividual;
  averageFitness: number;
} {
  const { populationSize, mutationRate, selectionMethod } = config;
  
  // Sort by fitness (descending) to easily access top performers
  const sortedPop = [...population].sort((a, b) => b.fitness - a.fitness);
  const bestIndividual = sortedPop[0];

  // Calculate stats
  let totalFitness = 0;
  for (const ind of population) {
    totalFitness += ind.fitness;
  }
  const averageFitness = totalFitness / population.length;

  const newPopulation: MonkeyIndividual[] = [];

  // We support elitism: carry over the absolute best to the next generation
  const elitismCount = Math.max(1, Math.floor(populationSize * 0.05)); // top 5%
  for (let i = 0; i < elitismCount; i++) {
    if (sortedPop[i]) {
      newPopulation.push({
        id: "elite_" + Math.random().toString(36).substring(2, 6) + "_" + i,
        genes: sortedPop[i].genes,
        fitness: sortedPop[i].fitness,
      });
    }
  }

  // Create the remaining of the population through selection, crossover, mutation
  while (newPopulation.length < populationSize) {
    let parentA: MonkeyIndividual;
    let parentB: MonkeyIndividual;

    if (selectionMethod === "roulette") {
      parentA = selectRouletteWheel(population, totalFitness);
      parentB = selectRouletteWheel(population, totalFitness);
    } else if (selectionMethod === "tournament") {
      parentA = selectTournament(population, 5);
      parentB = selectTournament(population, 5);
    } else {
      // elitism selection (only select from top 50% randomly)
      const halfSize = Math.max(2, Math.floor(population.length / 2));
      parentA = sortedPop[Math.floor(Math.random() * halfSize)];
      parentB = sortedPop[Math.floor(Math.random() * halfSize)];
    }

    // Breed child
    let childGenes = crossoverMonkeys(parentA.genes, parentB.genes);
    childGenes = mutateGenes(childGenes, mutationRate);

    newPopulation.push({
      id: Math.random().toString(36).substring(2, 9),
      genes: childGenes,
      fitness: calcMonkeyFitness(childGenes, target),
    });
  }

  // Ensure exact population size
  const trimmedPopulation = newPopulation.slice(0, populationSize);

  // Return values
  return {
    newPopulation: trimmedPopulation,
    bestIndividual,
    averageFitness,
  };
}
