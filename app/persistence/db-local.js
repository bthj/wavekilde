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
