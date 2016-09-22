import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { setCurrentPopulation, setCurrentMember } from '../../actions/evolution';
import { getOutputsForMember, getAudioBuffersForMember } from '../../actions/rendering';
import { playAudioBuffer } from '../../util/play';

import PopulationGrid from '../views/population-grid';
import IndividualContainer from './individual-container';


class PopulationsContainer extends Component{

  componentDidMount() {

    if( this.props.currentPopulationIndex < 0 ) {
      this.props.setCurrentPopulation ( 0 );
    }
  }

  componentDidUpdate( prevProps ) {

    for( let i=0; i<this.getCurrentPopulation().length; i++ ) {
      if( this.isNetworkActivating( i ) || this.isAudioBuffersRendering( i ) ) {
        break;
      } else if( ! this.isMemberOutputAvailable( i ) ) {
        this.startMemberOutputsRendering( i );
        break;
      } else if( ! this.isAudioBufferAvailable( i ) ) {
        this.startAudioBuffersRendering( i );
        break;
      }
    }
  }

  render() {
    console.log( "this.props.populations", this.props.populations );

    return(
      <div>
        TODO: display tiles for each member of population
              with navigation to <Link to="/individual">individual detail</Link>
              and ability to select individuals as parents for evolution.
        TODO: button to evolve next generation.

        {this.getPopulationNodes()}
      </div>
    );
  }

  getPopulationNodes() {
    const currentPopulation = this.getCurrentPopulation();
    return currentPopulation ? currentPopulation.map( (oneMember, memberIndex) => {
      return(
        <div style={{padding:"1em"}} key={memberIndex}>
          {this.isMemberOutputAvailable( memberIndex ) ?
            <span> [Network activated] </span> : ''
          }
          {this.isAudioBufferAvailable( memberIndex ) ?
            <span>
               [Audio available]
               <button onClick={this.playMemberAudio.bind(this, 0, memberIndex )} key="play">Play</button>
             </span> : ''
          }

          <Link to="/individual" onClick={() => this.props.setCurrentMember(memberIndex)}>
            {oneMember.offspring.nodes.map( oneNode => <span>{oneNode.activationFunction},</span>)}
          </Link>
        </div>
      );
    }) : '';
  }



  getMemberOutputsFromApplicationState( memberIndex ) {
    return this.props.rendering.memberOutputs.getIn(
      [this.props.currentPopulationIndex, memberIndex] );
  }

  getRenderedSoundBuffersFromApplicationState( memberIndex ) {
    return this.props.rendering.memberRenderedSounds.getIn(
        [this.props.currentPopulationIndex, memberIndex] );
  }

  isMemberOutputAvailable( memberIndex ) {
    return this.getMemberOutputsFromApplicationState( memberIndex ) ? true : false;
  }
  isNetworkActivating( memberIndex ) {
    return this.props.rendering.renderingMemberOutputs.getIn(
      [this.props.currentPopulationIndex, memberIndex] );
  }

  isAudioBufferAvailable( memberIndex ) {
    return this.getRenderedSoundBuffersFromApplicationState( memberIndex ) ? true : false;
  }
  isAudioBuffersRendering( memberIndex ) {
    return this.props.rendering.renderingMemberSounds.getIn(
      [this.props.currentPopulationIndex, memberIndex] );
  }

  startMemberOutputsRendering( memberIndex ) {
    return this.props.getOutputsForMember(
      this.props.currentPopulationIndex, memberIndex
    );
  }

  startAudioBuffersRendering( memberIndex ) {
    return this.props.getAudioBuffersForMember(
      this.getMemberOutputsFromApplicationState( memberIndex ),
      this.props.currentPopulationIndex, memberIndex,
      /*, noteDeltas, reverse */
    );
  }

  getCurrentPopulation() {
    return this.props.populations[this.props.currentPopulationIndex];
  }

  playMemberAudio( notesFromBase, memberIndex ) {
    const audioBuffer = this.getRenderedSoundBuffersFromApplicationState( memberIndex );
    playAudioBuffer( notesFromBase, audioBuffer, this.props.rendering.audioCtx );
  }
}

function mapStateToProps( state ) {
  return {
    ...state.evolution,
    rendering: state.rendering
  };
}

export default connect(mapStateToProps, {
  setCurrentPopulation, setCurrentMember,
  getOutputsForMember, getAudioBuffersForMember
})(PopulationsContainer);
