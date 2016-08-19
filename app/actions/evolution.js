import {
  POPULATION_SET_CURRENT,
  POPULATION_EVOLVE,
  MEMBER_SET_CURRENT
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

export function setCurrentMember( memberIndex ) {
  return {
    type: MEMBER_SET_CURRENT,
    memberIndex
  }
}
