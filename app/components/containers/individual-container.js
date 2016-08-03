import React from 'react';
import update from 'react-addons-update';
import IndividualGrid from '../views/individual-grid';

import { Waveform, LineChart } from 'react-d3-components';


const IndividualContainer = React.createClass({

  // TODO: move (most / all) state variables to application redux state
  // one .memberOutputs object per member of current population, lazily
  // set on demand; possibly when played in overview of population,
  // and when viewing detail for one individual...
  getInitialState: function() {
    const duration = 10;  // in seconds
    const audioCtx = new( window.AudioContext || window.webkitAudioContext )();
    return {
      memberOutputs: {},
      memberSettings: [],
      audioCtx: audioCtx,
      duration: duration,
      // Create an empty two-second buffer at the sample rate of the AudioContext,
      // times the number of seconds
      frameCount: audioCtx.sampleRate * duration,

      networkIndividualSound: null,
      waveformNodes: []
    }
  },
  componentWillReceiveProps: function( nextProps ) {

    if( nextProps.member ) {

/*    rather dub-steppy settings:
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
*/

      let outputsToActivate = [
        { index: 0, frequency: 55.0 }, // wave table mix control wave
        { index: 1, frequency: 110.0 }, // wave table audio waves:
        { index: 2, frequency: 220.0 },
        { index: 3, frequency: 440.0 },
        { index: 4, frequency: 660.0 },
        { index: 5, frequency: 880.0 },
        { index: 6, frequency: 1760.0 },
        { index: 7, frequency: 3520.0 },
        { index: 8, frequency: 7040.0 },
        { index: 9, frequency: 14080.0 },
      ];

      this.activateMember( nextProps.member, outputsToActivate );
      // this.activateMember( nextProps.member, null );
    }
  },

  componentDidMount: function() {

    // console.log('document.getElementsByClassName("population-footer")[0]');
    // console.log(document.getElementsByClassName("population-footer")[0]);
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

    this.networkIndividualSound = null;

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
        samples: new Array(sampleCount),
        frequency: oneOutput.frequency,
        inputPeriods: oneOutput.frequency *
          (this.state.frameCount / this.state.audioCtx.sampleRate)
      };
    }.bind(this));

    // let's only activate the network once per unique input perods value / sample
    let uniqueInputPeriods = new Set( outputsToActivate.map( o =>
      memberOutputs[o.index].inputPeriods ) );
    var networkActivationStart = performance.now();
    uniqueInputPeriods.forEach(function( inputPeriods ) {


      // TODO: do something like this in a separate function, to get the input signals generally..
      // let inputSignals = Array(sampleCount).fill(0).map((v,c) => {
      //   let rangeFraction = c / (sampleCount-1);
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




      for ( let c=0; c < sampleCount; c++ ) {
        // if( c % 10000 == 0 ) console.log(`activating network for sample ${c} and input period ${inputPeriods}`);

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

            memberOutputs[ oneOutput.index ].samples[c] =
              memberCPPN.getOutputSignal(oneOutput.index);
          }
        }.bind(this));
      }
    }.bind(this));
    var networkActivationEnd = performance.now();
    console.log(`Activating network,
      for ${uniqueInputPeriods.size} unique periods
      and ${sampleCount} samples,
      took ${networkActivationEnd - networkActivationStart}  milliseconds.`);

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
  },

  playAudioRendering: function() {
    console.log(`playAudioRendering, buffer length: ${this.networkIndividualSound.length}`);
    let soundToPlay = this.state.audioCtx.createBufferSource();
    soundToPlay.buffer = this.networkIndividualSound;
    soundToPlay.connect( this.state.audioCtx.destination );
    soundToPlay.start();

    // this.mixGainsStart = null;
    // window.requestAnimationFrame( this.showMixGains );
  },

  getAudioBufferSource: function( samplesArrays, audioCtx ) {

    let channels = samplesArrays.length;

    let arrayBuffer = audioCtx.createBuffer(
      channels, this.state.frameCount, audioCtx.sampleRate );

    // Fill the buffer with signals according to the network outputs
    for( let channel=0; channel < channels; channel++ ) {

      // This gives us the actual ArrayBuffer that contains the data
      let nowBuffering = arrayBuffer.getChannelData( channel );
      let networkOutputBuffer = this.ensureBufferStartsAndEndsAtZero(
        samplesArrays[channel] );
      for( let i=0; i < this.state.frameCount; i++ ) {
        nowBuffering[i] = networkOutputBuffer[i];
      }
    }

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    let audioBufferSourceNode = audioCtx.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    audioBufferSourceNode.buffer = arrayBuffer;

    return audioBufferSourceNode;
  },

  render: function() {

    ///// try populating one audio buffer from this member
    //...such as in:  https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode#Examples

    if( Object.keys(this.state.memberOutputs).length ) {

      console.log('Wiring up audio graph...');

      const offlineCtx = new OfflineAudioContext( 1 /*channels*/,
        this.state.audioCtx.sampleRate*this.state.duration, this.state.audioCtx.sampleRate);
/*
      // Stereo
      let channels = 2;



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
*/


      ///// wave table (or vector) synthes:
      // get a control wave for the mix
      let waveTableMixWave = this.state.memberOutputs[0];
      // and the audio waves for the wave table, which the control wave will mix together
      let audioWaves = [];
      for( let outputIndex in this.state.memberOutputs ) {
        let output = this.state.memberOutputs[outputIndex];
        if( this.isAudible(output.frequency) && 0 != outputIndex ) {
          audioWaves.push( output );
        }
      }

      let audioSources = audioWaves.map( oneOutput => {
        return this.getAudioBufferSource( [oneOutput.samples], offlineCtx );
      });

      // gain values for each audio wave in the wave table,
      // each controlled by a value curve from the calculated gain values
      console.log('Calculating gain values...');
      let gainValues = this.getGainValuesPerAudioWave( audioWaves.length, waveTableMixWave.samples );
      this.gainValues = gainValues; // temporary global assignment, for logging in showMixGains()
      // console.log("gainValues");console.log(gainValues);
      let audioSourceGains = [];
      console.log('Applying gain values to each gain node...');
      gainValues.forEach( (oneGainControlArray, gainIndex) => {
        let VCA = offlineCtx.createGain();
        VCA.gain.setValueCurveAtTime(new Float32Array( oneGainControlArray.map( oneGainValue => {
          return this.remapNumberToRange( oneGainValue, -1, 1, 0, 1 );
        })), offlineCtx.currentTime, this.state.duration);
        audioSourceGains.push( VCA );
      });
      console.log('Done calculating gain values.');

      // connect each audio source to a gain node,
      audioSources.forEach(
        (audioSource, index) => audioSource.connect( audioSourceGains[index] ) );

      // instantiate a merger; mixer
      let mergerNode = offlineCtx.createChannelMerger( audioSources.length );

      // connect the output of each audio source gain to the mixer
      audioSourceGains.forEach(
        (audioGain, index) => audioGain.connect( mergerNode, 0, index ) );

      // connect the mixer to the output device
      mergerNode.connect( offlineCtx.destination );

      // start all the audio sources
      let currentTime = offlineCtx.currentTime;
      audioSources.forEach( audioSource => audioSource.start(currentTime) );


/*    AM, FM, subtractive synthesis, distortion - TODO: to be assignable to waves in UI

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

      // TODO: use scheduling in the future, shared with the audio sources's .start(...) ?
      // start controlling the amplifier's gain:  AM
      VCA.gain.setValueCurveAtTime(
        new Float32Array( this.state.memberOutputs[2].samples.map(function(oneSample) {
          return this.remapNumberToRange(oneSample, -1, 1, 0, 1);
        }.bind(this)) ),
        offlineCtx.currentTime, this.state.duration
      );
      // use a control signal to mess with the detuning of the audio source:  FM
      source.detune.setValueCurveAtTime(
        new Float32Array( this.state.memberOutputs[3].samples.map(function(oneSample) {
          return this.remapNumberToRange(oneSample, -1, 1, -1000, 1000);
        }.bind(this)) ),
        offlineCtx.currentTime, this.state.duration*1.1
        // multiplier to have the k-rate (detune) param cover the entire playback duration
        // ...with limited understanding of how those k-rate params actually work:
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam#k-rate
      );
      // assign a sample array from one neural network output to sweep the filter:  subtractive synthesis
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
*/

      console.log('Done wiring up audio graph, will now render.');

      // Offline rendering of the audio graph to a reusable buffer
      offlineCtx.startRendering().then(function( renderedBuffer ) {
        console.log('Rendering completed successfully, will add result to component state...');

        this.networkIndividualSound = this.ensureBufferStartsAndEndsAtZero( renderedBuffer );
        console.log('Rendered buffer set to global variable, will now play.');
        this.playAudioRendering();

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
        {
          waveformNodes && waveformNodes.length ?
          [
            ...waveformNodes,
            <button onClick={this.playAudioRendering} key="play">Play</button>
          ]
          : <em>Rendering waveform visualization</em>
        }
      </div>
    );
  }
});

export default IndividualContainer;
