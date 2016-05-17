import React from 'react';
import IndividualGrid from '../views/individual-grid';


const IndividualContainer = React.createClass({

  getInitialState: function() {
    const audioCtx = new( window.AudioContext || window.webkitAudioContext )();
    return {
      memberOutputs: [],
      memberSettings: [],
      audioCtx: audioCtx,
      // Create an empty two-second buffer at the sample rate of the AudioContext
      frameCount: audioCtx.sampleRate * 30.0
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

      memberOutputs.push( [c,
        memberCPPN.getOutputSignal(0),
        memberCPPN.getOutputSignal(1) // TODO: can use spread operator?
      ] );

      this.setState({memberOutputs: memberOutputs});
    }
  },


  render: function() {
    console.log( "this.state.memberOutputs" );
    console.log( this.state.memberOutputs );

    // try populating one audio buffer from this member
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

    return(
      <p>Hello IndividualContainer</p>
    );
  }
});

export default IndividualContainer;
