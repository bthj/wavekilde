import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { setCurrentPopulation, setCurrentMember } from '../../actions/evolution';

import PopulationGrid from '../views/population-grid';
import IndividualContainer from './individual-container';


class PopulationsContainer extends Component{

  componentDidMount() {

    this.props.setCurrentPopulation ( 0 );
    this.props.setCurrentMember( 5 );
  }

  render() {
    console.log( "this.props.populations", this.props.populations );
    // let individual = this.props.populations[0] ?
    //   this.props.populations[0][5] : null;

    return(
      <div>
        TODO: display tiles for each member of population
              with navigation to <Link to="/individual">individual detail</Link>
              and ability to select individuals as parents for evolution.
        TODO: button to evolve next generation.
      </div>
      // <IndividualContainer
//        member={individual}
        // populationIndex={0}
        // memberIndex={5}
      // />
    );
  }
}

function mapStateToProps( state ) {
  return {
    ...state.evolution
  };
}

export default connect(mapStateToProps, {
  setCurrentPopulation, setCurrentMember
})(PopulationsContainer);
