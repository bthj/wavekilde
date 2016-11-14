import PouchDB from 'pouchdb-browser';
import { remotePublicKilde } from './db-urls';
import { sortRowsByUpdated } from './db-common';

const dbPublic = new PouchDB('wavekilde-published');


export function getPublicFeed() {

  return dbPublic.changes({
    since: 'now',
    live: true,
    include_docs: true
  });
}

export function getAllPublicLineageMetaEntries() {

  return dbPublic.allDocs({
    startkey: 'l_', endkey: 'l_\uffff',
    include_docs: true
  }).then( result => {
    sortRowsByUpdated( result );
    return result.rows
      .filter( oneRow => oneRow.doc.published )
      .map( oneRow => oneRow.doc );
  }).catch( err => console.error(err) );
}

// Initialize a one way replication of published data from a remoate server
function replicateFromPublicKilde() {
  const opts = {
    live: true,
    batch_size: 10
  };
  dbPublic.replicate.from( remotePublicKilde, opts, syncError );
}

function syncError( err ) {
  // TODO: notify in UI?
  console.error( err );
}

if( remotePublicKilde ) {
  replicateFromPublicKilde();
}
