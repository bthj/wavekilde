import {
  POPULATION_INITIALZE,
  POPULATION_SET_CURRENT,
  POPULATION_EVOLVE,
  MEMBER_SET_CURRENT,
  LINEAGE_SET_KEY,
  LINEAGE_SET_NAME,
  CLEAR_POPULATIONS,
  SET_LINEAGE
} from './types';
import * as db from '../persistence/db-local';

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

export function setLineageName( name ) {
  return {
    type: LINEAGE_SET_NAME,
    name
  };
}

export function clearPopulations() {
  return {
    type: CLEAR_POPULATIONS
  };
}

export function initializePopulation( lineageKey, lineageName, populationIndex ) {
  return {
    type: POPULATION_INITIALZE,
    lineageKey,
    lineageName,
    populationIndex
  }
}


export function setCurrentPopulation( lineageKey, populationIndex ) {
  return function( dispatch, getState ) {
    db.getPopulationFromLineage( lineageKey, populationIndex )
    .then( population => {
      dispatch( receivePopulationFromLocalDb( population, populationIndex ) );
    });
  }
}

function receivePopulationFromLocalDb( population, populationIndex ) {
  return {
    type: POPULATION_SET_CURRENT,
    population,
    populationIndex
  };
}


export function loadLineageFromLocalDb( lineageKey, populationIndex ) {
  return function( dispatch, getState ) {
    db.getLineageMeta( lineageKey ).then( lineageMeta => {
      console.log("local db lineage: ", lineageMeta);

      db.getPopulationFromLineage( lineageKey, populationIndex )
      .then( population => {

        dispatch( receiveLineageFromLocalDb(
          lineageKey, lineageMeta, populationIndex, population ) );
      });
    });
  }
}

function receiveLineageFromLocalDb(
    lineageKey, lineageMeta, populationIndex, population ) {

  return {
    type: SET_LINEAGE,
    currentPopulation: population,
    currentPopulationIndex: populationIndex,
    populationsCount: lineageMeta ? lineageMeta.populationsCount : -1,
    lineageName: lineageMeta ? lineageMeta.name : undefined,
    lineageKey
  };
}
