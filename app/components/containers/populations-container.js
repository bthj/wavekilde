import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import {
  setCurrentPopulation, setCurrentMember, evolveCurrentPopulation, setLineageKey
} from '../../actions/evolution';
import { getOutputsForMember, getAudioBuffersForMember } from '../../actions/rendering';
import { playAudioBuffer } from '../../util/play';
import { POPULATION_SIZE } from '../../cppn-neat/evolution-constants';

import PopulationGrid from '../views/population-grid';
import IndividualContainer from './individual-container';

import { Loader } from 'react-loaders';

const loaders = ["line-scale", "line-scale-party", "line-scale-pulse-out", "line-scale-pulse-out-rapid"];

class PopulationsContainer extends Component{

  constructor( props ) {
    super( props );

    this.state = {
      memberSelection: new Array( POPULATION_SIZE )
    }
  }

  componentDidMount() {

    if( this.props.currentPopulationIndex < 0 ) {
      this.props.setLineageKey( new Date().toString() );
      this.props.setCurrentPopulation ( 0 );
    }

    this.loaderTypes = new Array( POPULATION_SIZE );
    for( let i=0; i<POPULATION_SIZE; i++ ) {
      this.loaderTypes[i] = loaders[Math.floor(Math.random() * loaders.length)];
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

        <h2>Population {this.props.currentPopulationIndex}</h2>

        <input type="button" className="btn-evolve" value="Evolve -->"
          onClick={() => this.evolveNextGeneration()} />
        <br />
        {this.getPopulationNodes()}
        <br />
        <input type="button" className="btn-evolve" value="Evolve -->"
          onClick={() => this.evolveNextGeneration()} />

      </div>
    );
  }

  getPopulationNodes() {
    const currentPopulation = this.getCurrentPopulation();
    return currentPopulation ? currentPopulation.map( (oneMember, memberIndex) => {
      const memberOutputsAvailable = this.isMemberOutputAvailable( memberIndex );
      const audioBufferAvailable = this.isAudioBufferAvailable( memberIndex );

      return(
        <div style={{padding:"1em"}} key={memberIndex} className="member-container">
          {memberOutputsAvailable ?
            <span> [Network activated] </span> : ''
          }
          {audioBufferAvailable ?
            <span>
               [Audio available]
               <button onClick={this.playMemberAudio.bind( this, 0, memberIndex )}>Play</button>
             </span> : ''
          }


          {memberOutputsAvailable && audioBufferAvailable ?
            <div>
              <input type="checkbox"
                name={`member-${memberIndex}`} id={`member-${memberIndex}`}
                checked={this.isMemberSelected(memberIndex)}
                onChange={this.toggleMemberIndexInSelectedState.bind(this, memberIndex)} />
              <label htmlFor={`member-${memberIndex}`}>Individual {memberIndex}</label>
              <br />
              <Link to="/individual" onClick={() => this.props.setCurrentMember(memberIndex)}>
                {oneMember.offspring.nodes.map( (oneNode, nodeIndex) =>
                  <span key={nodeIndex}>{oneNode.activationFunction}, </span>)}
              </Link>
            </div>
            : <Loader type={this.loaderTypes[memberIndex]} active={true} />
          }
        </div>
      );
    }) : '';
  }

  toggleMemberIndexInSelectedState( memberIndex ) {
    this.state.memberSelection[ memberIndex ] =
      this.isMemberSelected(memberIndex) ? -1 : memberIndex;
    this.setState({ memberSelection: this.state.memberSelection }, () => {
      console.log("this.state.memberSelection: ", this.state.memberSelection);
    });
  }
  isMemberSelected( memberIndex ) {
    return this.state.memberSelection[ memberIndex ] === memberIndex;
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


  evolveNextGeneration() {
    const parentIndexes =
    this.state.memberSelection.filter( memberIndexSelected => memberIndexSelected > -1 );
    this.props.evolveCurrentPopulation( parentIndexes );
    this.props.setCurrentPopulation( this.props.currentPopulationIndex + 1 );
  }
}

function mapStateToProps( state ) {
  return {
    ...state.evolution,
    rendering: state.rendering
  };
}

export default connect(mapStateToProps, {
  setCurrentPopulation, setCurrentMember, evolveCurrentPopulation, setLineageKey,
  getOutputsForMember, getAudioBuffersForMember
})(PopulationsContainer);
