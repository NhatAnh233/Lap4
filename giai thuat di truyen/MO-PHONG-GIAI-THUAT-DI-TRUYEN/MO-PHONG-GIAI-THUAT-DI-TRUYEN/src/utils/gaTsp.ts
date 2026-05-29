/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { City, TspIndividual, TspConfig } from "../types";

// Standard popular Vietnamese city names for aesthetic touch
export const VIET_CITIES = [
  "Hà Nội",
  "Hải Phòng",
  "Hạ Long",
  "Vinh",
  "Huế",
  "Đà Nẵng",
  "Hội An",
  "Nha Trang",
  "Đà Lạt",
  "Buôn Ma Thuột",
  "Phan Thiết",
  "TP. Hồ Chí Minh",
  "Vũng Tàu",
  "Cần Thơ",
  "Phú Quốc",
  "Rạch Giá",
  "Cà Mau",
  "Sa Pa",
  "Hà Giang",
  "Mũi Né"
];

/**
 * Calculates Euclidean distance between two cities on a scale of 0 to 100
 */
export function getDistance(cityA: City, cityB: City): number {
  const dx = cityA.x - cityB.x;
  const dy = cityA.y - cityB.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the total length of a path (looping back to the starting city)
 */
export function getPathDistance(path: City[]): number {
  if (path.length <= 1) return 0;
  let dist = 0;
  for (let i = 0; i < path.length; i++) {
    const fromCity = path[i];
    const toCity = path[(i + 1) % path.length];
    dist += getDistance(fromCity, toCity);
  }
  return dist;
}

/**
 * Generates N random cities distributed beautifully on a 2D plane
 */
export function generateRandomCities(count: number): City[] {
  const cities: City[] = [];
  const padding = 8; // avoid cities being generated right on the frame boarder

  for (let i = 0; i < count; i++) {
    const name = VIET_CITIES[i % VIET_CITIES.length] + (i >= VIET_CITIES.length ? ` ${Math.floor(i / VIET_CITIES.length) + 1}` : "");
    cities.push({
      id: `city_${Math.random().toString(36).substring(2, 6)}_${i}`,
      name,
      x: padding + Math.random() * (100 - padding * 2),
      y: padding + Math.random() * (100 - padding * 2),
    });
  }
  return cities;
}

/**
 * Shuffles an array helper
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates random individuals (random routes)
 */
export function initializeTspPopulation(
  cities: City[],
  popSize: number
): TspIndividual[] {
  const population: TspIndividual[] = [];
  for (let i = 0; i < popSize; i++) {
    const path = shuffleArray(cities);
    const distance = getPathDistance(path);
    population.push({
      path,
      distance,
      fitness: distance > 0 ? 100000 / distance : 0, // Invert distance for fitness
    });
  }
  return population;
}

/**
 * Ordered Crossover (OX1) - Standard valid crossover for permutations
 */
export function orderedCrossover(
  parentA: City[],
  parentB: City[]
): City[] {
  const size = parentA.length;
  const child: (City | null)[] = Array(size).fill(null);

  // Pick two random crossover points
  let start = Math.floor(Math.random() * size);
  let end = Math.floor(Math.random() * size);

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  // Copy segment from Parent A
  for (let i = start; i <= end; i++) {
    child[i] = parentA[i];
  }

  // Set up child index tracker to fill remaining elements
  let childIdx = (end + 1) % size;
  
  // Fill remaining positions using elements from Parent B in circular order
  for (let i = 0; i < size; i++) {
    const parentBIdx = (end + 1 + i) % size;
    const city = parentB[parentBIdx];

    // Check if child already contains this city
    const exists = child.some((c) => c !== null && c.id === city.id);
    if (!exists) {
      child[childIdx] = city;
      childIdx = (childIdx + 1) % size;
    }
  }

  return child as City[];
}

/**
 * Swap Mutation - standard permutation mutation by swapping two indices
 */
export function swapMutate(path: City[], rate: number): City[] {
  const mutated = [...path];
  for (let i = 0; i < mutated.length; i++) {
    if (Math.random() < rate) {
      const idxSwap = Math.floor(Math.random() * mutated.length);
      // Swap places
      const temp = mutated[i];
      mutated[i] = mutated[idxSwap];
      mutated[idxSwap] = temp;
    }
  }
  return mutated;
}

/**
 * Selection: Tournament selection for TSP
 */
function selectTspTournament(
  population: TspIndividual[],
  tournamentSize: number = 5
): TspIndividual {
  let best: TspIndividual | null = null;
  for (let i = 0; i < tournamentSize; i++) {
    const ind = population[Math.floor(Math.random() * population.length)];
    if (best === null || ind.fitness > best.fitness) {
      best = ind;
    }
  }
  return best || population[0];
}

/**
 * Evolves a TSP population
 */
export function evolveTspGeneration(
  population: TspIndividual[],
  config: TspConfig
): {
  newPopulation: TspIndividual[];
  bestIndividual: TspIndividual;
  averageDistance: number;
} {
  const { populationSize, mutationRate, elitismCount } = config;

  // Sort by distance ascending / fitness descending
  const sortedPop = [...population].sort((a, b) => b.fitness - a.fitness);
  const bestIndividual = sortedPop[0];

  // Calculate statistics
  let totalDistance = 0;
  for (const ind of population) {
    totalDistance += ind.distance;
  }
  const averageDistance = totalDistance / population.length;

  const newPopulation: TspIndividual[] = [];

  // Carry over elites
  for (let i = 0; i < elitismCount; i++) {
    if (sortedPop[i]) {
      newPopulation.push({
        path: sortedPop[i].path,
        distance: sortedPop[i].distance,
        fitness: sortedPop[i].fitness,
      });
    }
  }

  // Breed children
  while (newPopulation.length < populationSize) {
    const parentA = selectTspTournament(population, 5);
    const parentB = selectTspTournament(population, 5);

    let childPath = orderedCrossover(parentA.path, parentB.path);
    childPath = swapMutate(childPath, mutationRate);

    const distance = getPathDistance(childPath);
    newPopulation.push({
      path: childPath,
      distance,
      fitness: distance > 0 ? 100000 / distance : 0,
    });
  }

  // Trim to exact size
  const trimmed = newPopulation.slice(0, populationSize);

  return {
    newPopulation: trimmed,
    bestIndividual,
    averageDistance,
  };
}
