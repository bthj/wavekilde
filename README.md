# Audio waveform breeding with neuro-evolution

Exploring the feasibility of utilizing the powerful properties of Compositional pattern-producing networks, evolved through NeuroEvolution of Augmenting Topologies ([CPPN](http://en.wikipedia.org/wiki/Compositional_pattern-producing_network)–[NEAT](http://en.wikipedia.org/wiki/Neuroevolution_of_augmenting_topologies)), in the formation of unique audio waveforms.

More information:  
http://bthj.is/category/breedesizer/


## Installation
Implemented with the [React](https://facebook.github.io/react/) JavaScript user interface library and assembled with the [Webpack](https://webpack.github.io) module bundler.

With [NodeJS](https://nodejs.org/en/download/) installed, the JavaScript module dependencies can be installed with

```
$ npm install -g webpack
$ npm install -g webpack-dev-server
```

```
$ npm install
```

and by running

```
$ webpack
```

a distribution is assembled into the `dist/` folder, which can be viewed by issuing

```
$ open dist/index.html
```

To avoid issuing the module bundling command `webpack` each time when changes are to be viewed in a browser, a [development server](https://webpack.github.io/docs/webpack-dev-server.html) can be started with

```
$ webpack-dev-server --progress --colors --port 8111 --content-base dist/
```

and changes can be viewed by reloading http://localhost:8111.

To have changes [automatically refreshed](https://webpack.github.io/docs/webpack-dev-server.html#automatic-refresh) in the browser, an URL like the following can be visited instead in the browser:  http://localhost:8111/webpack-dev-server/index.html

### npm start script

The development server can also be run by simply issuing:

```
$ npm start
```
