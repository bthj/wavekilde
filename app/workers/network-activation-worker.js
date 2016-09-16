import Activator from '../cppn-neat/network-activation';

onmessage = function(e) {
  console.log('Message received from main script');
  console.log('data from message: ', e.data );

  const activator = new Activator( e.data.frameCount, e.data.sampleRate );
  console.log("about to activateMember");
  activator.activateMember( e.data.member, e.data.currentPatch )
  .then( memberOutputs => {
    console.log("done activating, memberOutputs: ", memberOutputs);
    console.log("transferables: ", [...memberOutputs.values()].map( oneOutput => oneOutput.samples.buffer ) );
    postMessage({
      startSending: performance.now(),
      populationIndex: e.data.populationIndex,
      memberIndex: e.data.memberIndex,
      memberOutputs
    }
    , [...memberOutputs.values()].map( oneOutput => oneOutput.samples.buffer ) /*<- transfer list*/
    );
  });
}
