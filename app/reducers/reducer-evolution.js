import {
  POPULATION_INITIALZE,
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
  currentPopulation: null,
  currentPopulationIndex: -1,
  currentMemberIndex: -1
};

import neatjs from 'neatjs';

const evolver = new Evolver();


/**
 * Ensures populations are available up to and including the provided index;
 * if asking for more than one initial population,
 * evolution of populations is performed without parents
 * until the provided index is reached.
 * @param  {int} index       Index of the population to set as current
 * @return {Array}             Array of populations reaching at least the provided index.
 */
function getPopulationsCoveringIndex( index ) {
  const populations = [];
  for( let i=0; i <= index; i++ ) {
    if( i === 0 ) {
      populations.push( evolver.createFirstPopulation() );
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
    case POPULATION_INITIALZE: {
      const populations = getPopulationsCoveringIndex( action.populationIndex );

      db.initializeLineage( action.lineageKey, action.lineageName, populations );

      const currentPopulation = populations[action.populationIndex];
      const populationsCount = populations.length;

      return {...state,
        currentPopulation,
        currentPopulationIndex: action.populationIndex,
        populationsCount,
        lineageKey: action.lineageKey,
        lineageName: action.lineageName
      };
    }
    case POPULATION_SET_CURRENT: {
      if( action.population ) {
        const currentPopulation = action.population;
        return {...state,
          currentPopulation,
          currentPopulationIndex: action.populationIndex
        };
      }
    }
    case POPULATION_EVOLVE: {
      const newPopulation = evolveNewPopulation(
        action.parentIdexes,
        state.currentPopulation
      );

      db.addPopulationToLineage( state.lineageKey, newPopulation );

      return {...state,
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
        currentPopulation: null
      };
    case SET_LINEAGE:
      const {
        currentPopulation, currentPopulationIndex,
        populationsCount, lineageName, lineageKey
      } = action;
      return {...state,
        currentPopulation,
        currentPopulationIndex,
        populationsCount,
        lineageName,
        lineageKey
      };
    default:
      return state;
  }
}
