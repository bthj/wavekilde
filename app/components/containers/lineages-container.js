import React, { Component } from 'react';
import { Link } from 'react-router';
import * as db from '../../persistence/db-local';
import { Loader } from 'react-loaders';

export default class LineagesContainer extends Component {

  constructor( props ) {
    super( props );

    this.state = {
      lineageMetaEntries: [],
      fetchingLineageKeys: true
    }
  }

  componentWillMount() {
    db.getAllLineageMetaEntries().then( lineageMetaEntries => this.setState({
      lineageMetaEntries,
      fetchingLineageKeys: false
    }) );
  }

  render() {
    return(
      <div>
        <h2>Breed new sounds</h2>
        <h3>New lineage</h3>
        <p>
          <Link to="/lineage">Start breeding from initial seeds</Link>
        </p>
        <h3>Saved lineages</h3>
        <ul>
          {this.state.fetchingLineageKeys ?
            <Loader type="line-scale" active={true} />
            : this.state.lineageMetaEntries.map( oneMeta =>
              <li key={oneMeta._id}>
                <Link to={`/lineage/${oneMeta._id.substring(2)}/${oneMeta.populationsCount-1}`}>
                  {oneMeta.name}
                </Link>
              </li>
            )
          }
        </ul>
      </div>
    );
  }
}
