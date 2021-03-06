import Activator from '../cppn-neat/network-activation';

onmessage = function(e) {
  console.log('data from message to subworker: ', e.data );

  const activator = new Activator(
    e.data.frameCount, e.data.sampleRate,
    e.data.sampleCountToActivate, e.data.sampleOffset );
  activator.activateMember( e.data.member, e.data.currentPatch )
  .then( memberOutputs => {
    postMessage({
      slice: e.data.slice,
      populationIndex: e.data.populationIndex,
      memberIndex: e.data.memberIndex,
      memberOutputs
    }
    , [...memberOutputs.values()].map( oneOutput => oneOutput.samples.buffer ) /*<- transfer list*/
    );
  });
}
