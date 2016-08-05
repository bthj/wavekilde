/**
 * Get audio from a CPPN network by activating its outputs
 * and rendering an audio graph,
 * according to the current audio synthesis patch set in application state.
 * @param  {int} populationIndex Index to the population to draw a member from.
 * @param  {int} memberIndex     Index to the member in the provided population.
 * @param  {Array} noteDeltas       What notes to render as deviations from the
 *                                  base note, with integers indicating the number
 *                                  of notes departing from the base note, such as:
 *                                  [-4, -1, 2, 8]
 * @param  {boolean} reverse         Wether the samples output from the network
 *                                  should be reversed.
 * @return {Array}                 Audio buffer(s).
 */
export function getAudioBuffersFromMember(
  populationIndex, memberIndex, noteDeltas, reverse ) {

  // TODO: get member outputs from Activator,
  //  providing it sampleCount, sampleRate and
  //  outputsToActivate (deduced from synth-patch) from application state
  //  using Thunk middleware:  http://stackoverflow.com/a/35674575/169858
  //
  //  Then render an audio graph with Renderer,
  //  providing it with an audio graph patch from application state.
}
