import localForage from "localforage";

const lineageStore = localForage.createInstance({
  name: "waveKilde"
});

export function saveLineage( key, populations ) {
  return lineageStore.setItem( key, populations )
  .then( populations => populations )
  .catch( err => {
    console.error( err );
  });
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
