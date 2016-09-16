// import hamsters from 'webhamsters/src/hamsters';
// import Parallel from 'paralleljs';
import neatjs from 'neatjs';
import cppnjs from 'cppnjs';

/**
 * Activates outputs of the provided network
 */
class Activator {

  constructor( sampleCount, sampleRate ) {
    this.sampleCount = sampleCount;
    this.sampleRate = sampleRate;
  }

  // activate( member, neatjs ) {
  //   var params = {'array':[0,1,2,3,4,5,6,7,8,9], 'member':member};
  //   hamsters.run(params, function() {
  //
  //     var newCPPN = new neatjs.neatGenome("asdf",
  //     params.member.offspring.nodes,
  //     params.member.offspring.connections,
  //     params.member.offspring.inputNodeCount,
  //     params.member.offspring.outputNodeCount );
  //
  //     const arr = params.array;
  //     arr.forEach(function(item) {
  //       rtn.data.push( newCPPN );
  //     });
  //   }, function(output) {
  //     console.log("output: ", output);
  //     return output
  //   }, 1, false);
  // }

  getInputSignals( inputPeriods, variationOnPeriods ) {
    const startInputSignalsCalculation = performance.now();
    let inputSignals = Array(this.sampleCount).fill(0).map((v,c) => {
      let rangeFraction = c / (this.sampleCount-1);
      let mainInputSignal = this.lerp( -1, 1, rangeFraction );
      if( variationOnPeriods ) {
        var extraInput = Math.sin( inputPeriods * mainInputSignal );
      } else {
        var extraInput = Math.sin( inputPeriods * Math.abs(mainInputSignal) );
      }
      return [extraInput, mainInputSignal];
    });
    const endInputSignalsCalculation = performance.now();
    console.log(`%c InputSignalsCalculation took ${endInputSignalsCalculation - startInputSignalsCalculation} milliseconds for inputPeriods: ${inputPeriods}`,'color:orange');
    return inputSignals;
  }

  getOutputSignals( inputSignals, outputIndexes, memberCPPN ) {
    const startOutputSignalsCalculation = performance.now();
    const outputSignals = new Array(inputSignals.length); // TODO: typed array?
    inputSignals.forEach( (signalSet, sampleIndex) => {
      memberCPPN.clearSignals();
      memberCPPN.setInputSignals( signalSet );
      memberCPPN.recursiveActivation();

      const outputSlice = new Map(
        outputIndexes.map( oneOutputIndex =>
          [oneOutputIndex, memberCPPN.getOutputSignal(oneOutputIndex)]
        )
      );
      outputSignals[ sampleIndex ] = outputSlice;
    });
    const endOutputSignalsCalculation = performance.now();
    console.log(`%c OutputSignalsCalculation took ${endOutputSignalsCalculation - startOutputSignalsCalculation} milliseconds`,'color:orange');
    return outputSignals;
  }

  activateMember( member, patch, reverse = false, variationOnPeriods = true ) {

    return new Promise( (resolve, reject) => {

      let memberCPPN;
      if( member.offspring.networkDecode ) {
        memberCPPN = member.offspring.networkDecode();
      } else {
        // we didn't receive member as a neatjs/cppnjs instance,
        // but rather an object representation of it,
        // so we'll use the data from that object to create a new instance:
        memberCPPN = new neatjs.neatGenome(`${Math.random()}`,
        member.offspring.nodes,
        member.offspring.connections,
        member.offspring.inputNodeCount,
        member.offspring.outputNodeCount ).networkDecode();
      }

      const memberOutputs = new Map();

/*
      var p = new Parallel([1, 2, 3], {
        // evalPath: 'paralleljs/lib/eval.js',
        // env: {
        //   member: "member"
        // }
      });
      // var neatGenome = neatjs.neatGenome;
      // console.log("neatGenome: ", neatGenome);

      p
      // .require( { fn: worksGreat, name: 'worksGreat'} )
      .spawn(function( data ) {
        var newCPPN = "worksGreat";
        // new neatGenome("asdf",
        //   member.offspring.nodes,
        //   member.offspring.connections,
        //   member.offspring.inputNodeCount,
        //   member.offspring.outputNodeCount );
        return data.map(function(number) {
          return newCPPN;
        });
      }).then(function(data) {
        console.log(`%c newCPPNdata: ${data}`, 'color:red');
      });
*/

      // console.log("member: ", JSON.stringify(
      //   member,
      //   null,
      //   '\t'
      // ));

      // const newCPPN = new neatjs.neatGenome("asdf",
      // member.offspring.nodes,
      // member.offspring.connections,
      // member.offspring.inputNodeCount,
      // member.offspring.outputNodeCount );

      // console.log("newCPPN: ", newCPPN);

      // var op = function(i) { //Perform this function on every element
      //
      //   const newCPPN = new neatjs.neatGenome("asdf",
      //   member.offspring.nodes,
      //   member.offspring.connections,
      //   member.offspring.inputNodeCount,
      //   member.offspring.outputNodeCount );
      //
      //   return arguments[0] * 2 + newCPPN;
      // };
      // var options = {
      //   operator: op, //Operation to perform on every element
      //   array: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], //Input array
      //   startIndex: 0, //Optional Starting index for loop default of 0
      //   limit: null, //Optional Loop limit, eg. 4 to only compute elements 0-3 default of input array length
      //   dataType: 'Int32', //Optional dataType param default null
      //   incrementBy: 1, //Optional Increment amount per loop default of 1
      //   threads: 1 //Optional number of threads to execute across for parallel computing default of 1
      // };
      // hamsters.tools.loop(options, function(output) {
      //   console.log(output);
      // });

      // const hamsterResult = this.activate( member );
      // console.log("hamsterResult: ", hamsterResult);


      let outputsToActivate;
      if( patch ) {
        outputsToActivate = this.getOutputsToActivateFromPatch( patch );
      } else {
        // activate all outputs, each with random frequency:
        outputsToActivate = Array.apply(null, Array(memberCPPN.outputNeuronCount))
            .map(function(x,i){
              return {
                index: i,
                frequency: this.halfChance() ?
                  this.randomFromInterval( 1, 19 )  // LFO
                  : this.randomFromInterval( 20, 20000 ) // Audio frequency
              };
            }.bind(this));  //wtf: http://www.2ality.com/2013/11/initializing-arrays.html
      }

      outputsToActivate.forEach( function(oneOutput) {
        memberOutputs.set( oneOutput.index, {
          samples: new Float32Array(this.sampleCount), // typed array for samples
          frequency: oneOutput.frequency,
          inputPeriods: oneOutput.frequency *
            (this.sampleCount / this.sampleRate)
        });
      }.bind(this));

      // let's only activate the network once per unique input periods value / sample
      let uniqueInputPeriods = new Set( outputsToActivate.map( o =>
        memberOutputs.get(o.index).inputPeriods ) );

      const networkActivationStart = performance.now();
      uniqueInputPeriods.forEach(function( inputPeriods ) {

/*
        for ( let c=0; c < this.sampleCount; c++ ) {
*/
          // if( c % 10000 == 0 ) console.log(`activating network for sample ${c} and input period ${inputPeriods}`);
/*
          let rangeFraction = c / (this.sampleCount-1);

          let mainInputSignal = this.lerp( -1, 1, rangeFraction );

          if( variationOnPeriods ) {
            var extraInput = Math.sin( inputPeriods * mainInputSignal );
          } else {
            var extraInput = Math.sin( inputPeriods * Math.abs(mainInputSignal) );
          }
*/
/*
          let inputSignals = [ extraInput, mainInputSignal ];

          memberCPPN.clearSignals();
          memberCPPN.setInputSignals( inputSignals );

          memberCPPN.recursiveActivation();
*/

          // collect output indexes associated with the input periods value being activated for
          const outputIndexs = [];
          outputsToActivate.forEach( oneOutput => {
            if( inputPeriods == memberOutputs.get(oneOutput.index).inputPeriods ) {
              outputIndexs.push( oneOutput.index );
            }
          });

          const inputSignals = this.getInputSignals( inputPeriods, variationOnPeriods );
          const outputSignals = this.getOutputSignals(
            inputSignals, outputIndexs, memberCPPN );

          const startApplyMemberOutputs = performance.now();
          outputSignals.forEach( (oneOutputSlice, sampleIndex) => {
            for( let [outputIndex, outputValue] of oneOutputSlice ) {
              memberOutputs.get( outputIndex ).samples[sampleIndex] = outputValue;
            }
          });
          const endApplyMemberOutputs = performance.now();
          console.log(`%c Applying member outputs for one input period took ${endApplyMemberOutputs - startApplyMemberOutputs} milliseconds`,'color:orange');

          // outputsToActivate.forEach( function(oneOutput) {
          //   if( inputPeriods == memberOutputs[ oneOutput.index ].inputPeriods ) {
          //
          //     memberOutputs[ oneOutput.index ].samples[c] =
          //       memberCPPN.getOutputSignal(oneOutput.index);
          //   }
          // }.bind(this));
/*
        }
*/
      }.bind(this));

      const networkActivationEnd = performance.now();
      console.log(`%c Activating network,
        for ${uniqueInputPeriods.size} unique periods
        and ${this.sampleCount} samples,
        took ${networkActivationEnd - networkActivationStart}  milliseconds.`,'color:darkorange');

      if( memberOutputs.size ) {
        resolve( memberOutputs );
      } else {
        reject( "No member outputs activated" );
      }
    });
  }


  lerp( from, to, fraction ) {
    return from + fraction * ( to - from );
  }

  randomFromInterval( from, to ) {
    return Math.floor(Math.random()*(to-from+1)+from);
  }

  halfChance() {
    return ( Math.random() < 0.5 ? 0 : 1 );
  }

  getOutputsToActivateFromPatch( patch ) {
    return patch.map( onePatchNode => {
      return {
        index: onePatchNode.networkOutput,
        frequency: onePatchNode.frequency
      };
    });
  }
}

export default Activator;
