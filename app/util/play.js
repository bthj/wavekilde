/**
 * Plays a sound buffer for the current member of the current population.
 * @param  {Integer} notesFromBase What note to play, as deviation from the
 *                                base note, where e.g. 0 refers to the base note,
 *                                1 one note higher than the base note and
 *                                -2 two notes lower than the base note.
 */
function playAudioBuffer( notesFromBase, audioBuffers, audioCtx ) {
  console.log(`playAudioRendering, buffer length: ${audioBuffers[ notesFromBase ].length}`);
  const soundToPlay = audioCtx.createBufferSource();
  soundToPlay.buffer = audioBuffers[ notesFromBase ];
  soundToPlay.connect( audioCtx.destination );
  soundToPlay.start();
}

export {
  playAudioBuffer
}
