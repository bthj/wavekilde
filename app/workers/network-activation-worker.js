import Activator from '../cppn-neat/network-activation';

onmessage = function(e) {
  console.log('Message received from main script');
  console.log('data from message: ', e.data );

  const activator = new Activator( e.data.frameCount, e.data.sampleRate );
  console.log("about to activateMember");
  activator.activateMember( e.data.member, e.data.currentPatch )
  .then( memberOutputs => {
    console.log("done activating, memberOutputs: ", memberOutputs);
    postMessage({
      populationIndex: e.data.populationIndex,
      memberIndex: e.data.memberIndex,
      memberOutputs
    }
    //, memberOutputs.map( oneOutput => new Float32Array(oneOutput.samples) ) /*<- transfer list*/
    );
  });

  // var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
  // console.log('Posting message back to main script');

}
