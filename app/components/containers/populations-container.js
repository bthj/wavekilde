import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import {
  initializePopulation, setCurrentPopulation,
  setCurrentMember, evolveCurrentPopulation,
  setLineageKey, setLineageName,
  clearPopulations, loadLineageFromLocalDb
} from '../../actions/evolution';
import {
  getOutputsForMemberInCurrentPopulation,
  getAudioBuffersForMember, removeRenderingsForPopulation
} from '../../actions/rendering';
import { playAudioBuffer } from '../../util/play';
import { POPULATION_SIZE } from '../../cppn-neat/evolution-constants';

import PopulationGrid from '../views/population-grid';
import IndividualContainer from './individual-container';

import { Loader } from 'react-loaders';
import uuid from 'uuid';

const loaders = ["line-scale", "line-scale-party", "line-scale-pulse-out", "line-scale-pulse-out-rapid"];

class PopulationsContainer extends Component {

  constructor( props ) {
    super( props );

    this.state = {
      memberSelection: new Array( POPULATION_SIZE )
    }
  }

  componentWillMount() {

    this.loaderTypes = new Array( POPULATION_SIZE );
    for( let i=0; i<POPULATION_SIZE; i++ ) {
      this.loaderTypes[i] = loaders[Math.floor(Math.random() * loaders.length)];
    }
  }

  componentDidMount() {

    this.getOrCreateFamily();
  }

  componentDidUpdate( prevProps ) {

    if( ! this.props.currentPopulation ) {
      this.getOrCreateFamily();
    }

    this.activateNetworksAndRenderAudio();
  }

  getOrCreateFamily() {
    const populationIndex = this.props.params.populationIndex ? this.props.params.populationIndex : 0;
    if( this.props.params.lineageId ) {

      this.props.loadLineageFromLocalDb( this.props.params.lineageId, populationIndex );

    } else {
      if( this.props.currentPopulationIndex < 0 ) {
        const lineageKey = uuid.v1();
        const lineageName = new Date().toString();
        this.props.clearPopulations(); // clear app state from populatins
        this.props.initializePopulation ( lineageKey, lineageName, populationIndex );
      }
    }
  }

  activateNetworksAndRenderAudio() {
    if( this.getCurrentPopulation() ) {
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
  }

  render() {
    // console.log( "this.props.populations", this.props.populations );
    return(
      <div>
        <h1>Family: {this.props.lineageName}</h1>
        <h2>Population {this.props.currentPopulationIndex}</h2>

        {this.getCurrentPopulation() ?
          <div>

            <input type="button" value="activate networks and render audio"
              onClick={() => this.activateNetworksAndRenderAudio()} />

            <div>
              {this.props.currentPopulationIndex > 0 ?
                <input type="button" className="btn-evolve" value="<-- Previous Generation"
                  onClick={() => this.backOneGeneration()} /> : ''
              }
              {this.doesGenerationAfterCurrentExist() ?
                <input type="button" className="btn-evolve" value="Next Generation -->"
                  onClick={() => this.forwardOneGeneration()} /> : ''
              }
              <input type="button" className="btn-evolve" value="Evolve -->"
                onClick={() => this.evolveNextGeneration()} />
            </div>
            <br />
            {this.getPopulationNodes()}
            <br style={{clear:"both"}} />
            <div>
              {this.props.currentPopulationIndex > 0 ?
                <input type="button" className="btn-evolve" value="<-- Previous Generation"
                  onClick={() => this.backOneGeneration()} /> : ''
              }
              {this.doesGenerationAfterCurrentExist() ?
                <input type="button" className="btn-evolve" value="Next Generation -->"
                  onClick={() => this.forwardOneGeneration()} /> : ''
              }
              <input type="button" className="btn-evolve" value="Evolve -->"
                onClick={() => this.evolveNextGeneration()} />
            </div>

            <div>
              {this.props.params.lineageId ?
                [
                "Go to generation:  "
                ,
                [...Array(this.props.populationsCount)].map( (e, populationIndex) =>
                  <span>
                    <Link
                      key={`populationLink${populationIndex}`}
                      to={`/populations/${this.props.params.lineageId}/${populationIndex}`}
                      onClick={() => this.goToGeneration(populationIndex)}>
                        {populationIndex+1}
                      </Link>
                      &nbsp;
                    </span>
                )
                ]
                : ''
              }
            </div>

          </div>
          : this.props.params.lineageId ?
            <div>
              <p>
                Cannot find a population with ID <strong>{this.props.params.lineageId}</strong>.&nbsp;
                <Link to="/populations">Create a new family</Link> or <Link to="/">load saved families</Link>.
              </p>
            </div>
            :
            ''
        }

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
    return this.props.getOutputsForMemberInCurrentPopulation(
      this.props.currentPopulationIndex, memberIndex );
  }

  startAudioBuffersRendering( memberIndex ) {
    return this.props.getAudioBuffersForMember(
      this.getMemberOutputsFromApplicationState( memberIndex ),
      this.props.currentPopulationIndex, memberIndex,
      /*, noteDeltas, reverse */
    );
  }

  getCurrentPopulation() {
    return this.props.currentPopulation;
  }

  playMemberAudio( notesFromBase, memberIndex ) {
    const audioBuffer = this.getRenderedSoundBuffersFromApplicationState( memberIndex );
    playAudioBuffer( notesFromBase, audioBuffer, this.props.rendering.audioCtx );
  }



  evolveNextGeneration() {
    if( this.doesGenerationAfterCurrentExist() ) {
      this.removeLastGeneration();
      this.props.removeRenderingsForPopulation( this.props.currentPopulationIndex + 1 );
    }
    const parentIndexes = this.state.memberSelection.filter(
      memberIndexSelected => memberIndexSelected > -1 );
    this.props.evolveCurrentPopulation( parentIndexes );
    this.setState({ memberSelection: new Array( POPULATION_SIZE ) });
  }

  forwardOneGeneration() {
    if( this.doesGenerationAfterCurrentExist() ) {
      this.props.setCurrentPopulation (
        this.props.lineageKey, this.props.currentPopulationIndex + 1 );
    }
  }

  backOneGeneration() {
    if( this.props.currentPopulationIndex > 0 ) {
      this.props.setCurrentPopulation(
        this.props.lineageKey, this.props.currentPopulationIndex - 1 );
    }
  }

  goToGeneration( populationIndex ) {

    this.props.setCurrentPopulation ( this.props.lineageKey, populationIndex );
  }

  removeLastGeneration() {
    this.props.populations.pop();
  }

  doesGenerationAfterCurrentExist() {
    return this.props.populationsCount > this.props.currentPopulationIndex + 1;
  }
}

function mapStateToProps( state ) {
  return {
    ...state.evolution,
    rendering: state.rendering
  };
}

export default connect(mapStateToProps, {
  initializePopulation, setCurrentPopulation,
  setCurrentMember, evolveCurrentPopulation,
  setLineageKey, setLineageName,
  getOutputsForMemberInCurrentPopulation,
  getAudioBuffersForMember, removeRenderingsForPopulation,
  clearPopulations, loadLineageFromLocalDb
})(PopulationsContainer);
