// Partial config file
requirejs.config({
  // Base URL relative to the test runner
  // Paths are relative to this
  baseUrl: '../',
  paths: {
    'bee':             'src',
    'bee/util':        'vendor/util',
    'querystring':     'vendor/querystring',
    'promise':         'vendor/promise',
    'specs':           'test/specs'
  },
  use: {
    mocha: {
      attach: 'mocha'
    }
  },
  urlArgs: /debug\=1/.test(window.location.search) ? '' : 'bust=' +  (new Date()).getTime()
});

var expect = chai.expect;

mocha.setup({
  ui: 'bdd',
  ignoreLeaks: false,
  timeout: 500
});
