import {
  POPULATION_SET_CURRENT,
  POPULATION_EVOLVE,
  MEMBER_SET_CURRENT,
  LINEAGE_SET_KEY,
  LINEAGE_SET_NAME,
  CLEAR_POPULATIONS,
  SET_LINEAGE
} from '../actions/types';
import Evolver from '../cppn-neat/network-evolution';
import * as db from '../persistence/db-local';

const INITIAL_STATE = {
  populations: [],
  currentPopulationIndex: -1,
  currentMemberIndex: -1
};

import neatjs from 'neatjs';

const evolver = new Evolver();


/**
 * Ensures populations are available up to and including the provided index;
 * if populations in the currrent state to not reach the current index,
 * evolution of populations is performed without parents
 * until the provided index is reached.
 * @param  {int} index       Index of the population to set as current
 * @param  {Array} populations Array of populations form the current state.
 * @return {Array}             Array of populations reaching at least the provided index.
 */
/*
function getPopulationsCoveringIndex( index, populations ) {
  let nextPopulations;
  if( ! populations[index] ) {
    if( 0 === index ) {
      nextPopulations = [ evolver.createFirstPopulation() ];
    } else {
      // evolution without parents to fill the gap up to the provided index
      const highestAvailableIndex = populations.length - 1;
      const populationsDelta = index - highestAvailableIndex;
      const newPopulations = [];
      for( let i=0; i < populationsDelta; i++ ) {
        newPopulations.push( evolver.evolveNextGeneration( [] ) );
      }
      nextPopulations = [ ...populations, ...newPopulations ];
    }
  } else { // the provided index is already covered
    nextPopulations = populations
  }
  return nextPopulations;
}
*/
function getPopulationsCoveringIndex( index ) {
  const populations = [];
  for( let i=0; i < index; i++ ) {
    if( i === 0 ) {
      populations.push( evolover.createFirstPopulation() );
    } else {
      // evolution without parents to fill the gap up to the provided index
      populations.push( evolver.evolveNextGeneration( [] ) );
    }
  }
  return populations;
}

function evolveNewPopulation( parentIndexes, population ) {
  const parents = [];
  parentIndexes.forEach( oneParentIndex => {
    let oneParent;
    if( population[oneParentIndex].offspring.createOffspringAsexual ) {
      oneParent = population[oneParentIndex].offspring;
    } else {
      oneParent = new neatjs.neatGenome( `${Math.random()}`,
        population[oneParentIndex].offspring.nodes,
        population[oneParentIndex].offspring.connections,
        population[oneParentIndex].offspring.inputNodeCount,
        population[oneParentIndex].offspring.outputNodeCount
      );
    }
    parents.push( oneParent );
  });
  const newPopulation = evolver.evolveNextGeneration( parents );
  return newPopulation;
}

export default function( state = INITIAL_STATE, action ) {
  switch( action.type ) {
    case POPULATION_SET_CURRENT: {
      let currentPopulation;
      let populationsCount;
      if( action.population ) {
        currentPopulation = action.population;
      } else {
        const populations = getPopulationsCoveringIndex(
          action.populationIndex /*, state.populations */ );
        db.initializeLineage( state.lineageKey, state.lineageName, populations );
        currentPopulation = populations[action.populationIndex];
        populationsCount = populations.length;
      }
/*
      const populations = getPopulationsCoveringIndex(
        action.populationIndex, state.populations );
      if( 0 === action.populationIndex ) {
        // db.saveLineage( state.lineageKey, state.lineageName, populations );
        db.initializeLineage( state.lineageKey, state.lineageName, populations );
      }
*/
      return {...state,
        // populations,
        currentPopulation,
        currentPopulationIndex: action.populationIndex,
        populationsCount: populationsCount ? populationsCount : state.populationsCount
      };
    }
    case POPULATION_EVOLVE: {
/*
      const populations = [
        ...state.populations,
        evolveNewPopulation(
          action.parentIdexes,
          state.populations[state.currentPopulationIndex]
        )
      ];
      db.saveLineage( state.lineageKey, state.lineageName, populations );
*/
      const newPopulation = evolveNewPopulation(
        action.parentIdexes,
        state.populations[state.currentPopulationIndex]
      );
      db.addPopulationToLineage( state.lineageKey, newPopulation );
      return {...state,
        // populations
        currentPopulation: newPopulation,
        currentPopulationIndex: ++state.currentPopulationIndex,
        populationsCount: ++state.populationsCount
      };
    }
    case MEMBER_SET_CURRENT:
      return {...state,
        currentMemberIndex: action.memberIndex
      };
    case LINEAGE_SET_KEY:
      return {...state,
        lineageKey: action.key
      };
    case LINEAGE_SET_NAME:
      return {...state,
        lineageName: action.name
      };
    case CLEAR_POPULATIONS:
      return {...state,
        populations: []
      };
    case SET_LINEAGE:
      return {...state,
        populations: action.lineage,
        lineageName: action.name,
        currentPopulationIndex: action.populationIndex
      };
    default:
      return state;
  }
}
