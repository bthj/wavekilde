import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentPopulation } from '../../actions/index';

import PopulationGrid from '../views/population-grid';
import IndividualContainer from './individual-container';


// import neatjs from 'neatjs';
// import cppnjs from 'cppnjs';

class PopulationsContainer extends Component{

  componentDidMount() {

    this.props.setCurrentPopulation ( 0 );
  }

  render() {
    console.log( "this.props.populations", this.props.populations );
    let individual = this.props.populations[0] ?
      this.props.populations[0][5] : null;

    return(
      <IndividualContainer member={individual} />
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
