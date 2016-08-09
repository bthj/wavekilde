import {
  REQUEST_OUTPUTS_FOR_MEMBER,
  RECEIVE_OUTPUTS_FOR_MEMBER,
  REQUEST_AUDIO_BUFFER_FOR_MEMBER,
  RECEIVE_AUDIO_BUFFER_FOR_MEMBER
} from '../actions/types';

const duration = 10;  // in seconds
const audioCtx = new( window.AudioContext || window.webkitAudioContext )();

const INITIAL_STATE = {
  // memberOutputs keys on the form [population index]-[member index]
  // map to an object {}, where each property key is the number of the
  // network output, mapping to an object with the output samples and meta data.
  memberOutputs: new Map(),
  // memberRenderedSounds keys on the form [population index]-[member index]
  // map to Web Audio buffer rendered from the memberOutputs,
  // according to the provided patch definition.
  memberRenderedSounds: new Map(),
  audioCtx,
  duration,
  frameCount: audioCtx.sampleRate * duration
};

export default function( state = INITIAL_STATE, action ) {
  switch( action.type ) {
    case REQUEST_OUTPUTS_FOR_MEMBER:
      return state;
    case RECEIVE_OUTPUTS_FOR_MEMBER:
      return state;
    case REQUEST_AUDIO_BUFFER_FOR_MEMBER:
      return state;
    case RECEIVE_AUDIO_BUFFER_FOR_MEMBER:
      return state;
    default:
      return state;
  }
}
