import reducer from '../reducers';
import { createWorker } from 'redux-worker';
import Activator from '../cppn-neat/network-activation';
import Renderer from '../cppn-neat/network-rendering';
import {
  GET_OUTPUTS_FOR_MEMBER, GET_AUDIO_BUFFERS_FOR_MEMBER
} from '../actions/types';

const worker = createWorker();

worker.registerReducer( reducer );

// TODO: do we want network activation
// - getOutputsForMember -
// and network rendering
// - getAudioBuffersFromMember -
// to be different tasks here on the worker?
// - then getAudioBuffersFromMember would need
// memberOutputs passed as a message
// - fast possibility with typed arrays?
//
// plus with separate tasks is that memberOutputs could be reused
// for differnet patch configurations on the same network...
worker.registerTask('GET_OUTPUTS_FOR_MEMBER', (a) => {

  console.log("about to GET_OUTPUTS_FOR_MEMBER");

  const {member, currentPatch, frameCount, sampleRate} = a;

  const activator = new Activator( frameCount, sampleRate );
  // Get member outputs from Activator,
  // providing it sampleCount, sampleRate and
  // outputsToActivate (deduced from synth-patch) from application state.
  // Return a promise to wait for activation of network outputs
  return activator
    .activateMember(member, currentPatch)
    .then( memberOutputs => memberOutputs );

});

worker.registerTask('GET_AUDIO_BUFFERS_FOR_MEMBER', (a) => {

  const {memberOutputs, currentPatch, sampleRate, frameCount, duration} = a;

  const renderer = new Renderer( frameCount, sampleRate, duration );
  // Render an audio graph with Renderer,
  // providing it with an audio graph patch from application state.
  // Wait for a promise to be fulfilled with the audio buffer of a rendered audio graph.
  return renderer
    .renderNetworksOutputSamplesAsAudioBuffer( memberOutputs, currentPatch )
    .then( audioBuffer => audioBuffer );
});
