import React from 'react';
import update from 'react-addons-update';
import IndividualGrid from '../views/individual-grid';

import { Waveform, LineChart } from 'react-d3-components';


const IndividualContainer = React.createClass({

  getInitialState: function() {
    const audioCtx = new( window.AudioContext || window.webkitAudioContext )();
    return {
      memberOutputs: {},
      memberSettings: [],
      audioCtx: audioCtx,
      // Create an empty two-second buffer at the sample rate of the AudioContext
      frameCount: audioCtx.sampleRate * 3 // * seconds
    }
  },
  componentWillReceiveProps: function( nextProps ) {

    if( nextProps.member ) {
      const inputPeriods = this.state.frameCount / (this.state.frameCount/20);
      // const inputPeriods = this.state.frameCount / 66;

      let outputsToActivate = [
        {
          index: 0,
          frequency: 440.0  // A4
        },
        {
          index: 1,
          frequency: 4  // LFO
        }
      ];
      this.activateMember( nextProps.member, outputsToActivate );
      // this.activateMember( nextProps.member, null );
    }
  },

  lerp: function( from, to, fraction ) {
    return from + fraction * ( to - from );
  },
  randomFromInterval: function(from,to) {
    return Math.floor(Math.random()*(to-from+1)+from);
  },
  halfChance: function () {
    return ( Math.random() < 0.5 ? 0 : 1 );
  },
  activateMember: function( member, outputsToActivate, reverse ) {

    const variationOnPeriods = true;

    const sampleCount = this.state.frameCount;

    const memberCPPN = member.offspring.networkDecode();

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

    const memberOutputs = {};
    outputsToActivate.forEach( function(oneOutput) {
      memberOutputs[ oneOutput.index ] = {
        samples: [],
        frequency: oneOutput.frequency,
        inputPeriods: oneOutput.frequency *
          (this.state.frameCount / this.state.audioCtx.sampleRate)
      };
    }.bind(this));

    // let's only activate the network once per unique input perods value / sample
    let uniqueInputPeriods = new Set( outputsToActivate.map( o =>
      memberOutputs[o.index].inputPeriods ) );
    uniqueInputPeriods.forEach(function( inputPeriods ) {

      for ( let c=0; c < sampleCount; c++ ) {

        let rangeFraction = c / (sampleCount-1);

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

            memberOutputs[ oneOutput.index ].samples.push(
              memberCPPN.getOutputSignal(oneOutput.index) );
          }
        });
      }
    }.bind(this));

    this.setState({
      memberOutputs: update(this.state.memberOutputs, {$merge: memberOutputs})
    });
  },

  remapNumberToRange: function( inputNumber, fromMin, fromMax, toMin, toMax ) {
    return (inputNumber - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
  },
  getDownsampledArray: function( originalValues, targetSampleCount ) {

    const samplesInSection = Math.floor( originalValues.length / targetSampleCount );

    let downsampled = [];
    originalValues.reduce(function(previousValue, currentValue, currentIndex, array) {
      if( currentIndex % samplesInSection ) {
        return previousValue + currentValue;
      } else {
        const averageInSection = previousValue / samplesInSection;
        downsampled.push( averageInSection );
        return currentValue;
      }
    });
    return downsampled;
  },
  getDownsampledMemberOutputs: function( targetSampleCount ) {
    let downsampledMemberOutputs = {};
    for( let outputIndex in this.state.memberOutputs ) {
      downsampledMemberOutputs[outputIndex] = {
        samples: this.getDownsampledArray(
          this.state.memberOutputs[outputIndex].samples, targetSampleCount ),
        frequency: this.state.memberOutputs[outputIndex].frequency
      };
    }
    return downsampledMemberOutputs;
  },
  getWaveformVisualizationDataFromOutputs: function( memberOutputs ) {
    let visualizationDataForAllNetworkOutputNodes = [];
    for( let outputIndex in memberOutputs ) {
      visualizationDataForAllNetworkOutputNodes.push({
        label: `Output ${outputIndex}`,
        values: memberOutputs[outputIndex].samples.map( function(oneSample, index) {
          return {
            x: index,
            y: this.remapNumberToRange(oneSample, -1, 1, 0, 1)
          };
        }.bind(this)),
        frequency: memberOutputs[outputIndex].frequency
      });
    }
    return visualizationDataForAllNetworkOutputNodes;
  },
  isAudible: function( frequency ) {
    return 20 <= frequency && frequency <=20000;
  },


  render: function() {

    ///// try populating one audio buffer from this member
    //...such as in:  https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode#Examples

    if( Object.keys(this.state.memberOutputs).length ) {

      // Stereo
      let channels = 2;

      let myArrayBuffer = this.state.audioCtx.createBuffer(
        channels, this.state.frameCount, this.state.audioCtx.sampleRate );

      // Fill the buffer with signals according to the network outputs
      for( let channel=0; channel < channels; channel++ ) {

        // This gives us the actual ArrayBuffer that contains the data
        let nowBuffering = myArrayBuffer.getChannelData( channel );
        for( let i=0; i < this.state.frameCount; i++ ) {
          nowBuffering[i] = this.state.memberOutputs[channel].samples[i];
        }
      }

      // Get an AudioBufferSourceNode.
      // This is the AudioNode to use when we want to play an AudioBuffer
      let source = this.state.audioCtx.createBufferSource();
      // set the buffer in the AudioBufferSourceNode
      source.buffer = myArrayBuffer;
      // connect the AudioBufferSourceNode to the
      // destination so we can hear the sound
      source.connect(this.state.audioCtx.destination);
      // start the source playing
      source.start();
    }


    ///// waveform visualization

    let waveformWidth = 1200; // TODO: window.innerWidth gives 0;

    if( Object.keys(this.state.memberOutputs).length ) {
      let downsampledMemberOutputs =
        this.getDownsampledMemberOutputs( waveformWidth * 2 );
      var waveformVisualizationData =
        this.getWaveformVisualizationDataFromOutputs( downsampledMemberOutputs );
    } else {
      var waveformVisualizationData = [];
    }

    let waveformNodes = waveformVisualizationData.map( function(oneWaveformVizData) {
      return(
        this.isAudible( oneWaveformVizData.frequency ) ?
          <Waveform
            data={oneWaveformVizData}
            width={waveformWidth}
            height={100}
            colorScale={ d3.scale.linear().domain([0,waveformWidth]).range(['#eb1785','#ff7b16'])}
            key={oneWaveformVizData.label}
          />
          :
          <LineChart
            data={oneWaveformVizData}
            width={waveformWidth}
            height={100}
            xAxis={{label:'x-label'}}
            yAxis={{label:'y-label'}}
            key={oneWaveformVizData.label}
          />

      );
    }.bind(this));

    return(
      <div className="waveform-visualization">
        {waveformNodes.length ? waveformNodes : <em>Rendering waveform visualization</em>}
      </div>
    );
  }
});

export default IndividualContainer;
