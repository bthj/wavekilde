import {
  POPULATION_INITIALIZE,
  POPULATION_EVOLVE
} from './types';

export function initializePopulation() {
  const population = []; // TODO: call helper to initialize population
  return {
    type: POPULATION_INITIALIZE,
    payload: population
  };
}

// TODO: parents as parameters?
export function evolvePopulation( parents ) {
  const population = []; // TODO: call helper to eveolve population
  return {
    type: POPULATION_EVOLVE,
    payload: population
  };
}
