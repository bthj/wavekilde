/**
 * Renders audio buffers from CPPN network output samples
 * by wiring an audio graph from a provided patch definition.
 */
class Renderer {

  constructor( sampleCount, duration ) {
    this.sampleCount = sampleCount;
    this.duration = duration;
  }

  renderNetworksOutputSamplesAsAudioBuffer( memberOutputs, patch ) {

  }
}
