import React, { Component } from 'react';
import { Link } from 'react-router';
import * as dbRemote from '../../persistence/db-remote';
import { Loader } from 'react-loaders';

export default class PublicationsContainer extends Component {

  constructor( props ) {
    super( props );

    this.state = {
      publishedMetaEntries: [],
      fetchingLineageMeta: true
    }

    this.publicFeed = dbRemote.getPublicFeed();
    this.publicFeed.on('change', change => {

      this.getPublishedLineagesMeta();
    });
  }

  componentWillMount() {
    this.getPublishedLineagesMeta();
  }

  getPublishedLineagesMeta() {
    dbRemote.getAllPublicLineageMetaEntries().then( publishedMetaEntries => this.setState({
      publishedMetaEntries,
      fetchingLineageMeta: false
    }) );
  }

  render() {
    return(
      <div>
        <h3>Published lineages</h3>
        <ul>
          {this.state.fetchingLineageMeta ?
            <Loader type="line-scale" active={true} />
            : this.state.publishedMetaEntries.map( oneMeta =>
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
