import Immutable from 'immutable';
import {
  REQUEST_OUTPUTS_FOR_MEMBER,
  RECEIVE_OUTPUTS_FOR_MEMBER,
  REQUEST_AUDIO_BUFFER_FOR_MEMBER,
  RECEIVE_AUDIO_BUFFER_FOR_MEMBER
} from '../actions/types';

const duration = 10;  // in seconds
const audioCtx = new( window.AudioContext || window.webkitAudioContext )();

const INITIAL_STATE = {
  // memberOutputs are found in a nested struture on the form
  // {populationIndex:{memberIndex:{memberOutputs}}}
  // where the innermost memberOutputs is an object
  // where each property key is the number of the
  // network output, mapping to an object with the output samples and meta data.
  renderingMemberOutputs: Immutable.Map(),
  memberOutputs: Immutable.Map(),

  // memberRenderedSounds are found in a nested structure on the form
  // {populationIndex:{memberIndex:{renderedSounds}}}
  // where the innermost renderedSounds is an object with keys as
  // integers indicating the number of notes departing from the base note, such as:
  // [-4, -1, 0, 2, 8], where 0 maps to the base note audio buffer,
  // where each Web Audio buffer is rendered from the memberOutputs,
  // according to the provided patch definition.
  renderingMemberSounds: Immutable.Map(),
  memberRenderedSounds: Immutable.Map(),
  audioCtx,
  duration,
  frameCount: audioCtx.sampleRate * duration
};

export default function( state = INITIAL_STATE, action ) {
  switch( action.type ) {
    case REQUEST_OUTPUTS_FOR_MEMBER:
      return { ...state,
        renderingMemberOutputs: state.renderingMemberOutputs.setIn(
          [action.populationIndex, action.memberIndex], true
        )
      };
    case RECEIVE_OUTPUTS_FOR_MEMBER:
      return {...state,
        memberOutputs: state.memberOutputs.setIn(
          [action.populationIndex, action.memberIndex], action.memberOutputs
        ),
        renderingMemberOutputs: state.renderingMemberOutputs.setIn(
          [action.populationIndex, action.memberIndex], false )
      };
    case REQUEST_AUDIO_BUFFER_FOR_MEMBER:
      return {...state,
        renderingMemberSounds: state.renderingMemberSounds.setIn(
          [action.populationIndex, action.memberIndex], true
        )
      };
    case RECEIVE_AUDIO_BUFFER_FOR_MEMBER:
      return {...state,
        memberRenderedSounds: state.memberRenderedSounds.setIn(
          [action.populationIndex, action.memberIndex], {
            0: action.audioBuffer // TODO: handle buffers for multiple notes, see rendering action
          }
        ),
        renderingMemberSounds: state.renderingMemberSounds.setIn(
          [action.populationIndex, action.memberIndex], true
        )
      };
    default:
      return state;
  }
}
