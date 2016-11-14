import React from 'react';
import LineagesContainer from './containers/lineages-container';
import PublicationsContainer from './containers/publications-container';

const Home = React.createClass({
  render: function() {
    return(
      <div className="home-page">

        <h1>WaveKilde</h1>

        <PublicationsContainer />

        <LineagesContainer />

      </div>
    );
  }
});

export default Home;
