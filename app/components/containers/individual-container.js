import React from 'react';
import IndividualGrid from '../views/individual-grid';


const IndividualContainer = React.createClass({

  getInitialState: function() {
    return {
      memberOutputs: [],
      memberSettings: []
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
    const inputPeriods = 10;
    const variationOnPeriods = true;

    const sampleCount = 128;

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

    //TODO: try populating one audio buffer from this member
    //...such as in:  https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode#Examples

    return(
      <p>Hello IndividualContainer</p>
    );
  }
});

export default IndividualContainer;
