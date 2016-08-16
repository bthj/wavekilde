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

    return new Promise( (resolve, reject) = {

      // TODO: move in hardcoded rendering from IndividualContainer

      // TODO: ...then, dynamic rendering pipeline according to patch

      let audioBuffer;
      /* ... */
      if( true /*TODO: audio buffer successfully rendered */ ) {
        resolve( audioBuffer );
      } else {
        reject( "Not able to render audio buffer from member outputs with provided audio graph patch" );
      }
    });
  }
}
