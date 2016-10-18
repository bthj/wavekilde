import {
  POPULATION_SET_CURRENT,
  POPULATION_EVOLVE,
  MEMBER_SET_CURRENT,
  LINEAGE_SET_KEY
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
  };
}

export function setLineageKey( key ) {
  return {
    type: LINEAGE_SET_KEY,
    key
  };
}
