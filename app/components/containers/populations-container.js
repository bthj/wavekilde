import React from 'react';
import PopulationGrid from '../views/population-grid';

import IndividualContainer from './individual-container';

import neatjs from 'neatjs';
import cppnjs from 'cppnjs';

const PopulationsContainer = React.createClass({
  iecGenerator: undefined,
  populationSize: 10,

  getInitialState: function() {
    return {
      populations: [],
      currentPopulationIndex: 0
    }
  },

  createFirstPopulation: function() {

    let firstPopulation = [];
    for( var i=0; i < this.populationSize; i++ ) {

      // individuals in the first population have no actual parents;
      // instead they are mutations of some random seed genome:
      let onePopulationMember = this.iecGenerator.createNextGenome( [] );
      firstPopulation.push( onePopulationMember );
    }
    this.setState({populations: [firstPopulation]});
  },

  componentDidMount: function() {

    const weightRange = 2;
    const connectionProportion = 1;
    const inputs = 2;
    const outputs = 2;
    const seedCount = 5;
    let initialPopulationSeeds = [];

    // create initial seed genomes for coming population(s members)
    for( var i=0; i < seedCount; i++ ) {
      neatjs.neatGenome.Help.resetGenomeID();

      let neatGenome =
          neatjs.neatGenome.Help.CreateGenomeByInnovation(
        inputs,
        outputs,
        {
          connectionProportion: connectionProportion,
          connectionWeightRange: weightRange
        }
      );
      initialPopulationSeeds.push( neatGenome );
    }


    // Interactive Evolution Computation (IEC) setup

    let np = new neatjs.neatParameters();
    // defaults taken from
    // https://github.com/OptimusLime/win-gen/blob/d11e6df5e7b8948f292c999ad5e6c24ab0198e23/old/plugins/NEAT/neatPlugin.js#L63
    // https://github.com/OptimusLime/win-neat/blob/209f00f726457bcb7cd63ccc1ec3b33dec8bbb66/lib/win-neat.js#L20
    np.pMutateAddConnection = .13;
    np.pMutateAddNode = .13;
    np.pMutateDeleteSimpleNeuron = .00;
    np.pMutateDeleteConnection = .00;
    np.pMutateConnectionWeights = .72;
    np.pMutateChangeActivations = .02;

    np.pNodeMutateActivationRate = 0.2;
    np.connectionWeightRange = 3.0;
    np.disallowRecurrence = true;


    // IEC options taken from
    // https://github.com/OptimusLime/win-Picbreeder/blob/33366ef1d8bfd13c936313d2fdb2afed66c31309/html/pbHome.html#L95
    // https://github.com/OptimusLime/win-Picbreeder/blob/33366ef1d8bfd13c936313d2fdb2afed66c31309/html/pbIEC.html#L87
    let iecOptions = {
      initialMutationCount : 5,
      postMutationCount : 5  // AKA mutationsOnCreation
    };

    this.iecGenerator = new neatjs.iec( np, initialPopulationSeeds, iecOptions );

    this.createFirstPopulation();

    // let's decrease the mutation count after creating the first population
    iecOptions.initialMutationCount = 1;
    iecOptions.postMutationCount = 1;
  },

  render: function() {
    console.log( "this.state.populations" );
    console.log( this.state.populations );
    let individual = this.state.populations[0] ?
      this.state.populations[0][5] : null;
      
    return(
      <IndividualContainer member={individual} />
    );
  }
});

export default PopulationsContainer;
