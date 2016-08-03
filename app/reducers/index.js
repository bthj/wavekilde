import { combineReducers} from 'redux';
import EvolutionReducer from './reducer-evolution.js';

const rootReducer = combineReducers({
  evolution: EvolutionReducer
});

export default rootReducer;
