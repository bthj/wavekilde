import React from 'react';

export default function(props) {
  return(
    <section className="individual-waveform-layout">
      <header className="individual-header">
        [ID / NAME of waveform individual]
      </header>
      <div className="individual-container">
        {props.children}
      </div>
      <footer className="individual-footer">
        [Footer for individual waveform set]
      </footer>
    </section>
  );
}
