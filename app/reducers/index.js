import { combineReducers} from 'redux';
import EvolutionReducer from './reducer-evolution';
import RenderingReducer from './reducer-rendering';
import PatchingReducer from './reducer-patching';

const rootReducer = combineReducers({
  evolution: EvolutionReducer,
  rendering: RenderingReducer,
  patching: PatchingReducer
});

export default rootReducer;
