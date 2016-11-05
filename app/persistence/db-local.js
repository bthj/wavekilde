import localForage from "localforage";

const lineageStore = localForage.createInstance({
  name: "waveKilde",
  storeName: "lineages"
});
const populationsStore = localForage.createInstance({
  name: "waveKilde",
  storeName: "populations"
});

// export function saveLineage( key, name, populations ) {
//   return lineageStore.setItem( key, {name, populations} )
/*
export function initializeLineage( key, name, populations ) {
  const populationCount = populations.length;
  return lineageStore.setItem( key, {name, populationCount} )
  .then( populations => populations )
  // addPopulationToLineage(...) ?
  .catch( err => {
    console.error( err );
  });
}
*/

export function initializeLineage( key, name, populations ) {
  setLineageName( key, name ).then( name => {

    populations.forEach( onePopulation => {
      addPopulationToLineage( key, onePopulation );
    });

  }).catch( err => console.log(err) );
}

export function setLineageName( key, name ) {
  return lineageStore.getItem( key ).then( lineageMeta => {
    if( ! lineageMeta ) lineageMeta = {};
    return lineageStore.setItem( key, {...lineageMeta, name} )
    .then( lineageMeta => {return lineageMeta.name} )
    .catch( err => console.log(err) );
  }).catch( err => console.log(err) );
}

export function incrementLineagePopulationCount( key ) {
  return lineageStore.getItem( key ).then( lineageMeta => {
    if( ! lineageMeta ) lineageMeta = {};
    const populationsCount = ++lineageMeta.populationsCount || 1;
    const updated = Date.now();
    return lineageStore.setItem(
      key, {...lineageMeta, populationsCount, updated}
    ).then( lineageMeta => {return lineageMeta.populationsCount} )
    .catch( err => console.log(err) );
  }).catch( err => console.log(err) );
}

export function addPopulationToLineage( key, population ) {
  return incrementLineagePopulationCount( key ).then( populationsCount => {
    const populationKey = getPopulationKey( key, populationsCount-1);
    return populationsStore.setItem( populationKey, population )
    .then( population => population )
    .catch( err => console.log(err) );
  }).catch( err => console.log(err) );
}

export function getPopulationFromLineage( key, populationIndex ) {
  const populationKey = getPopulationKey( key, populationIndex );
  return populationsStore.getItem( populationKey ).then( p => {return p} );
}

function getPopulationKey( lineageKey, populationIndex ) {
  return `${lineageKey}_${populationIndex}`;
}

export function getAllLineageKeys() {
  return lineageStore.keys().then( k => {
    return k;
  } ).catch( err => { console.error(err); } );
}

export function getAllLineageMetaEntries () {
  const lineageMetaEntries = [];
  return lineageStore.iterate( (lineageMeta, key, iterationNumber) => {
      lineageMetaEntries.push( [lineageMeta, key] );
  }).then( () => {
      // sort lineages by when they were updated, in descending time order
      lineageMetaEntries.sort( (a, b) => {
        if( a[0].updated > b[0].updated ) return -1;
        if( a[0].updated < b[0].updated ) return 1;
        return 0
      });
      return lineageMetaEntries;
  }).catch( (err) => {
      console.log(err);
  });
}

export function getLineageMeta( lineageId ) {
  return lineageStore.getItem( lineageId ).then( lineage => {
    return lineage;
  }).catch( err => { console.error(err); } );
}
