import React from 'react';
import IndividualGrid from '../views/individual-grid';

import { Waveform } from 'react-d3-components';


const IndividualContainer = React.createClass({

  getInitialState: function() {
    const audioCtx = new( window.AudioContext || window.webkitAudioContext )();
    return {
      memberOutputs: [],
      memberSettings: [],
      audioCtx: audioCtx,
      // Create an empty two-second buffer at the sample rate of the AudioContext
      frameCount: audioCtx.sampleRate * 3
    }
  },
  componentWillReceiveProps: function( nextProps ) {

    if( nextProps.member ) {
      this.activateMember( nextProps.member );
    }
  },

  lerp: function( from, to, fraction ) {
    return from + fraction * ( to - from );
  },
  activateMember: function( member ) {
    const inputPeriods = this.state.frameCount / 66;
    console.log("inputPeriods");console.log(inputPeriods);
    const variationOnPeriods = true;

    const sampleCount = this.state.frameCount;

    let memberCPPN = member.offspring.networkDecode();
    let memberOutputs = [];

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

      let oneMemberOutputSet = [ c ];
      for( let s=0; s < memberCPPN.outputNeuronCount; s++ ) {
        oneMemberOutputSet.push( memberCPPN.getOutputSignal(s) );
      }

      memberOutputs.push( oneMemberOutputSet );

      this.setState({memberOutputs: memberOutputs});
    }
  },

  remapNumberToRange: function( inputNumber, fromMin, fromMax, toMin, toMax ) {
    return (inputNumber - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
  },
  getWaveformVisualizationDataFromOutputs: function( memberOutputs ) {
    // console.log("memberOutputs");
    // console.log(memberOutputs);

    let visualizationDataForAllNetworkOutputNodes = [];
    console.log("memberOutputs[0].length");console.log(memberOutputs[0].length);
    for( let o=1; o < memberOutputs[0].length; o++ ) {
      visualizationDataForAllNetworkOutputNodes.push({
        label: `Output ${o}`,
        values: memberOutputs.map( function(oneSample, index) {
          return {
            x: index,
            y: this.remapNumberToRange(oneSample[o], -1, 1, 0, 1)
          };
        }.bind(this))
      });
    }

    return visualizationDataForAllNetworkOutputNodes;
  },



  render: function() {
    // console.log( "this.state.memberOutputs" );
    // console.log( this.state.memberOutputs );

    if( this.props.member ) {
      var cppn = this.props.member.offspring.networkDecode();
      console.log( "cppn.outputNeuronCount" );
      console.log( cppn.outputNeuronCount );

      console.log("this.state.memberOutputs[0]");
      console.log(this.state.memberOutputs[0]);
    }

    ///// try populating one audio buffer from this member
    //...such as in:  https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode#Examples

    if( this.state.memberOutputs.length ) {

      // Stereo
      let channels = 2;

      let myArrayBuffer = this.state.audioCtx.createBuffer(
        channels, this.state.frameCount, this.state.audioCtx.sampleRate );

      // Fill the buffer with signals according to the network outputs
      for( let channel=0; channel < channels; channel++ ) {

        // This gives us the actual ArrayBuffer that contains the data
        let nowBuffering = myArrayBuffer.getChannelData( channel );
        for( let i=0; i < this.state.frameCount; i++ ) {
          nowBuffering[i] = this.state.memberOutputs[i][channel+1];
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

    let waveformVisualizationData = this.state.memberOutputs.length ?
      this.getWaveformVisualizationDataFromOutputs(this.state.memberOutputs)
      : [];
    let waveformWidth = 1200; // TODO: window.innerWidth gives 0;

    let waveformNodes = waveformVisualizationData.map( function(oneWaveformVizData) {
      return(
        <Waveform
          data={oneWaveformVizData}
          width={waveformWidth}
          height={200}
          colorScale={ d3.scale.linear().domain([0,waveformWidth]).range(['#eb1785','#ff7b16'])}
          key={oneWaveformVizData.label}
        />
      );
    });

    return(
      <div className="waveform-visualization">
        {waveformNodes.length ? waveformNodes : <em>Rendering waveform visualization</em>}
      </div>
    );
  }
});

export default IndividualContainer;
