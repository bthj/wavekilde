import React from 'react';

export default function(props) {
  return(
    <section className="population-layout">
      <header className="population-header">
        [ID / NAME of population]
      </header>
      <div className="population-container">
        {props.children}
      </div>
      <footer className="population-footer">
        [Footer for population]
      </footer>
    </section>
  );
}
