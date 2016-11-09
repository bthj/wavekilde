import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  getOutputsForMemberInCurrentPopulation, getAudioBuffersForMember
} from '../../actions/rendering';
import { isAudible, remapNumberToRange } from '../../util/range';
import { playAudioBuffer } from '../../util/play';

import IndividualGrid from '../views/individual-grid';

import { Waveform, LineChart } from 'react-d3-components';


class IndividualContainer extends Component {

  static contextTypes = {
    router: PropTypes.object
  };

  constructor( props ) {
    super( props );

    this.state = { soundBufferPlayedAutomatically: false };
  }


  getMemberOutputsFromApplicationState() {
    return this.props.rendering.memberOutputs.getIn(
      [this.props.populationIndex, this.props.memberIndex] );
  }

  getRenderedSoundBuffersFromApplicationState() {
    return this.props.rendering.memberRenderedSounds.getIn(
        [this.props.populationIndex, this.props.memberIndex] );
  }

  isMemberOutputAvailable() {
    return this.getMemberOutputsFromApplicationState() ? true : false;
  }
  isNetworkActivating() {
    return this.props.rendering.renderingMemberOutputs.getIn(
      [this.props.populationIndex, this.props.memberIndex] );
  }

  isAudioBufferAvailable() {
    return this.getRenderedSoundBuffersFromApplicationState() ? true : false;
  }
  isAudioBuffersRendering() {
    return this.props.rendering.renderingMemberSounds.getIn(
      [this.props.populationIndex, this.props.memberIndex] );
  }

  isMemberSelectedFromPopulation() {
    return this.props.populationIndex >= 0 && this.props.memberIndex >= 0;
  }
  getSelectedMember() {
    return this.props.currentPopulation[this.props.memberIndex];
  }

  startMemberOutputsRendering() {
    return this.props.getOutputsForMemberInCurrentPopulation(
      this.props.populationIndex, this.props.memberIndex );
  }

  startAudioBuffersRendering() {
    return this.props.getAudioBuffersForMember(
      this.getMemberOutputsFromApplicationState(),
      this.props.populationIndex, this.props.memberIndex,
      /*, noteDeltas, reverse */
    );
  }

  componentDidUpdate( prevProps ) {

    if( this.isMemberOutputAvailable() ) {
      console.log("this.isMemberOutputAvailable(): ", this.isMemberOutputAvailable());
      // TODO: message that network activation has completed
      // TODO: set up waveform visualization for the available network outputs.

      if( ! this.isAudioBufferAvailable() && ! this.isAudioBuffersRendering() ) {

        this.startAudioBuffersRendering();
      }
    }
    if( this.isAudioBufferAvailable() ) {
      console.log("this.isAudioBufferAvailable(): ", this.isAudioBufferAvailable());

      if( ! this.state.soundBufferPlayedAutomatically ) {
        this.playAudioRendering( 0 );
      }
    }
  }

  componentDidMount() {

    if( this.isMemberSelectedFromPopulation() ) {

      if( ! this.isMemberOutputAvailable() && ! this.isNetworkActivating() ) {

        this.startMemberOutputsRendering();

      } else if( ! this.isAudioBufferAvailable() ) {

        this.startAudioBuffersRendering();

      } else {
        this.playAudioRendering( 0 );
      }

    } else {
      this.context.router.push( '/lineage' );
    }
  }


  getDownsampledArray( originalValues, targetSampleCount ) {

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
  }

  getDownsampledMemberOutputs( targetSampleCount ) {
    let downsampledMemberOutputs = {};
    for( let outputIndex in this.getMemberOutputsFromApplicationState() ) {
      downsampledMemberOutputs[outputIndex] = {
        samples: this.getDownsampledArray(
          this.getMemberOutputsFromApplicationState()[outputIndex].samples, targetSampleCount ),
        frequency: this.getMemberOutputsFromApplicationState()[outputIndex].frequency
      };
    }
    return downsampledMemberOutputs;
  }
  getWaveformVisualizationDataFromOutputs( memberOutputs ) {
    let visualizationDataForAllNetworkOutputNodes = [];
    for( let outputIndex in memberOutputs ) {
      visualizationDataForAllNetworkOutputNodes.push({
        label: `Output ${outputIndex}`,
        values: memberOutputs[outputIndex].samples.map( function(oneSample, index) {
          return {
            x: index,
            y: remapNumberToRange(oneSample, -1, 1, 0, 1)
          };
        }.bind(this)),
        frequency: memberOutputs[outputIndex].frequency
      });
    }
    return visualizationDataForAllNetworkOutputNodes;
  }

  showMixGains( timestamp ) {
      if( !this.mixGainsStart ) this.mixGainsStart = timestamp;
      let playbackProgressInSeconds = (timestamp - this.mixGainsStart)/1000;
      let timePercentage = playbackProgressInSeconds / this.state.duration;
      let frameNr = Math.floor( timePercentage * this.state.frameCount );
      let gainsPercentages = new Array(this.gainValues.size);
      for( var [key, value] of this.gainValues.entries() ) {
        gainsPercentages[key] = `gain${key}: ${value[frameNr]}`;
      }
      console.log(`time percentage: ${timePercentage},\t${gainsPercentages.join(',\t')}`);
      if( playbackProgressInSeconds < this.state.duration ) {
        window.requestAnimationFrame( this.showMixGains );
      }
  }

  playAudioRendering( notesFromBase ) {
    const individualSoundBuffers = this.getRenderedSoundBuffersFromApplicationState();
    if( individualSoundBuffers ) {
      playAudioBuffer( notesFromBase, individualSoundBuffers, this.props.rendering.audioCtx );
    }
  }


  render() {

    ///// waveform visualization

    let waveformWidth = 1200; // TODO: window.innerWidth gives 0;

    if( false /* need to ensure visualization rendering is only performed once:  this.isMemberOutputAvailable() */ ) {
      const startDownsamplingNetworkOutputs = performance.now();
      let downsampledMemberOutputs =
        this.getDownsampledMemberOutputs( waveformWidth * 2 );
      const endDownsamplingNetworkOutputs = performance.now();
      console.log(`%c Downsampling network outputs took ${endDownsamplingNetworkOutputs - startDownsamplingNetworkOutputs} milliseconds`,'color:darkorange');

      const startGettingWaveformVisualizationDataFromOutputs = performance.now();
      var waveformVisualizationData =
        this.getWaveformVisualizationDataFromOutputs( downsampledMemberOutputs );
      const endGettingWaveformVisualizationDataFromOutputs = performance.now();
      console.log(`%c Getting waveform visualization data from outputs took ${endGettingWaveformVisualizationDataFromOutputs - startGettingWaveformVisualizationDataFromOutputs} milliseconds`,'color:darkorange');
    } else {
      var waveformVisualizationData = [];
    }

    let waveformNodes = waveformVisualizationData.map( function(oneWaveformVizData) {
      return(
        isAudible( oneWaveformVizData.frequency ) ?
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
        {
          waveformNodes && waveformNodes.length ?
          [
            ...waveformNodes
          ]
          : <em>Rendering waveform visualization</em>
        }
        {
          this.isAudioBufferAvailable() ?
            <button onClick={this.playAudioRendering.bind(this, 0)} key="play">Play</button>
            : ''
        }
        {
          this.isMemberSelectedFromPopulation() ?
          <pre>{JSON.stringify( this.getSelectedMember() ,null,'\t')}</pre> : ''
        }
      </div>
    );
  }
}

function mapStateToProps( state ) {
  return {
    rendering: state.rendering,
    populationIndex: state.evolution.currentPopulationIndex,
    memberIndex: state.evolution.currentMemberIndex,
    currentPopulation: state.evolution.currentPopulation
  };
}

export default connect(mapStateToProps, {
  getOutputsForMemberInCurrentPopulation,
  getAudioBuffersForMember
})(IndividualContainer);
