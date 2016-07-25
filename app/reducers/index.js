import { combineReducers} from 'redux';
import EvolutionReducer from './reducer-evolution.js';

const rootReducer = combineReducers({
  populations: EvolutionReducer
});

export default rootReducer;
