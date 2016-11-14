import PouchDB from 'pouchdb-browser';
import { remotePublicKilde, remoteUserKilde } from './db-urls';
import { sortRowsByUpdated } from './db-common';

const db = new PouchDB('wavekilde');


export function initializeLineage( key, name, populations ) {
  db.post({
    _id: getLineageKey( key ),
    type: 'lineage',
    name
  }).then( response => {
    populations.forEach( onePopulation => {
      addPopulationToLineage( key, onePopulation );
    });
  }).catch( err => console.error(err) );
}

export function incrementLineagePopulationCount( key ) {
  return db.get( getLineageKey(key) ).then( lineageMeta => {
    if( lineageMeta ) {
      const populationsCount = ++lineageMeta.populationsCount || 1;
      const updated = Date.now();
      return db.put({
        ...lineageMeta, populationsCount, updated
      }).then( response => {
        return populationsCount;
      }).catch( err => console.error(err) );
    }
  }).catch( err => console.error(err) );
}

export function addPopulationToLineage( key, population ) {

  return incrementLineagePopulationCount( key ).then( populationsCount => {

    const populationKey = getPopulationKey( key, populationsCount-1);
    db.put({
      _id: populationKey,
      population
    }).then( response => {
      response => response
    }).catch( err => console.error(err) );

  }).catch( err => console.log(err) );
}

export function getPopulationFromLineage( key, populationIndex ) {
  const populationKey = getPopulationKey( key, populationIndex );

  return db.get( populationKey ).then( p => {
    return p.population;
  }).catch( err => console.log(err) );
}

export function getAllLineageMetaEntries() {

  return db.allDocs({
    startkey: 'l_', endkey: 'l_\uffff',
    include_docs: true
  }).then( result => {
    sortRowsByUpdated( result );
    return result.rows.map( oneRow => oneRow.doc );
  }).catch( err => console.error(err) );
}

export function getLineageMeta( lineageId ) {
  return db.get( getLineageKey(lineageId) ).then( lineage => {
    return lineage;
  }).catch( err => console.error(err) );
}

export function setLineagePublishedStatus( lineageId, isPublished ) {

  setLineagePopulationsPublishedStatus( lineageId, isPublished );

  return setLineageMetaPublishedStatus( lineageId, isPublished );
}


function setLineageMetaPublishedStatus( lineageId, isPublished ) {
  return db.get( getLineageKey(lineageId) ).then( doc => {
    doc.published = isPublished;
    return db.put( doc );
  });
}

function setLineagePopulationsPublishedStatus( lineageId, isPublished ) {
  return db.allDocs({
    startkey: `p_${lineageId}`, endkey: `p_${lineageId}\uffff`,
    include_docs: true
  }).then( result => {
    result.rows.forEach( oneRow => {
      oneRow.doc.published = isPublished;
      return db.put( oneRow.doc );
    });
  })
}



function getPopulationKey( key, populationIndex ) {
  return `p_${key}_${populationIndex}`;
}

function getLineageKey( key ) {
  return `l_${key}`;
}



// Initialise a one way replication of published data to a remote server
function replicateToPublicKilde() {
  const opts = {
    live: true,
    batch_size: 10, // trial and error for Cloudant - https://github.com/pouchdb/pouchdb/issues/4210#issuecomment-135796683
    filter: function( doc ) {
      return doc.published !== undefined;
    }
  };
  db.replicate.to( remotePublicKilde, opts, syncError );
}

// Initialise a sync with a remote server of selected user data
function replicateToUserKilde() {
  // TODO
}

function syncError( err ) {
  // TODO: notify in UI?
  console.error( err );
}

if( remotePublicKilde ) {
  replicateToPublicKilde();
}
if( remoteUserKilde ) {
  replicateToUserKilde();
}
