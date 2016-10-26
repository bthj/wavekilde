import {
  REQUEST_OUTPUTS_FOR_MEMBER,
  RECEIVE_OUTPUTS_FOR_MEMBER,
  REQUEST_AUDIO_BUFFER_FOR_MEMBER,
  RECEIVE_AUDIO_BUFFER_FOR_MEMBER,
  REMOVE_RENDERINGS_FOR_POPULATION
} from './types';
import { numWorkers } from '../util/range';
import { concatenateTypedArrays } from '../util/arrays';

import Activator from '../cppn-neat/network-activation';
import Renderer from '../cppn-neat/network-rendering';

// const ActivationSubWorker = require("worker!../workers/network-activation-sub-worker.js");
// inlining the worker seems necessary when visiting react-router path with /:parameters !?!!
const ActivationSubWorker = require("worker?inline!../workers/network-activation-sub-worker.js");

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
 * @param  {boolean} reverse        Whether the samples output from the network
 *                                  should be reversed.
 * @return {Array}                  Audio buffer(s).
 */


let _dispatch = undefined;
/**
 * Kinda hackish way to retain a reference to the redux store dispatch function,
 * for use when a callback comes in from a web worker
 * ...should maybe study discussion at https://github.com/reactjs/redux/issues/776
 * @param  {[type]} dispatch Reference to redux's store dispatch function
 */
function grabReferenceToReduxStoreDispatch( dispatch ) {
  if( ! _dispatch ) _dispatch = dispatch;
}

let postToActivationWorker;
export function getOutputsForMember( populationIndex, memberIndex ) {

  return function(dispatch, getState) {
    const member = getState().evolution.populations[populationIndex][memberIndex];
    const {frameCount} = getState().rendering;
    const {sampleRate} = getState().rendering.audioCtx;
    const currentPatch = getState().patching.patches.get(
      getState().patching.currentPatchKey );

    grabReferenceToReduxStoreDispatch( dispatch );

    dispatch( requestMemberOutputsFromActivator(populationIndex, memberIndex) );

    // Perform network actiation on worker
    // ...dispatch receiveOutputsForMember when worker posts back:

    if( ! window.Worker ) {
      alert("Please use a modern web browser that supports Web Workers");
    }

    postToActivationWorker = performance.now();

    spawnMultipleNetworkActivationWebWorkers({
      populationIndex,
      memberIndex,
      member,
      currentPatch,
      frameCount,
      sampleRate
    });
  }
}

const pendingWorkers = {};
const subResults = {};

function spawnMultipleNetworkActivationWebWorkers( data ) {
  pendingWorkers[getTaskKey(data)] = numWorkers;
  subResults[getTaskKey(data)] = {};
  const samplesPerWorker = Math.round( data.frameCount / numWorkers );
  for( let i=0; i < numWorkers; i+=1 ) {
    const sampleOffset = i * samplesPerWorker;
    let sampleCountToActivate;
    if( sampleOffset + samplesPerWorker > data.frameCount ) {
      sampleCountToActivate = data.frameCount - sampleOffset;
    } else {
      sampleCountToActivate = samplesPerWorker;
    }
    const activationSubWorker = new ActivationSubWorker();
    const messageToWorker = {
      slice: i,
      populationIndex: data.populationIndex,
      memberIndex: data.memberIndex,
      frameCount: data.frameCount,
      sampleRate: data.sampleRate,
      member: data.member,
      currentPatch: data.currentPatch,
      sampleCountToActivate,
      sampleOffset
    };
    activationSubWorker.postMessage( messageToWorker );
    activationSubWorker.onmessage = storeSubResult;
  }
}

/**
 * We receive this message when one activation worker has completed
 * activating the network for all (frameCount) samples.
 * When all workers have completed,
 * their results are combined and dispatched to the application state.
 */
function storeSubResult(e) {

  subResults[getTaskKey(e.data)][e.data.slice] = e.data.memberOutputs;
  pendingWorkers[getTaskKey(e.data)] -= 1;
  if( pendingWorkers[getTaskKey(e.data)] <= 0 ) {

    const receiveFromActivationWorker = performance.now();
    console.log(`%c Receiving data from activation workers took ${receiveFromActivationWorker - postToActivationWorker} milliseconds`, 'color: deep-purple');

    // combine memberOutputs in subResults to one memberOutputs object
    const memberOutputs = getCombinedMemberOutputsFromSubResults(
      subResults[getTaskKey(e.data)] );

    // then, add the combined results to application state
    _dispatch( receiveOutputsForMember(
      memberOutputs, e.data.populationIndex, e.data.memberIndex) );
  }
}

function getTaskKey( data ) {
  return `${data.populationIndex}-${data.memberIndex}`;
}

function getCombinedMemberOutputsFromSubResults( subResults ) {

  // let's initialize a Map for memberOutputs
  // using the first sub result as a template
  const memberOutputs = new Map( subResults[0].entries() );

  // then combine samples from each sub results for each nework output
  const subResultsSliceIndexes = Object.keys(subResults).sort();
  [...memberOutputs.keys()].forEach( outputIndex => {
    const sampleArraysForOneOutput = [];
    subResultsSliceIndexes.forEach( oneSliceIndex => {
      sampleArraysForOneOutput.push( subResults[oneSliceIndex].get(outputIndex).samples )
    });
    const samplesForOneOutput = concatenateTypedArrays(
      Float32Array, sampleArraysForOneOutput );
    memberOutputs.get(outputIndex).samples = samplesForOneOutput;
  });
  return memberOutputs;
}



export function getAudioBuffersForMember(
  memberOutputs,
  populationIndex, memberIndex, noteDeltas, reverse ) {

  return function(dispatch, getState) {
    const {frameCount, duration} = getState().rendering;
    const {sampleRate} = getState().rendering.audioCtx;
    const currentPatch = getState().patching.patches.get(
      getState().patching.currentPatchKey );

    dispatch( requestAudioBufferForMember(populationIndex, memberIndex) );

    const renderer = new Renderer( frameCount, sampleRate, duration );
    // Render an audio graph with Renderer,
    // providing it with an audio graph patch from application state.
    // Wait for a promise to be fulfilled with the audio buffer of a rendered audio graph.
    return renderer
      .renderNetworksOutputSamplesAsAudioBuffer( memberOutputs, currentPatch )
      .then( audioBuffer => {
        dispatch( receiveAudioBufferForMember(
          audioBuffer, populationIndex, memberIndex ) );
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

function requestAudioBufferForMember( populationIndex, memberIndex ) {
  return {
    type: REQUEST_AUDIO_BUFFER_FOR_MEMBER,
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



export function removeRenderingsForPopulation( populationIndex ) {
  return {
    type: REMOVE_RENDERINGS_FOR_POPULATION,
    populationIndex
  }
}
