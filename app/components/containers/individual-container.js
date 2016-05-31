import React from 'react';
import update from 'react-addons-update';
import IndividualGrid from '../views/individual-grid';

import { Waveform, LineChart } from 'react-d3-components';


const IndividualContainer = React.createClass({

  getInitialState: function() {
    const duration = 1;  // in seconds
    const audioCtx = new( window.AudioContext || window.webkitAudioContext )();
    return {
      memberOutputs: {},
      memberSettings: [],
      audioCtx: audioCtx,
      duration: duration,
      // Create an empty two-second buffer at the sample rate of the AudioContext,
      // times the number of seconds
      frameCount: audioCtx.sampleRate * duration,

      networkIndividualSound: null
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
          frequency: 440.0  // A4
        },
        {
          index: 2,
          frequency: 0  // LFO for AM
        },
        {
          index: 3,
          frequency: 880  // LFO for FM
        },
        {
          index: 4,
          frequency: 14  // LFO for filter frequency
        },
        {
          index: 5,
          frequency: 14  // LFO for distortion
        }
      ];
      this.activateMember( nextProps.member, outputsToActivate );
      // this.activateMember( nextProps.member, null );
    }
  },

  componentDidMount: function() {

    console.log('document.getElementsByClassName("population-footer")[0]');
    console.log(document.getElementsByClassName("population-footer")[0]);
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
    this.setState({
      networkIndividualSound: update(this.state.networkIndividualSound, {$set: null})
    });

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
        if( c % 10000 == 0 ) console.log(`activating network for sample ${c} and input period ${inputPeriods}`);

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
              memberCPPN.getOutputSignal(oneOutput.index)
            );
          }
        }.bind(this));
      }
    }.bind(this));

    this.setState({
      memberOutputs: update(this.state.memberOutputs, {$merge: memberOutputs})
    });
    console.log("Done activating member outputs");
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

  getSpectrumSpansForAudioWaves: function( audioWaveCount, oneWaveFraction, oneWaveMiddleFraction ) {
    const waveSpectrumSpans = new Map();
    for( let i=0; i < audioWaveCount; i++ ) {
      let spectrumStart = i * oneWaveFraction - 1 // -1 as we're working with the range -1 to 1
      let spectrumStartFading =
        spectrumStart - ( i ? oneWaveMiddleFraction : 0 ); // to start fading in the adjacent span
      let spectrumMiddle = spectrumStart + oneWaveMiddleFraction;
      let spectrumEnd = spectrumStart + oneWaveFraction
      let spectrumEndFading =
        spectrumEnd + ( (i+1) < audioWaveCount ? oneWaveMiddleFraction : 0 ); // to fade into the adjacent span
      waveSpectrumSpans.set( i, {
        start: spectrumStartFading,
        middle: spectrumMiddle,
        end: spectrumEndFading
      });
    }
    // console.log(`oneWaveFraction: ${oneWaveFraction}, oneWaveMiddleFraction: ${oneWaveMiddleFraction}`);
    // console.log("waveSpectrumSpans");console.log(waveSpectrumSpans);
    return waveSpectrumSpans;
  },
  getGainValuesPerAudioWave: function( audioWaveCount, controlWave ) {
    const oneWaveFraction = 2 / audioWaveCount; // 2 as -1 to 1 spans two integers
    const oneWaveMiddleFraction = oneWaveFraction / 2;
    const waveSpectrumSpans =
      this.getSpectrumSpansForAudioWaves( audioWaveCount, oneWaveFraction, oneWaveMiddleFraction );
    const gainValues = new Map();
    [...Array(audioWaveCount).keys()].forEach( audioWaveNr => {
      gainValues.set( audioWaveNr, [] );
    });
    controlWave.forEach( oneSample => {
      for( let [waveNr, spans] of waveSpectrumSpans.entries() ) {
        let spectrum = waveSpectrumSpans.get(waveNr);
        if( spectrum.start < oneSample && oneSample < spectrum.end ) {
          let gain = 1 - Math.abs(spectrum.middle - oneSample) / oneWaveFraction;
          gainValues.get( waveNr ).push( gain );
        } else {
          gainValues.get( waveNr ).push( 0 );
        }
      }
    });
    console.log("gainValues");console.log(gainValues);
    return gainValues;
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

  sign: function( number ) {
    return number?number<0?-1:1:0;  // from http://stackoverflow.com/a/9079549/169858
  },
  ensureBufferStartsAndEndsAtZero: function( buffer ) {
    const samplesToFadeFromZero = 128;
    if( 0 != buffer[0] ) {
      for( let i=0; i < samplesToFadeFromZero; i++ ) {
        buffer[i] = buffer[i] * (i/samplesToFadeFromZero);
      }
    }
    if( 0 != buffer[buffer.length-1] ) {
      for( let i=samplesToFadeFromZero; i > 0; --i ) {
        buffer[buffer.length-i] =
          buffer[buffer.length-i] * ((i-1) / samplesToFadeFromZero);
      }
    }
    return buffer;
  },


  showMixGains: function( timestamp ) {
      if( !this.mixGainsStart ) this.mixGainsStart = timestamp;
      let playbackProgressInSeconds = (timestamp - this.mixGainsStart)/1000;
      console.log(`time percentage: ${playbackProgressInSeconds / this.state.duration}`);
      if( playbackProgressInSeconds < this.state.duration ) {
        window.requestAnimationFrame( this.showMixGains );
      }
  },

  playAudioRendering: function() {

    let soundToPlay = this.state.audioCtx.createBufferSource();
    soundToPlay.buffer = this.state.networkIndividualSound;
    soundToPlay.connect( this.state.audioCtx.destination );
    soundToPlay.start();

    this.mixGainsStart = null;
    window.requestAnimationFrame( this.showMixGains );
  },

  render: function() {

    ///// try populating one audio buffer from this member
    //...such as in:  https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode#Examples

    if( Object.keys(this.state.memberOutputs).length && ! this.state.networkIndividualSound) {

      // Stereo
      let channels = 2;

      const offlineCtx = new OfflineAudioContext( channels,
        this.state.audioCtx.sampleRate*this.state.duration, this.state.audioCtx.sampleRate);

      let myArrayBuffer = offlineCtx.createBuffer(
        channels, this.state.frameCount, offlineCtx.sampleRate );

      // Fill the buffer with signals according to the network outputs
      for( let channel=0; channel < channels; channel++ ) {

        // This gives us the actual ArrayBuffer that contains the data
        let nowBuffering = myArrayBuffer.getChannelData( channel );
        let networkOutputBuffer = this.ensureBufferStartsAndEndsAtZero(
          this.state.memberOutputs[channel].samples );
        for( let i=0; i < this.state.frameCount; i++ ) {
          nowBuffering[i] = networkOutputBuffer[i];
        }
      }

      // Get an AudioBufferSourceNode.
      // This is the AudioNode to use when we want to play an AudioBuffer
      let source = offlineCtx.createBufferSource();
      // set the buffer in the AudioBufferSourceNode
      source.buffer = myArrayBuffer;


      // let gainValues = this.getGainValuesPerAudioWave( 5, this.state.memberOutputs[5].samples );
      // let oneGainArray = gainValues.get(2);

      // create a "Voltage Controlled" Amplifier
      let VCA = offlineCtx.createGain();
      // set the amplifier's initial gain value
      VCA.gain.value = .5;

      let biquadFilter = offlineCtx.createBiquadFilter();
      biquadFilter.type = 'lowpass'; // moar types at https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
      biquadFilter.frequency.value = 1000;

      let distortion = offlineCtx.createWaveShaper();


      source.connect( distortion );
      distortion.connect( biquadFilter );
      biquadFilter.connect( VCA );
      // connect the Amplifier to the
      // destination so we can hear the sound
      VCA.connect(offlineCtx.destination);


      // start controlling the amplifier's gain
      // TODO: use scheduling in the future, shared with the audio sources's .start(...) ?
      VCA.gain.setValueCurveAtTime(
        new Float32Array( this.state.memberOutputs[2].samples.map(function(oneSample) {
          return this.remapNumberToRange(oneSample, -1, 1, 0, 1);
        }.bind(this)) ),
        offlineCtx.currentTime, this.state.duration
      );
      // use a control signal to mess with the detuning of the audio source
      source.detune.setValueCurveAtTime(
        new Float32Array( this.state.memberOutputs[3].samples.map(function(oneSample) {
          return this.remapNumberToRange(oneSample, -1, 1, -1000, 1000);
        }.bind(this)) ),
        offlineCtx.currentTime, this.state.duration*1.1
        // multiplier to have the k-rate (detune) param cover the entire playback duration
        // ...with limited understanding of how those k-rate params actually work:
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam#k-rate
      );
      // assign a sample array from one neural network output to sweep the filter
      biquadFilter.frequency.setValueCurveAtTime(
        new Float32Array(this.state.memberOutputs[4].samples.map(function(oneSample) {
          return this.remapNumberToRange(oneSample, -1, 1, 0, 2000);
        }.bind(this)) ),
        offlineCtx.currentTime, this.state.duration
      ); // TODO: use network outputs to control filter's gain or Q ?
      // distortion
      distortion.curve = new Float32Array(this.state.memberOutputs[5].samples);

      // start the source playing
      source.start();




      // Offline rendering of the audio graph to a reusable buffer
      offlineCtx.startRendering().then(function( renderedBuffer ) {
        console.log('Rendering completed successfully');

        // console.log("renderedBuffer.getChannelData(0)");
        // console.log(renderedBuffer.getChannelData(0)[renderedBuffer.length-1]);
        this.setState({
          networkIndividualSound: this.ensureBufferStartsAndEndsAtZero( renderedBuffer )
        }, function() {
          this.playAudioRendering();
        });
      }.bind(this)).catch(function( err ) {
        console.log('Rendering failed: ' + err);
      });
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
        {
          this.state.networkIndividualSound ?
          <button onClick={this.playAudioRendering}>Play</button>
          : <em>waiting for rendering</em>
        }
      </div>
    );
  }
});

export default IndividualContainer;
