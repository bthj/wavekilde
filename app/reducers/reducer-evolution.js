import {
  POPULATION_SET_CURRENT,
  POPULATION_EVOLVE
} from '../actions/types';
import Evolver from '../evolution/cppn-neat';

const INITIAL_STATE = {
  populations: [],
  currentPopulationIndex: 0,
  currentIndividual: null
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
// function setPopulation( index, populations ) {
//   let population;
//   if( populations[index] ) {
//     population = populations[index];
//   } else {
//     if( 0 === index ) {
//       population = Evolver.createFirstPopulation();
//     } else { // evolution without parents
//       population = Evolver.evolveNextGeneration( [] );
//     }
//   }
//   return population;
// }

function evolveNewPopulation( parentIndexes, population ) {
  const parents = [];
  parentIndexes.forEach( oneParentIndex => {
    parents.push( population[oneParentIndex] );
  });
  const newPopulation = evolver.evolveNextGeneration( parents );
  return newPopulation;
}

export default function( state = INITIAL_STATE, action ) {
  switch( action.type ) {
    case POPULATION_SET_CURRENT:
      return {...state,
        populations: getPopulationsCoveringIndex(
          action.populationIndex, state.populations ),
        currentPopulationIndex: action.populationIndex
      };
    case POPULATION_EVOLVE:
      return {...state,
        populations: [
          ...state.populations,
          evolveNewPopulation(
            action.parentIdexes,
            state.populations[state.currentPopulationIndex]
          )
        ]
      };
    default:
      return state;
  }
}
