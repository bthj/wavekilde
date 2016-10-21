import React, { Component } from 'react';
import { Link } from 'react-router';
import * as db from '../../persistence/db-local';
import { Loader } from 'react-loaders';

export default class LineagesContainer extends Component {

  constructor( props ) {
    super( props );

    this.state = {
      lineageKeys: [],
      fetchingLineageKeys: true
    }
  }

  componentWillMount() {
    db.getAllLineageKeys().then( lineageKeys => this.setState({
      lineageKeys,
      fetchingLineageKeys: false
    }) );
  }

  render() {
    return(
      <div>
        <h2>Breed new sounds</h2>
        <h3>New lineage</h3>
        <p>Start breeding from initial seeds</p>
        <h3>Saved lineages</h3>
        <ul>
          {this.state.fetchingLineageKeys ?
            <Loader type="line-scale" active={true} />
            : this.state.lineageKeys.map( oneLineage =>
              <li key={oneLineage}>
                <Link to={`/populations/${oneLineage}`}>{oneLineage}</Link>
              </li>
            )
          }
        </ul>
      </div>
    );
  }
}
