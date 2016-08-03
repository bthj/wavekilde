import {
  POPULATION_SET_CURRENT,
  POPULATION_EVOLVE
} from './types';

export function setCurrentPopulation( populationIndex ) {
  return {
    type: POPULATION_SET_CURRENT,
    populationIndex
  };
}

export function evolveCurrentPopulation( parentIdexes ) {
  return {
    type: POPULATION_EVOLVE,
    parentIdexes
  };
}
