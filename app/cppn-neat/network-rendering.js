import { isAudible, remapNumberToRange, numWorkers } from '../util/range';
import { concatenateTypedArrays } from '../util/arrays';

const GainValuesPerAudioWavesWorker = require("worker?inline!../workers/gain-values-per-audio-wave-worker.js");
const RemapControlArrayToValueCurveRangeWorker = require("worker?inline!../workers/remap-control-array-to-value-curve-range-worker.js");


/**
 * Renders audio buffers from CPPN network output samples
 * by wiring an audio graph from a provided patch definition.
 */
class Renderer {

  constructor( sampleCount, sampleRate, duration ) {
    this.sampleCount = sampleCount;
    this.sampleRate = sampleRate;
    this.duration = duration;
  }

  renderNetworksOutputSamplesAsAudioBuffer( memberOutputs, patch ) {

    return new Promise( (resolve, reject) => {

      // TODO: move in hardcoded rendering from IndividualContainer


      console.log('Wiring up audio graph...');

      const startAudioCtxInstance = performance.now();

      const offlineCtx = new OfflineAudioContext( 1 /*channels*/,
        this.sampleRate * this.duration, this.sampleRate);

      const endAudioCtxInstance = performance.now();
      console.log(`%c instantiating audio context took ${endAudioCtxInstance-startAudioCtxInstance} milliseconds`,'color:darkorange');
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


      const startWaveTypeCategorization = performance.now();

      ///// wave table (or vector) synthes:
      // get a control wave for the mix
      let waveTableMixWave = memberOutputs.get(0);
      // and the audio waves for the wave table, which the control wave will mix together
      let audioWaves = [];
      for( let [outputIndex, output] of memberOutputs ) {
        if( isAudible(output.frequency) && 0 != outputIndex ) {
          audioWaves.push( output );
        }
      }

      let audioSources = audioWaves.map( oneOutput => {
        return this.getAudioBufferSource( [oneOutput.samples], offlineCtx );
      });

      const endWaveTypeCategorization = performance.now();
      console.log(`%c Wave type categorization took ${endWaveTypeCategorization - startWaveTypeCategorization} milliseconds`, 'color:darkorange');

      // gain values for each audio wave in the wave table,
      // each controlled by a value curve from the calculated gain values
      console.log('Calculating gain values...');
      const startCalculatingGainValues = performance.now();
      // let gainValues = this.getGainValuesPerAudioWave( audioWaves.length, waveTableMixWave.samples );
      this.spawnMultipleGainValuesPerAudioWaveWorkers(
        audioWaves.length, waveTableMixWave.samples
      ).then( gainValues => {

        const endCalculatingGainValues = performance.now();
        console.log(`%c Calculating gain values took ${endCalculatingGainValues - startCalculatingGainValues} milliseconds`, 'color:darkorange');


        const startApplyingGainValues = performance.now();

        this.getAudioSourceGains( gainValues, offlineCtx )
        .then( audioSourceGains => {

          const endApplyingGainValues = performance.now();
          console.log(`%c Applying gain values took ${endApplyingGainValues - startApplyingGainValues} milliseconds`, 'color:darkorange');
          console.log('Done calculating gain values.');

          const startConnectingAudioGraph = performance.now();

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

          const endConnectingAudioGraph = performance.now();
          console.log(`%c Connecting audio graph took ${endConnectingAudioGraph - startConnectingAudioGraph} milliseconds`, 'color:darkorange');

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
            new Float32Array( this.state.memberOutputs.get(2).samples.map(function(oneSample) {
              return remapNumberToRange(oneSample, -1, 1, 0, 1);
            }.bind(this)) ),
            offlineCtx.currentTime, this.state.duration
          );
          // use a control signal to mess with the detuning of the audio source:  FM
          source.detune.setValueCurveAtTime(
            new Float32Array( this.state.memberOutputs.get(3).samples.map(function(oneSample) {
              return remapNumberToRange(oneSample, -1, 1, -1000, 1000);
            }.bind(this)) ),
            offlineCtx.currentTime, this.state.duration*1.1
            // multiplier to have the k-rate (detune) param cover the entire playback duration
            // ...with limited understanding of how those k-rate params actually work:
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam#k-rate
          );
          // assign a sample array from one neural network output to sweep the filter:  subtractive synthesis
          biquadFilter.frequency.setValueCurveAtTime(
            new Float32Array(this.state.memberOutputs.get(4).samples.map(function(oneSample) {
              return remapNumberToRange(oneSample, -1, 1, 0, 2000);
            }.bind(this)) ),
            offlineCtx.currentTime, this.state.duration
          ); // TODO: use network outputs to control filter's gain or Q ?
          // distortion
          distortion.curve = new Float32Array(this.state.memberOutputs.get(5).samples);


          // start the source playing
          source.start();
    */

          console.log('Done wiring up audio graph, will now render.');

          const startRenderAudioGraph = performance.now();

          // Offline rendering of the audio graph to a reusable buffer
          offlineCtx.startRendering().then(function( renderedBuffer ) {
            console.log('Rendering completed successfully');

            const endRenderAudioGraph = performance.now();
            console.log(`%c Rendering audio graph took ${endRenderAudioGraph - startRenderAudioGraph} milliseconds`, 'color:darkorange');

            const networkIndividualSound = this.ensureBufferStartsAndEndsAtZero(
              renderedBuffer );

            resolve( networkIndividualSound );

          }.bind(this)).catch(function( err ) {
            console.log('Rendering failed: ' + err);

            reject( "Not able to render audio buffer from member outputs with provided audio graph patch: "
              + err );
          });

        }); // gain value curve remapping promise

      }); // gain calculation promise


      // TODO: ...then, dynamic rendering pipeline according to patch
    });
  }



  ensureBufferStartsAndEndsAtZero( buffer ) {
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
  }

  getAudioBufferSource( samplesArrays, audioCtx ) {

    let channels = samplesArrays.length;

    let arrayBuffer = audioCtx.createBuffer(
      channels, this.sampleCount, audioCtx.sampleRate );

    // Fill the buffer with signals according to the network outputs
    for( let channel=0; channel < channels; channel++ ) {

      // This gives us the actual ArrayBuffer that contains the data
      let nowBuffering = arrayBuffer.getChannelData( channel );
      let networkOutputBuffer = this.ensureBufferStartsAndEndsAtZero(
        samplesArrays[channel] );
      for( let i=0; i < this.sampleCount; i++ ) {
        nowBuffering[i] = networkOutputBuffer[i];
      }
    }

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    let audioBufferSourceNode = audioCtx.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    audioBufferSourceNode.buffer = arrayBuffer;

    return audioBufferSourceNode;
  }



  spawnMultipleGainValuesPerAudioWaveWorkers( audioWaveCount, controlWave ) {
    const chunk = Math.round( controlWave.length / numWorkers );

    const gainValuePromises = [];
    for( let i=0, j=controlWave.length; i<j; i+=chunk ) {
      const controlWaveSlice = controlWave.slice( i, i+chunk );

      gainValuePromises.push(
        this.spawnOneGainValuesPerAudioWaveWorker(
          audioWaveCount, controlWaveSlice )
      );
    }
    return Promise.all( gainValuePromises ).then( arrayOfSubGainValues => {

      return this.getCombinedGainValuesFromSubResults( arrayOfSubGainValues );
    });
  }

  spawnOneGainValuesPerAudioWaveWorker( audioWaveCount, controlWave ) {
    const promise = new Promise( (resolve, reject) => {
      const gainValuesPerAudioWaveWorker = new GainValuesPerAudioWavesWorker();
      gainValuesPerAudioWaveWorker.postMessage({
        audioWaveCount,
        controlWave
      }, [controlWave.buffer] );
      gainValuesPerAudioWaveWorker.onmessage = (e) => {

        resolve( e.data.gainValues );
      };
    });
    return promise;
  }

  getCombinedGainValuesFromSubResults( arrayOfSubGainValues ) {

    // initialize a Map of gain values using the first sub result as template
    const gainValues = new Map( [...arrayOfSubGainValues[0].entries()].map( oneEntry => {
      return [
         oneEntry[0],
         // will hold sub sample arrays, which will then be concatenated:
         new Array(arrayOfSubGainValues.length)
       ];
    }) );

    // combine gain values from each sub result
    const gainSubArrays = [];
    arrayOfSubGainValues.forEach( (subGainValues, subIndex) => {
      for( let [gainIndex, gainSubValues] of subGainValues ) {
        // add sub array of gain values
        gainValues.get( gainIndex )[subIndex] = gainSubValues;
      }
    });
    for( let [gainIndex, gainValuesSubArrays] of gainValues ) {
      gainValues.set(gainIndex,
        // combine the sub arrays
        concatenateTypedArrays(Float32Array, gainValuesSubArrays) );
    }
    return gainValues;
  }



  getAudioSourceGains( gainValues, audioCtx ) {

    const gainValueCurvePromises = [];
    gainValues.forEach( (oneGainControlArray, gainIndex) => {

      gainValueCurvePromises.push(
        this.getGainControlArrayRemappedToValueCurveRange( oneGainControlArray )
      );
    });
    return Promise.all( gainValueCurvePromises ).then( gainValueCurveArrays => {
      const audioSourceGains = [];
      gainValueCurveArrays.forEach( oneValueCurveArray => {
        let VCA = audioCtx.createGain();
        VCA.gain.setValueCurveAtTime(
          oneValueCurveArray, audioCtx.currentTime, this.duration );
        audioSourceGains.push( VCA );
      });
      return audioSourceGains;
    });
  }

  getGainControlArrayRemappedToValueCurveRange( gainControlArray ) {

    return new Promise(function(resolve, reject) {
      const remapControlArrayToValueCurveRangeWorker =
        new RemapControlArrayToValueCurveRangeWorker();

      remapControlArrayToValueCurveRangeWorker.postMessage({
        gainControlArray
      }, [gainControlArray.buffer] );

      remapControlArrayToValueCurveRangeWorker.onmessage = (e) => {
        resolve( e.data.valueCurve );
      };
    });
  }

}

export default Renderer;
