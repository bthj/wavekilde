import React from 'react';
import LineagesContainer from './containers/lineages-container';

const Home = React.createClass({
  render: function() {
    return(
      <div className="home-page">

        <h1>WaveKilde</h1>

        <LineagesContainer />

      </div>
    );
  }
});

export default Home;
