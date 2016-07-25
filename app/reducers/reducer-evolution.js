import {
  POPULATION_INITIALIZE,
  POPULATION_EVOLVE
} from '../actions/types';

const INITIAL_STATE = {
  populations: [],
  currentIndividual: null
};

export default function( state = INITIAL_STATE, action ) {
  switch( action.type ) {
    case POPULATION_INITIALIZE:
      return [...state, action.payload];
    case POPULATION_EVOLVE:
      return [...state, action.payload];
    default:
      return state;
  }
}
