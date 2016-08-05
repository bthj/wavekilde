/**
 * Activates outputs of the provided network
 */
class Activator {

  constructor( sampleCount, sampleRate ) {
    this.sampleCount = sampleCount;
    this.sampleRate = sampleRate;
  }

  activateMember( member, outputsToActivate, reverse, variationOnPeriods = true ) {

    return new Promise( (resolve, reject) => {

      const memberCPPN = member.offspring.networkDecode();
      const memberOutputs = {};

      if( ! outputsToActivate || ! outputsToActivate.length ) {
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
        memberOutputs[ oneOutput.index ] = {
          samples: new Array(this.sampleCount),
          frequency: oneOutput.frequency,
          inputPeriods: oneOutput.frequency *
            (this.sampleCount / this.sampleRate)
        };
      }.bind(this));

      // let's only activate the network once per unique input periods value / sample
      let uniqueInputPeriods = new Set( outputsToActivate.map( o =>
        memberOutputs[o.index].inputPeriods ) );

      var networkActivationStart = performance.now();
      uniqueInputPeriods.forEach(function( inputPeriods ) {

        // TODO: do something like this in a separate function, to get the input signals generally..
        // let inputSignals = Array(this.sampleCount).fill(0).map((v,c) => {
        //   let rangeFraction = c / (this.sampleCount-1);
        //   let mainInputSignal = this.lerp( -1, 1, rangeFraction );
        //   if( variationOnPeriods ) {
        //     var extraInput = Math.sin( inputPeriods * mainInputSignal );
        //   } else {
        //     var extraInput = Math.sin( inputPeriods * Math.abs(mainInputSignal) );
        //   }
        //   return [extraInput, mainInputSignal];
        // });
        // console.log("inputSignals.length");console.log(inputSignals.length);
        // console.log("inputSignals[inputSignals.length/2]");console.log(inputSignals[inputSignals.length/2]);

        for ( let c=0; c < this.sampleCount; c++ ) {
          // if( c % 10000 == 0 ) console.log(`activating network for sample ${c} and input period ${inputPeriods}`);

          let rangeFraction = c / (this.sampleCount-1);

          let mainInputSignal = this.lerp( -1, 1, rangeFraction );

          if( variationOnPeriods ) {
            var extraInput = Math.sin( inputPeriods * mainInputSignal );
          } else {
            var extraInput = Math.sin( inputPeriods * Math.abs(mainInputSignal) );
          }

          let inputSignals = [ extraInput, mainInputSignal ];

          memberCPPN.clearSignals();
          memberCPPN.setInputSignals( inputSignals );

          memberCPPN.recursiveActivation();

          outputsToActivate.forEach( function(oneOutput) {
            if( inputPeriods == memberOutputs[ oneOutput.index ].inputPeriods ) {

              memberOutputs[ oneOutput.index ].samples[c] =
                memberCPPN.getOutputSignal(oneOutput.index);
            }
          }.bind(this));
        }
      }.bind(this));

      var networkActivationEnd = performance.now();
      console.log(`Activating network,
        for ${uniqueInputPeriods.size} unique periods
        and ${this.sampleCount} samples,
        took ${networkActivationEnd - networkActivationStart}  milliseconds.`);

      if( Object.keys(memberOutputs).length ) {
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
}

export default Activator;
