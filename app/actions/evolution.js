import {
  POPULATION_SET_CURRENT,
  POPULATION_EVOLVE,
  MEMBER_SET_CURRENT,
  LINEAGE_SET_KEY,
  CLEAR_POPULATIONS,
  SET_LINEAGE
} from './types';
import * as db from '../persistence/db-local';

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

export function clearPopulations() {
  return {
    type: CLEAR_POPULATIONS
  };
}


export function loadLineageFromLocalDb( lineageId, populationIndex ) {
  return function( dispatch, getState ) {
    db.getLineage( lineageId ).then( lineage => {
      dispatch( receiveLineageFromLocalDb( lineage, populationIndex ) );
    });
  }
}

function receiveLineageFromLocalDb( lineage, populationIndex ) {
  console.log("receiveLineageFromLocalDb: ", lineage);
  return {
    type: SET_LINEAGE,
    lineage,
    populationIndex: lineage ? populationIndex : -1
  };
}
