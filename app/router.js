import React from 'react';
import { Router, Route, browserHistory, IndexRoute } from 'react-router';

// Layouts
import MainLayout from './components/layouts/main-layout';
import PopulationLayout from './components/layouts/population-layout';
import IndividualLayout from './components/layouts/individual-layout';

// Pages
import Home from './components/home';
import PopulationsContainer from './components/containers/populations-container';
import IndividualContainer from './components/containers/individual-container';

export default (
  <Router history={browserHistory}>
    <Route component={MainLayout}>

      <Route path="/" component={Home} />

        <Route path="individual">
          <Route component={IndividualLayout}>
            <IndexRoute component={IndividualContainer} />
          </Route>
        </Route>

        <Route path="lineage(/:lineageId)(/:populationIndex)">
          <Route component={PopulationLayout}>
            <IndexRoute component={PopulationsContainer} />
          </Route>
        </Route>

    </Route>
  </Router>
);
