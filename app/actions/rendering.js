import {
  REQUEST_OUTPUTS_FOR_MEMBER,
  RECEIVE_OUTPUTS_FOR_MEMBER,
  REQUEST_AUDIO_BUFFER_FOR_MEMBER,
  RECEIVE_AUDIO_BUFFER_FOR_MEMBER
} from './types';

import Activator from '../cppn-neat/network-activation';
import Renderer from '../cppn-neat/network-rendering';

/**
 * Get audio from a CPPN network by activating its outputs
 * and rendering an audio graph,
 * according to the current audio synthesis patch set in application state.
 * @param  {int} populationIndex Index to the population to draw a member from.
 * @param  {int} memberIndex     Index to the member in the provided population.
 * @param  {Array} noteDeltas       What notes to render as deviations from the
 *                                  base note, with integers indicating the number
 *                                  of notes departing from the base note, such as:
 *                                  [-4, -1, 2, 8]
 * @param  {boolean} reverse         Wether the samples output from the network
 *                                  should be reversed.
 * @return {Array}                 Audio buffer(s).
 */
export function getAudioBuffersFromMember(
    populationIndex, memberIndex, noteDeltas, reverse ) {

  return function(dispatch, getState) {
    const member = getState().evolution.populations[populationIndex][memberIndex];
    const {frameCount, duration} = getState().rendering;
    const {sampleRate} = getState().rendering.audioCtx;
    const {currentPatch} = getState().patching.patches.get(
      getState().patching.currentPatchKey );

    const activator = new Activator( frameCount, sampleRate );
    const renderer = new Renderer( frameCount, duration );

    dispatch( requestMemberOutputsFromActivator(populationIndex, memberIndex) );

    // Get member outputs from Activator,
    // providing it sampleCount, sampleRate and
    // outputsToActivate (deduced from synth-patch) from application state.
    // Return a promise to wait for activation of network outputs
    return activator.activateMember(member, currentPatch).then( memberOutputs => {
      // update app state with results of network activation
      dispatch( receiveOutputsForMember( memberOutputs, populationIndex, memberIndex) );

      // Then render an audio graph with Renderer,
      // providing it with an audio graph patch from application state.
      // Wait for a promise to be fulfilled with the audio buffer of a rendered audio graph.
      return renderer
        .renderNetworksOutputSamplesAsAudioBuffer( memberOutputs, currentPatch )
        .then( audioBuffer => {
          dispatch( receiveAudioBufferForMember(
            audioBuffer, populationIndex, memberIndex ) );
        });
    });
  }
}

function requestMemberOutputsFromActivator( populationIndex, memberIndex ) {
  return {
    type: REQUEST_OUTPUTS_FOR_MEMBER,
    populationIndex,
    memberIndex
  };
}
function receiveOutputsForMember( memberOutputs, populationIndex, memberIndex ) {
  return {
    type: RECEIVE_OUTPUTS_FOR_MEMBER,
    memberOutputs,
    populationIndex,
    memberIndex
  };
}
function receiveAudioBufferForMember( audioBuffer, populationIndex, memberIndex ) {
  return {
    type: RECEIVE_AUDIO_BUFFER_FOR_MEMBER,
    audioBuffer,
    populationIndex,
    memberIndex
  };
}
