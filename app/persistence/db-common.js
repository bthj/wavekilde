
export function sortRowsByUpdated( result ) {
  result.rows.sort( (a, b) => {
    if( a.doc.updated > b.doc.updated ) return -1;
    if( a.doc.updated < b.doc.updated ) return 1;
    return 0;
  });
}
