import neatjs from 'neatjs';
import cppnjs from 'cppnjs';
import { setActivationFunctions } from './activation-functions';

/**
 * Activates outputs of the provided network
 */
class Activator {

  constructor( sampleCount, sampleRate, sampleCountToActivate, sampleOffset ) {
    this.sampleCount = sampleCount;
    this.sampleRate = sampleRate;

    if( sampleCountToActivate ) {
      // ^ optional constructor parameter,
      // to only create input signals to activate a subset
      // of the desired total sampleCount,
      // useful for multicore computation on multiple sub-web workers.
      this.sampleCountToActivate = sampleCountToActivate;
    } else {
      this.sampleCountToActivate = sampleCount;
    }
    sampleOffset ? this.sampleOffset = sampleOffset : this.sampleOffset = 0;

    setActivationFunctions( cppnjs );
  }


  getInputSignals( inputPeriods, variationOnPeriods ) {
    const startInputSignalsCalculation = performance.now();
    let inputSignals = Array(this.sampleCountToActivate).fill(0).map((v,c) => {
      let rangeFraction = (c+this.sampleOffset) / (this.sampleCount-1);
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

    const outputSignals = {};
    outputIndexes.forEach( outputIndex => {
      // typed array for samples; results in faster transfers via message passing from worker
      outputSignals[outputIndex] = new Float32Array( inputSignals.length );
    });

    let recursiveActivationTime = 0;
    inputSignals.forEach( (signalSet, sampleIndex) => {
      memberCPPN.clearSignals();
      memberCPPN.setInputSignals( signalSet );
      const startRecursiveActivation = performance.now();
      memberCPPN.recursiveActivation();
      const endRecursiveActivation = performance.now();
      recursiveActivationTime += endRecursiveActivation - startRecursiveActivation;

      outputIndexes.forEach( outputIndex => {
        outputSignals[outputIndex][sampleIndex] = memberCPPN.getOutputSignal(outputIndex);
      });

    });
    const endOutputSignalsCalculation = performance.now();
    const outputSignalsCalculationTime = endOutputSignalsCalculation - startOutputSignalsCalculation
    console.log(`%c OutputSignalsCalculation took
      ${outputSignalsCalculationTime} milliseconds,
      of which recursive activation took ${recursiveActivationTime},
      ${(recursiveActivationTime/outputSignalsCalculationTime)*100}%`,
      'color:orange');
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
          samples: undefined,
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

          outputIndexs.forEach( outputIndex => {
            memberOutputs.get( outputIndex ).samples = outputSignals[outputIndex];
          });

          const endApplyMemberOutputs = performance.now();
          console.log(`%c Applying member outputs for one input period took ${endApplyMemberOutputs - startApplyMemberOutputs} milliseconds`,'color:orange');

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
