import {
  PATCH_ADD,
  PATCH_REMOVE,
  PATCH_SET_CURRENT
} from '../actions/types';

const INITIAL_STATE = {
  patches: new Map(),
  currentPatchKey: null
};

export default function( state = INITIAL_STATE, action ) {
  switch( action.type ) {
    case PATCH_ADD:
      return state;
    case PATCH_REMOVE:
      return state;
    case PATCH_SET_CURRENT:
      return state;
    default:
      return state;
  }
}

// TODO: hardcode a few example patches,
// in accordance with doc/audio-graph-schema.json
