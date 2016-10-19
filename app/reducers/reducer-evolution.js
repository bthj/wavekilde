import {
  POPULATION_SET_CURRENT,
  POPULATION_EVOLVE,
  MEMBER_SET_CURRENT,
  LINEAGE_SET_KEY
} from '../actions/types';
import Evolver from '../cppn-neat/network-evolution';
import * as db from '../persistence/db-local';

const INITIAL_STATE = {
  populations: [],
  currentPopulationIndex: -1,
  currentMemberIndex: -1
};

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

function evolveNewPopulation( parentIndexes, population ) {
  const parents = [];
  parentIndexes.forEach( oneParentIndex => {
    parents.push( population[oneParentIndex].offspring );
  });
  const newPopulation = evolver.evolveNextGeneration( parents );
  return newPopulation;
}

export default function( state = INITIAL_STATE, action ) {
  switch( action.type ) {
    case POPULATION_SET_CURRENT: {
      const populations = getPopulationsCoveringIndex(
        action.populationIndex, state.populations );
      db.saveLineage( state.lineageKey, populations );
      return {...state,
        populations,
        currentPopulationIndex: action.populationIndex
      };
    }
    case POPULATION_EVOLVE: {
      const populations = [
        ...state.populations,
        evolveNewPopulation(
          action.parentIdexes,
          state.populations[state.currentPopulationIndex]
        )
      ];
      db.saveLineage( state.lineageKey, populations );
      return {...state,
        populations
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
    default:
      return state;
  }
}
