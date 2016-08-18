import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentPopulation } from '../../actions/evolution';

import PopulationGrid from '../views/population-grid';
import IndividualContainer from './individual-container';


class PopulationsContainer extends Component{

  componentDidMount() {

    this.props.setCurrentPopulation ( 0 );
  }

  render() {
    console.log( "this.props.populations", this.props.populations );
    // let individual = this.props.populations[0] ?
    //   this.props.populations[0][5] : null;

    // TODO: provide populationIndex and memberIndex from selection in UI,
    // or navigate to /individual with parameters?

    return(
      <IndividualContainer
//        member={individual}
        populationIndex={0}
        memberIndex={5}
      />
    );
  }
}

function mapStateToProps( state ) {
  return {
    ...state.evolution
  };
}

export default connect(mapStateToProps, {
  setCurrentPopulation
})(PopulationsContainer);
