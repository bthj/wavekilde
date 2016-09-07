import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { applyWorker } from 'redux-worker';

import Router from './router';
import reducers from './reducers';

const loggerMiddleware = createLogger();

// const createStoreWithMiddleware = applyMiddleware(
//   thunkMiddleware,
//   loggerMiddleware
// )(createStore);

const ReduxWorkerForRendering = require("worker!./reducers/redux-worker.js");
const worker = new ReduxWorkerForRendering();

const enhancerWithWorker = compose(
  applyMiddleware( thunkMiddleware ),
  applyMiddleware( loggerMiddleware ),
  applyWorker( worker )
);
const store = createStore( reducers, {}, enhancerWithWorker );

ReactDOM.render(
  <Provider store={store}>
    {Router}
  </Provider>
  , document.getElementById('content'));
