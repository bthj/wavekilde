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
    const populationsCount = ++lineageMeta.populationsCount | 0;
    return lineageStore.setItem( key, {...lineageMeta, populationsCount} )
    .then( lineageMeta => {return lineageMeta.populationsCount} )
    .catch( err => console.log(err) );
  }).catch( err => console.log(err) );
}

export function addPopulationToLineage( key, population ) {
  return incrementLineagePopulationCount( key ).then( populationsCount => {
    const populationKey = getPopulationKey( key, populationsCount);
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

export function getLineage( lineageId ) {
  return lineageStore.getItem( lineageId ).then( lineage => {
    return lineage;
  }).catch( err => { console.error(err); } );
}
