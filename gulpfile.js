var gobble = require('gobble'),
    gulp   = require('gulp'),
    mkdirp = require('mkdirp');

// Disable: modules, classes, unicodeRegex, forOf
var babelOpts = {
  whitelist: [
    'spec.undefinedToVoid',    // https://6to5.org/docs/usage/transformers/#spec-undefined-to-void
    'es6.arrowFunctions',      // https://6to5.org/docs/learn-es6/#arrows
    'es6.blockScoping',        // https://6to5.org/docs/learn-es6/#let-const
    'es6.constants',           // https://6to5.org/docs/learn-es6/#let-const
    'es6.destructuring',       // https://6to5.org/docs/learn-es6/#destructuring
    'es6.parameters',          // https://6to5.org/docs/learn-es6/#default-rest-spread
    'es6.spread',              // https://6to5.org/docs/learn-es6/#default-rest-spread
    'es6.templateLiterals',    // https://6to5.org/docs/learn-es6/#template-strings
    'es6.properties.computed', // https://6to5.org/docs/learn-es6/#enhanced-object-literals
    'es6.properties.shorthand' // https://6to5.org/docs/learn-es6/#enhanced-object-literals
  ]
};

var es5 = gobble('src/net.js').transform('babel', babelOpts);

gulp.task('build:umd', function(done) {
  mkdirp.sync('build/umd');

  var umd = es5.transform('esperanto-bundle', {
    type: 'umd',
    entry: 'net.js',
    name: 'net'
  });
  var umdMin = umd.transform('uglifyjs', { ext: '.min.js' });
  gobble([umdMin, umd]).build({ dest: 'build/umd', force: true }).then(done);
});

gulp.task('build:amd', function(done) {
  mkdirp.sync('build/amd');
  var amd = es5.transform('esperanto-bundle', {
    type: 'amd',
    entry: 'net.js',
    name: 'net'
  });
  var amdMin = amd.transform('uglifyjs', { ext: '.min.js' });

  gobble([amdMin, amd]).build({ dest: 'build/amd', force: true });
});
